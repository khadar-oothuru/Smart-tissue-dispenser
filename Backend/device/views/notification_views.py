from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.shortcuts import get_object_or_404

from device.models import Notification, ExpoPushToken, Device
from device.serializers import NotificationSerializer
from users.models import AppLog

@swagger_auto_schema(
    method='get',
    responses={200: NotificationSerializer(many=True)},
    operation_description="Fetch all notifications for all devices"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.all().order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@swagger_auto_schema(
    method='delete',
    responses={204: 'Notification deleted successfully'},
    operation_description="Delete a specific notification"
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    try:
        notification = Notification.objects.get(pk=pk)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@swagger_auto_schema(
    method='post',
    responses={200: 'Notification marked as read'},
    operation_description="Mark a notification as read"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk)
        notification.is_read = True
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@swagger_auto_schema(
    method='post',
    responses={200: 'All notifications cleared'},
    operation_description="Clear all notifications (admin and users allowed)"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    deleted_count = Notification.objects.all().delete()[0]
    return Response({
        'message': f'{deleted_count} notifications cleared successfully'
    })


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Unread count', schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'count': openapi.Schema(type=openapi.TYPE_INTEGER)
        }
    ))},
    operation_description="Get unread notification count"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    count = Notification.objects.filter(is_read=False).count()
    return Response({'count': count})


@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['token'],
        properties={
            'token': openapi.Schema(type=openapi.TYPE_STRING, description='Expo push token')
        }
    ),
    responses={200: openapi.Response('Push token registered')},
    operation_description="Register Expo push token for authenticated user"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_push_token(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ExpoPushToken.objects.update_or_create(
            user=request.user,
            defaults={'token': token}
        )
        
        # Log push token registration
        AppLog.log_success(
            message="Push token registered",
            source="PushTokenRegistration",
            details=f"User: {request.user.email}",
            user=request.user,
            request=request
        )
        
        return Response({'message': 'Push token registered successfully'})
    except Exception as e:
        # Log failed push token registration
        AppLog.log_error(
            message="Failed to register push token",
            source="PushTokenRegistration",
            details=f"User: {request.user.email}, Error: {str(e)}",
            user=request.user,
            request=request
        )
        return Response({'error': 'Failed to register push token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    method='post',
    responses={200: openapi.Response('Test notification sent')},
    operation_description="Send a test notification with custom sound and styling"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_notification(request):
    """Send a test notification to verify sound and styling"""
    from device.utils import send_push_notification
    
    # Get all push tokens
    tokens = ExpoPushToken.objects.all()
    if not tokens.exists():
        return Response({'error': 'No push tokens registered'}, status=400)
    
    # Test notification data
    test_notification = {
        "title": "Test Alert",
        "message": "Testing custom sound and device details",
        "device_name": "Test Dispenser",
        "device_id": 999,
        "room": 101,
        "floor": 1,
        "type": "tamper"
    }
    
    sent_count = 0
    for token_entry in tokens:
        try:
            send_push_notification(
                token_entry.token,
                title=test_notification["title"],
                body=test_notification["message"],
                data={
                    "device_id": test_notification["device_id"],
                    "device_name": test_notification["device_name"],
                    "room": test_notification["room"],
                    "floor": test_notification["floor"],
                    "type": test_notification["type"],
                },
                notification_type=test_notification["type"]
            )
            sent_count += 1
        except Exception as e:
            print(f"Failed to send test notification to {token_entry.token}: {e}")
    
    return Response({
        'message': f'Test notification sent to {sent_count} devices',
        'notification_details': test_notification
    })

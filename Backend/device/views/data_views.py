from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from device.models import Device, DeviceData, Notification, ExpoPushToken
from device.serializers import DeviceDataSerializer
from device.utils import send_push_notification

device_data_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['DID', 'ALERT', 'count', 'REFER_Val', 'TAMPER'],
    properties={
        'DID': openapi.Schema(type=openapi.TYPE_INTEGER),
        'TS': openapi.Schema(type=openapi.TYPE_STRING, description="Device timestamp"),
        'ALERT': openapi.Schema(type=openapi.TYPE_STRING),
        'count': openapi.Schema(type=openapi.TYPE_INTEGER),
        'REFER_Val': openapi.Schema(type=openapi.TYPE_INTEGER),
        'TOTAL_USAGE': openapi.Schema(type=openapi.TYPE_INTEGER),
        'TAMPER': openapi.Schema(type=openapi.TYPE_STRING),
        'BATTERY_PERCENTAGE': openapi.Schema(type=openapi.TYPE_NUMBER, format=openapi.FORMAT_FLOAT),
        'PWR_STATUS': openapi.Schema(type=openapi.TYPE_STRING, description="Power status: ON/OFF/NONE"),
    }
)

@swagger_auto_schema(
    method='post',
    request_body=device_data_schema,
    responses={201: openapi.Response('Success'), 404: 'Device not found'},
    operation_description="Receive real-time data from devices (public)"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def receive_device_data(request):
    try:
        device = Device.objects.get(id=request.data.get('DID'))
        
        tamper_value = str(request.data.get('TAMPER')).lower()
        
        power_status = request.data.get('PWR_STATUS')
        battery_percentage = request.data.get('BATTERY_PERCENTAGE')
        # Normalize battery percentage if string 'None' or missing
        try:
            battery_percentage_val = float(battery_percentage) if battery_percentage not in [None, '', 'None', 'none'] else None
        except Exception:
            battery_percentage_val = None

        # Enhanced power off logic: treat empty, null, 0 as 'NO'
        def is_power_off_status(val):
            if val is None:
                return True
            val_str = str(val).strip().lower()
            return val_str in ['off', 'no', 'none', '', '0', 'false']

        data = DeviceData.objects.create(
            device=device,
            alert=request.data.get('ALERT'),
            count=request.data.get('count'),
            refer_val=request.data.get('REFER_Val'),
            tamper=tamper_value,
            total_usage=request.data.get('TOTAL_USAGE'),
            battery_percentage=battery_percentage_val,
            power_status=power_status,
            device_timestamp=request.data.get('TS')
        )

        # --- Log the device alert to AppLog ---
        try:
            from users.models import AppLog
            AppLog.objects.create(
                user=None,  # No user for device-originated logs
                level='INFO',
                message=f"Device alert received: {request.data.get('ALERT')}",
                source='device.receive_device_data',
                details=f"device_id={device.id}, alert={request.data.get('ALERT')}, tamper={tamper_value}, battery={battery_percentage_val}, power_status={power_status}, count={request.data.get('count')}, refer_val={request.data.get('REFER_Val')}, total_usage={request.data.get('TOTAL_USAGE')}, device_timestamp={request.data.get('TS')}"
            )
        except Exception as log_exc:
            print(f"Failed to log device alert to AppLog: {log_exc}")
        
        # Check conditions for notifications
        alert_status = request.data.get('ALERT')
        is_low_alert = alert_status == "LOW"
        is_empty_alert = alert_status == "EMPTY"
        is_tampered = tamper_value == "true"
        is_power_off = is_power_off_status(power_status)
        # Battery notification thresholds
        battery_low_threshold = 20.0
        battery_critical_threshold = 10.0
        is_battery_critical = battery_percentage_val is not None and battery_percentage_val <= battery_critical_threshold
        is_battery_low = battery_percentage_val is not None and battery_critical_threshold < battery_percentage_val <= battery_low_threshold

        notifications_to_send = []
        # Combined notification for low/critical battery AND power off
        if (is_battery_critical or is_battery_low) and is_power_off:
            notifications_to_send.append({
                "type": "battery_power_off",
                "notification_type": "battery_power_off",
                "title": "Battery & Power Alert",
                "message": f"Battery is {'CRITICAL' if is_battery_critical else 'LOW'} ({battery_percentage_val}%) and device power is OFF! Immediate action required.",
                "device_name": device.name,
                "device_id": device.id,
                "room": device.room_number,
                "floor": device.floor_number,
                "priority": 110
            })
        else:
            if is_tampered:
                notifications_to_send.append({
                    "type": "tamper",
                    "notification_type": "tamper",
                    "title": "Tamper Alert",
                    "message": "Device tampering detected",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 100
                })
            if is_empty_alert:
                notifications_to_send.append({
                    "type": "empty",
                    "notification_type": "empty",
                    "title": "Empty Alert",
                    "message": "Container is empty - needs refill",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 90
                })
            if is_low_alert:
                notifications_to_send.append({
                    "type": "low",
                    "notification_type": "low",
                    "title": "Low Tissue Alert",
                    "message": "Low tissue detected - refill soon",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 80
                })
            if is_battery_critical:
                notifications_to_send.append({
                    "type": "battery_critical",
                    "notification_type": "battery_critical",
                    "title": "Critical Battery Alert",
                    "message": f"Battery critically low ({battery_percentage_val}%)! Immediate replacement required.",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 75
                })
            elif is_battery_low:
                notifications_to_send.append({
                    "type": "battery_low",
                    "notification_type": "battery_low",
                    "title": "Low Battery Alert",
                    "message": f"Battery low ({battery_percentage_val}%). Replace soon.",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 74
                })
            if is_power_off:
                notifications_to_send.append({
                    "type": "power_off",
                    "notification_type": "power_off",
                    "title": "Power Off Alert",
                    "message": "Device power is OFF! Check power supply.",
                    "device_name": device.name,
                    "device_id": device.id,
                    "room": device.room_number,
                    "floor": device.floor_number,
                    "priority": 70
                })

        # Send all applicable notifications
        for notif_data in notifications_to_send:
            notification = Notification.objects.create(
                device=device,
                message=notif_data["message"],
                title=notif_data["title"],
                notification_type=notif_data["type"],
                alert=alert_status,
                tamper=tamper_value,
                battery_percentage=battery_percentage_val,
                power_status=power_status,
                priority=notif_data["priority"]
            )
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "notifications",
                {
                    "type": "send_notification",
                    "content": {
                        "id": notification.id,
                        "device_id": device.id,
                        "device": {
                            "id": device.id,
                            "name": device.name if hasattr(device, 'name') else f"Device {device.id}",
                            "device_id": device.id,
                            "room_number": device.room_number,
                            "floor_number": device.floor_number,
                        },
                        "room": device.room_number,
                        "floor": device.floor_number,
                        "timestamp": str(data.timestamp),
                        "alert": alert_status,
                        "tamper": tamper_value,
                        "battery_percentage": battery_percentage_val,
                        "power_status": power_status,
                        "type": notif_data["type"],
                        "notification_type": notif_data["notification_type"],
                        "title": notif_data["title"],
                        "message": notif_data["message"],
                        "priority": notif_data["priority"],
                        "created_at": str(notification.created_at),
                        "is_read": False,
                    }
                }
            )
            # Only send to unique tokens for this device (avoid sending to all tokens in DB)
            tokens = ExpoPushToken.objects.filter(device=device).distinct('token') if hasattr(ExpoPushToken, 'device') else ExpoPushToken.objects.all().distinct('token')
            for token_entry in tokens:
                try:
                    send_push_notification(
                        token_entry.token,
                        title=notif_data["title"],
                        body=notif_data["message"],
                        data={
                            "device_id": device.id,
                            "notification_id": notification.id,
                            "type": notif_data["type"],
                            "notification_type": notif_data["notification_type"],
                            "priority": notif_data["priority"],
                            "room": device.room_number,
                            "floor": device.floor_number,
                            "device_name": device.name if hasattr(device, 'name') else f"Device {device.id}",
                            "battery_percentage": battery_percentage_val,
                            "power_status": power_status,
                        },
                        notification_type=notif_data["type"]
                    )
                except Exception as e:
                    print(f"Failed to send push notification to {token_entry.token}: {e}")

        return Response({
            "message": "Data recorded successfully",
            "notifications_sent": len(notifications_to_send),
            "notification_types": [n["type"] for n in notifications_to_send],
            "alert_status": alert_status,
            "tamper_status": tamper_value,
            "battery_percentage": battery_percentage_val,
            "power_status": power_status,
            "device_info": {
                "id": device.id,
                "room": device.room_number,
                "floor": device.floor_number,
            }
        }, status=201)

    except Device.DoesNotExist:
        return Response({"error": "Device not found"}, status=404)
    except Exception as e:
        print(f"Error in receive_device_data: {str(e)}")  # Debug log
        return Response({"error": str(e)}, status=500)


@swagger_auto_schema(
    method='get',
    responses={200: DeviceDataSerializer(many=True)},
    operation_description="Get all recorded device data"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_device_data(request):
    data = DeviceData.objects.all()
    serializer = DeviceDataSerializer(data, many=True)
    return Response(serializer.data)


@swagger_auto_schema(
    method='get',
    responses={200: DeviceDataSerializer(many=True)},
    operation_description="Get device data by specific device ID"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_data_by_id(request, device_id):
    # Check if device_id is numeric (database ID) or string (device_id field)
    if str(device_id).isdigit():
        data = DeviceData.objects.filter(device__id=device_id)
    else:
        data = DeviceData.objects.filter(device__device_id=device_id)
    serializer = DeviceDataSerializer(data, many=True)
    return Response(serializer.data)

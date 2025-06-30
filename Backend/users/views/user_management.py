from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..models import CustomUser, AppLog
from ..serializers import (
    AdminUserListSerializer,
    UserRoleUpdateSerializer,
    AdminProfileUpdateSerializer,
    UserSerializer
)
from ..permissions import IsAdminUser


class AdminUserListView(generics.ListAPIView):
    """List all users (admin only)"""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return CustomUser.objects.all().order_by('-date_joined')
    
    @swagger_auto_schema(
        operation_description="Get list of all users (Admin only)",
        responses={
            200: AdminUserListSerializer(many=True),
            403: 'Permission denied'
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AdminUserDetailView(generics.RetrieveAPIView):
    """Get specific user details (admin only)"""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = CustomUser.objects.all()
    lookup_field = 'id'
    
    @swagger_auto_schema(
        operation_description="Get user details by ID (Admin only)",
        responses={
            200: AdminUserListSerializer,
            404: 'User not found',
            403: 'Permission denied'
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AdminUserDeleteView(generics.DestroyAPIView):
    """Delete user (admin only)"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = CustomUser.objects.all()
    lookup_field = 'id'
    
    @swagger_auto_schema(
        operation_description="Delete user by ID (Admin only)",
        responses={
            200: openapi.Response('User deleted successfully'),
            400: 'Cannot delete own account or last admin',
            404: 'User not found',
            403: 'Permission denied'
        }
    )
    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Prevent admin from deleting themselves
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent deletion of the last admin
        if user.role == 'admin':
            admin_count = CustomUser.objects.filter(role='admin').count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Cannot delete the last admin user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        user.delete()
        return Response(
            {'message': f'User {user.username} has been deleted successfully'},
            status=status.HTTP_200_OK
        )


class AdminUserRoleUpdateView(generics.UpdateAPIView):
    """Update user role (admin only)"""
    serializer_class = UserRoleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = CustomUser.objects.all()
    lookup_field = 'id'
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Prevent admin from demoting themselves
        if user.id == request.user.id and request.data.get('role') != 'admin':
            return Response(
                {'error': 'You cannot change your own role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent demoting the last admin
        if user.role == 'admin' and request.data.get('role') != 'admin':
            admin_count = CustomUser.objects.filter(role='admin').count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Cannot demote the last admin user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update user role (Admin only)",
        request_body=UserRoleUpdateSerializer,
        responses={
            200: UserRoleUpdateSerializer,
            400: 'Cannot change own role or demote last admin',
            404: 'User not found',
            403: 'Permission denied'
        }
    )
    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


class AdminProfileView(generics.RetrieveUpdateAPIView):
    """Get and update admin profile"""
    serializer_class = AdminProfileUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_object(self):
        return self.request.user
    
    @swagger_auto_schema(
        operation_description="Get admin profile",
        responses={
            200: AdminProfileUpdateSerializer,
            403: 'Permission denied'
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update admin profile",
        request_body=AdminProfileUpdateSerializer,
        responses={
            200: AdminProfileUpdateSerializer,
            400: 'Validation error',
            403: 'Permission denied'
        }
    )
    def patch(self, request, *args, **kwargs):
        try:
            response = super().patch(request, *args, **kwargs)
            if response.status_code == 200:
                AppLog.log_success(
                    message="Admin profile updated",
                    source="AdminProfileView",
                    details=f"Admin: {request.user.email}",
                    user=request.user,
                    request=request
                )
            return response
        except Exception as e:
            AppLog.log_error(
                message="Admin profile update failed",
                source="AdminProfileView",
                details=str(e),
                user=request.user,
                request=request
            )
            raise


class AdminStatsView(APIView):
    """Get admin dashboard statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get user statistics (Admin only)",
        responses={
            200: openapi.Response(
                'Statistics',
                openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total_users': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'total_admins': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'total_regular_users': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'active_users': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'inactive_users': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'recent_users': openapi.Schema(type=openapi.TYPE_INTEGER),
                    }
                )
            ),
            403: 'Permission denied'
        }
    )
    def get(self, request):
        try:
            total_users = CustomUser.objects.count()
            total_admins = CustomUser.objects.filter(role='admin').count()
            total_regular_users = CustomUser.objects.filter(role='user').count()
            active_users = CustomUser.objects.filter(is_active=True).count()
            inactive_users = CustomUser.objects.filter(is_active=False).count()
            
            # Recent users (last 30 days)
            from django.utils import timezone
            from datetime import timedelta
            recent_cutoff = timezone.now() - timedelta(days=30)
            recent_users = CustomUser.objects.filter(date_joined__gte=recent_cutoff).count()
            
            stats = {
                'total_users': total_users,
                'total_admins': total_admins,
                'total_regular_users': total_regular_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'recent_users': recent_users,
            }
            
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch stats: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

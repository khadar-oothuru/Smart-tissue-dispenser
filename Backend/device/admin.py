from django.contrib import admin
from .models import Device, DeviceData, Notification, ExpoPushToken

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'device_id', 'room_number', 'floor_number', 'registration_type', 'created_at']
    list_filter = ['registration_type', 'floor_number', 'created_at']
    search_fields = ['name', 'device_id', 'room_number']
    readonly_fields = ['created_at']

@admin.register(DeviceData)
class DeviceDataAdmin(admin.ModelAdmin):
    list_display = ['id', 'device', 'timestamp', 'alert', 'count', 'refer_val', 'tamper', 'total_usage', 'battery_percentage']
    list_filter = ['alert', 'tamper', 'timestamp', 'device']
    search_fields = ['device__name', 'device__device_id']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'device', 'title', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'priority', 'created_at']
    search_fields = ['device__name', 'title', 'message']
    readonly_fields = ['created_at']
    ordering = ['-priority', '-created_at']

@admin.register(ExpoPushToken)
class ExpoPushTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'token']
    search_fields = ['user__username', 'token']

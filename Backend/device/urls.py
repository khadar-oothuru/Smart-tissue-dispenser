from django.urls import path

from .views.device_views import (
    add_device, 
    get_devices, 
    device_detail,
    register_device, 
    register_device_via_wifi,
    check_device_status,
    update_device_status
)
from .views.data_views import receive_device_data, all_device_data, device_data_by_id
from .views.notification_views import (
    get_notifications, 
    register_push_token,
    delete_notification,
    mark_notification_as_read,
    clear_all_notifications,
    get_unread_count,
    send_test_notification
)
from .views.analytics_views import (
    device_analytics, 
    advanced_analytics,
    device_realtime_status,
    time_based_analytics, 
    # download_analytics,
    download_csv_analytics,
    download_json_analytics,
    download_pdf_analytics,
    summary_analytics,    device_status_summary,
    device_status_distribution,
    # TODO: Temporarily commented out battery analytics
    battery_usage_analytics,
    battery_usage_trends,
)

urlpatterns = [    # Device endpoints
    path('devices/', get_devices, name='get_devices'),
    path('devices/add/', add_device, name='add_device'),
    path('devices/<int:pk>/', device_detail, name='device_detail'),
    path('devices/<str:device_id>/', device_detail, name='device_detail_by_device_id'),    # Device data endpoints
    path('device-data/submit/', receive_device_data, name='receive_device_data'),
    path('device-data/all/', all_device_data, name='all_device_data'),
    path('device-data/<int:device_id>/', device_data_by_id, name='device_data_by_id'),
    path('device-data/<str:device_id>/', device_data_by_id, name='device_data_by_device_id'),# Notification endpoints
    path('notifications/', get_notifications, name='get_notifications'),
    path('notifications/<int:pk>/', delete_notification, name='delete_notification'),
    path('notifications/<int:pk>/mark-read/', mark_notification_as_read, name='mark_notification_as_read'),
    path('notifications/clear-all/', clear_all_notifications, name='clear_all_notifications'),    path('notifications/unread-count/', get_unread_count, name='get_unread_count'),
    path('notifications/test/', send_test_notification, name='send_test_notification'),
    path('expo-token/register/', register_push_token, name='register_push_token'),
    
    # Analytics endpoints
    path('device-analytics/', advanced_analytics, name='advanced_analytics'),
    path('device-analytics/time-based/', time_based_analytics, name='time_based_analytics'),
    # path('device-analytics/download/', download_analytics, name='download_analytics'),

    path('device-analytics/summary/', summary_analytics, name='summary_analytics'),
    path('device-analytics/realtime-status/', device_realtime_status, name='device_realtime_status'),
    path('device-analytics/status-summary/', device_status_summary, name='device_status_summary'),
    path('device-analytics/status-distribution/', device_status_distribution, name='device_status_distribution'),
      # Device registration endpoints
    path('device/register/', register_device, name='register_device'),
    path('wifi/', register_device_via_wifi, name='register_device_via_wifi'),
    
    # New WiFi-related endpoints
    path('devices/check-status/', check_device_status, name='check_device_status'),
    path('devices/update-status/', update_device_status, name='update_device_status'),
    
    # Download Analytics
    path('device-analytics/download/csv/', download_csv_analytics, name='download_csv_analytics'),
    path('device-analytics/download/json/', download_json_analytics, name='download_json_analytics'),    path('device-analytics/download/pdf/', download_pdf_analytics, name='download_pdf_analytics'),
    
    # TODO: Temporarily commented out Battery and Usage Analytics
    path('device-analytics/battery-usage/', battery_usage_analytics, name='battery_usage_analytics'),
    path('device-analytics/battery-usage-trends/', battery_usage_trends, name='battery_usage_trends'),
]
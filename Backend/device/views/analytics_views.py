from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.http import HttpResponse
from django.db.models import Max, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import io
import logging
import json


from django.db import models
from device.models import Device, DeviceData

# Set up logging
logger = logging.getLogger(__name__)

@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Analytics per device')},
    operation_description="Get analytics like LOW alerts and last alert timestamp for each device"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_analytics(request):
    devices = Device.objects.all()
    analytics = []

    for device in devices:
        device_data = DeviceData.objects.filter(device=device)
        # Tissue alerts
        low_alerts = device_data.filter(alert="LOW").count()
        empty_alerts = device_data.filter(alert="EMPTY").count()
        full_alerts = device_data.filter(alert="FULL").count()
        
        # Battery alerts - Fixed logic to match data_views.py
        battery_low_count = device_data.filter(
            battery_percentage__gt=10, 
            battery_percentage__lte=20
        ).exclude(battery_percentage=None).count()
        
        battery_critical_count = device_data.filter(
            battery_percentage__lte=10
        ).exclude(battery_percentage=None).count()
        
        # Power status alerts
        power_off_count = device_data.filter(
            power_status__iexact="OFF"
        ).count()
        
        # Battery statistics - Fixed calculations
        battery_data = device_data.exclude(battery_percentage=None)
        avg_battery = battery_data.aggregate(avg=models.Avg('battery_percentage'))['avg']
        min_battery = battery_data.aggregate(min=models.Min('battery_percentage'))['min']
        max_battery = battery_data.aggregate(max=models.Max('battery_percentage'))['max']
        
        last_entry = device_data.order_by('-timestamp').first()
        
        analytics.append({
            "device_id": device.id,
            "device_name": device.name,
            "room": device.room_number,
            "floor": device.floor_number,
            "low_alert_count": low_alerts,
            "empty_alert_count": empty_alerts,
            "full_alert_count": full_alerts,
            "battery_low_count": battery_low_count,
            "battery_critical_count": battery_critical_count,
            "battery_alert_count": battery_low_count + battery_critical_count,  # Total battery alerts
            "power_off_count": power_off_count,
            "avg_battery": round(avg_battery, 2) if avg_battery else None,
            "min_battery": round(min_battery, 2) if min_battery else None,
            "max_battery": round(max_battery, 2) if max_battery else None,
            "last_alert_time": last_entry.timestamp if last_entry else None
        })

    return Response(analytics)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Advanced analytics per device')},
    operation_description="Advanced analytics: total entries, low alerts, tamper counts, last alert timestamp"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_analytics(request):
    data = []
    devices = Device.objects.all()
    for device in devices:
        device_data = DeviceData.objects.filter(device=device)
        # Tissue alerts
        low_alerts = device_data.filter(alert="LOW").count()
        empty_alerts = device_data.filter(alert="EMPTY").count()
        full_alerts = device_data.filter(alert="FULL").count()
        tamper_count = device_data.filter(tamper="true").count()
        
        # Battery alerts - Fixed logic to match data_views.py
        battery_low_count = device_data.filter(
            battery_percentage__gt=10, 
            battery_percentage__lte=20
        ).exclude(battery_percentage=None).count()
        
        battery_critical_count = device_data.filter(
            battery_percentage__lte=10
        ).exclude(battery_percentage=None).count()
        
        # Power status alerts
        power_off_count = device_data.filter(
            power_status__iexact="OFF"
        ).count()
        
        # Battery statistics - Fixed calculations
        battery_data = device_data.exclude(battery_percentage=None)
        avg_battery = battery_data.aggregate(avg=models.Avg('battery_percentage'))['avg']
        min_battery = battery_data.aggregate(min=models.Min('battery_percentage'))['min']
        max_battery = battery_data.aggregate(max=models.Max('battery_percentage'))['max']
        
        total_data = device_data.count()
        last_alert = device_data.aggregate(Max('timestamp'))['timestamp__max']
        
        data.append({
            "device_id": device.id,
            "room": device.room_number,
            "floor": device.floor_number,
            "total_entries": total_data,
            "low_alert_count": low_alerts,
            "empty_alert_count": empty_alerts,
            "full_alert_count": full_alerts,
            "tamper_count": tamper_count,
            "battery_low_count": battery_low_count,
            "battery_critical_count": battery_critical_count,
            "battery_alert_count": battery_low_count + battery_critical_count,  # Total battery alerts
            "power_off_count": power_off_count,
            "avg_battery": round(avg_battery, 2) if avg_battery else None,
            "min_battery": round(min_battery, 2) if min_battery else None,
            "max_battery": round(max_battery, 2) if max_battery else None,
            "last_alert_time": last_alert
        })
    return Response(data)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Real-time device status')},
    operation_description="Get current/latest status of all devices (real-time data)"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_realtime_status(request):
    """
    Returns the current status of each device based on the latest data entry.
    This data changes as new data comes in from devices.
    """
    devices = Device.objects.all()
    realtime_data = []
    
    for device in devices:
        # Get the latest data entry for this device
        latest_data = DeviceData.objects.filter(device=device).order_by('-timestamp').first()

        # Enhanced power off detection logic
        def is_power_off_status(val):
            if val is None:
                return True
            val_str = str(val).strip().lower()
            return val_str in ['off', 'no', 'none', '', '0', 'false']

        # Battery alert logic - Fixed to match data_views.py thresholds
        battery_critical = 0
        battery_low = 0
        if latest_data and latest_data.battery_percentage is not None:
            if latest_data.battery_percentage <= 10:
                battery_critical = 1
            elif 10 < latest_data.battery_percentage <= 20:
                battery_low = 1

        if latest_data:
            time_since_update = timezone.now() - latest_data.timestamp
            minutes_since_update = int(time_since_update.total_seconds() / 60)
            is_active = minutes_since_update <= 5
            current_status = "normal"
            status_priority = 0
            
            # Enhanced status priority logic:
            # Priority: Tamper > Empty > Low > Full > Battery Critical > Battery Low > Power Off > Normal > Offline
            if latest_data.tamper == "true":
                current_status = "tamper"
                status_priority = 8
            elif latest_data.alert == "EMPTY":
                current_status = "empty"
                status_priority = 7
            elif latest_data.alert == "LOW":
                current_status = "low"
                status_priority = 6
            elif latest_data.alert == "FULL":
                current_status = "full"
                status_priority = 5
            elif battery_critical:
                current_status = "battery_critical"
                status_priority = 4
            elif battery_low:
                current_status = "battery_low"
                status_priority = 3
            elif is_power_off_status(latest_data.power_status):
                current_status = "power_off"
                status_priority = 2
            elif is_active:
                current_status = "normal"
                status_priority = 1
            else:
                # Device is offline (no recent updates)
                current_status = "offline"
                status_priority = 0
                
            realtime_data.append({
                "device_id": device.id,
                "device_name": device.name,
                "room": device.room_number,
                "floor": device.floor_number,
                "is_active": is_active,
                "current_status": current_status,
                "status_priority": status_priority,
                "current_alert": latest_data.alert,
                "current_tamper": latest_data.tamper == "true",
                "current_count": latest_data.count,
                "last_updated": latest_data.timestamp,
                "minutes_since_update": minutes_since_update,
                "refer_val": latest_data.refer_val,
                "total_usage": latest_data.total_usage,
                "battery_percentage": latest_data.battery_percentage,
                "battery_critical": battery_critical,
                "battery_low": battery_low,
                "power_status": latest_data.power_status,
                "device_timestamp": latest_data.device_timestamp
            })
        else:
            # No data for this device yet
            realtime_data.append({
                "device_id": device.id,
                "device_name": device.name,
                "room": device.room_number,
                "floor": device.floor_number,
                "is_active": False,
                "current_status": "offline",
                "status_priority": -1,
                "current_alert": None,
                "current_tamper": False,
                "current_count": 0,
                "last_updated": None,
                "minutes_since_update": None,
                "refer_val": None,
                "total_usage": None,
                "battery_percentage": None,
                "battery_critical": 0,
                "battery_low": 0,
                "power_status": None,
                "device_timestamp": None
            })
    
    # Sort by status priority (highest priority first) and then by last updated
    realtime_data.sort(key=lambda x: (-x['status_priority'], x['last_updated'] or ''), reverse=True)
    
    return Response(realtime_data)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Device status summary')},
    operation_description="Get summary of current device statuses"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_status_summary(request):
    """
    Returns a summary of device statuses for dashboard display
    """
    total_devices = Device.objects.count()
    now = timezone.now()
    
    # Get latest status for each device
    device_statuses = []
    for device in Device.objects.all():
        latest_data = DeviceData.objects.filter(device=device).order_by('-timestamp').first()
        if latest_data:
            time_since = now - latest_data.timestamp
            is_active = time_since.total_seconds() <= 300  # 5 minutes
            device_statuses.append({
                'device_id': device.id,
                'is_active': is_active,
                'alert': latest_data.alert,
                'tamper': latest_data.tamper == "true",
                'battery_percentage': latest_data.battery_percentage,
                'power_status': latest_data.power_status,
                'timestamp': latest_data.timestamp
            })
        else:
            device_statuses.append({
                'device_id': device.id,
                'is_active': False,
                'alert': None,
                'tamper': False,
                'battery_percentage': None,
                'power_status': None,
                'timestamp': None
            })
      # Calculate summaries with new status system
    active_count = sum(1 for d in device_statuses if d['is_active'])
    tamper_count = sum(1 for d in device_statuses if d['tamper'])
    empty_count = sum(1 for d in device_statuses if d['alert'] == 'EMPTY')
    low_count = sum(1 for d in device_statuses if d['alert'] == 'LOW')
    full_count = sum(1 for d in device_statuses if d['alert'] == 'FULL')
    battery_critical_count = sum(1 for d in device_statuses if d['battery_percentage'] is not None and d['battery_percentage'] <= 10)
    battery_low_count = sum(1 for d in device_statuses if d['battery_percentage'] is not None and 10 < d['battery_percentage'] <= 20)
    battery_alert_count = battery_critical_count + battery_low_count
    power_off_count = sum(1 for d in device_statuses if (d['power_status'] or '').upper() == 'OFF')
    normal_count = sum(1 for d in device_statuses if d['is_active'] and not d['tamper'] and d['alert'] not in ['EMPTY', 'LOW', 'FULL'] and (d['battery_percentage'] is None or d['battery_percentage'] > 20) and (d['power_status'] is None or (d['power_status'] or '').upper() != 'OFF'))
    inactive_count = sum(1 for d in device_statuses if not d['is_active'])

    return Response({
        'summary': {
            'total_devices': total_devices,
            'active_devices': active_count,
            'inactive_devices': inactive_count,
            'tamper_devices': tamper_count,
            'empty_devices': empty_count,
            'low_alert_devices': low_count,
            'full_devices': full_count,
            'battery_critical_devices': battery_critical_count,
            'battery_low_devices': battery_low_count,
            'battery_alert_devices': battery_alert_count,
            'power_off_devices': power_off_count,
            'normal_devices': normal_count
        },
        'status_breakdown': {
            'tamper': tamper_count,
            'empty': empty_count,
            'low': low_count,
            'full': full_count,
            'battery_critical': battery_critical_count,
            'battery_low': battery_low_count,
            'battery_alert': battery_alert_count,
            'power_off': power_off_count,
            'normal': normal_count,
            'inactive': inactive_count
        },
        'percentages': {
            'active_percentage': round((active_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'tamper_percentage': round((tamper_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'empty_percentage': round((empty_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'battery_critical_percentage': round((battery_critical_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'battery_low_percentage': round((battery_low_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'battery_alert_percentage': round((battery_alert_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'power_off_percentage': round((power_off_count / total_devices * 100), 1) if total_devices > 0 else 0,
            'inactive_percentage': round((inactive_count / total_devices * 100), 1) if total_devices > 0 else 0
        },
        'last_updated': now
    })








#?  summary code start

@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Summary analytics for dashboard')},
    operation_description="Get summary analytics for dashboard display"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary_analytics(request):
    now = timezone.now()
    
    # Overall stats
    total_devices = Device.objects.count()
    total_entries = DeviceData.objects.count()
    
    # Recent activity (last 24 hours)
    last_24h = now - timedelta(hours=24)
    recent_entries = DeviceData.objects.filter(timestamp__gte=last_24h).count()
    recent_alerts = DeviceData.objects.filter(
        timestamp__gte=last_24h,
        alert__in=['LOW', 'HIGH', 'MEDIUM']
    ).count()
      # Alert distribution (all time) - Fixed to use string "true"
    alert_distribution = {
        'low': DeviceData.objects.filter(alert='LOW').count(),
        'medium': DeviceData.objects.filter(alert='MEDIUM').count(),
        'high': DeviceData.objects.filter(alert='HIGH').count(),
        'empty': DeviceData.objects.filter(alert='EMPTY').count(),
        'full': DeviceData.objects.filter(alert='FULL').count(),
        'tamper': DeviceData.objects.filter(tamper="true").count()  # Fixed this line
    }
    
    # Debug logging to verify our changes
    logger.info(f"Alert distribution debug: empty={alert_distribution['empty']}, full={alert_distribution['full']}, low={alert_distribution['low']}, tamper={alert_distribution['tamper']}")
    
    # Most active devices (last 7 days)
    last_week = now - timedelta(days=7)
    active_devices = DeviceData.objects.filter(
        timestamp__gte=last_week    ).values('device__id', 'device__room_number', 'device__floor_number').annotate(
        entry_count=Count('id')
    ).order_by('-entry_count')[:5]
    
    # Debug logging to verify our changes
    logger.info(f"Alert distribution debug: empty={alert_distribution['empty']}, full={alert_distribution['full']}, low={alert_distribution['low']}, tamper={alert_distribution['tamper']}")
    
    return Response({
        'summary': {
            'total_devices': total_devices,
            'total_entries': total_entries,
            'recent_entries_24h': recent_entries,
            'recent_alerts_24h': recent_alerts
        },
        'alert_distribution': alert_distribution,
        'most_active_devices': list(active_devices)
    })



# Helper function to get time-based analytics data
def get_time_based_analytics_data(period, device_id=None, start_date=None, end_date=None):
    now = timezone.now()
    
    # If custom date range is provided, use it; otherwise use period-based defaults
    if start_date and end_date:
        # Parse the date strings if they're strings
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Ensure timezone awareness
        if start_date.tzinfo is None:
            start_date = timezone.make_aware(start_date)
        if end_date.tzinfo is None:
            end_date = timezone.make_aware(end_date)
            
        # Use custom date range
        custom_date_range = True
        date_format = '%Y-%m-%d'
        period_name = 'Day'
    else:
        # Calculate date ranges based on period (existing logic)
        custom_date_range = False
        if period == 'daily':
            start_date = now - timedelta(days=30)  # Last 30 days
            date_format = '%Y-%m-%d'
            period_name = 'Day'
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)  # Last 12 weeks
            date_format = '%Y-W%U'
            period_name = 'Week'
        elif period == 'monthly':
            start_date = now - timedelta(days=365)  # Last 12 months
            date_format = '%Y-%m'
            period_name = 'Month'
        elif period == 'quarterly':
            start_date = now - timedelta(days=365*2)  # Last 8 quarters
            date_format = '%Y-Q'
            period_name = 'Quarter'
        elif period == 'yearly':
            start_date = now - timedelta(days=365*5)  # Last 5 years
            date_format = '%Y'
            period_name = 'Year'
        else:
            return None
        end_date = now
    
    # Filter devices
    devices = Device.objects.all()
    if device_id:
        # Check if device_id is numeric (database ID) or string (device_id field)
        if device_id.isdigit():
            devices = devices.filter(id=device_id)
        else:
            devices = devices.filter(device_id=device_id)
    
    analytics_data = []
    
    for device in devices:
        device_data = DeviceData.objects.filter(
            device=device,
            timestamp__gte=start_date,
            timestamp__lte=end_date
        ).order_by('timestamp')
        
        # Group data by time periods
        period_data = {}
        
        for data_point in device_data:
            if custom_date_range:
                # For custom date ranges, group by day
                period_key = data_point.timestamp.strftime('%Y-%m-%d')
                period_name_display = f"Day {data_point.timestamp.strftime('%b %d, %Y')}"
            elif period == 'quarterly':
                quarter = f"{data_point.timestamp.year}-Q{((data_point.timestamp.month-1)//3)+1}"
                period_key = quarter
                period_name_display = f"{period_name} {period_key}"
            else:
                period_key = data_point.timestamp.strftime(date_format)
                period_name_display = f"{period_name} {period_key}"
            
            if period_key not in period_data:
                period_data[period_key] = {
                    'total_entries': 0,
                    'tamper_alerts': 0,
                    'empty_alerts': 0,
                    'low_alerts': 0,
                    'full_alerts': 0,
                    'battery_percentages': [],
                    'total_usages': [],
                    'counts': []
                }
            
            period_data[period_key]['total_entries'] += 1
            
            # Count alert types based on new system
            if data_point.alert == 'EMPTY':
                period_data[period_key]['empty_alerts'] += 1
            elif data_point.alert == 'LOW':
                period_data[period_key]['low_alerts'] += 1
            elif data_point.alert == 'FULL':
                period_data[period_key]['full_alerts'] += 1
                
            if data_point.tamper == "true":
                period_data[period_key]['tamper_alerts'] += 1
            
            # Collect new field data
            if data_point.battery_percentage is not None:
                period_data[period_key]['battery_percentages'].append(data_point.battery_percentage)
            
            if data_point.total_usage is not None:
                period_data[period_key]['total_usages'].append(data_point.total_usage)
            
            period_data[period_key]['counts'].append(data_point.count)
        
        # Convert to list format
        periods = []
        for period_key, data in sorted(period_data.items()):
            # Calculate averages for new fields - filter out None values
            valid_battery_percentages = [x for x in data['battery_percentages'] if x is not None]
            valid_total_usages = [x for x in data['total_usages'] if x is not None]
            valid_counts = [x for x in data['counts'] if x is not None]
            
            battery_avg = sum(valid_battery_percentages) / len(valid_battery_percentages) if valid_battery_percentages else None
            usage_avg = sum(valid_total_usages) / len(valid_total_usages) if valid_total_usages else None
            count_avg = sum(valid_counts) / len(valid_counts) if valid_counts else None
            
            period_entry = {
                'period': period_key,
                'period_name': period_name_display if custom_date_range else f"{period_name} {period_key}",
                'total_entries': data['total_entries'],
                'tamper_alerts': data['tamper_alerts'],
                'empty_alerts': data['empty_alerts'],
                'low_alerts': data['low_alerts'],
                'full_alerts': data['full_alerts'],
                'tamper_alerts': data['tamper_alerts'],
                'avg_battery_percentage': battery_avg,
                'avg_total_usage': usage_avg,
                'avg_count': count_avg,
                'battery_readings_count': len(data['battery_percentages']),
                'usage_readings_count': len(data['total_usages'])
            }
            periods.append(period_entry)
        
        analytics_data.append({
            'device_id': device.id,
            'room': device.room_number,
            'floor': device.floor_number,
            'device_name': device.name,  # Use the actual name field
            'periods': periods
        })
    
    # Add some logging to help debug
    if custom_date_range:
        logger.info(f"Analytics data generated for custom date range '{start_date.date()} to {end_date.date()}': {len(analytics_data)} devices, total periods: {sum(len(d.get('periods', [])) for d in analytics_data)}")
    else:
        logger.info(f"Analytics data generated for period '{period}': {len(analytics_data)} devices, total periods: {sum(len(d.get('periods', [])) for d in analytics_data)}")
    
    return {
        'period_type': 'custom' if custom_date_range else period,
        'date_range': {
            'start_date': start_date.isoformat() if custom_date_range else None,
            'end_date': end_date.isoformat() if custom_date_range else None,
        },
        'data': analytics_data
    }

# Add this new function to your views.py
@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            name='period',
            in_=openapi.IN_QUERY,
            description="Time period: weekly, monthly, quarterly, yearly",
            type=openapi.TYPE_STRING,
            required=False,
            enum=['weekly', 'monthly', 'quarterly', 'yearly']
        ),
        openapi.Parameter(
            name='device_id',
            in_=openapi.IN_QUERY,
            description="Optional device ID to filter",
            type=openapi.TYPE_INTEGER,
            required=False
        ),
        openapi.Parameter(
            name='start_date',
            in_=openapi.IN_QUERY,
            description="Start date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        ),
        openapi.Parameter(
            name='end_date',
            in_=openapi.IN_QUERY,
            description="End date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        )
    ],
    responses={
        200: openapi.Response('PDF analytics data file'),
        400: openapi.Response('Invalid request parameters'),
        500: openapi.Response('Server error')
    },
    operation_summary="Download PDF analytics report",
    operation_description="Download device analytics in PDF format. Falls back to HTML if PDF libraries unavailable."
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_pdf_analytics(request):
    """Generate and download analytics report as PDF (with HTML fallback)"""
    try:
        # Get parameters
        period = request.GET.get('period', 'weekly')
        device_id = request.GET.get('device_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        logger.info(f"PDF download requested for period: {period}, device_id: {device_id}")
        
        # Get analytics data
        analytics_data = get_time_based_analytics_data(period, device_id, start_date, end_date)
        if analytics_data is None:
            logger.error(f"Invalid period specified: {period}")
            return Response({'error': 'Invalid period specified'}, status=400)
        
        # Check if we have any data
        total_devices = len(analytics_data.get('data', []))
        total_periods = sum(len(d.get('periods', [])) for d in analytics_data.get('data', []))
        
        logger.info(f"PDF generation: {total_devices} devices, {total_periods} total periods")
        
        if total_devices == 0:
            logger.warning("No devices found for PDF generation")
            return Response({'error': 'No devices found in the system'}, status=404)
        
        if total_periods == 0:
            logger.warning(f"No data found for the specified period: {period}")
            # Still generate PDF but with a message about no data
        
        # Generate filename
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"analytics_report_{period}_{timestamp}"
        
        # Check if reportlab is available
        pdf_available = False
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.enums import TA_CENTER
            import io
            pdf_available = True
            logger.info("ReportLab available, generating PDF")
        except ImportError:
            logger.info("ReportLab not available, using HTML format")
        
        if pdf_available:
            return generate_reportlab_pdf(analytics_data, filename, period)
        else:
            return generate_html_report(analytics_data, filename, period)
            
    except Exception as e:
        logger.exception(f"Report generation failed: {str(e)}")
        return Response({'error': f'Report generation failed: {str(e)}'}, status=500)


def generate_reportlab_pdf(analytics_data, filename, period):
    """Generate PDF using ReportLab"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.enums import TA_CENTER
    import io
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    # Build content
    story = []
      # Title and metadata
    story.append(Paragraph(f"Device Analytics Report - {period.title()}", title_style))
    story.append(Spacer(1, 12))
    
    total_devices = len(analytics_data.get('data', []))
    total_periods = sum(len(d.get('periods', [])) for d in analytics_data.get('data', []))
    
    report_info = f"""    Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    Period: {period.title()}
    Total Devices: {total_devices}
    Data Points: {total_periods}
    """
    story.append(Paragraph(report_info, styles['Normal']))
    story.append(Spacer(1, 20))
    
    if total_devices == 0:
        story.append(Paragraph("❌ No devices found in the system.", styles['Heading2']))
        story.append(Paragraph("Please add devices to start collecting analytics data.", styles['Normal']))
    elif total_periods == 0:
        story.append(Paragraph(f"⚠️ No data available for the {period} period.", styles['Heading2']))
        story.append(Paragraph("Try selecting a different time period or check if devices are sending data.", styles['Normal']))
    else:
        # Process each device
        for device in analytics_data.get('data', []):
            device_name = device.get('device_name', f"Device {device.get('device_id', 'Unknown')}")
            room = device.get('room', 'N/A')
            floor = device.get('floor', 'N/A')
            
            # Device header
            story.append(Paragraph(f"Device: {device_name} (Room {room}, Floor {floor})", styles['Heading2']))
            story.append(Spacer(1, 8))
            
            periods = device.get('periods', [])
            if not periods:
                story.append(Paragraph("No data available for this time period.", styles['Normal']))
                story.append(Spacer(1, 12))
                continue
              # Create table
            table_data = [['Period', 'Entries', 'Tamper', 'Empty', 'Low', 'Full', 'Battery(%)', 'Usage']]
        
        for period_data in periods:
            # Handle battery percentage - ensure it's properly formatted
            battery_percentage = period_data.get('avg_battery_percentage')
            if battery_percentage is not None and battery_percentage != '' and battery_percentage != 'N/A':
                try:
                    battery_str = f"{float(battery_percentage):.1f}%"
                except (ValueError, TypeError):
                    battery_str = 'N/A'
            else:
                battery_str = 'N/A'
            
            # Handle total usage
            total_usage = period_data.get('avg_total_usage')
            if total_usage is not None and total_usage != '' and total_usage != 'N/A':
                try:
                    usage_str = f"{int(float(total_usage))}"
                except (ValueError, TypeError):
                    usage_str = 'N/A'
            else:                usage_str = 'N/A'
            
            table_data.append([
                period_data.get('period_name', period_data.get('period', 'Unknown')),
                str(period_data.get('total_entries', 0)),
                str(period_data.get('tamper_alerts', 0)),
                str(period_data.get('empty_alerts', 0)),
                str(period_data.get('low_alerts', 0)),
                str(period_data.get('full_alerts', 0)),
                battery_str,
                usage_str
            ])
        
        table = Table(table_data, colWidths=[60, 40, 40, 40, 40, 40, 50, 40])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 15))
    
    # Build PDF
    doc.build(story)
    
    # Create response
    pdf_content = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    response.write(pdf_content)
    
    return response


def generate_html_report(analytics_data, filename, period):
    """Generate HTML report as fallback when PDF libraries are not available"""
    
    # Create styled HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Analytics Report</title>
        <style>
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 20px; 
                background-color: #f5f5f5;
            }}
            .container {{ 
                background-color: white; 
                padding: 30px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            h1 {{ 
                text-align: center; 
                color: #2c3e50; 
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }}
            h2 {{ 
                color: #34495e; 
                border-bottom: 2px solid #ecf0f1; 
                padding-bottom: 5px;
                margin-top: 30px;
            }}
            table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            th, td {{ 
                border: 1px solid #ddd; 
                padding: 12px 8px; 
                text-align: center; 
            }}
            th {{ 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold; 
                text-transform: uppercase;
                font-size: 0.9em;
            }}
            tr:nth-child(even) {{ background-color: #f8f9fa; }}
            tr:hover {{ background-color: #e8f4fd; }}
            .info {{ 
                background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
                color: white;
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 5px;
                text-align: center;
            }}
            .no-data {{ 
                text-align: center; 
                color: #7f8c8d; 
                font-style: italic; 
                padding: 20px;
                background-color: #ecf0f1;
                border-radius: 5px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ecf0f1;
                color: #7f8c8d;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Device Analytics Report - {period.title()}</h1>
            <div class="info">
                <strong>📅 Generated:</strong> {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>⏱️ Period:</strong> {period.title()} &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>🏠 Devices:</strong> {len(analytics_data.get('data', []))}
            </div>
    """
      # Process each device
    for device in analytics_data.get('data', []):
        device_name = device.get('device_name', f"Device {device.get('device_id', 'Unknown')}")
        room = device.get('room', 'N/A')
        floor = device.get('floor', 'N/A')
        
        html_content += f"""
        <h2>🔌 Device: {device_name} (Room {room}, Floor {floor})</h2>
        """
        
        periods = device.get('periods', [])
        if not periods:
            html_content += '<div class="no-data">📭 No data available for this time period.</div>'
            continue
        
        html_content += """        <table>
            <thead>
                <tr>
                    <th>📅 Period</th>
                    <th>📊 Total Entries</th>
                    <th>🛡️ Tamper Alerts</th>
                    <th>🪫 Empty Alerts</th>
                    <th>⚠️ Low Alerts</th>
                    <th>✅ Full Alerts</th>
                    <th>🔋 Avg Battery (V)</th>
                    <th>📈 Avg Usage</th>
                </tr>
            </thead>
            <tbody>
        """
        
        for period_data in periods:
            # Handle battery percentage properly
            battery_percentage = period_data.get('avg_battery_percentage')
            if battery_percentage is not None and battery_percentage != '' and battery_percentage != 'N/A':
                try:
                    battery_str = f"{float(battery_percentage):.1f}%"
                except (ValueError, TypeError):
                    battery_str = 'N/A'
            else:
                battery_str = 'N/A'
            
            # Handle total usage
            total_usage = period_data.get('avg_total_usage')
            if total_usage is not None and total_usage != '' and total_usage != 'N/A':
                try:
                    usage_str = f"{int(float(total_usage))}"
                except (ValueError, TypeError):
                    usage_str = 'N/A'
            else:
                usage_str = 'N/A'
            
            html_content += f"""
            <tr>
                <td><strong>{period_data.get('period_name', period_data.get('period', 'Unknown'))}</strong></td>
                <td>{period_data.get('total_entries', 0)}</td>
                <td>{period_data.get('tamper_alerts', 0)}</td>
                <td>{period_data.get('empty_alerts', 0)}</td>
                <td>{period_data.get('low_alerts', 0)}</td>
                <td>{period_data.get('full_alerts', 0)}</td>
                <td>{battery_str}</td>
                <td>{usage_str}</td>
            </tr>
            """
        
        html_content += """
            </tbody>
        </table>
        """
    
    html_content += """
            <div class="footer">
                🤖 Generated by Smart Dispenser Analytics System<br/>
                📄 <em>Note: PDF format requires additional libraries. This HTML report contains the same data.</em>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Return HTML response
    response = HttpResponse(content_type='text/html')
    response['Content-Disposition'] = f'attachment; filename="{filename}.html"'
    response.write(html_content)
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_data_check(request):
    """Test endpoint to check if there's data in the database"""
    try:
        device_count = Device.objects.count()
        device_data_count = DeviceData.objects.count()
        
        # Get a sample of recent data
        recent_data = DeviceData.objects.order_by('-timestamp')[:5]
        recent_samples = []
        
        for data in recent_data:
            recent_samples.append({
                'device_name': data.device.name,
                'device_id': data.device.id,
                'timestamp': data.timestamp,
                'alert': data.alert,
                'count': data.count,
                'battery_percentage': data.battery_percentage,
                'total_usage': data.total_usage,
                'tamper': data.tamper
            })
        
        # Get devices info
        devices = Device.objects.all()[:5]
        device_samples = []
        
        for device in devices:
            device_data_count_for_device = DeviceData.objects.filter(device=device).count()
            device_samples.append({
                'id': device.id,
                'name': device.name,
                'room': device.room_number,
                'floor': device.floor_number,
                'data_entries': device_data_count_for_device
            })
        
        return Response({
            'total_devices': device_count,
            'total_device_data': device_data_count,
            'recent_data_samples': recent_samples,
            'device_samples': device_samples,
            'message': 'Database check complete'
        })
        
    except Exception as e:
        logger.exception(f"Test data check failed: {str(e)}")
        return Response({'error': f'Test failed: {str(e)}'}, status=500)

@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter('period', openapi.IN_QUERY, description="Period: weekly, monthly, quarterly, yearly", type=openapi.TYPE_STRING),
        openapi.Parameter('device_id', openapi.IN_QUERY, description="Specific device ID (optional)", type=openapi.TYPE_INTEGER),
        openapi.Parameter('start_date', openapi.IN_QUERY, description="Start date for custom range (ISO format)", type=openapi.TYPE_STRING),
        openapi.Parameter('end_date', openapi.IN_QUERY, description="End date for custom range (ISO format)", type=openapi.TYPE_STRING),
    ],
    responses={200: openapi.Response('Time-based analytics')},
    operation_description="Get analytics data for different time periods or custom date ranges"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def time_based_analytics(request):
    period = request.GET.get('period', 'weekly')
    device_id = request.GET.get('device_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    analytics_data = get_time_based_analytics_data(period, device_id, start_date, end_date)
    if analytics_data is None:
        return Response({'error': 'Invalid period or date range'}, status=400)
    
    return Response(analytics_data)

@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            name='period',
            in_=openapi.IN_QUERY,
            description="Time period: weekly, monthly, quarterly, yearly",
            type=openapi.TYPE_STRING,
            required=False,
            enum=['weekly', 'monthly', 'quarterly', 'yearly']
        ),
        openapi.Parameter(
            name='device_id',
            in_=openapi.IN_QUERY,
            description="Optional device ID to filter",
            type=openapi.TYPE_INTEGER,
            required=False
        ),
        openapi.Parameter(
            name='start_date',
            in_=openapi.IN_QUERY,
            description="Start date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        ),
        openapi.Parameter(
            name='end_date',
            in_=openapi.IN_QUERY,
            description="End date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        )
    ],
    responses={
        200: openapi.Response('CSV analytics data file'),
        400: openapi.Response('Invalid request parameters'),
        500: openapi.Response('Server error')
    },
    operation_summary="Download CSV analytics report",
    operation_description="Download device analytics in CSV format."
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_csv_analytics(request):
    """Generate and download analytics report as CSV"""
    try:
        period = request.GET.get('period', 'weekly')
        device_id = request.GET.get('device_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        analytics_data = get_time_based_analytics_data(period, device_id, start_date, end_date)
        if analytics_data is None:
            return Response({'error': 'Invalid period specified'}, status=400)
        # Prepare CSV
        response = HttpResponse(content_type='text/csv')
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"analytics_report_{period}_{timestamp}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(['Device Name', 'Room', 'Floor', 'Period', 'Entries', 'Tamper', 'Empty', 'Low', 'Full', 'Battery(%)', 'Usage'])
        for device in analytics_data.get('data', []):
            device_name = device.get('device_name', f"Device {device.get('device_id', 'Unknown')}")
            room = device.get('room', 'N/A')
            floor = device.get('floor', 'N/A')
            for period_data in device.get('periods', []):
                battery_percentage = period_data.get('avg_battery_percentage')
                if battery_percentage is not None and battery_percentage != '' and battery_percentage != 'N/A':
                    try:
                        battery_str = f"{float(battery_percentage):.1f}%"
                    except (ValueError, TypeError):
                        battery_str = 'N/A'
                else:
                    battery_str = 'N/A'
                total_usage = period_data.get('avg_total_usage')
                if total_usage is not None and total_usage != '' and total_usage != 'N/A':
                    try:
                        usage_str = f"{int(float(total_usage))}"
                    except (ValueError, TypeError):
                        usage_str = 'N/A'
                else:
                    usage_str = 'N/A'
                writer.writerow([
                    device_name,
                    room,
                    floor,
                    period_data.get('period_name', period_data.get('period', 'Unknown')),
                    period_data.get('total_entries', 0),
                    period_data.get('tamper_alerts', 0),
                    period_data.get('empty_alerts', 0),
                    period_data.get('low_alerts', 0),
                    period_data.get('full_alerts', 0),
                    battery_str,
                    usage_str
                ])
        return response
    except Exception as e:
        logger.exception(f"CSV report generation failed: {str(e)}")
        return Response({'error': f'CSV report generation failed: {str(e)}'}, status=500)


@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            name='period',
            in_=openapi.IN_QUERY,
            description="Time period: weekly, monthly, quarterly, yearly",
            type=openapi.TYPE_STRING,
            required=False,
            enum=['weekly', 'monthly', 'quarterly', 'yearly']
        ),
        openapi.Parameter(
            name='device_id',
            in_=openapi.IN_QUERY,
            description="Optional device ID to filter",
            type=openapi.TYPE_INTEGER,
            required=False
        ),
        openapi.Parameter(
            name='start_date',
            in_=openapi.IN_QUERY,
            description="Start date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        ),
        openapi.Parameter(
            name='end_date',
            in_=openapi.IN_QUERY,
            description="End date for custom range (ISO format)",
            type=openapi.TYPE_STRING,
            required=False
        )
    ],
    responses={
        200: openapi.Response('JSON analytics data file'),
        400: openapi.Response('Invalid request parameters'),
        500: openapi.Response('Server error')
    },
    operation_summary="Download JSON analytics report",
    operation_description="Download device analytics in JSON format."
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_json_analytics(request):
    """Generate and download analytics report as JSON"""
    try:
        period = request.GET.get('period', 'weekly')
        device_id = request.GET.get('device_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        analytics_data = get_time_based_analytics_data(period, device_id, start_date, end_date)
        if analytics_data is None:
            return Response({'error': 'Invalid period specified'}, status=400)
        # Prepare JSON
        response = HttpResponse(content_type='application/json')
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"analytics_report_{period}_{timestamp}.json"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(json.dumps(analytics_data, indent=2, default=str))
        return response
    except Exception as e:
        logger.exception(f"JSON report generation failed: {str(e)}")
        return Response({'error': f'JSON report generation failed: {str(e)}'}, status=500)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Device status distribution')},
    operation_description="Get distribution of device statuses across the system"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_status_distribution(request):
    """Get distribution of device statuses"""
    try:
        devices = Device.objects.all()
        status_counts = {
            'normal': 0,
            'low': 0,
            'empty': 0,
            'full': 0,
            'tamper': 0,
            'battery_low': 0,
            'battery_critical': 0,
            'power_off': 0,
            'offline': 0
        }
        
        for device in devices:
            latest_data = DeviceData.objects.filter(device=device).order_by('-timestamp').first()
            
            if not latest_data:
                status_counts['offline'] += 1
                continue
                
            time_since_update = timezone.now() - latest_data.timestamp
            minutes_since_update = int(time_since_update.total_seconds() / 60)
            
            if minutes_since_update > 5:
                status_counts['offline'] += 1
            elif latest_data.tamper == "true":
                status_counts['tamper'] += 1
            elif latest_data.alert == "EMPTY":
                status_counts['empty'] += 1
            elif latest_data.alert == "LOW":
                status_counts['low'] += 1
            elif latest_data.alert == "FULL":
                status_counts['full'] += 1
            elif latest_data.battery_percentage is not None:
                if latest_data.battery_percentage <= 10:
                    status_counts['battery_critical'] += 1
                elif latest_data.battery_percentage <= 20:
                    status_counts['battery_low'] += 1
                else:
                    status_counts['normal'] += 1
            elif latest_data.power_status and str(latest_data.power_status).lower() in ['off', 'no', 'none', '0', 'false']:
                status_counts['power_off'] += 1
            else:
                status_counts['normal'] += 1
        
        total_devices = sum(status_counts.values())
        
        return Response({
            'status_distribution': status_counts,
            'total_devices': total_devices,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        logger.exception(f"Device status distribution failed: {str(e)}")
        return Response({'error': f'Device status distribution failed: {str(e)}'}, status=500)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Battery usage analytics')},
    operation_description="Get battery usage analytics for all devices"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def battery_usage_analytics(request):
    """Get battery usage analytics"""
    try:
        devices = Device.objects.all()
        battery_data = []
        
        for device in devices:
            device_data = DeviceData.objects.filter(device=device).exclude(battery_percentage=None)
            
            if not device_data.exists():
                continue
                
            avg_battery = device_data.aggregate(avg=models.Avg('battery_percentage'))['avg']
            min_battery = device_data.aggregate(min=models.Min('battery_percentage'))['min']
            max_battery = device_data.aggregate(max=models.Max('battery_percentage'))['max']
            
            battery_low_count = device_data.filter(
                battery_percentage__gt=10, 
                battery_percentage__lte=20
            ).count()
            
            battery_critical_count = device_data.filter(
                battery_percentage__lte=10
            ).count()
            
            battery_data.append({
                'device_id': device.id,
                'device_name': device.name,
                'room': device.room_number,
                'floor': device.floor_number,
                'avg_battery': round(avg_battery, 2) if avg_battery else None,
                'min_battery': round(min_battery, 2) if min_battery else None,
                'max_battery': round(max_battery, 2) if max_battery else None,
                'battery_low_count': battery_low_count,
                'battery_critical_count': battery_critical_count,
                'total_battery_alerts': battery_low_count + battery_critical_count
            })
        
        return Response({
            'battery_analytics': battery_data,
            'total_devices': len(battery_data),
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        logger.exception(f"Battery usage analytics failed: {str(e)}")
        return Response({'error': f'Battery usage analytics failed: {str(e)}'}, status=500)


@swagger_auto_schema(
    method='get',
    responses={200: openapi.Response('Battery usage trends')},
    operation_description="Get battery usage trends over time"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def battery_usage_trends(request):
    """Get battery usage trends over time"""
    try:
        devices = Device.objects.all()
        trends_data = []
        
        for device in devices:
            # Get battery data for the last 7 days
            week_ago = timezone.now() - timedelta(days=7)
            device_data = DeviceData.objects.filter(
                device=device,
                timestamp__gte=week_ago
            ).exclude(battery_percentage=None).order_by('timestamp')
            
            if not device_data.exists():
                continue
                
            # Group by day
            daily_battery = {}
            for data in device_data:
                day = data.timestamp.date()
                if day not in daily_battery:
                    daily_battery[day] = []
                daily_battery[day].append(data.battery_percentage)
            
            # Calculate daily averages
            daily_averages = []
            for day, values in sorted(daily_battery.items()):
                avg_battery = sum(values) / len(values)
                daily_averages.append({
                    'date': day,
                    'avg_battery': round(avg_battery, 2),
                    'readings_count': len(values)
                })
            
            trends_data.append({
                'device_id': device.id,
                'device_name': device.name,
                'room': device.room_number,
                'floor': device.floor_number,
                'daily_trends': daily_averages
            })
        
        return Response({
            'battery_trends': trends_data,
            'total_devices': len(trends_data),
            'period': '7 days',
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        logger.exception(f"Battery usage trends failed: {str(e)}")
        return Response({'error': f'Battery usage trends failed: {str(e)}'}, status=500)
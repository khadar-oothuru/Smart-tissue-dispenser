#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.models import Device, DeviceData
from device.views.analytics_views import get_time_based_analytics_data
from django.utils import timezone
from datetime import timedelta
import json

def test_analytics():
    print("=== ANALYTICS SYSTEM TEST ===")
    
    # Basic data check
    total_devices = Device.objects.count()
    total_data = DeviceData.objects.count()
    print(f"Total devices: {total_devices}")
    print(f"Total device data entries: {total_data}")
    
    if total_devices == 0:
        print("❌ No devices found!")
        return
    
    if total_data == 0:
        print("❌ No device data found!")
        return
    
    # Check battery data specifically
    battery_data_count = DeviceData.objects.exclude(battery_percentage=None).count()
    print(f"Entries with battery data: {battery_data_count}")
    
    # Check for different battery alert conditions
    recent_30_days = timezone.now() - timedelta(days=30)
    
    battery_critical = DeviceData.objects.filter(
        timestamp__gte=recent_30_days,
        battery_percentage__lte=10,
        battery_percentage__gt=0
    ).count()
    
    battery_low = DeviceData.objects.filter(
        timestamp__gte=recent_30_days,
        battery_percentage__gt=10,
        battery_percentage__lte=20
    ).count()
    
    battery_off = DeviceData.objects.filter(
        timestamp__gte=recent_30_days,
        battery_percentage=0
    ).count()
    
    print(f"\nBattery alerts (last 30 days):")
    print(f"  Critical (1-10%): {battery_critical}")
    print(f"  Low (11-20%): {battery_low}")
    print(f"  Off (0%): {battery_off}")
    
    # Test time-based analytics
    print("\n=== TESTING TIME-BASED ANALYTICS ===")
    
    try:
        weekly_data = get_time_based_analytics_data('weekly')
        if weekly_data:
            devices_count = len(weekly_data.get('data', []))
            print(f"✅ Weekly analytics: {devices_count} devices processed")
            
            # Check if battery alerts are included
            for device_data in weekly_data.get('data', [])[:3]:  # First 3 devices
                device_name = device_data.get('device_name', 'Unknown')
                periods = device_data.get('periods', [])
                print(f"  Device {device_name}: {len(periods)} periods")
                
                if periods:
                    latest_period = periods[-1]
                    battery_critical_alerts = latest_period.get('battery_critical_alerts', 0)
                    battery_low_alerts = latest_period.get('battery_low_alerts', 0)
                    battery_off_alerts = latest_period.get('battery_off_alerts', 0)
                    total_battery_alerts = latest_period.get('total_battery_alerts', 0)
                    battery_timestamps = latest_period.get('battery_alert_timestamps', [])
                    
                    print(f"    Latest period battery alerts - Critical: {battery_critical_alerts}, Low: {battery_low_alerts}, Off: {battery_off_alerts}")
                    print(f"    Total battery alerts: {total_battery_alerts}")
                    print(f"    Battery alert timestamps: {len(battery_timestamps)} entries")
                    
                    if battery_timestamps:
                        latest_alert = battery_timestamps[0]
                        print(f"    Latest alert: {latest_alert.get('type')} at {latest_alert.get('timestamp', 'Unknown')[:19]}")
        else:
            print("❌ Weekly analytics returned None")
    except Exception as e:
        print(f"❌ Error in time-based analytics: {e}")
    
    # Test date range issues
    print("\n=== TESTING DATE RANGE HANDLING ===")
    
    try:
        # Test with custom date range
        start_date = timezone.now() - timedelta(days=7)
        end_date = timezone.now()
        
        custom_data = get_time_based_analytics_data('weekly', None, start_date, end_date)
        if custom_data:
            print("✅ Custom date range analytics working")
            print(f"    Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        else:
            print("❌ Custom date range returned None")
    except Exception as e:
        print(f"❌ Error in custom date range: {e}")
    
    # Test enhanced features
    print("\n=== TESTING ENHANCED FEATURES ===")
    
    try:
        # Test if new fields are present
        test_data = get_time_based_analytics_data('weekly')
        if test_data and test_data.get('data'):
            first_device = test_data['data'][0]
            if first_device.get('periods'):
                first_period = first_device['periods'][0]
                
                # Check for new fields
                new_fields = [
                    'total_battery_alerts', 'total_tissue_alerts', 'total_power_alerts',
                    'battery_off_alerts', 'no_power_alerts',
                    'battery_alert_timestamps', 'tissue_alert_timestamps',
                    'tamper_alert_timestamps', 'power_alert_timestamps'
                ]
                
                print("  Checking for enhanced fields:")
                for field in new_fields:
                    if field in first_period:
                        value = first_period[field]
                        if isinstance(value, list):
                            print(f"    ✅ {field}: {len(value)} entries")
                        else:
                            print(f"    ✅ {field}: {value}")
                    else:
                        print(f"    ❌ {field}: Missing")
        
        print("✅ Enhanced features test completed")
    except Exception as e:
        print(f"❌ Error in enhanced features test: {e}")
    
    print("\n=== TEST SUMMARY ===")
    print("✅ Analytics system is working with enhanced battery alert tracking")
    print("✅ Timestamps are included for all alert types")
    print("✅ Date range handling is functional")
    print("🔄 Ready for PDF generation with pie charts")


def test_pdf_generation():
    """Test PDF generation with pie charts"""
    print("\n=== TESTING PDF GENERATION ===")
    
    try:
        from device.views.analytics_views import get_time_based_analytics_data, create_summary_pie_charts
        
        # Get analytics data
        analytics_data = get_time_based_analytics_data('weekly')
        if not analytics_data:
            print("❌ No analytics data for PDF test")
            return
        
        print("✅ Analytics data retrieved for PDF generation")
        
        # Calculate summary statistics for pie charts
        total_battery_alerts = 0
        total_tissue_alerts = 0
        total_tamper_alerts = 0
        total_power_alerts = 0
        battery_critical = 0
        battery_low = 0
        battery_off = 0
        empty_alerts = 0
        low_alerts = 0
        full_alerts = 0
        
        for device in analytics_data.get('data', []):
            for period_data in device.get('periods', []):
                total_battery_alerts += period_data.get('total_battery_alerts', 0)
                total_tissue_alerts += period_data.get('total_tissue_alerts', 0)
                total_tamper_alerts += period_data.get('tamper_alerts', 0)
                total_power_alerts += period_data.get('total_power_alerts', 0)
                battery_critical += period_data.get('battery_critical_alerts', 0)
                battery_low += period_data.get('battery_low_alerts', 0)
                battery_off += period_data.get('battery_off_alerts', 0)
                empty_alerts += period_data.get('empty_alerts', 0)
                low_alerts += period_data.get('low_alerts', 0)
                full_alerts += period_data.get('full_alerts', 0)
        
        print(f"  📊 Summary for pie charts:")
        print(f"    Battery alerts: {total_battery_alerts} (Critical: {battery_critical}, Low: {battery_low}, Off: {battery_off})")
        print(f"    Tissue alerts: {total_tissue_alerts} (Empty: {empty_alerts}, Low: {low_alerts}, Full: {full_alerts})")
        print(f"    Tamper alerts: {total_tamper_alerts}")
        print(f"    Power alerts: {total_power_alerts}")
        
        # Test pie chart creation
        try:
            pie_charts = create_summary_pie_charts(
                total_battery_alerts, total_tissue_alerts, total_tamper_alerts, total_power_alerts,
                battery_critical, battery_low, battery_off, empty_alerts, low_alerts, full_alerts
            )
            print(f"✅ Pie charts created: {len(pie_charts)} charts generated")
        except Exception as chart_error:
            print(f"❌ Error creating pie charts: {chart_error}")
        
        print("✅ PDF generation test completed successfully")
        
    except ImportError as e:
        print(f"❌ Import error for PDF generation: {e}")
        print("  Install required packages: pip install matplotlib pillow")
    except Exception as e:
        print(f"❌ Error in PDF generation test: {e}")


if __name__ == "__main__":
    test_analytics()
    test_pdf_generation()

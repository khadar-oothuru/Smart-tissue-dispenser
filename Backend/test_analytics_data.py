#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.views.analytics_views import get_time_based_analytics_data
from device.models import Device, DeviceData

def test_analytics_data():
    """Test what analytics data is being generated"""
    print("=== TESTING ANALYTICS DATA CONTENT ===")
    
    try:
        # Check if we have any devices
        devices = Device.objects.all()
        print(f"📊 Total devices in system: {devices.count()}")
        
        for device in devices[:3]:  # Show first 3 devices
            print(f"  - Device {device.id}: {device.name} (Room {device.room_number}, Floor {device.floor_number})")
        
        # Check recent data entries
        recent_data = DeviceData.objects.all().order_by('-timestamp')[:10]
        print(f"\n📈 Recent data entries: {recent_data.count()}")
        
        for data in recent_data[:5]:  # Show first 5 entries
            print(f"  - {data.timestamp}: Device {data.device.name}, Alert: {data.alert}, Battery: {data.battery_percentage}%, Tamper: {data.tamper}")
        
        # Get analytics data
        analytics_data = get_time_based_analytics_data('weekly')
        if not analytics_data:
            print("❌ No analytics data returned")
            return
        
        print(f"\n📊 Analytics data structure:")
        print(f"  - Period type: {analytics_data.get('period_type')}")
        print(f"  - Devices: {len(analytics_data.get('data', []))}")
        
        # Check each device's data
        for device_data in analytics_data.get('data', [])[:2]:  # Show first 2 devices
            print(f"\n🏥 Device: {device_data.get('device_name')} (ID: {device_data.get('device_id')})")
            print(f"  - Room: {device_data.get('room')}, Floor: {device_data.get('floor')}")
            print(f"  - Periods: {len(device_data.get('periods', []))}")
            
            # Check alerts in each period
            for period in device_data.get('periods', [])[:3]:  # Show first 3 periods
                print(f"    📅 {period.get('period_name', period.get('period'))}:")
                print(f"      - Total entries: {period.get('total_entries', 0)}")
                print(f"      - Tissue alerts: {period.get('total_tissue_alerts', 0)} (Empty: {period.get('empty_alerts', 0)}, Low: {period.get('low_alerts', 0)}, Full: {period.get('full_alerts', 0)})")
                print(f"      - Battery alerts: {period.get('total_battery_alerts', 0)} (Critical: {period.get('battery_critical_alerts', 0)}, Low: {period.get('battery_low_alerts', 0)}, Off: {period.get('battery_off_alerts', 0)})")
                print(f"      - Tamper alerts: {period.get('tamper_alerts', 0)}")
                print(f"      - Power alerts: {period.get('total_power_alerts', 0)}")
        
        # Save sample data to JSON for inspection
        sample_file = "sample_analytics_data.json"
        with open(sample_file, 'w') as f:
            json.dump(analytics_data, f, indent=2, default=str)
        print(f"\n💾 Sample analytics data saved to: {os.path.abspath(sample_file)}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analytics_data()

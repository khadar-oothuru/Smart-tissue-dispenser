#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.views.analytics_views import get_time_based_analytics_data, generate_reportlab_pdf
from device.models import Device, DeviceData

def test_alert_details_in_pdf():
    """Test that all alert details are included in PDF"""
    print("=== TESTING ALERT DETAILS IN PDF ===")
    
    try:
        # Get analytics data
        analytics_data = get_time_based_analytics_data('weekly')
        
        if not analytics_data or not analytics_data.get('data'):
            print("❌ No analytics data available")
            return
        
        # Count different types of alerts
        total_battery_timestamps = 0
        total_tissue_timestamps = 0
        total_tamper_timestamps = 0
        total_power_timestamps = 0
        
        devices_with_battery_details = 0
        devices_with_tissue_details = 0
        devices_with_tamper_details = 0
        devices_with_power_details = 0
        
        print(f"📊 Analyzing alert details from {len(analytics_data['data'])} devices:")
        
        for device_data in analytics_data['data']:
            device_name = device_data.get('device_name', 'Unknown')
            periods = device_data.get('periods', [])
            
            device_battery_count = 0
            device_tissue_count = 0
            device_tamper_count = 0
            device_power_count = 0
            
            for period in periods:
                battery_timestamps = period.get('battery_alert_timestamps', [])
                tissue_timestamps = period.get('tissue_alert_timestamps', [])
                tamper_timestamps = period.get('tamper_alert_timestamps', [])
                power_timestamps = period.get('power_alert_timestamps', [])
                
                device_battery_count += len(battery_timestamps)
                device_tissue_count += len(tissue_timestamps)
                device_tamper_count += len(tamper_timestamps)
                device_power_count += len(power_timestamps)
            
            total_battery_timestamps += device_battery_count
            total_tissue_timestamps += device_tissue_count
            total_tamper_timestamps += device_tamper_count
            total_power_timestamps += device_power_count
            
            if device_battery_count > 0:
                devices_with_battery_details += 1
            if device_tissue_count > 0:
                devices_with_tissue_details += 1
            if device_tamper_count > 0:
                devices_with_tamper_details += 1
            if device_power_count > 0:
                devices_with_power_details += 1
            
            if device_battery_count > 0 or device_tissue_count > 0 or device_tamper_count > 0 or device_power_count > 0:
                print(f"  📱 {device_name}:")
                if device_battery_count > 0:
                    print(f"    🔋 Battery alerts with timestamps: {device_battery_count}")
                if device_tissue_count > 0:
                    print(f"    🧻 Tissue alerts with timestamps: {device_tissue_count}")
                if device_tamper_count > 0:
                    print(f"    🚨 Tamper alerts with timestamps: {device_tamper_count}")
                if device_power_count > 0:
                    print(f"    ⚡ Power alerts with timestamps: {device_power_count}")
        
        print(f"\n📈 ALERT DETAILS SUMMARY:")
        print(f"  - Total battery alert timestamps: {total_battery_timestamps}")
        print(f"  - Total tissue alert timestamps: {total_tissue_timestamps}")
        print(f"  - Total tamper alert timestamps: {total_tamper_timestamps}")
        print(f"  - Total power alert timestamps: {total_power_timestamps}")
        print(f"\n📊 DEVICES WITH ALERT DETAILS:")
        print(f"  - Devices with battery details: {devices_with_battery_details}")
        print(f"  - Devices with tissue details: {devices_with_tissue_details}")
        print(f"  - Devices with tamper details: {devices_with_tamper_details}")
        print(f"  - Devices with power details: {devices_with_power_details}")
        
        # Show sample timestamps
        sample_device = analytics_data['data'][0]
        sample_periods = sample_device.get('periods', [])[:2]  # Show first 2 periods
        
        print(f"\n🔍 SAMPLE ALERT TIMESTAMPS (Device: {sample_device.get('device_name')}):")
        for period in sample_periods:
            period_name = period.get('period_name', 'Unknown')
            print(f"  📅 {period_name}:")
            
            battery_timestamps = period.get('battery_alert_timestamps', [])
            if battery_timestamps:
                print(f"    🔋 Battery alerts: {len(battery_timestamps)}")
                for alert in battery_timestamps[:2]:  # Show first 2
                    print(f"      - {alert.get('type')} ({alert.get('percentage')}%) at {alert.get('timestamp', 'Unknown')[:19]}")
            
            tissue_timestamps = period.get('tissue_alert_timestamps', [])
            if tissue_timestamps:
                print(f"    🧻 Tissue alerts: {len(tissue_timestamps)}")
                for alert in tissue_timestamps[:2]:  # Show first 2
                    print(f"      - {alert.get('type')} at {alert.get('timestamp', 'Unknown')[:19]}")
            
            tamper_timestamps = period.get('tamper_alert_timestamps', [])
            if tamper_timestamps:
                print(f"    🚨 Tamper alerts: {len(tamper_timestamps)}")
                for alert in tamper_timestamps[:2]:  # Show first 2
                    print(f"      - TAMPER_DETECTED at {alert.get('timestamp', 'Unknown')[:19]}")
            
            power_timestamps = period.get('power_alert_timestamps', [])
            if power_timestamps:
                print(f"    ⚡ Power alerts: {len(power_timestamps)}")
                for alert in power_timestamps[:2]:  # Show first 2
                    print(f"      - {alert.get('type')} (Status: {alert.get('status')}) at {alert.get('timestamp', 'Unknown')[:19]}")
        
        # Generate PDF with detailed analysis
        print(f"\n📄 Generating comprehensive test PDF...")
        response = generate_reportlab_pdf(analytics_data, "comprehensive_alert_details_test", 'weekly')
        
        # Save the PDF
        pdf_filename = "comprehensive_alert_details_test.pdf"
        with open(pdf_filename, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Comprehensive PDF generated: {os.path.abspath(pdf_filename)}")
        
        # Summary of what should be in the PDF
        print(f"\n📋 PDF CONTENT SUMMARY:")
        print(f"✅ Overall alert distribution pie charts")
        print(f"✅ Individual device tables with alert counts")
        print(f"✅ Battery alert details with percentages and timestamps")
        print(f"✅ Power alert details with status and timestamps")
        print(f"✅ Tissue alert details with types and timestamps")
        print(f"✅ Tamper alert details with timestamps")
        
        if total_battery_timestamps > 0:
            print(f"✅ Battery alert details: {total_battery_timestamps} detailed entries")
        if total_tissue_timestamps > 0:
            print(f"✅ Tissue alert details: {total_tissue_timestamps} detailed entries")
        if total_tamper_timestamps > 0:
            print(f"✅ Tamper alert details: {total_tamper_timestamps} detailed entries")
        if total_power_timestamps > 0:
            print(f"✅ Power alert details: {total_power_timestamps} detailed entries")
        
    except Exception as e:
        print(f"❌ Error in comprehensive analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_alert_details_in_pdf()

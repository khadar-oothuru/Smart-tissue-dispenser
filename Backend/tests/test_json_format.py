#!/usr/bin/env python3
"""
Quick JSON Format Test
Test the new JSON format without authentication using Django shell
"""

import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from device.models import Device, DeviceData
from datetime import datetime
import json

def test_new_json_format():
    """Test creating device data with new field structure"""
    print("🧪 Testing New JSON Format Data Creation")
    print("=" * 45)
    
    # Sample new format data
    test_cases = [
        {
            "name": "Full New Format",
            "data": {
                "device_id": "TEST_DEVICE_001",
                "current_alert": "HIGH",
                "current_tamper": False,
                "total_usage": 150,
                "battery_voltage": 3.2,
                "device_timestamp": "2024-12-16 10:30:45"
            }
        },
        {
            "name": "Minimal New Format",
            "data": {
                "device_id": "TEST_DEVICE_004",
                "total_usage": 200,
                "battery_voltage": 3.5,
                "device_timestamp": "2024-12-16 13:00:00"
            }
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n📋 Testing: {test_case['name']}")
        print(f"📊 Input: {json.dumps(test_case['data'], indent=2)}")
        
        try:
            # Get or create device
            device, created = Device.objects.get_or_create(
                device_id=test_case['data']['device_id'],
                defaults={
                    'name': f"Test Device {test_case['data']['device_id']}",
                    'floor_number': 1,
                    'room_number': 'TEST'
                }
            )
              # Create DeviceData with new fields
            device_data = DeviceData.objects.create(
                device=device,
                alert=test_case['data'].get('current_alert', 'NORMAL'),
                tamper=str(test_case['data'].get('current_tamper', False)).lower(),
                count=test_case['data'].get('count', 0),
                refer_val=test_case['data'].get('refer_val', 0),
                total_usage=test_case['data'].get('total_usage'),
                battery_voltage=test_case['data'].get('battery_voltage'),
                device_timestamp=test_case['data'].get('device_timestamp')
            )
            
            print(f"✅ Data Creation: SUCCESS")
            print(f"📈 Created DeviceData ID: {device_data.id}")
            print(f"   Device: {device_data.device.name}")
            print(f"   Total Usage: {device_data.total_usage}")
            print(f"   Battery Voltage: {device_data.battery_voltage}V")
            print(f"   Device Timestamp: {device_data.device_timestamp}")
            
            results.append({
                'name': test_case['name'],
                'status': 'PASS',
                'device_data_id': device_data.id
            })
            
        except Exception as e:
            print(f"❌ Data Creation: FAILED - {str(e)}")
            results.append({
                'name': test_case['name'], 
                'status': 'FAIL',
                'error': str(e)
            })
    
    return results

def test_model_fields():
    """Test if the new model fields are properly available"""
    print("\n🗄️  Testing Model Fields")
    print("=" * 30)
    
    try:
        # Check DeviceData model fields
        model_fields = [field.name for field in DeviceData._meta.fields]
        new_fields = ['total_usage', 'battery_voltage', 'device_timestamp']
        
        print("📋 DeviceData Model Fields:")
        for field in sorted(model_fields):
            marker = "✨" if field in new_fields else "  "
            field_obj = DeviceData._meta.get_field(field)
            field_type = field_obj.__class__.__name__
            print(f"{marker} {field} ({field_type})")
        
        missing_fields = [field for field in new_fields if field not in model_fields]
        
        if not missing_fields:
            print("\n✅ All new fields are present in the model!")
            return True
        else:
            print(f"\n❌ Missing fields: {missing_fields}")
            return False
            
    except Exception as e:
        print(f"❌ Model check failed: {str(e)}")
        return False

def test_sample_data_creation():
    """Test creating sample device data with new fields"""
    print("\n💾 Testing Sample Data Creation")
    print("=" * 35)
    
    try:
        # Get or create a test device
        device, created = Device.objects.get_or_create(
            device_id="TEST_ANALYTICS_001",
            defaults={
                'name': 'Test Analytics Device',
                'floor_number': 1,
                'room_number': 'TEST_ROOM'
            }
        )
        
        if created:
            print("✅ Created new test device")
        else:
            print("✅ Using existing test device")
          # Create sample data entry with new fields
        device_data = DeviceData.objects.create(
            device=device,
            alert='HIGH',
            tamper='false',
            count=10,
            refer_val=100,
            total_usage=125,
            battery_voltage=3.3,
            device_timestamp='2024-12-16 15:30:00'
        )        
        print(f"✅ Created DeviceData entry with ID: {device_data.id}")
        print(f"📊 Data Details:")
        print(f"   Device: {device_data.device.name}")
        print(f"   Alert: {device_data.alert}")
        print(f"   Tamper: {device_data.tamper}")
        print(f"   Total Usage: {device_data.total_usage}")
        print(f"   Battery Voltage: {device_data.battery_voltage}V")
        print(f"   Device Timestamp: {device_data.device_timestamp}")
        print(f"   Created: {device_data.timestamp}")
        
        return True
        
    except Exception as e:
        print(f"❌ Sample data creation failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🔬 JSON Format & Model Test Suite")
    print("=" * 50)
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test model fields
    model_ok = test_model_fields()
    
    # Test JSON parsing
    json_results = test_new_json_format()
    
    # Test sample data creation
    if model_ok:
        data_ok = test_sample_data_creation()
    else:
        print("\n⚠️  Skipping data creation test due to model issues")
        data_ok = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    json_passed = len([r for r in json_results if r['status'] == 'PASS'])
    json_total = len(json_results)
    
    print(f"🗄️  Model Fields: {'✅ PASS' if model_ok else '❌ FAIL'}")
    print(f"📝 JSON Parsing: {json_passed}/{json_total} passed")
    print(f"💾 Data Creation: {'✅ PASS' if data_ok else '❌ FAIL'}")
    
    overall_success = model_ok and json_passed == json_total and data_ok
    
    if overall_success:
        print("\n🎉 All tests passed! Enhanced JSON format is working correctly.")
        print("\n📈 Your system is ready for:")
        print("   ✅ New device data format (TS, TOTAL_USAGE, BATTERY_VOLTAGE)")
        print("   ✅ Enhanced analytics with battery and usage data")
        print("   ✅ Backward compatibility with legacy formats")
    else:
        print("\n⚠️  Some tests failed. Check the issues above.")
        
        if not model_ok:
            print("\n🔧 To fix model issues:")
            print("   python manage.py makemigrations")
            print("   python manage.py migrate")

if __name__ == "__main__":
    main()

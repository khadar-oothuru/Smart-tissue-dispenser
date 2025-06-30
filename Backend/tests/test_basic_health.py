#!/usr/bin/env python3
"""
Basic Analytics Test Script
Tests analytics endpoints without authentication to verify they're properly configured
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api/device"

def test_endpoint_availability():
    """Test if analytics endpoints are properly configured"""
    print("🔗 Testing Analytics Endpoint Availability")
    print("=" * 50)
    
    endpoints_to_test = [
        ("Battery Usage Analytics", "/device-analytics/battery-usage/"),
        ("Battery Usage Trends", "/device-analytics/battery-usage-trends/"),
        ("CSV Download", "/device-analytics/download/csv/"),
        ("JSON Download", "/device-analytics/download/json/"),
        ("PDF Download", "/device-analytics/download/pdf/"),
        ("Status Distribution", "/device-analytics/status-distribution/"),
        ("Device Analytics", "/device-analytics/"),
        ("Summary Analytics", "/device-analytics/summary/"),
        ("Real-time Status", "/device-analytics/realtime-status/"),
    ]
    
    results = []
    
    for name, endpoint in endpoints_to_test:
        try:
            # We expect 401 (Unauthorized) for protected endpoints, not 404 (Not Found)
            response = requests.get(f"{API_BASE}{endpoint}")
            
            if response.status_code == 401:
                status = "✅ CONFIGURED"
                message = "Endpoint exists (requires auth)"
            elif response.status_code == 404:
                status = "❌ NOT FOUND"
                message = "Endpoint not configured"
            elif response.status_code == 200:
                status = "✅ WORKING"
                message = "Endpoint accessible"
            else:
                status = f"⚠️  HTTP {response.status_code}"
                message = "Unexpected response"
            
            results.append((name, status, message))
            print(f"{status} {name}: {message}")
            
        except Exception as e:
            results.append((name, "❌ ERROR", str(e)))
            print(f"❌ ERROR {name}: {str(e)}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 ENDPOINT AVAILABILITY SUMMARY")
    print("=" * 50)
    
    configured = len([r for r in results if "CONFIGURED" in r[1] or "WORKING" in r[1]])
    total = len(results)
    
    print(f"✅ Configured Endpoints: {configured}/{total}")
    print(f"🎯 Configuration Rate: {configured/total*100:.1f}%")
    
    if configured == total:
        print("🎉 All analytics endpoints are properly configured!")
    elif configured >= total * 0.8:
        print("✨ Most endpoints are configured correctly.")
    else:
        print("⚠️  Some endpoints may need attention.")
    
    return results

def test_backend_health():
    """Test if the Django backend is running and healthy"""
    print("\n🏥 Testing Backend Health")
    print("=" * 30)
    
    try:
        # Test basic Django health
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ Backend Status: HTTP {response.status_code}")
        
        # Test device API base
        response = requests.get(f"{API_BASE}/", timeout=5)
        if response.status_code in [401, 403, 405]:  # These are better than 404
            print("✅ Device API: Properly configured")
        elif response.status_code == 404:
            print("❌ Device API: Not found")
        else:
            print(f"⚠️  Device API: HTTP {response.status_code}")
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend: Connection failed - server may not be running")
        return False
    except requests.exceptions.Timeout:
        print("❌ Backend: Timeout - server is slow or unresponsive")
        return False
    except Exception as e:
        print(f"❌ Backend: Error - {str(e)}")
        return False

def check_new_model_fields():
    """Check if the new model fields are properly migrated"""
    print("\n🗄️  Checking Database Migration Status")
    print("=" * 40)
    
    try:
        # This will help us understand if our models are properly set up
        from django.core.management import execute_from_command_line
        import os
        import sys
        
        # Set up Django environment
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        import django
        django.setup()
        
        from device.models import DeviceData
        
        # Check if new fields exist
        model_fields = [field.name for field in DeviceData._meta.fields]
        new_fields = ['total_usage', 'battery_voltage', 'device_timestamp']
        
        print("📋 DeviceData Model Fields:")
        for field in model_fields:
            marker = "✨" if field in new_fields else "  "
            print(f"{marker} {field}")
        
        missing_fields = [field for field in new_fields if field not in model_fields]
        
        if not missing_fields:
            print("\n✅ All new fields are present in the model!")
        else:
            print(f"\n❌ Missing fields: {missing_fields}")
            print("   Run: python manage.py makemigrations && python manage.py migrate")
        
        return len(missing_fields) == 0
        
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        print("   This might be normal if running outside Django environment")
        return None

def main():
    """Main test function"""
    print("🧪 Basic Analytics System Health Check")
    print("=" * 60)
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Testing Server: {BASE_URL}")
    print()
    
    # Test backend health
    backend_healthy = test_backend_health()
    
    if not backend_healthy:
        print("\n❌ Backend is not accessible. Please ensure:")
        print("   1. Django development server is running")
        print("   2. Server is accessible at http://127.0.0.1:8000")
        print("   3. No firewall issues")
        return
    
    # Test endpoint availability
    test_endpoint_availability()
    
    # Test database fields
    check_new_model_fields()
    
    print("\n" + "=" * 60)
    print("📝 RECOMMENDATIONS")
    print("=" * 60)
    print("1. ✅ Ensure Django server is running: python manage.py runserver")
    print("2. 🔑 Create a test user account for full testing")
    print("3. 📊 Test frontend integration with new API endpoints")
    print("4. 🗄️  Verify all migrations are applied")
    print("5. 📱 Test mobile app with new analytics features")
    
    print("\n🎯 Next Steps:")
    print("   • Use the authentication test script with valid credentials")
    print("   • Test frontend integration")
    print("   • Verify PDF generation with reportlab")
    
    print("\n🎉 Basic health check complete!")

if __name__ == "__main__":
    main()

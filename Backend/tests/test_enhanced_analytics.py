#!/usr/bin/env python3
"""
Enhanced Analytics Test Script
Tests all new analytics endpoints including battery analytics and PDF downloads
"""

import requests
import json
import os
import sys
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api/device"

# Test credentials - you may need to adjust these
TEST_EMAIL = "admin@example.com"
TEST_PASSWORD = "admin123"

class AnalyticsTestSuite:
    def __init__(self):
        self.token = None
        self.test_results = []
        
    def log_test(self, test_name, status, message="", data=None):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        result = {
            'timestamp': timestamp,
            'test': test_name,
            'status': status,
            'message': message
        }
        if data:
            result['data_preview'] = str(data)[:200] + "..." if len(str(data)) > 200 else str(data)
        
        self.test_results.append(result)
        
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} [{timestamp}] {test_name}: {status}")
        if message:
            print(f"   📝 {message}")
        if data and len(str(data)) <= 100:
            print(f"   📊 Data: {data}")
        print()

    def authenticate(self):
        """Authenticate and get access token"""
        print("🔐 Starting Authentication...")
        
        try:
            # Try to login
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.log_test("Authentication", "PASS", f"Logged in as {TEST_EMAIL}")
                return True
            else:
                self.log_test("Authentication", "FAIL", f"Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", "FAIL", f"Authentication error: {str(e)}")
            return False

    def get_headers(self):
        """Get authentication headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_battery_usage_analytics(self):
        """Test battery usage analytics endpoint"""
        try:
            response = requests.get(
                f"{API_BASE}/device-analytics/battery-usage/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                device_count = len(data.get('devices', []))
                self.log_test(
                    "Battery Usage Analytics", 
                    "PASS", 
                    f"Retrieved analytics for {device_count} devices",
                    f"Sample keys: {list(data.keys()) if data else 'No data'}"
                )
                return data
            else:
                self.log_test("Battery Usage Analytics", "FAIL", f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Battery Usage Analytics", "FAIL", f"Error: {str(e)}")
            return None

    def test_battery_usage_trends(self):
        """Test battery usage trends endpoint"""
        try:
            # Test with default parameters
            response = requests.get(
                f"{API_BASE}/device-analytics/battery-usage-trends/",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                trends_count = len(data.get('trends', []))
                self.log_test(
                    "Battery Usage Trends", 
                    "PASS", 
                    f"Retrieved {trends_count} trend entries",
                    f"Period: {data.get('period', 'N/A')} days"
                )
                
                # Test with specific parameters
                params = {"days": 14, "device_id": 1}
                response2 = requests.get(
                    f"{API_BASE}/device-analytics/battery-usage-trends/",
                    headers=self.get_headers(),
                    params=params
                )
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    self.log_test(
                        "Battery Trends (Filtered)", 
                        "PASS", 
                        f"Retrieved filtered data for device 1",
                        f"Trends: {len(data2.get('trends', []))}"
                    )
                
                return data
            else:
                self.log_test("Battery Usage Trends", "FAIL", f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Battery Usage Trends", "FAIL", f"Error: {str(e)}")
            return None

    def test_download_endpoints(self):
        """Test all download endpoints"""
        download_tests = [
            ("CSV", "/device-analytics/download/csv/"),
            ("JSON", "/device-analytics/download/json/"),
            ("PDF", "/device-analytics/download/pdf/")
        ]
        
        for format_name, endpoint in download_tests:
            try:
                # Test with different periods
                for period in ["weekly", "monthly"]:
                    params = {"period": period}
                    response = requests.get(
                        f"{API_BASE}{endpoint}",
                        headers=self.get_headers(),
                        params=params
                    )
                    
                    if response.status_code == 200:
                        content_type = response.headers.get('content-type', '')
                        content_length = len(response.content)
                        
                        # Determine if this is the expected format
                        expected_types = {
                            "CSV": "text/csv",
                            "JSON": "application/json", 
                            "PDF": ["application/pdf", "text/html"]  # PDF or HTML fallback
                        }
                        
                        expected = expected_types[format_name]
                        is_expected = (content_type in expected) if isinstance(expected, list) else (content_type == expected)
                        
                        status = "PASS" if is_expected else "WARN"
                        message = f"{period.title()} {format_name} download successful"
                        
                        if format_name == "PDF" and content_type == "text/html":
                            message += " (HTML fallback - PDF libraries not available)"
                        
                        self.log_test(
                            f"Download {format_name} ({period})", 
                            status, 
                            message,
                            f"Content-Type: {content_type}, Size: {content_length} bytes"
                        )
                    else:
                        self.log_test(
                            f"Download {format_name} ({period})", 
                            "FAIL", 
                            f"HTTP {response.status_code}"
                        )
                        
            except Exception as e:
                self.log_test(f"Download {format_name}", "FAIL", f"Error: {str(e)}")

    def test_existing_enhanced_analytics(self):
        """Test existing analytics endpoints to ensure they still work with new fields"""
        endpoints_to_test = [
            ("Device Analytics", "/device-analytics/"),
            ("Summary Analytics", "/device-analytics/summary/"),
            ("Real-time Status", "/device-analytics/realtime-status/"),
            ("Status Summary", "/device-analytics/status-summary/"),
            ("Status Distribution", "/device-analytics/status-distribution/"),
            ("Time-based (Weekly)", "/device-analytics/time-based/?period=weekly"),
            ("Time-based (Monthly)", "/device-analytics/time-based/?period=monthly")
        ]
        
        for test_name, endpoint in endpoints_to_test:
            try:
                response = requests.get(
                    f"{API_BASE}{endpoint}",
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check for new fields in the response
                    has_new_fields = self.check_for_new_fields(data)
                    
                    message = f"Endpoint working"
                    if has_new_fields:
                        message += " ✨ (includes new enhanced fields)"
                    
                    self.log_test(
                        test_name, 
                        "PASS", 
                        message,
                        f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}"
                    )
                else:
                    self.log_test(test_name, "FAIL", f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(test_name, "FAIL", f"Error: {str(e)}")

    def check_for_new_fields(self, data):
        """Check if response contains new enhanced fields"""
        new_fields = ['total_usage', 'battery_voltage', 'device_timestamp', 'TS', 'TOTAL_USAGE', 'BATTERY_VOLTAGE']
        
        def search_for_fields(obj, fields):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in fields:
                        return True
                    if search_for_fields(value, fields):
                        return True
            elif isinstance(obj, list):
                for item in obj:
                    if search_for_fields(item, fields):
                        return True
            return False
        
        return search_for_fields(data, new_fields)

    def test_json_compatibility(self):
        """Test the new JSON format compatibility"""
        print("🧪 Testing JSON format compatibility...")
        
        # Sample new format data
        test_data = {
            "device_id": "TEST_DEVICE_001",
            "current_alert": "HIGH",
            "current_tamper": False,
            "TS": "2024-12-16 10:30:45",
            "TOTAL_USAGE": 150,
            "BATTERY_VOLTAGE": 3.2
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/device-data/submit/",
                headers=self.get_headers(),
                json=test_data
            )
            
            if response.status_code in [200, 201]:
                self.log_test(
                    "JSON Format Compatibility", 
                    "PASS", 
                    "New JSON format accepted successfully",
                    f"Test data: {test_data}"
                )
                return True
            else:
                self.log_test(
                    "JSON Format Compatibility", 
                    "FAIL", 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("JSON Format Compatibility", "FAIL", f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Enhanced Analytics Test Suite")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        print("📊 Testing New Analytics Endpoints...")
        print("-" * 40)
        
        # Test new endpoints
        self.test_battery_usage_analytics()
        self.test_battery_usage_trends()
        
        print("📥 Testing Download Endpoints...")
        print("-" * 40)
        
        self.test_download_endpoints()
        
        print("🔄 Testing Existing Enhanced Analytics...")
        print("-" * 40)
        
        self.test_existing_enhanced_analytics()
        
        print("📝 Testing JSON Compatibility...")
        print("-" * 40)
        
        self.test_json_compatibility()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warned = len([r for r in self.test_results if r['status'] == 'WARN'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warned}")
        print(f"📊 Total: {total}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['message']}")
        
        if warned > 0:
            print("\n⚠️  WARNINGS:")
            for result in self.test_results:
                if result['status'] == 'WARN':
                    print(f"   • {result['test']}: {result['message']}")
        
        print("\n🎉 Enhanced Analytics System Test Complete!")
        
        if success_rate >= 80:
            print("✨ System is working well! Most features are functional.")
        elif success_rate >= 60:
            print("⚠️  System has some issues but core functionality works.")
        else:
            print("❌ System needs attention. Multiple critical issues found.")

if __name__ == "__main__":
    print("🔬 Enhanced Analytics Test Suite")
    print("Testing all new battery analytics and enhanced download features")
    print()
    
    tester = AnalyticsTestSuite()
    tester.run_all_tests()

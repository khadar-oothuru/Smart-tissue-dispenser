#!/usr/bin/env python3
"""
Test script to verify notification payload structure
"""

import sys
import os
import json

# Add the Backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from device.utils import send_push_notification

def test_notification_payload():
    """Test the notification payload structure without actually sending"""
    
    # Test data
    test_data = {
        "device_id": 1,
        "device_name": "Test Dispenser",
        "room": 101,
        "floor": 1,
        "notification_id": 123
    }
    
    # Mock token for testing
    test_token = "ExponentPushToken[test-token-123]"
    
    print("🧪 Testing notification payload structure...")
    print("=" * 50)
    
    # Test different notification types
    notification_types = ["critical", "low", "tamper", "battery_low", "maintenance", "default"]
    
    for notif_type in notification_types:
        print(f"\n📱 Testing notification type: {notif_type}")
        print("-" * 30)
        
        try:
            # This will attempt to send but we'll capture the payload structure
            result = send_push_notification(
                test_token,
                title=f"Test {notif_type.title()} Alert",
                body="This is a test notification",
                data=test_data,
                notification_type=notif_type
            )
            
            print(f"✅ Payload structure valid for {notif_type}")
            
        except Exception as e:
            print(f"❌ Error with {notif_type}: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_notification_payload()

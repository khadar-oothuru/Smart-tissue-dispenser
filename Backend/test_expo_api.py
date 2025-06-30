import requests
import json

def test_expo_notification_api():
    """Test the Expo notification API with our payload structure"""
    
    # Test payload (using dummy token)
    payload = {
        "to": "ExponentPushToken[dummy-test-token]",
        "title": "⚠️ Test Alert", 
        "body": "Test Device (Room 101, Floor 1): Testing notification",
        "data": {
            "type": "critical",
            "timestamp": "1234567890",
            "device_info": "Test Device (Room 101, Floor 1)",
            "icon": "⚠️"
        },
        "sound": "notif.mp3",
        "badge": 1,
        "ttl": 86400,
        "priority": "high",
        "channelId": "critical"
    }
    
    print("🧪 Testing Expo Push API with our payload...")
    print(f"📋 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Test with Expo API (will fail with dummy token but should validate format)
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        
        result = response.json()
        print(f"📤 Response Status: {response.status_code}")
        print(f"📥 Response Body: {json.dumps(result, indent=2)}")
        
        # Check for validation errors
        if response.status_code == 200:
            if 'errors' in result and result['errors']:
                print("❌ Validation errors found:")
                for error in result['errors']:
                    print(f"   - {error.get('message', 'Unknown error')}")
            else:
                print("✅ Payload structure is valid!")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    test_expo_notification_api()

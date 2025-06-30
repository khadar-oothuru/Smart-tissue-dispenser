import requests

def send_push_notification(expo_token, title, body, data=None, notification_type="default"):
    """
    Enhanced push notification with custom sound, styling, and device details
    """    # Map notification types to priorities and styling with real icon names
    # Force all notifications to use only the Open App action (category: critical-alert)
    type_config = {
        "critical": {
            "priority": "high",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#F44336",
            "icon": "alert-triangle",
            "iconFamily": "Feather"
        },
        "low": {
            "priority": "high",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#FF9800",
            "icon": "clipboard-list",
            "iconFamily": "FontAwesome5"
        },
        "tamper": {
            "priority": "high",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#FF5722",
            "icon": "shield-alert",
            "iconFamily": "MaterialCommunityIcons"
        },
        "battery_low": {
            "priority": "normal",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#FFC107",
            "icon": "battery-low",
            "iconFamily": "Feather"
        },
        "maintenance": {
            "priority": "normal",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#2196F3",
            "icon": "wrench",
            "iconFamily": "Feather"
        },
        "default": {
            "priority": "normal",
            "sound": "notif.mp3",
            "categoryId": "critical-alert",
            "color": "#3AB0FF",
            "icon": "bell",
            "iconFamily": "Feather"
        }
    }
    config = type_config.get(notification_type, type_config["default"])
    
    # Enhanced device information formatting
    device_info = ""
    if data and "device_name" in data:
        device_name = data["device_name"]
        room = data.get("room", "")
        floor = data.get("floor", "")
        
        if room and floor:
            device_info = f"{device_name} (Room {room}, Floor {floor})"
        elif device_name:
            device_info = device_name
        else:
            device_info = f"Device {data.get('device_id', 'Unknown')}"    # Enhanced title with icon name (frontend will handle icon rendering)
    enhanced_title = title  # Remove emoji, let frontend handle icon
    enhanced_body = f"{device_info}: {body}" if device_info else body    # Create minimal payload following Expo Push API specification with app icon
    payload = {
        "to": expo_token,
        "title": enhanced_title,
        "body": enhanced_body,
        "data": {
            **(data or {}),
            "type": notification_type,
            "timestamp": str(int(__import__('time').time())),
            "device_info": device_info,
            "icon": config["icon"],
            "iconFamily": config["iconFamily"],
            "iconColor": config["color"]
        },
        "sound": config["sound"],
        "badge": 1,
        "ttl": 86400,
        # Add app icon for Android large icon and iOS attachment
        "android": {
            "icon": "./assets/images/notification.png",
            "largeIcon": "./assets/images/notification.png",
            "color": config["color"]
        },
        "ios": {
            "attachments": [{
                "id": "app-icon",
                "url": "./assets/images/notification.png",
                "options": {
                    "typeHint": "public.png",
                    "thumbnailHidden": False
                }
            }],
            "categoryId": "critical-alert"  # Force only Open App action
        },
        "categoryId": "critical-alert"  # Force only Open App action for all platforms
    }
    
    # Add platform-specific fields only if they're properly formatted
    if config["priority"] == "high":
        payload["priority"] = "high"
        payload["channelId"] = "critical"
    else:
        payload["priority"] = "normal"
        payload["channelId"] = "default"
    # Always force categoryId to critical-alert for Open App only
    payload["categoryId"] = "critical-alert"
    
    try:        # Debug: Print the payload structure (only in development)
        print(f"🔍 Sending notification to: {expo_token[:20]}...")
        print(f"📋 Title: {enhanced_title}")
        print(f"🎨 Icon: {config['icon']} ({config['iconFamily']})")
        print(f"�️ App Icon: notification.png")
        print(f"�🔊 Sound: {config['sound']}")
        
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
        
        if response.status_code == 200:
            # Check for errors in the response
            if 'errors' in result and result.get('errors'):
                print(f"❌ Push notification validation errors:")
                for error in result['errors']:
                    print(f"   - {error.get('message', 'Unknown error')}")
                return {"success": False, "errors": result['errors']}
            else:
                print(f"✅ Push notification sent successfully: {enhanced_title}")
                return {"success": True, "data": result}
        else:
            print(f"❌ Push notification failed (Status: {response.status_code}): {result}")
            return {"success": False, "status": response.status_code, "error": result}
            
    except Exception as e:
        print(f"❌ Error sending push notification: {str(e)}")
        return {"success": False, "error": str(e)}

def test_notification_payload():
    """
    Test function to verify notification payload structure
    """
    test_payload = {
        "to": "ExponentPushToken[test]",
        "title": "Test Alert",  # No emoji, let frontend handle icon
        "body": "Test Device (Room 101, Floor 1): Testing notification",
        "data": {
            "type": "critical",
            "timestamp": str(int(__import__('time').time())),
            "device_info": "Test Device (Room 101, Floor 1)",
            "icon": "alert-triangle",
            "iconFamily": "Feather",
            "iconColor": "#F44336"
        },
        "sound": "notif.mp3",
        "badge": 1,
        "ttl": 86400,
        "priority": "high",
        "channelId": "critical",
        # Add app icon for testing
        "android": {
            "icon": "./assets/images/notification.png",
            "largeIcon": "./assets/images/notification.png",
            "color": "#F44336"
        },
        "ios": {
            "attachments": [{
                "id": "app-icon",
                "url": "./assets/images/notification.png",
                "options": {
                    "typeHint": "public.png",
                    "thumbnailHidden": False
                }
            }]
        }
    }
    
    print("📋 Test notification payload:")
    print(f"   Title: {test_payload['title']}")
    print(f"   Body: {test_payload['body']}")
    print(f"   Sound: {test_payload['sound']}")
    print(f"   Priority: {test_payload['priority']}")
    print(f"   Channel: {test_payload['channelId']}")
    
    return test_payload

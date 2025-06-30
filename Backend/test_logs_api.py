#!/usr/bin/env python
"""
Test script to verify the logs API is working correctly
"""
import os
import sys
import django
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import AppLog

def test_logs_api():
    """Test the logs API endpoint"""
    print("Testing Logs API...")
    
    # Check if we have any logs
    log_count = AppLog.objects.count()
    print(f"Total logs in database: {log_count}")
    
    if log_count == 0:
        print("No logs found. Creating a test log...")
        AppLog.log_success(
            message="Test log created",
            source="TestScript",
            details="This is a test log entry"
        )
        print("Test log created successfully")
    
    # Create a test user and get admin token
    User = get_user_model()
    try:
        admin_user = User.objects.filter(is_staff=True).first()
        if not admin_user:
            print("No admin user found. Creating one...")
            admin_user = User.objects.create_user(
                username='testadmin',
                email='testadmin@example.com',
                password='testpass123',
                is_staff=True,
                is_superuser=True
            )
            print(f"Created admin user: {admin_user.email}")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return
    
    # Test the API endpoint
    client = Client()
    
    # Login to get session
    login_success = client.login(username=admin_user.username, password='testpass123')
    if not login_success:
        print("Failed to login with admin user")
        return
    
    print("Testing /api/auth/admin/logs/ endpoint...")
    response = client.get('/api/auth/admin/logs/')
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response data keys: {list(data.keys())}")
        print(f"Results count: {len(data.get('results', []))}")
        print(f"Total count: {data.get('count', 0)}")
        
        # Print first few logs
        logs = data.get('results', [])
        for i, log in enumerate(logs[:3]):
            print(f"Log {i+1}: {log.get('message', 'No message')} - {log.get('level', 'No level')}")
    else:
        print(f"Error response: {response.content}")
    
    print("\nTesting /api/auth/admin/logs/stats/ endpoint...")
    response = client.get('/api/auth/admin/logs/stats/')
    print(f"Stats response status: {response.status_code}")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"Stats summary: {stats.get('summary', {})}")
    else:
        print(f"Stats error: {response.content}")

if __name__ == "__main__":
    test_logs_api() 
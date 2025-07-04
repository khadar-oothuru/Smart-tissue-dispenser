import os
import django
from datetime import datetime
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.models import Device, DeviceData, Notification

def delete_all_device_data():
    """Delete all device data and related notifications"""
    print("🗑️  Starting cleanup of device data...")
    
    # Get counts before deletion
    device_data_count = DeviceData.objects.count()
    notification_count = Notification.objects.count()
    
    print(f"📊 Current database state:")
    print(f"   - DeviceData records: {device_data_count}")
    print(f"   - Notification records: {notification_count}")
    
    if device_data_count == 0 and notification_count == 0:
        print("✅ Database is already clean!")
        return
    
    # Ask for confirmation
    print(f"\n⚠️  WARNING: This will permanently delete:")
    print(f"   - {device_data_count} DeviceData records")
    print(f"   - {notification_count} Notification records")
    
    confirm = input("\n🤔 Are you sure you want to delete all data? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("❌ Operation cancelled.")
        return
    
    print(f"\n🔄 Deleting data...")
    
    # Delete notifications first (they may reference device data)
    if notification_count > 0:
        deleted_notifications = Notification.objects.all().delete()
        print(f"   ✅ Deleted {deleted_notifications[0]} notifications")
    
    # Delete device data
    if device_data_count > 0:
        deleted_device_data = DeviceData.objects.all().delete()
        print(f"   ✅ Deleted {deleted_device_data[0]} device data records")
    
    # Verify cleanup
    remaining_data = DeviceData.objects.count()
    remaining_notifications = Notification.objects.count()
    
    print(f"\n🎉 Cleanup completed!")
    print(f"📊 Final database state:")
    print(f"   - DeviceData records: {remaining_data}")
    print(f"   - Notification records: {remaining_notifications}")
    
    if remaining_data == 0 and remaining_notifications == 0:
        print("✅ All data successfully deleted!")
    else:
        print("⚠️  Some data may still remain.")

def delete_data_by_date_range():
    """Delete device data within a specific date range"""
    print("🗑️  Delete data by date range...")
    
    print("📅 Enter date range (YYYY-MM-DD format):")
    start_date_str = input("Start date: ").strip()
    end_date_str = input("End date: ").strip()
    
    try:
        start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
        end_date = timezone.make_aware(datetime.strptime(end_date_str + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    except ValueError:
        print("❌ Invalid date format. Please use YYYY-MM-DD.")
        return
    
    # Get counts in date range
    device_data_count = DeviceData.objects.filter(timestamp__range=[start_date, end_date]).count()
    notification_count = Notification.objects.filter(created_at__range=[start_date, end_date]).count()
    
    print(f"\n📊 Data to delete ({start_date.date()} to {end_date.date()}):")
    print(f"   - DeviceData records: {device_data_count}")
    print(f"   - Notification records: {notification_count}")
    
    if device_data_count == 0 and notification_count == 0:
        print("✅ No data found in this date range!")
        return
    
    confirm = input(f"\n🤔 Delete {device_data_count + notification_count} records? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("❌ Operation cancelled.")
        return
    
    # Delete data in date range
    if notification_count > 0:
        deleted_notifications = Notification.objects.filter(created_at__range=[start_date, end_date]).delete()
        print(f"   ✅ Deleted {deleted_notifications[0]} notifications")
    
    if device_data_count > 0:
        deleted_device_data = DeviceData.objects.filter(timestamp__range=[start_date, end_date]).delete()
        print(f"   ✅ Deleted {deleted_device_data[0]} device data records")
    
    print("🎉 Date range deletion completed!")

def main():
    print("🧹 Device Data Cleanup Tool")
    print("=" * 40)
    
    while True:
        print("\n🔧 Choose an option:")
        print("1. Delete ALL device data and notifications")
        print("2. Delete data by date range")
        print("3. Show current data summary")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            delete_all_device_data()
        elif choice == '2':
            delete_data_by_date_range()
        elif choice == '3':
            show_data_summary()
        elif choice == '4':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")

def show_data_summary():
    """Show summary of current data"""
    print("\n📊 Current Database Summary:")
    print("=" * 30)
    
    # Device data summary
    device_data_count = DeviceData.objects.count()
    print(f"📈 Total DeviceData records: {device_data_count}")
    
    if device_data_count > 0:
        # Latest and oldest records
        latest_record = DeviceData.objects.order_by('-timestamp').first()
        oldest_record = DeviceData.objects.order_by('timestamp').first()
        
        print(f"   📅 Date range: {oldest_record.timestamp.date()} to {latest_record.timestamp.date()}")
        
        # Alert distribution
        print(f"\n🚨 Alert Distribution:")
        for alert in ['FULL', 'LOW', 'EMPTY']:
            count = DeviceData.objects.filter(alert=alert).count()
            print(f"   - {alert}: {count} records")
        
        # Device distribution
        print(f"\n🏠 Data by Device:")
        devices = Device.objects.all()
        for device in devices:
            count = DeviceData.objects.filter(device=device).count()
            if count > 0:
                print(f"   - {device.name} (ID: {device.id}): {count} records")
    
    # Notification summary
    notification_count = Notification.objects.count()
    print(f"\n🔔 Total Notifications: {notification_count}")
    
    if notification_count > 0:
        # Notification types
        print(f"📝 Notification Types:")
        notification_types = Notification.objects.values_list('notification_type', flat=True).distinct()
        for ntype in notification_types:
            count = Notification.objects.filter(notification_type=ntype).count()
            print(f"   - {ntype}: {count} notifications")

if __name__ == "__main__":
    main()

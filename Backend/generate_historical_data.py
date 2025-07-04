import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.models import Device, DeviceData

# Device IDs from your database
device_ids = [95, 98, 96, 97, 90, 55, 54, 39, 38, 37, 25, 93]

# Alert types and their probabilities
alert_types = ["FULL", "LOW", "EMPTY"]
alert_probabilities = [0.7, 0.2, 0.1]  # 70% full, 20% low, 10% empty

# Tamper status probabilities (more realistic - tamper events are rare)
tamper_probabilities = [0.98, 0.02]  # 98% false, 2% true (tamper is rare)

# Power status options
power_status_options = ["ON", "OFF", "NONE"]
power_probabilities = [0.85, 0.12, 0.03]  # 85% ON, 12% OFF, 3% NONE

# Battery percentage ranges and probabilities
battery_ranges = [
    (80, 100),  # Good battery
    (50, 79),   # Medium battery
    (20, 49),   # Low battery
    (5, 19),    # Very low battery
    (1, 4)      # Critical battery
]
battery_range_probabilities = [0.4, 0.3, 0.2, 0.08, 0.02]  # Most devices have good battery

def generate_random_timestamp(start_date, end_date):
    """Generate random timestamp between start and end dates"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_seconds = random.randrange(24 * 60 * 60)
    return start_date + timedelta(days=random_days, seconds=random_seconds)

def generate_device_data(device_id, timestamp):
    """Generate realistic device data"""
    # Base usage patterns
    base_count = random.randint(1, 150)
    refer_val = random.randint(80, 120)
    total_usage = random.randint(base_count, base_count + 500)
    
    # Alert status
    alert = random.choices(alert_types, weights=alert_probabilities)[0]
    
    # Tamper status (very rare events)
    tamper = random.choices(["false", "true"], weights=tamper_probabilities)[0]
    
    # Battery percentage - realistic distribution
    battery_range = random.choices(battery_ranges, weights=battery_range_probabilities)[0]
    battery_percentage = round(random.uniform(battery_range[0], battery_range[1]), 1)
    
    # Power status
    power_status = random.choices(power_status_options, weights=power_probabilities)[0]
    
    # If alert is EMPTY, adjust counts
    if alert == "EMPTY":
        base_count = random.randint(0, 5)
        refer_val = random.randint(95, 100)
    elif alert == "LOW":
        base_count = random.randint(5, 25)
        refer_val = random.randint(80, 95)
    
    # If tamper is true, simulate some irregular behavior
    if tamper == "true":
        # Tampering might cause irregular readings
        base_count = random.randint(0, 200)  # Irregular count
        refer_val = random.randint(50, 150)  # Irregular reference
        # Tamper events might also affect power
        if random.random() < 0.3:  # 30% chance tamper affects power
            power_status = "OFF"
    
    # Battery degradation over time (older timestamps have slightly lower battery)
    days_ago = (timezone.now() - timestamp).days
    if days_ago > 60:  # Data older than 2 months
        battery_degradation = random.uniform(0, 15)  # Up to 15% degradation
        battery_percentage = max(1.0, battery_percentage - battery_degradation)
    elif days_ago > 30:  # Data older than 1 month
        battery_degradation = random.uniform(0, 8)   # Up to 8% degradation
        battery_percentage = max(1.0, battery_percentage - battery_degradation)
    
    battery_percentage = round(battery_percentage, 1)
    
    return {
        "device_id": device_id,
        "alert": alert,
        "count": base_count,
        "refer_val": refer_val,
        "total_usage": total_usage,
        "tamper": tamper,
        "battery_percentage": battery_percentage,
        "power_status": power_status,
        "timestamp": timestamp
    }

def main():
    print("🚀 Starting historical data generation...")
    
    # Date range: April 1, 2025 to June 30, 2025
    start_date = timezone.make_aware(datetime(2025, 4, 1))
    end_date = timezone.make_aware(datetime(2025, 6, 30, 23, 59, 59))
    
    print(f"📅 Generating data from {start_date.date()} to {end_date.date()}")
    
    # Verify devices exist
    existing_devices = Device.objects.filter(id__in=device_ids)
    print(f"📊 Found {existing_devices.count()} devices in database:")
    for device in existing_devices:
        print(f"   - ID: {device.id}, Name: {device.name}, Room: {device.room_number}, Floor: {device.floor_number}")
    
    if existing_devices.count() == 0:
        print("❌ No devices found! Please check device IDs.")
        return
    
    # Generate data for each device
    total_records = 0
    
    for device in existing_devices:
        print(f"\n🔄 Generating data for Device ID: {device.id} ({device.name})")
        
        # Generate 150-300 random data points per device over 3 months
        num_records = random.randint(150, 300)
        device_records = []
        
        for i in range(num_records):
            timestamp = generate_random_timestamp(start_date, end_date)
            data = generate_device_data(device.id, timestamp)
            
            # Create DeviceData record
            device_data = DeviceData.objects.create(
                device=device,
                alert=data["alert"],
                count=data["count"],
                refer_val=data["refer_val"],
                total_usage=data["total_usage"],
                tamper=data["tamper"],
                battery_percentage=data["battery_percentage"],
                power_status=data["power_status"],
                device_timestamp=timestamp.isoformat(),
                timestamp=timestamp
            )
            
            device_records.append(data)
            
            if (i + 1) % 50 == 0:
                print(f"   ✅ Generated {i + 1}/{num_records} records")
        
        total_records += num_records
        print(f"   🎯 Completed {num_records} records for {device.name}")
        
        # Show sample data
        sample_data = random.sample(device_records, min(3, len(device_records)))
        print(f"   📋 Sample data:")
        for sample in sample_data:
            print(f"      - {sample['timestamp'].strftime('%Y-%m-%d %H:%M')} | Alert: {sample['alert']} | Count: {sample['count']} | Battery: {sample['battery_percentage']}% | Power: {sample['power_status']} | Tamper: {sample['tamper']}")
    
    print(f"\n🎉 Historical data generation completed!")
    print(f"📈 Total records generated: {total_records}")
    print(f"🗄️ Data covers {(end_date - start_date).days} days")
    
    # Generate summary statistics
    print(f"\n📊 Summary by Alert Type:")
    for alert_type in alert_types:
        count = DeviceData.objects.filter(alert=alert_type, timestamp__range=[start_date, end_date]).count()
        print(f"   - {alert_type}: {count} records")
    
    print(f"\n🔧 Tamper Statistics:")
    tamper_true = DeviceData.objects.filter(tamper="true", timestamp__range=[start_date, end_date]).count()
    tamper_false = DeviceData.objects.filter(tamper="false", timestamp__range=[start_date, end_date]).count()
    print(f"   - Tamper True: {tamper_true} records")
    print(f"   - Tamper False: {tamper_false} records")
    
    print(f"\n🔋 Battery Statistics:")
    excellent_battery = DeviceData.objects.filter(battery_percentage__gte=80, timestamp__range=[start_date, end_date]).count()
    good_battery = DeviceData.objects.filter(battery_percentage__gte=50, battery_percentage__lt=80, timestamp__range=[start_date, end_date]).count()
    low_battery = DeviceData.objects.filter(battery_percentage__gte=20, battery_percentage__lt=50, timestamp__range=[start_date, end_date]).count()
    very_low_battery = DeviceData.objects.filter(battery_percentage__gte=5, battery_percentage__lt=20, timestamp__range=[start_date, end_date]).count()
    critical_battery = DeviceData.objects.filter(battery_percentage__lt=5, timestamp__range=[start_date, end_date]).count()
    print(f"   - Excellent Battery (80-100%): {excellent_battery} records")
    print(f"   - Good Battery (50-79%): {good_battery} records")
    print(f"   - Low Battery (20-49%): {low_battery} records")
    print(f"   - Very Low Battery (5-19%): {very_low_battery} records")
    print(f"   - Critical Battery (<5%): {critical_battery} records")
    
    print(f"\n⚡ Power Status Statistics:")
    for power_status in power_status_options:
        count = DeviceData.objects.filter(power_status=power_status, timestamp__range=[start_date, end_date]).count()
        print(f"   - {power_status}: {count} records")

if __name__ == "__main__":
    main()

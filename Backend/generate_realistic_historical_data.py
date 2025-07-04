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
alert_probabilities = [0.75, 0.20, 0.05]  # 75% full, 20% low, 5% empty

# Tamper status probabilities (very rare)
tamper_probabilities = [0.99, 0.01]  # 99% false, 1% true

# Power status options
power_status_options = ["ON", "OFF", "NONE"]
power_probabilities = [0.88, 0.10, 0.02]  # 88% ON, 10% OFF, 2% NONE

# Battery percentage ranges for realistic distribution
battery_ranges = [
    (85, 100),  # Excellent battery
    (60, 84),   # Good battery
    (30, 59),   # Medium battery
    (10, 29),   # Low battery
    (1, 9)      # Critical battery
]
battery_range_probabilities = [0.4, 0.35, 0.15, 0.08, 0.02]

def generate_daily_data_pattern(device, date):
    """Generate realistic daily data pattern for a device"""
    daily_records = []
    
    # Each device sends data 3-8 times per day at different intervals
    num_records_per_day = random.randint(3, 8)
    
    # Generate timestamps throughout the day
    for i in range(num_records_per_day):
        # Distribute throughout the day (work hours more likely)
        if i == 0:
            # First record of the day (6-9 AM)
            hour = random.randint(6, 9)
        elif i == num_records_per_day - 1:
            # Last record of the day (6-10 PM)
            hour = random.randint(18, 22)
        else:
            # Random times during the day
            hour = random.randint(8, 20)
        
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        timestamp = timezone.make_aware(datetime.combine(date, datetime.min.time().replace(hour=hour, minute=minute, second=second)))
        
        # Generate realistic device data
        data = generate_realistic_device_data(device, timestamp, date)
        daily_records.append(data)
    
    return daily_records

def generate_realistic_device_data(device, timestamp, date):
    """Generate realistic device data with proper patterns"""
    
    # Calculate days since April 1, 2025 for progressive changes
    start_date = datetime(2025, 4, 1).date()
    days_elapsed = (date - start_date).days
    
    # Base usage patterns (increases over time)
    base_usage = 50 + (days_elapsed * random.uniform(0.2, 0.8))
    count = int(base_usage + random.randint(-20, 30))
    count = max(0, min(count, 150))  # Keep within realistic range
    
    # Reference value (capacity indicator)
    refer_val = random.randint(85, 115)
    
    # Total usage (cumulative over time)
    total_usage = int(base_usage * 5 + random.randint(-100, 500))
    total_usage = max(count, total_usage)
    
    # Alert status based on count
    if count <= 5:
        alert = "EMPTY"
    elif count <= 25:
        alert = "LOW"
    else:
        alert = "FULL"
    
    # Add some randomness to alerts
    if random.random() < 0.1:  # 10% chance to randomize
        alert = random.choices(alert_types, weights=alert_probabilities)[0]
    
    # Tamper status (very rare)
    tamper = random.choices(["false", "true"], weights=tamper_probabilities)[0]
    
    # Battery degradation over time
    battery_degradation_factor = days_elapsed / 90.0  # 90 days = 3 months
    battery_base_range = random.choices(battery_ranges, weights=battery_range_probabilities)[0]
    
    # Apply degradation
    battery_min, battery_max = battery_base_range
    degradation = battery_degradation_factor * random.uniform(5, 25)
    battery_min = max(1, battery_min - degradation)
    battery_max = max(battery_min + 5, battery_max - degradation)
    
    battery_percentage = round(random.uniform(battery_min, battery_max), 1)
    
    # Power status
    power_status = random.choices(power_status_options, weights=power_probabilities)[0]
    
    # If tamper is true, cause irregularities
    if tamper == "true":
        count = random.randint(0, 200)
        refer_val = random.randint(40, 160)
        if random.random() < 0.4:  # 40% chance tamper affects power
            power_status = "OFF"
    
    # If battery is very low, higher chance of power issues
    if battery_percentage < 10:
        if random.random() < 0.3:  # 30% chance of power issues with low battery
            power_status = "OFF"
    
    return {
        "device": device,
        "timestamp": timestamp,
        "alert": alert,
        "count": count,
        "refer_val": refer_val,
        "total_usage": total_usage,
        "tamper": tamper,
        "battery_percentage": battery_percentage,
        "power_status": power_status,
        "device_timestamp": timestamp.isoformat()
    }

def generate_date_range(start_date, end_date):
    """Generate all dates in the range"""
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    return dates

def main():
    print("🚀 Starting realistic historical data generation...")
    print("📅 Creating day-by-day data for the past 3 months\n")
    
    # Date range: April 1, 2025 to June 30, 2025
    start_date = datetime(2025, 4, 1).date()
    end_date = datetime(2025, 6, 30).date()
    
    print(f"📅 Generating data from {start_date} to {end_date}")
    print(f"📊 Total days: {(end_date - start_date).days + 1}")
    
    # Verify devices exist
    existing_devices = Device.objects.filter(id__in=device_ids)
    print(f"🏠 Found {existing_devices.count()} devices:")
    for device in existing_devices:
        print(f"   - ID: {device.id}, Name: {device.name}, Room: {device.room_number}, Floor: {device.floor_number}")
    
    if existing_devices.count() == 0:
        print("❌ No devices found! Please check device IDs.")
        return
    
    # Generate all dates in the range
    dates = generate_date_range(start_date, end_date)
    total_records = 0
    
    print(f"\n🔄 Generating daily data patterns...\n")
    
    for device in existing_devices:
        print(f"📱 Processing Device: {device.name} (ID: {device.id})")
        device_records = 0
        
        for date in dates:
            # Generate daily data for this device
            daily_data = generate_daily_data_pattern(device, date)
            
            # Save to database
            for data in daily_data:
                DeviceData.objects.create(
                    device=data["device"],
                    alert=data["alert"],
                    count=data["count"],
                    refer_val=data["refer_val"],
                    total_usage=data["total_usage"],
                    tamper=data["tamper"],
                    battery_percentage=data["battery_percentage"],
                    power_status=data["power_status"],
                    device_timestamp=data["device_timestamp"],
                    timestamp=data["timestamp"]
                )
                device_records += 1
                total_records += 1
        
        print(f"   ✅ Generated {device_records} records for {device.name}")
        
        # Show sample data for this device
        sample_dates = random.sample(dates, min(3, len(dates)))
        print(f"   📋 Sample data:")
        for sample_date in sample_dates:
            sample_data = generate_daily_data_pattern(device, sample_date)
            sample_record = random.choice(sample_data)
            print(f"      - {sample_date} | Alert: {sample_record['alert']} | Count: {sample_record['count']} | Battery: {sample_record['battery_percentage']}% | Power: {sample_record['power_status']}")
        print()
    
    print(f"🎉 Historical data generation completed!")
    print(f"📈 Total records generated: {total_records}")
    print(f"🗓️  Data covers {len(dates)} days ({start_date} to {end_date})")
    print(f"📊 Average records per day: {total_records / len(dates):.1f}")
    
    # Generate summary statistics
    print(f"\n📊 Final Statistics:")
    print("=" * 40)
    
    # Alert distribution
    for alert_type in alert_types:
        count = DeviceData.objects.filter(alert=alert_type).count()
        percentage = (count / total_records) * 100
        print(f"🚨 {alert_type}: {count} records ({percentage:.1f}%)")
    
    # Tamper events
    tamper_events = DeviceData.objects.filter(tamper="true").count()
    print(f"🔧 Tamper Events: {tamper_events} records ({(tamper_events/total_records)*100:.2f}%)")
    
    # Battery statistics
    low_battery = DeviceData.objects.filter(battery_percentage__lt=20).count()
    critical_battery = DeviceData.objects.filter(battery_percentage__lt=10).count()
    print(f"🔋 Low Battery (<20%): {low_battery} records")
    print(f"🔋 Critical Battery (<10%): {critical_battery} records")
    
    # Power status
    power_off = DeviceData.objects.filter(power_status="OFF").count()
    print(f"⚡ Power OFF events: {power_off} records")
    
    # Data distribution by month
    print(f"\n📅 Monthly Distribution:")
    for month in [4, 5, 6]:
        month_data = DeviceData.objects.filter(timestamp__month=month, timestamp__year=2025).count()
        month_name = ["", "", "", "April", "May", "June"][month]
        print(f"   {month_name} 2025: {month_data} records")
    
    print(f"\n✅ Data generation completed successfully!")
    print(f"🎯 Your database now contains realistic historical data!")

if __name__ == "__main__":
    main()

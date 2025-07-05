#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_pdf_api_endpoint():
    """Test the PDF download API endpoint directly"""
    print("=== TESTING PDF DOWNLOAD API ENDPOINT ===")
    
    # Test endpoint URLs
    base_url = "http://127.0.0.1:8000"  # Adjust if different
    pdf_endpoint = f"{base_url}/device-analytics/download/pdf/"
    
    # Test parameters
    params = {
        'period': 'weekly'
    }
    
    try:
        print(f"🔗 Testing URL: {pdf_endpoint}")
        print(f"📊 Parameters: {params}")
        
        # Make request (without authentication for now)
        response = requests.get(pdf_endpoint, params=params)
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📄 Content type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"📏 Content length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Save PDF to file
            pdf_filename = "test_api_download.pdf"
            with open(pdf_filename, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ PDF downloaded successfully: {pdf_filename}")
            print(f"📁 File saved to: {os.path.abspath(pdf_filename)}")
            
            # Check if it's actually a PDF
            if response.content.startswith(b'%PDF'):
                print("✅ Content appears to be a valid PDF")
            else:
                print("⚠️ Content does not appear to be a PDF file")
                print(f"First 100 characters: {response.content[:100]}")
        
        elif response.status_code == 401:
            print("🔐 Authentication required - this is expected without login")
        
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response content: {response.text[:500]}")
    
    except Exception as e:
        print(f"❌ Error testing API endpoint: {str(e)}")

def test_internal_pdf_with_alerts():
    """Test PDF generation focusing on alert content"""
    print("\n=== TESTING PDF ALERT CONTENT ===")
    
    try:
        from device.views.analytics_views import get_time_based_analytics_data, generate_reportlab_pdf
        
        # Get data for analysis
        analytics_data = get_time_based_analytics_data('weekly')
        
        if not analytics_data or not analytics_data.get('data'):
            print("❌ No analytics data available")
            return
        
        # Analyze alert content
        total_devices = len(analytics_data['data'])
        total_tissue_alerts = 0
        total_battery_alerts = 0
        total_periods = 0
        
        print(f"📊 Analyzing data from {total_devices} devices:")
        
        for device_data in analytics_data['data']:
            device_name = device_data.get('device_name', 'Unknown')
            periods = device_data.get('periods', [])
            total_periods += len(periods)
            
            device_tissue = sum(p.get('total_tissue_alerts', 0) for p in periods)
            device_battery = sum(p.get('total_battery_alerts', 0) for p in periods)
            
            total_tissue_alerts += device_tissue
            total_battery_alerts += device_battery
            
            if device_tissue > 0 or device_battery > 0:
                print(f"  📱 {device_name}: {device_tissue} tissue alerts, {device_battery} battery alerts")
        
        print(f"\n📈 SUMMARY:")
        print(f"  - Total periods: {total_periods}")
        print(f"  - Total tissue alerts: {total_tissue_alerts}")
        print(f"  - Total battery alerts: {total_battery_alerts}")
        
        if total_tissue_alerts == 0 and total_battery_alerts == 0:
            print("⚠️ WARNING: No alerts found in data - PDF will only show system information")
        elif total_tissue_alerts == 0:
            print("⚠️ WARNING: No tissue alerts found - only battery alerts will appear in PDF")
        elif total_battery_alerts == 0:
            print("⚠️ WARNING: No battery alerts found - only tissue alerts will appear in PDF")
        else:
            print("✅ Both tissue and battery alerts found - PDF should include both types")
        
        # Generate PDF with detailed analysis
        print(f"\n📄 Generating test PDF...")
        response = generate_reportlab_pdf(analytics_data, "detailed_test_analytics", 'weekly')
        
        # Save the PDF
        pdf_filename = "detailed_test_analytics.pdf"
        with open(pdf_filename, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Detailed PDF generated: {os.path.abspath(pdf_filename)}")
        
    except Exception as e:
        print(f"❌ Error in detailed analysis: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_api_endpoint()
    test_internal_pdf_with_alerts()

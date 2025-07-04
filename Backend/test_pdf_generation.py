#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from device.views.analytics_views import generate_reportlab_pdf, get_time_based_analytics_data
from django.utils import timezone

def test_pdf_generation():
    """Test PDF generation with actual file output"""
    print("=== TESTING PDF FILE GENERATION ===")
    
    try:
        # Get analytics data
        analytics_data = get_time_based_analytics_data('weekly')
        if not analytics_data:
            print("❌ No analytics data for PDF test")
            return
        
        print("✅ Analytics data retrieved")
        
        # Generate PDF
        filename = f"test_analytics_report_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
        
        response = generate_reportlab_pdf(analytics_data, filename, 'weekly')
        
        # Save the PDF to a file
        pdf_filename = f"{filename}.pdf"
        with open(pdf_filename, 'wb') as f:
            f.write(response.content)
        
        # Check file size
        file_size = os.path.getsize(pdf_filename)
        print(f"✅ PDF generated successfully: {pdf_filename}")
        print(f"📄 File size: {file_size} bytes")
        
        if file_size > 1000:  # Should be at least 1KB for a real PDF
            print("✅ PDF appears to have content (file size > 1KB)")
        else:
            print("⚠️ PDF file size is very small, may not have proper content")
        
        print(f"📁 PDF saved to: {os.path.abspath(pdf_filename)}")
        
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_generation()

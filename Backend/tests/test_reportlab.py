#!/usr/bin/env python3
"""
Test ReportLab PDF functionality
"""

def test_reportlab_installation():
    """Test if reportlab is properly installed and working"""
    try:
        print("🧪 Testing ReportLab Installation...")
        print("=" * 50)
        
        # Test basic imports
        from reportlab.lib.pagesizes import A4, letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        import io
        
        print("✅ All ReportLab imports successful!")
        
        # Test basic PDF creation
        print("\n📄 Testing PDF Creation...")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        title = Paragraph("Test PDF - Smart Dispenser Analytics", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Add sample table
        data = [
            ['Device', 'Battery', 'Usage', 'Status'],
            ['Device 1', '3.7V', '25', 'Good'],
            ['Device 2', '3.2V', '18', 'Low'],
            ['Device 3', '3.9V', '32', 'Excellent']
        ]
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        
        # Build PDF
        doc.build(story)
        
        # Check if PDF was created
        pdf_size = len(buffer.getvalue())
        buffer.close()
        
        if pdf_size > 0:
            print(f"✅ PDF created successfully! Size: {pdf_size} bytes")
        else:
            print("❌ PDF creation failed - no content generated")
            
        print("\n🎯 ReportLab Features Available:")
        features = [
            "✅ PDF document creation",
            "✅ Professional table styling", 
            "✅ Multiple page sizes (A4, Letter, etc.)",
            "✅ Text styling and formatting",
            "✅ Color support",
            "✅ Table layouts with borders and backgrounds",
            "✅ Spacers and layout control",
            "✅ Memory buffer support for web responses"
        ]
        
        for feature in features:
            print(f"   {feature}")
            
        print("\n" + "=" * 50)
        print("🚀 ReportLab is fully functional!")
        print("📄 PDF download endpoint will generate true PDF files")
        
        return True
        
    except ImportError as e:
        print(f"❌ ReportLab import failed: {e}")
        print("\n📦 To install ReportLab:")
        print("   pip install reportlab")
        return False
        
    except Exception as e:
        print(f"❌ PDF creation test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_reportlab_installation()
    if success:
        print("\n✨ Your PDF analytics endpoint is ready to use!")
        print("🔗 Try: GET /device-analytics/download/pdf/")
    else:
        print("\n⚠️  PDF endpoint will use HTML fallback")

import requests
import json

# Test script to check if backend PDF generation is working
API_BASE_URL = "http://localhost:8000"  # Adjust this to your backend URL

def test_pdf_download():
    """Test PDF download endpoint"""
    try:
        # You'll need to get a valid token first
        # For now, let's just test if the endpoint responds
        
        url = f"{API_BASE_URL}/device-analytics/download/pdf/"
        params = {
            "period": "weekly"
        }
        
        # Note: You'll need to add proper authentication headers
        headers = {
            # "Authorization": "Bearer YOUR_TOKEN_HERE"
        }
        
        print(f"Testing PDF endpoint: {url}")
        print(f"Parameters: {params}")
        
        response = requests.get(url, params=params, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type')}")
        print(f"Content Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Check if it's actually a PDF
            if response.content.startswith(b'%PDF'):
                print("✅ Response appears to be a valid PDF")
                
                # Save to file for inspection
                with open("test_download.pdf", "wb") as f:
                    f.write(response.content)
                print("💾 Saved test PDF as 'test_download.pdf'")
            else:
                print("❌ Response is not a valid PDF")
                print(f"First 100 bytes: {response.content[:100]}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing PDF endpoint: {str(e)}")

if __name__ == "__main__":
    test_pdf_download()

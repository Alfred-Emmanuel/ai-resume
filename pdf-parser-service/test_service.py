#!/usr/bin/env python3
"""
Test script for the PDF Parser Service
"""

import requests
import json
import sys
from pathlib import Path

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_pdf_parsing(pdf_path):
    """Test PDF parsing with a sample file"""
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        return False
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': (pdf_path, f, 'application/pdf')}
            response = requests.post("http://localhost:8000/parse", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF parsing successful")
            print(f"Pages: {result['metadata']['page_count']}")
            print(f"Text length: {len(result['text'])} characters")
            print(f"First 200 chars: {result['text'][:200]}...")
            return True
        else:
            print(f"❌ PDF parsing failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ PDF parsing error: {e}")
        return False

def test_text_only_parsing(pdf_path):
    """Test simplified text-only parsing"""
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        return False
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': (pdf_path, f, 'application/pdf')}
            response = requests.post("http://localhost:8000/parse-text-only", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text-only parsing successful")
            print(f"Pages: {result['page_count']}")
            print(f"Text length: {len(result['text'])} characters")
            return True
        else:
            print(f"❌ Text-only parsing failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Text-only parsing error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing PDF Parser Service")
    print("=" * 40)
    
    # Test health
    if not test_health():
        print("❌ Service is not running. Start it with: uvicorn main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)
    
    # Test PDF parsing if a file is provided
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        print(f"\n📄 Testing with PDF: {pdf_path}")
        test_pdf_parsing(pdf_path)
        test_text_only_parsing(pdf_path)
    else:
        print("\n💡 To test with a PDF file, run:")
        print("python test_service.py /path/to/your/resume.pdf")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Local testing script for the Credit Report Processor Google Cloud Function
"""

import json
import requests
import sys
from dotenv import load_dotenv

# Load environment variables for local testing
load_dotenv()

def test_function_locally():
    """Test the function running locally with functions-framework"""
    
    # Local function URL (when running with functions-framework)
    local_url = "http://localhost:8080"
    
    # Test payload
    test_payload = {
        "pdf_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",  # Sample PDF URL
        "user_id": "test-user-12345"
    }
    
    print("Testing Credit Report Processor locally...")
    print(f"URL: {local_url}")
    print(f"Payload: {json.dumps(test_payload, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(
            local_url,
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=300  # 5 minutes timeout for processing
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("-" * 50)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ ERROR!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        print("\nMake sure the function is running locally with:")
        print("functions-framework --target process_credit_report --debug")

def test_function_deployed(function_url):
    """Test the deployed function"""
    
    # Test payload
    test_payload = {
        "pdf_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",  # Sample PDF URL
        "user_id": "test-user-12345"
    }
    
    print("Testing deployed Credit Report Processor...")
    print(f"URL: {function_url}")
    print(f"Payload: {json.dumps(test_payload, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(
            function_url,
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=300  # 5 minutes timeout for processing
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("-" * 50)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ ERROR!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test deployed function
        function_url = sys.argv[1]
        test_function_deployed(function_url)
    else:
        # Test local function
        test_function_locally()
        
    print("\n" + "=" * 50)
    print("Test completed!")
    print("=" * 50)

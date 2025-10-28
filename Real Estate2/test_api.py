"""
Test script for Real Estate API
Run this to verify your API is working correctly
"""
import requests
import json
from datetime import datetime
import time

# Configuration
API_BASE_URL = "http://localhost:8000"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_test(test_name, passed, message=""):
    """Print test result"""
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} - {test_name}")
    if message:
        print(f"  {Colors.YELLOW}{message}{Colors.END}")

def test_health_check():
    """Test API health check"""
    try:
        response = requests.get(f"{API_BASE_URL}/")
        passed = response.status_code == 200
        message = f"Status: {response.status_code}"
        print_test("Health Check", passed, message)
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False

def test_register_user():
    """Test user registration"""
    test_email = f"test_{int(time.time())}@example.com"
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": test_email,
            "password": "testpass123",
            "username": "Test User",
            "role": "property_seeker"
        })
        passed = response.status_code == 200
        message = f"Status: {response.status_code}, Email: {test_email}"
        print_test("User Registration", passed, message)
        return passed, test_email
    except Exception as e:
        print_test("User Registration", False, str(e))
        return False, None

def test_login_user(email):
    """Test user login"""
    try:
        response = requests.post(f"{API_BASE_URL}/login", json={
            "email": email,
            "password": "testpass123"
        })
        passed = response.status_code == 200
        data = response.json() if passed else {}
        message = f"Status: {response.status_code}, User: {data.get('username', 'N/A')}"
        print_test("User Login", passed, message)
        return passed
    except Exception as e:
        print_test("User Login", False, str(e))
        return False

def test_add_property():
    """Test adding a property"""
    try:
        response = requests.post(f"{API_BASE_URL}/properties", json={
            "name": "Test Villa",
            "location": "Bangalore",
            "community": "Test Community",
            "price": 5000000,
            "area": "2000 sq.ft",
            "bedrooms": 3,
            "bathrooms": 2,
            "owner_name": "Test Owner",
            "owner_phone": "+91-1234567890",
            "owner_email": "owner@test.com",
            "amenities": ["gym", "pool", "parking"],
            "description": "Test property for API testing"
        })
        passed = response.status_code == 200
        data = response.json() if passed else {}
        property_id = data.get('id')
        message = f"Status: {response.status_code}, ID: {property_id}"
        print_test("Add Property", passed, message)
        return passed, property_id
    except Exception as e:
        print_test("Add Property", False, str(e))
        return False, None

def test_get_property(property_id):
    """Test getting a single property"""
    try:
        response = requests.get(f"{API_BASE_URL}/properties/{property_id}")
        passed = response.status_code == 200
        data = response.json() if passed else {}
        message = f"Status: {response.status_code}, Name: {data.get('name', 'N/A')}"
        print_test("Get Property", passed, message)
        return passed
    except Exception as e:
        print_test("Get Property", False, str(e))
        return False

def test_update_property(property_id):
    """Test updating a property"""
    try:
        response = requests.put(f"{API_BASE_URL}/properties/{property_id}", json={
            "price": 5500000,
            "bedrooms": 4
        })
        passed = response.status_code == 200
        message = f"Status: {response.status_code}"
        print_test("Update Property", passed, message)
        return passed
    except Exception as e:
        print_test("Update Property", False, str(e))
        return False

def test_search_properties():
    """Test property search"""
    try:
        response = requests.get(f"{API_BASE_URL}/search", params={
            "price_min": 1000000,
            "price_max": 10000000,
            "location": "Bangalore"
        })
        passed = response.status_code == 200
        data = response.json() if passed else {}
        count = len(data.get('top_matches', []))
        message = f"Status: {response.status_code}, Found: {count} properties"
        print_test("Search Properties", passed, message)
        return passed
    except Exception as e:
        print_test("Search Properties", False, str(e))
        return False

def test_delete_property(property_id):
    """Test deleting a property"""
    try:
        response = requests.delete(f"{API_BASE_URL}/properties/{property_id}")
        passed = response.status_code == 200
        message = f"Status: {response.status_code}"
        print_test("Delete Property", passed, message)
        return passed
    except Exception as e:
        print_test("Delete Property", False, str(e))
        return False

def run_all_tests():
    """Run all API tests"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Real Estate API Test Suite{Colors.END}")
    print(f"{Colors.BLUE}Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    results = []
    
    # Test 1: Health Check
    print(f"{Colors.BLUE}1. Testing Health Check...{Colors.END}")
    results.append(test_health_check())
    print()
    
    if not results[0]:
        print(f"{Colors.RED}❌ API is not running. Please start the backend server.{Colors.END}")
        print(f"{Colors.YELLOW}Run: python main.py{Colors.END}\n")
        return
    
    # Test 2: User Registration
    print(f"{Colors.BLUE}2. Testing User Registration...{Colors.END}")
    reg_passed, test_email = test_register_user()
    results.append(reg_passed)
    print()
    
    # Test 3: User Login
    if reg_passed:
        print(f"{Colors.BLUE}3. Testing User Login...{Colors.END}")
        results.append(test_login_user(test_email))
        print()
    
    # Test 4: Add Property
    print(f"{Colors.BLUE}4. Testing Add Property...{Colors.END}")
    add_passed, property_id = test_add_property()
    results.append(add_passed)
    print()
    
    # Test 5: Get Property
    if add_passed and property_id:
        print(f"{Colors.BLUE}5. Testing Get Property...{Colors.END}")
        results.append(test_get_property(property_id))
        print()
        
        # Test 6: Update Property
        print(f"{Colors.BLUE}6. Testing Update Property...{Colors.END}")
        results.append(test_update_property(property_id))
        print()
    
    # Test 7: Search Properties
    print(f"{Colors.BLUE}7. Testing Search Properties...{Colors.END}")
    results.append(test_search_properties())
    print()
    
    # Test 8: Delete Property
    if add_passed and property_id:
        print(f"{Colors.BLUE}8. Testing Delete Property...{Colors.END}")
        results.append(test_delete_property(property_id))
        print()
    
    # Summary
    passed_count = sum(results)
    total_count = len(results)
    pass_rate = (passed_count / total_count * 100) if total_count > 0 else 0
    
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Test Summary{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"Total Tests: {total_count}")
    print(f"{Colors.GREEN}Passed: {passed_count}{Colors.END}")
    print(f"{Colors.RED}Failed: {total_count - passed_count}{Colors.END}")
    print(f"Pass Rate: {pass_rate:.1f}%")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    if pass_rate == 100:
        print(f"{Colors.GREEN}🎉 All tests passed! Your API is working correctly.{Colors.END}\n")
    elif pass_rate >= 70:
        print(f"{Colors.YELLOW}⚠️  Most tests passed. Check failed tests above.{Colors.END}\n")
    else:
        print(f"{Colors.RED}❌ Multiple tests failed. Please check your setup.{Colors.END}\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user.{Colors.END}\n")
    except Exception as e:
        print(f"\n{Colors.RED}Test suite error: {str(e)}{Colors.END}\n")

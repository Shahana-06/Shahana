"""
Integration Tests for API Endpoints (Black Box + White Box)
Tests all API endpoints with various scenarios
Run this AFTER starting the backend: python main.py
"""
import requests
import time
import json

API_BASE_URL = "http://localhost:8000"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "total": 0,
    "details": []
}

def print_test_result(test_id, test_name, passed, expected, actual, test_type="Normal"):
    """Print formatted test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        status = "✅ PASS"
    else:
        test_results["failed"] += 1
        status = "❌ FAIL"
    
    result = {
        "id": test_id,
        "name": test_name,
        "status": status,
        "type": test_type,
        "expected": expected,
        "actual": actual
    }
    test_results["details"].append(result)
    
    print(f"{status} | {test_id}: {test_name}")
    print(f"   Type: {test_type}")
    print(f"   Expected: {expected}")
    print(f"   Actual: {actual}")
    print()

# ==========================================
# TEST SUITE 1: Health Check Endpoint
# ==========================================
def test_health_check():
    """Test /  endpoint"""
    print("="*60)
    print("TEST SUITE 1: Health Check Endpoint")
    print("="*60 + "\n")
    
    # TC_HEALTH_01: Server is running
    try:
        response = requests.get(f"{API_BASE_URL}/")
        passed = response.status_code == 200 and "message" in response.json()
        print_test_result(
            "TC_HEALTH_01",
            "Verify server is running",
            passed,
            "200 OK with message",
            f"Status: {response.status_code}, Response: {response.json()}",
            "Normal Case"
        )
        return True
    except Exception as e:
        print_test_result(
            "TC_HEALTH_01",
            "Verify server is running",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
        return False

# ==========================================
# TEST SUITE 2: User Registration Endpoint
# ==========================================
def test_register():
    """Test /register endpoint"""
    print("="*60)
    print("TEST SUITE 2: User Registration Endpoint")
    print("="*60 + "\n")
    
    test_email = f"test_{int(time.time())}@example.com"
    
    # TC_REG_01: Register valid user
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": test_email,
            "password": "password123",
            "username": "Test User",
            "role": "property_seeker"
        })
        passed = response.status_code == 200
        print_test_result(
            "TC_REG_01",
            "Register valid user",
            passed,
            "200 OK, user created",
            f"Status: {response.status_code}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_REG_01",
            "Register valid user",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_REG_02: Duplicate email
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": test_email,  # Same email as above
            "password": "password456",
            "username": "Another User",
            "role": "property_manager"
        })
        passed = response.status_code == 400 and "already" in response.json().get("detail", "").lower()
        print_test_result(
            "TC_REG_02",
            "Reject duplicate email",
            passed,
            "400 'Email already registered'",
            f"Status: {response.status_code}, Detail: {response.json().get('detail')}",
            "Branch Test - Duplicate Check"
        )
    except Exception as e:
        print_test_result(
            "TC_REG_02",
            "Reject duplicate email",
            False,
            "400 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_REG_03: Invalid role
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": f"invalid_{int(time.time())}@example.com",
            "password": "password123",
            "username": "Invalid Role User",
            "role": "admin"  # Invalid role
        })
        passed = response.status_code == 400 and "role" in response.json().get("detail", "").lower()
        print_test_result(
            "TC_REG_03",
            "Reject invalid role",
            passed,
            "400 'Invalid role'",
            f"Status: {response.status_code}, Detail: {response.json().get('detail')}",
            "Validation Test"
        )
    except Exception as e:
        print_test_result(
            "TC_REG_03",
            "Reject invalid role",
            False,
            "400 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_REG_04: Weak password (too short)
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": f"weak_{int(time.time())}@example.com",
            "password": "123",  # Too short
            "username": "Weak Password User",
            "role": "property_seeker"
        })
        passed = response.status_code == 400 and "password" in response.json().get("detail", "").lower()
        print_test_result(
            "TC_REG_04",
            "Reject weak password",
            passed,
            "400 'Password must be at least 6 characters'",
            f"Status: {response.status_code}, Detail: {response.json().get('detail')}",
            "Boundary Test"
        )
    except Exception as e:
        print_test_result(
            "TC_REG_04",
            "Reject weak password",
            False,
            "400 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_REG_05: Invalid email format
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": "not-an-email",
            "password": "password123",
            "username": "Invalid Email User",
            "role": "property_seeker"
        })
        passed = response.status_code == 422  # Pydantic validation error
        print_test_result(
            "TC_REG_05",
            "Reject invalid email format",
            passed,
            "422 Validation Error",
            f"Status: {response.status_code}",
            "Validation Test"
        )
    except Exception as e:
        print_test_result(
            "TC_REG_05",
            "Reject invalid email format",
            False,
            "422 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    return test_email  # Return for login tests

# ==========================================
# TEST SUITE 3: User Login Endpoint
# ==========================================
def test_login(test_email):
    """Test /login endpoint"""
    print("="*60)
    print("TEST SUITE 3: User Login Endpoint")
    print("="*60 + "\n")
    
    # TC_LOGIN_01: Valid credentials
    try:
        response = requests.post(f"{API_BASE_URL}/login", json={
            "email": test_email,
            "password": "password123"
        })
        passed = response.status_code == 200 and "username" in response.json()
        print_test_result(
            "TC_LOGIN_01",
            "Login with valid credentials",
            passed,
            "200 OK with user data",
            f"Status: {response.status_code}, User: {response.json().get('username')}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_LOGIN_01",
            "Login with valid credentials",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_LOGIN_02: Wrong password
    try:
        response = requests.post(f"{API_BASE_URL}/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        passed = response.status_code == 401 and "invalid" in response.json().get("detail", "").lower()
        print_test_result(
            "TC_LOGIN_02",
            "Reject wrong password",
            passed,
            "401 'Invalid email or password'",
            f"Status: {response.status_code}, Detail: {response.json().get('detail')}",
            "Branch Test - Authentication"
        )
    except Exception as e:
        print_test_result(
            "TC_LOGIN_02",
            "Reject wrong password",
            False,
            "401 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_LOGIN_03: Non-existent email
    try:
        response = requests.post(f"{API_BASE_URL}/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        passed = response.status_code == 401
        print_test_result(
            "TC_LOGIN_03",
            "Reject non-existent email",
            passed,
            "401 'Invalid email or password'",
            f"Status: {response.status_code}",
            "Branch Test - User Not Found"
        )
    except Exception as e:
        print_test_result(
            "TC_LOGIN_03",
            "Reject non-existent email",
            False,
            "401 error",
            f"Error: {str(e)}",
            "Exception"
        )

# ==========================================
# TEST SUITE 4: Property CRUD Operations
# ==========================================
def test_property_crud():
    """Test property create, read, update, delete"""
    print("="*60)
    print("TEST SUITE 4: Property CRUD Operations")
    print("="*60 + "\n")
    
    property_id = None
    
    # TC_PROP_ADD_01: Add valid property
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
            "description": "Test property"
        })
        passed = response.status_code == 200 and "id" in response.json()
        if passed:
            property_id = response.json().get("id")
        print_test_result(
            "TC_PROP_ADD_01",
            "Add valid property",
            passed,
            "200 OK with property ID",
            f"Status: {response.status_code}, ID: {property_id}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_PROP_ADD_01",
            "Add valid property",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_PROP_GET_01: Get valid property
    if property_id:
        try:
            response = requests.get(f"{API_BASE_URL}/properties/{property_id}")
            passed = response.status_code == 200 and response.json().get("name") == "Test Villa"
            print_test_result(
                "TC_PROP_GET_01",
                "Get property by valid ID",
                passed,
                "200 OK with property data",
                f"Status: {response.status_code}, Name: {response.json().get('name')}",
                "Normal Case"
            )
        except Exception as e:
            print_test_result(
                "TC_PROP_GET_01",
                "Get property by valid ID",
                False,
                "200 OK",
                f"Error: {str(e)}",
                "Exception"
            )
    
    # TC_PROP_GET_02: Get invalid property ID
    try:
        response = requests.get(f"{API_BASE_URL}/properties/nonexistent_id")
        passed = response.status_code == 404
        print_test_result(
            "TC_PROP_GET_02",
            "Reject invalid property ID",
            passed,
            "404 'Property not found'",
            f"Status: {response.status_code}",
            "Branch Test - Not Found"
        )
    except Exception as e:
        print_test_result(
            "TC_PROP_GET_02",
            "Reject invalid property ID",
            False,
            "404 error",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_PROP_UPDATE_01: Update valid property
    if property_id:
        try:
            response = requests.put(f"{API_BASE_URL}/properties/{property_id}", json={
                "price": 5500000,
                "bedrooms": 4
            })
            passed = response.status_code == 200
            print_test_result(
                "TC_PROP_UPDATE_01",
                "Update property with valid data",
                passed,
                "200 OK 'Property updated successfully'",
                f"Status: {response.status_code}",
                "Normal Case"
            )
        except Exception as e:
            print_test_result(
                "TC_PROP_UPDATE_01",
                "Update property with valid data",
                False,
                "200 OK",
                f"Error: {str(e)}",
                "Exception"
            )
    
    # TC_PROP_DELETE_01: Delete valid property
    if property_id:
        try:
            response = requests.delete(f"{API_BASE_URL}/properties/{property_id}")
            passed = response.status_code == 200
            print_test_result(
                "TC_PROP_DELETE_01",
                "Delete property by valid ID",
                passed,
                "200 OK 'Property deleted successfully'",
                f"Status: {response.status_code}",
                "Normal Case"
            )
        except Exception as e:
            print_test_result(
                "TC_PROP_DELETE_01",
                "Delete property by valid ID",
                False,
                "200 OK",
                f"Error: {str(e)}",
                "Exception"
            )

# ==========================================
# TEST SUITE 5: Search Endpoint
# ==========================================
def test_search():
    """Test /search endpoint with scoring"""
    print("="*60)
    print("TEST SUITE 5: Search Endpoint with Scoring")
    print("="*60 + "\n")
    
    # TC_SEARCH_01: Search with price range
    try:
        response = requests.get(f"{API_BASE_URL}/search", params={
            "price_min": 1000000,
            "price_max": 10000000
        })
        passed = response.status_code == 200 and "top_matches" in response.json()
        print_test_result(
            "TC_SEARCH_01",
            "Search with price range",
            passed,
            "200 OK with results",
            f"Status: {response.status_code}, Results: {len(response.json().get('top_matches', []))}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_SEARCH_01",
            "Search with price range",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_SEARCH_02: Search with location
    try:
        response = requests.get(f"{API_BASE_URL}/search", params={
            "location": "Bangalore"
        })
        passed = response.status_code == 200
        print_test_result(
            "TC_SEARCH_02",
            "Search by location",
            passed,
            "200 OK with location matches",
            f"Status: {response.status_code}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_SEARCH_02",
            "Search by location",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_SEARCH_03: Search with amenities
    try:
        response = requests.get(f"{API_BASE_URL}/search", params={
            "amenities": ["gym", "pool"]
        })
        passed = response.status_code == 200 and "user_score" in response.json()
        print_test_result(
            "TC_SEARCH_03",
            "Search by amenities",
            passed,
            "200 OK with scoring",
            f"Status: {response.status_code}, User Score: {response.json().get('user_score')}",
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_SEARCH_03",
            "Search by amenities",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )
    
    # TC_SEARCH_04: No filters (return all)
    try:
        response = requests.get(f"{API_BASE_URL}/search")
        passed = response.status_code == 200
        print_test_result(
            "TC_SEARCH_04",
            "Search with no filters",
            passed,
            "200 OK, returns all properties",
            f"Status: {response.status_code}",
            "Branch Test - No Filters"
        )
    except Exception as e:
        print_test_result(
            "TC_SEARCH_04",
            "Search with no filters",
            False,
            "200 OK",
            f"Error: {str(e)}",
            "Exception"
        )

# ==========================================
# MAIN TEST RUNNER
# ==========================================
def run_all_integration_tests():
    """Run all integration tests"""
    print("\n" + "🧪 "*30)
    print("INTEGRATION TESTING - API Endpoints")
    print("🧪 "*30 + "\n")
    
    # Check if backend is running
    if not test_health_check():
        print("\n❌ Backend is not running!")
        print("Please start the backend first: python main.py")
        return
    
    # Run all test suites
    test_email = test_register()
    test_login(test_email)
    test_property_crud()
    test_search()
    
    # Print detailed summary
    print("\n" + "="*60)
    print("DETAILED TEST RESULTS")
    print("="*60)
    for detail in test_results["details"]:
        print(f"{detail['status']} | {detail['id']}: {detail['name']}")
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total Tests: {test_results['total']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    
    pass_rate = (test_results['passed'] / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"Pass Rate: {pass_rate:.1f}%")
    print("="*60)
    
    if pass_rate == 100:
        print("\n🎉 All integration tests passed!")
    elif pass_rate >= 70:
        print("\n⚠️  Most tests passed. Review failed tests above.")
    else:
        print("\n❌ Multiple tests failed. Review API implementation.")
    
    return pass_rate

if __name__ == "__main__":
    try:
        run_all_integration_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite error: {str(e)}")
        import traceback
        traceback.print_exc()

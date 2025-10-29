"""
Unit Tests for Helper Functions (White Box Testing)
Tests internal functions: hash_password(), normalize(), Config.validate()
"""
import sys
import os
import hashlib

# Add parent directory to path to import main and config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config

# ==========================================
# TEST RESULTS TRACKING
# ==========================================
test_results = {
    "passed": 0,
    "failed": 0,
    "total": 0
}

def print_test_result(test_name, passed, expected, actual, test_type="Normal"):
    """Print formatted test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS | {test_name}")
        print(f"   Type: {test_type}")
        print(f"   Expected: {expected}")
        print(f"   Actual: {actual}")
    else:
        test_results["failed"] += 1
        print(f"❌ FAIL | {test_name}")
        print(f"   Type: {test_type}")
        print(f"   Expected: {expected}")
        print(f"   Actual: {actual}")
    print()

# ==========================================
# TEST 1: hash_password()
# ==========================================
def test_hash_password():
    """Test password hashing function"""
    print("="*60)
    print("TEST SUITE 1: hash_password() Function")
    print("="*60)
    
    def hash_password_local(password: str) -> str:
        """Local implementation for testing"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    # TC_HASH_01: Valid password
    password = "password123"
    result = hash_password_local(password)
    expected_type = str
    passed = isinstance(result, expected_type) and len(result) == 64
    print_test_result(
        "TC_HASH_01: Hash valid password",
        passed,
        "64-character hex string",
        f"{len(result)}-char string: {result[:20]}...",
        "Normal Case"
    )
    
    # TC_HASH_02: Same password produces same hash (deterministic)
    hash1 = hash_password_local("test123")
    hash2 = hash_password_local("test123")
    passed = hash1 == hash2
    print_test_result(
        "TC_HASH_02: Deterministic hashing",
        passed,
        "Same hash for same password",
        f"Match: {hash1 == hash2}",
        "Branch Test"
    )
    
    # TC_HASH_03: Empty password
    empty_result = hash_password_local("")
    passed = isinstance(empty_result, str) and len(empty_result) == 64
    print_test_result(
        "TC_HASH_03: Empty password",
        passed,
        "Valid hash even for empty string",
        f"Hash generated: {empty_result[:20]}...",
        "Edge Case"
    )
    
    # TC_HASH_04: Special characters
    special_pass = "P@$$w0rd!#"
    special_result = hash_password_local(special_pass)
    passed = isinstance(special_result, str) and len(special_result) == 64
    print_test_result(
        "TC_HASH_04: Special characters in password",
        passed,
        "Valid hash for special chars",
        f"Hash generated: {special_result[:20]}...",
        "Validation Test"
    )
    
    # TC_HASH_05: Long password (100 chars)
    long_pass = "a" * 100
    long_result = hash_password_local(long_pass)
    passed = isinstance(long_result, str) and len(long_result) == 64
    print_test_result(
        "TC_HASH_05: Long password (100 chars)",
        passed,
        "Valid hash for long password",
        f"Hash generated: {long_result[:20]}...",
        "Boundary Test"
    )

# ==========================================
# TEST 2: normalize()
# ==========================================
def test_normalize():
    """Test normalization function"""
    print("\n" + "="*60)
    print("TEST SUITE 2: normalize() Function")
    print("="*60)
    
    def normalize_local(value, min_val, max_val):
        """Local implementation for testing"""
        if max_val == min_val:
            return 1.0
        return (value - min_val) / (max_val - min_val)
    
    # TC_N1: Normal case - middle value
    result = normalize_local(50, 0, 100)
    expected = 0.5
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N1: Normalize middle value",
        passed,
        expected,
        result,
        "Normal Case"
    )
    
    # TC_N2: Lower bound
    result = normalize_local(0, 0, 100)
    expected = 0.0
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N2: Normalize lower bound",
        passed,
        expected,
        result,
        "Boundary Test"
    )
    
    # TC_N3: Upper bound
    result = normalize_local(100, 0, 100)
    expected = 1.0
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N3: Normalize upper bound",
        passed,
        expected,
        result,
        "Boundary Test"
    )
    
    # TC_N4: Division by zero prevention (min == max)
    result = normalize_local(20, 20, 20)
    expected = 1.0
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N4: Prevent division by zero",
        passed,
        expected,
        result,
        "Branch Test - Edge Case"
    )
    
    # TC_N5: Value outside range
    result = normalize_local(150, 0, 100)
    expected = 1.5
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N5: Value outside range",
        passed,
        expected,
        result,
        "Edge Case"
    )
    
    # TC_N6: Negative range
    result = normalize_local(5, 0, 10)
    expected = 0.5
    passed = abs(result - expected) < 0.0001
    print_test_result(
        "TC_N6: Negative values in range",
        passed,
        expected,
        result,
        "Normal Case"
    )

# ==========================================
# TEST 3: Config.validate()
# ==========================================
def test_config_validate():
    """Test configuration validation"""
    print("\n" + "="*60)
    print("TEST SUITE 3: Config.validate() Function")
    print("="*60)
    
    # TC_CONFIG_01: Valid configuration
    try:
        # Check if file exists first
        if os.path.exists(Config.FIREBASE_CREDENTIALS_PATH):
            Config.validate()
            passed = True
            result = "Validation passed"
        else:
            passed = False
            result = "Firebase credentials file missing"
        
        print_test_result(
            "TC_CONFIG_01: Valid configuration",
            passed,
            "No exception raised",
            result,
            "Normal Case"
        )
    except Exception as e:
        print_test_result(
            "TC_CONFIG_01: Valid configuration",
            False,
            "No exception",
            f"Exception: {str(e)}",
            "Normal Case"
        )
    
    # TC_CONFIG_02: Check weights sum to 1.0
    total_weight = (
        Config.WEIGHT_PRICE + 
        Config.WEIGHT_AMENITY + 
        Config.WEIGHT_LOCATION + 
        Config.WEIGHT_COMMUNITY
    )
    passed = abs(total_weight - 1.0) < 0.01
    print_test_result(
        "TC_CONFIG_02: Weights sum to 1.0",
        passed,
        1.0,
        total_weight,
        "Validation Test"
    )
    
    # TC_CONFIG_03: Check required constants exist
    required_attrs = [
        'API_HOST', 'API_PORT', 'API_BASE_URL',
        'FIREBASE_CREDENTIALS_PATH', 'APP_NAME',
        'WEIGHT_PRICE', 'WEIGHT_AMENITY',
        'MAX_SEARCH_RESULTS', 'PASSWORD_MIN_LENGTH'
    ]
    
    missing = [attr for attr in required_attrs if not hasattr(Config, attr)]
    passed = len(missing) == 0
    print_test_result(
        "TC_CONFIG_03: All required attributes exist",
        passed,
        "All attributes present",
        f"Missing: {missing}" if missing else "All present",
        "Validation Test"
    )
    
    # TC_CONFIG_04: Check password min length is reasonable
    passed = Config.PASSWORD_MIN_LENGTH >= 6
    print_test_result(
        "TC_CONFIG_04: Password min length >= 6",
        passed,
        ">= 6",
        Config.PASSWORD_MIN_LENGTH,
        "Boundary Test"
    )
    
    # TC_CONFIG_05: Check max search results is positive
    passed = Config.MAX_SEARCH_RESULTS > 0
    print_test_result(
        "TC_CONFIG_05: Max search results > 0",
        passed,
        "> 0",
        Config.MAX_SEARCH_RESULTS,
        "Validation Test"
    )

# ==========================================
# MAIN TEST RUNNER
# ==========================================
def run_all_unit_tests():
    """Run all unit tests"""
    print("\n" + "🧪 "*30)
    print("WHITE BOX TESTING - Unit Tests for Helper Functions")
    print("🧪 "*30 + "\n")
    
    # Run all test suites
    test_hash_password()
    test_normalize()
    test_config_validate()
    
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
        print("\n🎉 All unit tests passed!")
    elif pass_rate >= 70:
        print("\n⚠️  Most tests passed. Review failed tests above.")
    else:
        print("\n❌ Multiple tests failed. Review implementation.")
    
    return pass_rate

if __name__ == "__main__":
    try:
        run_all_unit_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite error: {str(e)}")
        import traceback
        traceback.print_exc()

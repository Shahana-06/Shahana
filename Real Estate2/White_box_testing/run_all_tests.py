"""
Master Test Runner - Runs All Tests
Executes both unit tests and integration tests
"""
import subprocess
import sys
import os
from datetime import datetime

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")

def run_command(command, description):
    """Run a command and return success status"""
    print(f"🚀 Running: {description}")
    print(f"   Command: {command}")
    print("-"*70)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=False,
            text=True
        )
        print("-"*70)
        print(f"✅ {description} completed\n")
        return True
    except subprocess.CalledProcessError as e:
        print("-"*70)
        print(f"❌ {description} failed")
        print(f"   Error: {e}\n")
        return False
    except Exception as e:
        print("-"*70)
        print(f"❌ {description} encountered an error")
        print(f"   Error: {str(e)}\n")
        return False

def check_backend_running():
    """Check if backend is running"""
    try:
        import requests
        response = requests.get("http://localhost:8000/", timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    """Main test execution"""
    start_time = datetime.now()
    
    print("\n" + "🧪 "*35)
    print(" "*20 + "COMPLETE TEST SUITE")
    print(" "*15 + "Real Estate Application Testing")
    print("🧪 "*35)
    print(f"\nStarted at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        "unit_tests": None,
        "integration_tests": None
    }
    
    # ==========================================
    # PHASE 1: Unit Tests
    # ==========================================
    print_header("PHASE 1: UNIT TESTS (White Box Testing)")
    print("Testing internal functions:")
    print("  - hash_password()")
    print("  - normalize()")
    print("  - Config.validate()")
    print()
    
    results["unit_tests"] = run_command(
        f"{sys.executable} test_unit_functions.py",
        "Unit Tests"
    )
    
    # ==========================================
    # PHASE 2: Integration Tests
    # ==========================================
    print_header("PHASE 2: INTEGRATION TESTS (API Endpoints)")
    
    # Check if backend is running
    if not check_backend_running():
        print("⚠️  WARNING: Backend is not running!")
        print("   Integration tests require the backend to be running.")
        print("   Please start backend in another terminal: python main.py")
        print("\n   Skipping integration tests...\n")
        results["integration_tests"] = False
    else:
        print("✅ Backend detected running on http://localhost:8000")
        print("\nTesting API endpoints:")
        print("  - /  (Health Check)")
        print("  - /register (User Registration)")
        print("  - /login (User Login)")
        print("  - /properties (CRUD Operations)")
        print("  - /search (Property Search)")
        print()
        
        results["integration_tests"] = run_command(
            f"{sys.executable} test_integration_api.py",
            "Integration Tests"
        )
    
    # ==========================================
    # FINAL SUMMARY
    # ==========================================
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print_header("FINAL TEST SUMMARY")
    
    print(f"Test Execution Time: {duration:.2f} seconds\n")
    
    print("Test Phase Results:")
    print(f"  {'Phase':<30} {'Status':<20}")
    print("  " + "-"*50)
    
    # Unit Tests
    status = "✅ PASSED" if results["unit_tests"] else "❌ FAILED"
    print(f"  {'Unit Tests':<30} {status:<20}")
    
    # Integration Tests
    if results["integration_tests"] is None:
        status = "⏭️  SKIPPED"
    elif results["integration_tests"]:
        status = "✅ PASSED"
    else:
        status = "❌ FAILED"
    print(f"  {'Integration Tests':<30} {status:<20}")
    
    print("  " + "-"*50)
    
    # Overall result
    print("\nOverall Result:")
    if results["unit_tests"] and results["integration_tests"]:
        print("  🎉 ALL TESTS PASSED!")
        print("  Your application is working correctly.")
        exit_code = 0
    elif results["unit_tests"] and results["integration_tests"] is False:
        print("  ⚠️  PARTIAL PASS")
        print("  Integration tests failed. Check API implementation.")
        exit_code = 1
    elif results["unit_tests"] and results["integration_tests"] is None:
        print("  ⚠️  PARTIAL PASS")
        print("  Integration tests skipped (backend not running).")
        print("  Start backend and run: python test_integration_api.py")
        exit_code = 0
    else:
        print("  ❌ TESTS FAILED")
        print("  Review the errors above.")
        exit_code = 1
    
    print("\n" + "="*70)
    print(f"Testing completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70 + "\n")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Test runner error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

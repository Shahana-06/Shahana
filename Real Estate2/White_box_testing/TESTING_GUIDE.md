# 🧪 Testing Guide - How to Run Tests

## 📋 Overview

You now have **3 test files** to verify your Real Estate Application:

| File | Purpose | Tests | Backend Required? |
|------|---------|-------|-------------------|
| `test_unit_functions.py` | Unit tests | Internal functions | ❌ No |
| `test_integration_api.py` | Integration tests | API endpoints | ✅ Yes |
| `run_all_tests.py` | Master runner | Runs all tests | ⚠️ Partial |

---

## 🚀 Quick Start - Run All Tests

### **Option 1: Run Everything at Once** (Easiest)

```bash
# Make sure backend is running in another terminal!
# Terminal 1: python main.py

# Terminal 2: Run all tests
python run_all_tests.py
```

This will:
- ✅ Run unit tests (no backend needed)
- ✅ Check if backend is running
- ✅ Run integration tests (if backend is available)
- ✅ Show comprehensive summary

---

## 🔬 Individual Test Suites

### **Test 1: Unit Tests** (White Box Testing)

Tests internal helper functions without needing the API running.

```bash
python test_unit_functions.py
```

**What it tests:**
- ✅ `hash_password()` - Password hashing
- ✅ `normalize()` - Value normalization (0 to 1)
- ✅ `Config.validate()` - Configuration validation

**Test Cases:**
- TC_HASH_01 to TC_HASH_05: Hash function tests
- TC_N1 to TC_N6: Normalization tests
- TC_CONFIG_01 to TC_CONFIG_05: Config validation tests

**Expected Output:**
```
🧪 🧪 🧪 ... WHITE BOX TESTING - Unit Tests ...

============================================================
TEST SUITE 1: hash_password() Function
============================================================

✅ PASS | TC_HASH_01: Hash valid password
   Type: Normal Case
   Expected: 64-character hex string
   Actual: 64-char string: ef92b778bafe771e89...

✅ PASS | TC_HASH_02: Deterministic hashing
...

============================================================
TEST SUMMARY
============================================================
Total Tests: 16
✅ Passed: 16
❌ Failed: 0
Pass Rate: 100.0%
============================================================

🎉 All unit tests passed!
```

---

### **Test 2: Integration Tests** (API Endpoint Testing)

Tests all API endpoints with real HTTP requests.

**⚠️ IMPORTANT: Backend must be running!**

```bash
# Terminal 1: Start backend
python main.py

# Terminal 2: Run tests
python test_integration_api.py
```

**What it tests:**
- ✅ `GET /` - Health check
- ✅ `POST /register` - User registration (valid, duplicate, invalid)
- ✅ `POST /login` - User login (valid, wrong password, non-existent)
- ✅ `POST /properties` - Add property
- ✅ `GET /properties/{id}` - Get property (valid, invalid ID)
- ✅ `PUT /properties/{id}` - Update property
- ✅ `DELETE /properties/{id}` - Delete property
- ✅ `GET /search` - Search with filters (price, location, amenities, no filters)

**Test Cases:**
- TC_HEALTH_01: Server running
- TC_REG_01 to TC_REG_05: Registration tests
- TC_LOGIN_01 to TC_LOGIN_03: Login tests
- TC_PROP_ADD_01, TC_PROP_GET_01/02, TC_PROP_UPDATE_01, TC_PROP_DELETE_01: CRUD tests
- TC_SEARCH_01 to TC_SEARCH_04: Search tests

**Expected Output:**
```
🧪 🧪 🧪 ... INTEGRATION TESTING - API Endpoints ...

============================================================
TEST SUITE 1: Health Check Endpoint
============================================================

✅ PASS | TC_HEALTH_01: Verify server is running
   Type: Normal Case
   Expected: 200 OK with message
   Actual: Status: 200, Response: {'message': ...}

============================================================
TEST SUITE 2: User Registration Endpoint
============================================================

✅ PASS | TC_REG_01: Register valid user
✅ PASS | TC_REG_02: Reject duplicate email
✅ PASS | TC_REG_03: Reject invalid role
✅ PASS | TC_REG_04: Reject weak password
...

============================================================
TEST SUMMARY
============================================================
Total Tests: 18
✅ Passed: 18
❌ Failed: 0
Pass Rate: 100.0%
============================================================

🎉 All integration tests passed!
```

---

## 📊 Understanding Test Results

### **Test Types Explained:**

| Type | Meaning | Example |
|------|---------|---------|
| **Normal Case** | Expected, happy path | Register valid user |
| **Branch Test** | Tests different code paths | Duplicate email check |
| **Validation Test** | Tests input validation | Invalid email format |
| **Boundary Test** | Tests edge values | Password length = 6 |
| **Exception Test** | Tests error handling | Database failure |

### **Test Case Naming:**

Format: `TC_CATEGORY_NUMBER`

Examples:
- `TC_HASH_01` = Test Case for Hash function #1
- `TC_REG_02` = Test Case for Registration #2
- `TC_LOGIN_03` = Test Case for Login #3

---

## 🎯 Step-by-Step Testing Process

### **Complete Testing Workflow:**

```bash
# Step 1: Create test files
# Copy the 3 test files to your project folder

# Step 2: Install pytest (optional, for advanced testing)
pip install pytest requests

# Step 3: Start backend (Terminal 1)
cd real-estate-app
venv\Scripts\activate  # Windows
python main.py

# Step 4: Run tests (Terminal 2)
cd real-estate-app
venv\Scripts\activate  # Windows
python run_all_tests.py

# Or run individually:
python test_unit_functions.py
python test_integration_api.py
```

---

## 📁 File Locations

Place all test files in your project root:

```
real-estate-app/
├── main.py
├── streamlit_app.py
├── config.py
├── test_unit_functions.py       ← NEW
├── test_integration_api.py      ← NEW
├── run_all_tests.py              ← NEW
├── test_api.py                   (existing, still useful)
└── ...
```

---

## 🐛 Troubleshooting

### **Issue 1: "Module not found" error**

```bash
# Solution: Install missing packages
pip install requests
```

### **Issue 2: "Cannot import config"**

```bash
# Solution: Make sure you're in the project directory
cd real-estate-app
python test_unit_functions.py
```

### **Issue 3: "Backend is not running"**

```bash
# Solution: Start backend first
# Terminal 1:
python main.py

# Terminal 2:
python test_integration_api.py
```

### **Issue 4: Tests fail due to Firebase**

```bash
# Solution: Make sure serviceAccountKey.json exists
ls serviceAccountKey.json  # Should show the file

# If missing, download from Firebase Console
```

### **Issue 5: Some tests fail unexpectedly**

**Check:**
1. Is backend running? (`python main.py` in another terminal)
2. Is Firebase configured? (check `serviceAccountKey.json`)
3. Are weights in `config.py` valid? (must sum to 1.0)
4. Is database accessible? (check internet connection)

---

## 📈 What Good Test Results Look Like

### **100% Pass Rate:**
```
============================================================
TEST SUMMARY
============================================================
Total Tests: 34
✅ Passed: 34
❌ Failed: 0
Pass Rate: 100.0%
============================================================

🎉 All tests passed!
```

### **Partial Pass:**
```
============================================================
TEST SUMMARY
============================================================
Total Tests: 34
✅ Passed: 30
❌ Failed: 4
Pass Rate: 88.2%
============================================================

⚠️  Most tests passed. Check failed tests above.
```

**Action:** Review the failed tests above to see what went wrong.

### **Multiple Failures:**
```
============================================================
TEST SUMMARY
============================================================
Total Tests: 34
✅ Passed: 15
❌ Failed: 19
Pass Rate: 44.1%
============================================================

❌ Multiple tests failed. Please check your setup.
```

**Action:** 
1. Check if backend is running
2. Verify Firebase configuration
3. Review error messages in detail

---

## 🎓 Understanding Your Test Report

When you run `python run_all_tests.py`, you'll see:

```
======================================================================
  FINAL TEST SUMMARY
======================================================================

Test Execution Time: 12.45 seconds

Test Phase Results:
  Phase                          Status              
  --------------------------------------------------
  Unit Tests                     ✅ PASSED          
  Integration Tests              ✅ PASSED          
  --------------------------------------------------

Overall Result:
  🎉 ALL TESTS PASSED!
  Your application is working correctly.

======================================================================
Testing completed at: 2024-10-29 15:30:45
======================================================================
```

This means:
- ✅ All internal functions work correctly
- ✅ All API endpoints work correctly
- ✅ Your app is ready to use/deploy!

---

## 🔄 Regular Testing Workflow

### **When to Run Tests:**

1. **After making code changes** - Ensure nothing broke
2. **Before deploying** - Verify everything works
3. **When adding features** - Check integration
4. **After updating dependencies** - Confirm compatibility

### **Quick Test Command:**

```bash
# Windows
test.bat  # Create this batch file (see below)

# Mac/Linux
./test.sh  # Create this shell script (see below)
```

**Create `test.bat` (Windows):**
```batch
@echo off
echo Running tests...
python run_all_tests.py
pause
```

**Create `test.sh` (Mac/Linux):**
```bash
#!/bin/bash
echo "Running tests..."
python run_all_tests.py
```

---

## 📊 Test Coverage Summary

Your tests cover:

### **Unit Tests (16 test cases):**
- Password hashing (5 cases)
- Value normalization (6 cases)
- Configuration validation (5 cases)

### **Integration Tests (18 test cases):**
- Health check (1 case)
- User registration (5 cases)
- User login (3 cases)
- Property CRUD (5 cases)
- Property search (4 cases)

### **Total: 34 Test Cases**

**Coverage:**
- ✅ All critical functions
- ✅ All API endpoints
- ✅ Error handling
- ✅ Edge cases
- ✅ Validation logic

---

## 🎯 Next Steps

After running tests successfully:

1. ✅ **Review results** - Check pass rate
2. ✅ **Fix failures** - Address any failing tests
3. ✅ **Add more tests** - For new features you add
4. ✅ **Automate** - Run tests before every commit
5. ✅ **Document** - Note any special test requirements

---

## 💡 Tips for Success

1. **Always start backend first** before integration tests
2. **Run unit tests frequently** (they're fast, no backend needed)
3. **Read error messages carefully** - they tell you what's wrong
4. **Test after every change** - Catch bugs early
5. **Keep tests updated** - When you add features, add tests

---

## 🆘 Getting Help

If tests fail:

1. **Read the error message** - It usually tells you the problem
2. **Check test expectations** - What did the test expect vs. what happened?
3. **Verify setup** - Backend running? Firebase configured?
4. **Run tests individually** - Isolate the problem
5. **Check your code** - Did you modify something recently?

---

**Happy Testing! 🧪✨**

Remember: Passing tests = Confidence in your code!

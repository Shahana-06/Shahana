# 🎯 Getting Started - Simple Step-by-Step Guide

## 📌 What You're Building
A real estate web application where:
- **Property Seekers** can search and find properties
- **Property Managers** can list and manage properties
- Smart matching algorithm ranks properties by relevance

---

## 🛠️ Step 1: Install Python

### Windows:
1. Go to https://www.python.org/downloads/
2. Download **Python 3.8 or higher** (recommended: Python 3.11)
3. Run the installer
4. **⚠️ IMPORTANT**: Check ✅ "Add Python to PATH" at the bottom of the installer
5. Click "Install Now"
6. After installation, verify:
   - Press `Win + R`, type `cmd`, press Enter
   - Type: `python --version`
   - Should show: `Python 3.x.x`

### Mac:
```bash
# Install using Homebrew
brew install python3

# Verify installation
python3 --version
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip

# Verify installation
python3 --version
```

---

## 🔥 Step 2: Set Up Firebase

### 2.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add Project" or select existing `real-estate-recommendati-183a5`
3. Follow the setup wizard (you can disable Google Analytics if asked)

### 2.2 Enable Firestore
1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose **"Start in test mode"** (easier for development)
4. Select location closest to you (e.g., `asia-south1` for India)
5. Click "Enable"
6. Wait for database to be created (takes ~1 minute)

### 2.3 Download Credentials
1. Go to Project Settings (⚙️ gear icon next to "Project Overview")
2. Click "Service accounts" tab at the top
3. Scroll down and click **"Generate new private key"**
4. Click "Generate key" in the popup
5. **Save the downloaded JSON file**
6. **Rename it to exactly:** `serviceAccountKey.json`
7. ⚠️ Keep this file SECRET - never share it or upload to GitHub!

---

## 📁 Step 3: Organize Your Files

### Windows Instructions:

1. **Create Project Folder:**
   - Open File Explorer
   - Navigate to a location (e.g., `C:\Users\YourName\Documents\`)
   - Right-click → New → Folder
   - Name it: `real-estate-app`

2. **Add Files to Folder:**
   - Create/copy all the files I provided into `real-estate-app` folder
   - Move your `serviceAccountKey.json` here too

Your folder should look like this:

```
📁 C:\Users\YourName\Documents\real-estate-app\
├── 📄 main.py
├── 📄 streamlit_app.py
├── 📄 config.py
├── 📄 test_api.py
├── 📄 load_sample_data.py
├── 📄 start_app.py
├── 📄 requirements.txt
├── 📄 sample_properties.json
├── 📄 .gitignore
├── 📄 README.md
├── 📄 SETUP_GUIDE.md
├── 📄 GETTING_STARTED.md
├── 🔐 serviceAccountKey.json (from Firebase)
└── 📄 .env (optional)
```

### How to Create Each File (Windows):
1. Open Notepad
2. Copy the content from the artifact I provided
3. Click File → Save As
4. In "Save as type", select **"All Files (*.*)"**
5. Name it exactly as shown (e.g., `main.py`, `config.py`)
6. Save in your `real-estate-app` folder

---

## 💻 Step 4: Install Dependencies

### Windows Instructions:

1. **Open Command Prompt in Project Folder:**
   - Open File Explorer
   - Navigate to `real-estate-app` folder
   - In the address bar at the top, click and type: `cmd`
   - Press Enter
   - Command Prompt opens in that folder

2. **Create Virtual Environment (Recommended):**
   ```cmd
   python -m venv venv
   ```
   Wait for it to finish (takes ~30 seconds)

3. **Activate Virtual Environment:**
   ```cmd
   venv\Scripts\activate
   ```
   You should see `(venv)` appear before your command prompt

4. **Install Required Packages:**
   ```cmd
   pip install -r requirements.txt
   ```
   This will take 2-3 minutes. You'll see packages being downloaded and installed.

### Mac/Linux Instructions:

1. **Open Terminal in Project Folder:**
   ```bash
   cd ~/Documents/real-estate-app
   ```

2. **Create Virtual Environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate Virtual Environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Install Packages:**
   ```bash
   pip install -r requirements.txt
   ```

---

## 🚀 Step 5: Run the Application

### Option A: Using the Starter Script (Easiest - Windows)

1. **Make sure you're in the project folder with Command Prompt open**
2. **Activate virtual environment if not already active:**
   ```cmd
   venv\Scripts\activate
   ```
3. **Run the starter:**
   ```cmd
   python start_app.py
   ```

This will:
- ✅ Check your Python version
- ✅ Verify all files exist
- ✅ Check Firebase credentials
- ✅ Install any missing dependencies
- ✅ Start backend automatically
- ✅ Start frontend automatically
- ✅ Open your browser to http://localhost:8501

**Note:** Two Command Prompt windows will open (one for backend, one for frontend). Keep both running!

### Option B: Manual Start (Windows - Two Command Prompts)

**Command Prompt 1 - Backend:**

1. Open first Command Prompt in project folder:
   - Navigate to folder in File Explorer
   - Type `cmd` in address bar, press Enter

2. Activate virtual environment:
   ```cmd
   venv\Scripts\activate
   ```

3. Start backend:
   ```cmd
   python main.py
   ```

You should see:
```
✅ Firebase initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**⚠️ Keep this window open!**

**Command Prompt 2 - Frontend:**

1. Open a **NEW** Command Prompt in same folder:
   - In File Explorer, type `cmd` in address bar again

2. Activate virtual environment:
   ```cmd
   venv\Scripts\activate
   ```

3. Start frontend:
   ```cmd
   streamlit run streamlit_app.py
   ```

You should see:
```
You can now view your Streamlit app in your browser.
Local URL: http://localhost:8501
```

Browser should automatically open to http://localhost:8501

**⚠️ Keep both windows open while using the app!**

### Option C: Manual Start (Mac/Linux - Two Terminals)

**Terminal 1 - Backend:**
```bash
cd ~/Documents/real-estate-app
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd ~/Documents/real-estate-app
source venv/bin/activate
streamlit run streamlit_app.py
```

---

## 🎨 Step 6: Add Sample Data (Optional)

With the backend running, open a **THIRD** Command Prompt/Terminal:

### Windows:
```cmd
cd C:\Users\YourName\Documents\real-estate-app
venv\Scripts\activate
python load_sample_data.py
```

### Mac/Linux:
```bash
cd ~/Documents/real-estate-app
source venv/bin/activate
python load_sample_data.py
```

This adds 10 sample properties (5 in Bangalore, 5 in Hyderabad) to your database.

You should see:
```
✅ [1/10] Added: Luxury Villa - Whitefield
✅ [2/10] Added: Cozy Apartment - Koramangala
...
🎉 Database populated!
```

---

## ✅ Step 7: Test the Application

### Register a User:
1. In your browser (http://localhost:8501)
2. Click **"Sign Up"** in the left sidebar
3. Fill in:
   - Username: `JohnDoe`
   - Email: `john@example.com`
   - Password: `password123` (at least 6 characters)
   - Confirm Password: `password123`
   - I am a: Choose **"Property Seeker"** or **"Property Manager"**
4. Click **"Sign Up"**
5. You should see: ✅ "Registration successful! Please login to continue."

### Login:
1. Click **"Login"** in sidebar
2. Enter:
   - Email: `john@example.com`
   - Password: `password123`
3. Click **"Login"**
4. You should see: ✅ "Welcome, JohnDoe!"

### As Property Seeker:
1. Click **"Search Properties"** in sidebar
2. Enter search criteria:
   - Location: `Bangalore`
   - Minimum Price: `0`
   - Maximum Price: `10000000`
   - Amenities: `gym, pool, parking`
3. Click **"🔎 Search"**
4. View results ranked by match percentage
5. Click **"📞 Contact Owner"** to see owner details

### As Property Manager:
1. Click **"My Properties"** in sidebar
2. Go to **"➕ Add New Property"** tab
3. Fill in property details:
   - Property Name: `Test Villa`
   - Location: `Bangalore`
   - Community: `Whitefield`
   - Price: `5000000`
   - Area: `2000 sq.ft`
   - Bedrooms: `3`
   - Bathrooms: `2`
   - Owner details (auto-filled)
   - Amenities: `gym, pool, parking`
4. Click **"Add Property"**
5. Go to **"📋 Manage Properties"** tab to see your listing

---

## 🔍 Step 8: Verify Everything Works

### Run Automated Tests (Windows):

1. Open a new Command Prompt in project folder
2. Activate virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
3. Run tests:
   ```cmd
   python test_api.py
   ```

You should see:
```
Real Estate API Test Suite
============================================================
✓ PASS - Health Check
✓ PASS - User Registration
✓ PASS - User Login
✓ PASS - Add Property
✓ PASS - Get Property
✓ PASS - Update Property
✓ PASS - Search Properties
✓ PASS - Delete Property

Pass Rate: 100%
🎉 All tests passed! Your API is working correctly.
```

### Mac/Linux:
```bash
source venv/bin/activate
python test_api.py
```

---

## 📊 Understanding the App Structure

### Backend (main.py):
- Runs on `http://localhost:8000`
- Handles database operations (Firebase)
- Provides API endpoints (login, register, search, CRUD)
- Manages authentication and security

### Frontend (streamlit_app.py):
- Runs on `http://localhost:8501`
- Beautiful user interface
- Communicates with backend via API calls
- Displays search results and forms

### Database (Firebase Firestore):
- Cloud-based NoSQL database
- Collections:
  - `users`: Stores user accounts
  - `properties`: Stores property listings
- Real-time synchronization

### Data Flow:
```
User clicks "Search" in Browser
         ↓
Streamlit sends request to Backend
         ↓
Backend queries Firebase Firestore
         ↓
Backend applies scoring algorithm
         ↓
Backend returns ranked results
         ↓
Streamlit displays results to User
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "python is not recognized" (Windows)
**Solution:**
- Python not added to PATH during installation
- Reinstall Python and CHECK ✅ "Add Python to PATH"
- OR use full path: `C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe`

### Issue 2: "Cannot connect to API"
**Solution:**
- Make sure backend is running (you should see it in Command Prompt)
- Check if something else is using port 8000
- Try restarting both backend and frontend

### Issue 3: "Firebase initialization error"
**Solution:**
- Verify `serviceAccountKey.json` is in the project root folder
- Open the file in Notepad - it should be valid JSON (starts with `{`)
- Make sure Firestore is enabled in Firebase Console
- Check the file isn't corrupted (re-download if needed)

### Issue 4: "Module not found" (e.g., "No module named 'fastapi'")
**Solution:**
```cmd
# Make sure virtual environment is activated
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Issue 5: "Permission denied" (Windows)
**Solution:**
- Run Command Prompt as Administrator:
  - Search for "cmd" in Start Menu
  - Right-click → "Run as administrator"

### Issue 6: Port already in use
**Solution (Windows):**
```cmd
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

**Or change port in config.py:**
```python
API_PORT = 8001  # Change from 8000
```

### Issue 7: Streamlit shows old cached data
**Solution:**
- Press `C` in the Streamlit browser window
- Or in Command Prompt:
```cmd
streamlit cache clear
```

### Issue 8: Virtual environment won't activate (Windows)
**Solution:**
- Enable script execution in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
- Then use: `venv\Scripts\Activate.ps1`

---

## 🎓 Next Steps

1. ✅ **Explore**: Try different search combinations
2. ✅ **Customize Colors**: Modify CSS in `streamlit_app.py`
3. ✅ **Adjust Scoring**: Change weights in `config.py`
4. ✅ **Add More Data**: Create more properties through the UI
5. ✅ **Learn the Code**: Read through `main.py` and `streamlit_app.py`
6. ✅ **Deploy Online**: Use Railway (backend) + Streamlit Cloud (frontend)

---

## 📞 Need Help?

### Quick Diagnostics (Windows):
```cmd
# Check Python version
python --version

# Check if packages are installed
pip list

# Test if backend is running
curl http://localhost:8000
# OR open http://localhost:8000 in browser

# Verify Firebase
python -c "import firebase_admin; print('Firebase OK')"
```

### Checklist:
- ✅ Is Command Prompt showing backend running (port 8000)?
- ✅ Is another Command Prompt showing frontend running (port 8501)?
- ✅ Is `serviceAccountKey.json` in the correct folder?
- ✅ Are both Command Prompt windows kept open?
- ✅ Is virtual environment activated (see `(venv)` in prompt)?

---

## 🎉 Success Checklist

- [ ] Python 3.8+ installed and added to PATH
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Service account key downloaded and renamed
- [ ] All files created in project folder
- [ ] Virtual environment created and activated
- [ ] Dependencies installed without errors
- [ ] Backend starts and shows "Uvicorn running on..."
- [ ] Frontend opens browser to localhost:8501
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can search properties and see results
- [ ] Can add properties (as property manager)
- [ ] Tests pass when running test_api.py

---

## 🚀 You're Ready!

Congratulations! Your Real Estate App is now running on your Windows/Mac/Linux machine!

### What you have now:
- ✅ Full-stack web application
- ✅ User authentication system
- ✅ Smart property search with scoring
- ✅ Database in the cloud (Firebase)
- ✅ Professional UI
- ✅ CRUD operations for properties

### To stop the application:
- Press `Ctrl + C` in both Command Prompt windows
- Or close the Command Prompt windows

### To start again later:
1. Open Command Prompt in project folder
2. `venv\Scripts\activate`
3. `python start_app.py`

**Happy coding! 🏠✨**

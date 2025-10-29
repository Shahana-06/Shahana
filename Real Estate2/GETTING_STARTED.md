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
2. Download Python 3.8 or higher
3. **Important**: Check "Add Python to PATH" during installation
4. Verify: Open Command Prompt and type: `python --version`

### Mac:
```bash
# Install using Homebrew
brew install python3
```

### Linux:
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

---

## 🔥 Step 2: Set Up Firebase

### 2.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add Project" or select existing `real-estate-recommendati-183a5`
3. Follow the setup wizard

### 2.2 Enable Firestore
1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (or production mode)
4. Select location closest to you
5. Click "Enable"

### 2.3 Download Credentials
1. Go to Project Settings (⚙️ icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. **Save the file as `serviceAccountKey.json`**
5. Keep this file SECRET - never share it!

---

## 📁 Step 3: Organize Your Files

Create a folder structure like this:

```
📁 real-estate-app/
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
├── 📄 GETTING_STARTED.md (this file)
├── 🔐 serviceAccountKey.json (download from Firebase)
└── 📄 .env (optional)
```

### Copy Files From Your Documents:
- Copy `main.py` content I provided
- Copy `streamlit_app.py` content I provided
- Copy other files as provided in artifacts

---

## 💻 Step 4: Install Dependencies

Open terminal/command prompt in your project folder:

### Create Virtual Environment (Recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Install Packages:
```bash
pip install -r requirements.txt
```

You should see installation progress for:
- fastapi
- uvicorn
- streamlit
- firebase-admin
- and others...

---

## 🚀 Step 5: Run the Application

### Option A: Using the Starter Script (Easiest)

```bash
python start_app.py
```

This will:
1. Check your Python version
2. Verify all files exist
3. Install missing dependencies
4. Start both backend and frontend automatically
5. Open your browser

### Option B: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
# Make sure you're in the project folder
cd real-estate-app

# Activate virtual environment if you created one
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Start backend
python main.py
```

You should see:
```
✅ Firebase initialized successfully
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
# Open a NEW terminal
cd real-estate-app

# Activate virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Start frontend
streamlit run streamlit_app.py
```

Browser should open automatically at `http://localhost:8501`

---

## 🎨 Step 6: Add Sample Data (Optional)

With the backend running, in a NEW terminal:

```bash
python load_sample_data.py
```

This adds 10 sample properties to your database.

---

## ✅ Step 7: Test the Application

### Register a User:
1. Click "Sign Up" in the sidebar
2. Fill in details
3. Choose role: "Property Seeker" or "Property Manager"
4. Click "Sign Up"

### Login:
1. Click "Login" in sidebar
2. Enter your email and password
3. Click "Login"

### As Property Seeker:
1. Go to "Search Properties"
2. Enter search criteria (location, price, amenities)
3. Click "Search"
4. View ranked results
5. Expand properties to see owner contact info

### As Property Manager:
1. Go to "My Properties"
2. Add a new property in "Add New Property" tab
3. View and edit your properties in "Manage Properties" tab

---

## 🔍 Step 8: Verify Everything Works

### Run Automated Tests:
```bash
python test_api.py
```

This tests all API endpoints. You should see:
```
✓ PASS - Health Check
✓ PASS - User Registration
✓ PASS - User Login
✓ PASS - Add Property
... and more ...

Pass Rate: 100%
🎉 All tests passed!
```

---

## 📊 Understanding the App Structure

### Backend (main.py):
- Runs on `http://localhost:8000`
- Handles database operations
- Provides API endpoints
- Manages authentication

### Frontend (streamlit_app.py):
- Runs on `http://localhost:8501`
- User interface
- Communicates with backend API
- Displays search results

### Database (Firestore):
- Stores users in `users` collection
- Stores properties in `properties` collection
- Real-time synchronization

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to API"
**Solution:**
- Make sure backend is running (`python main.py`)
- Check if port 8000 is not used by another application
- Try restarting both backend and frontend

### Issue 2: "Firebase initialization error"
**Solution:**
- Verify `serviceAccountKey.json` is in project root folder
- Check the file has valid JSON format
- Make sure Firestore is enabled in Firebase Console

### Issue 3: "Module not found"
**Solution:**
```bash
pip install -r requirements.txt --upgrade
```

### Issue 4: "Permission denied"
**Solution (Mac/Linux):**
```bash
chmod +x start_app.py
```

### Issue 5: Port already in use
**Solution:**
- Kill the process using the port
- Or change port in config.py:
```python
API_PORT = 8001  # Change from 8000 to 8001
```

---

## 🎓 Next Steps

1. ✅ **Customize**: Change colors in streamlit_app.py
2. ✅ **Add Data**: Add more properties through the UI
3. ✅ **Tweak Scoring**: Adjust weights in config.py
4. ✅ **Deploy**: Use Railway (backend) and Streamlit Cloud (frontend)
5. ✅ **Enhance**: Add images, maps, chat features

---

## 📞 Need Help?

### Quick Diagnostics:
```bash
# Check Python version
python --version

# Check if packages are installed
pip list

# Test API connection
curl http://localhost:8000

# Check Firebase connection
python -c "import firebase_admin; print('Firebase OK')"
```

### Check These Files:
- ✅ Is `serviceAccountKey.json` in the correct location?
- ✅ Are all .py files in the same folder?
- ✅ Is `requirements.txt` complete?

---

## 🎉 Success Checklist

- [ ] Python 3.8+ installed
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Service account key downloaded
- [ ] All files in project folder
- [ ] Dependencies installed
- [ ] Backend starts without errors
- [ ] Frontend opens in browser
- [ ] Can register and login
- [ ] Can search properties
- [ ] Can add properties (as manager)

---

## 🚀 You're Ready!

Congratulations! Your Real Estate App is running. Start exploring and customizing!

**Happy coding! 🏠✨**

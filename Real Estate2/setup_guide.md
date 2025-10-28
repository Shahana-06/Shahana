# Real Estate App - Complete Setup Guide

## 📋 Prerequisites

Before starting, make sure you have:
- Python 3.8 or higher installed
- pip (Python package manager)
- A Firebase account (free tier works)
- A code editor (VS Code recommended)

## 🔧 Step-by-Step Setup

### Step 1: Create Project Directory

```bash
# Create a new folder for your project
mkdir real-estate-app
cd real-estate-app
```

### Step 2: Set Up Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create or select your project**: `real-estate-recommendati-183a5`
3. **Enable Firestore Database**:
   - Click "Build" → "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode" (or production mode if you prefer)
   - Choose a location close to you
4. **Download Service Account Key**:
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate new private key"
   - Save the file as `serviceAccountKey.json` in your project folder

### Step 3: Create Project Files

Create the following files in your project directory with the content I provided:

```
real-estate-app/
│
├── main.py                    # FastAPI backend (provided)
├── streamlit_app.py           # Streamlit frontend (provided)
├── config.py                  # Configuration file (provided)
├── test_api.py                # API testing script (provided)
├── requirements.txt           # Dependencies (provided)
├── sample_properties.json     # Sample data (provided)
├── serviceAccountKey.json     # Firebase credentials (download from Firebase)
├── .env                       # Environment variables (create from .env.example)
└── README.md                  # Documentation
```

### Step 4: Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Configure Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_BASE_URL=http://localhost:8000

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
```

### Step 7: Verify Firebase Connection

Your `serviceAccountKey.json` should look like this (with your actual values):

```json
{
  "type": "service_account",
  "project_id": ".....",
  "private_key_id": ".....",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "......",
  "client_id": "...",
  "auth_uri": ".....",
  "token_uri": "....",
  "auth_provider_x509_cert_url": ".....",
  "client_x509_cert_url": "..."
}
```

## 🚀 Running the Application

### Option 1: Run Everything (Recommended for Testing)

Open **TWO separate terminal windows**:

#### Terminal 1 - Start Backend API:
```bash
# Make sure you're in the project directory
cd real-estate-app

# Activate virtual environment if not already active
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Run the FastAPI backend
python main.py
```

You should see:
```
✅ Firebase initialized successfully
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2 - Start Frontend:
```bash
# In a NEW terminal, navigate to project directory
cd real-estate-app

# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Run Streamlit frontend
streamlit run streamlit_app.py
```

The app will automatically open in your browser at `http://localhost:8501`

### Option 2: Test API First

Before running the full app, test if your API works:

```bash
# Make sure backend is running in another terminal
# Then run the test script
python test_api.py
```

You should see test results for all endpoints.

## 📊 Adding Sample Data (Optional)

To populate your database with sample properties:

1. **Create a script** `load_sample_data.py`:

```python
import requests
import json

API_URL = "http://localhost:8000"

with open('sample_properties.json', 'r') as f:
    data = json.load(f)

for prop in data['sample_properties']:
    response = requests.post(f"{API_URL}/properties", json=prop)
    if response.status_code == 200:
        print(f"✅ Added: {prop['name']}")
    else:
        print(f"❌ Failed: {prop['name']}")
```

2. **Run it**:
```bash
python load_sample_data.py
```

## 🎯 Using the Application

### For Property Seekers:

1. **Sign Up**: Click "Sign Up" → Choose "Property Seeker"
2. **Login**: Use your credentials
3. **Search**: Use filters (location, price, amenities) to find properties
4. **View Results**: Properties are ranked by match score
5. **Contact Owner**: Expand property card to see owner details

### For Property Managers:

1. **Sign Up**: Click "Sign Up" → Choose "Property Manager"
2. **Login**: Use your credentials
3. **Add Properties**: Go to "My Properties" → "Add New Property"
4. **Manage**: Edit or delete your listings
5. **Search**: You can also search all properties

## 🔍 Troubleshooting

### Problem: "Cannot connect to API"
**Solution**: Make sure the FastAPI backend is running on port 8000

### Problem: "Firebase initialization error"
**Solution**: 
- Check `serviceAccountKey.json` exists in project folder
- Verify the JSON is valid (no extra commas, proper formatting)
- Ensure Firebase project has Firestore enabled

### Problem: "Module not found"
**Solution**: Install missing packages:
```bash
pip install -r requirements.txt
```

### Problem: "Port already in use"
**Solution**: 
- Kill the process using the port OR
- Change port in `.env` file:
```env
API_PORT=8001
API_BASE_URL=http://localhost:8001
```

### Problem: Streamlit shows old cached data
**Solution**: Clear cache by pressing `C` in the Streamlit app, or:
```bash
streamlit cache clear
```

## 📁 Project Structure Explained

```
real-estate-app/
│
├── main.py                    # FastAPI backend server
│   ├── User authentication (register/login)
│   ├── Property CRUD operations
│   ├── Search with scoring algorithm
│   └── API endpoints
│
├── streamlit_app.py           # Frontend web interface
│   ├── User interface pages
│   ├── Search functionality
│   ├── Property management
│   └── API communication
│
├── config.py                  # Centralized configuration
│   ├── API settings
│   ├── Firebase settings
│   └── Scoring weights
│
├── test_api.py                # Automated API testing
│
├── requirements.txt           # Python dependencies
│
└── serviceAccountKey.json     # Firebase credentials (KEEP SECRET!)
```

## 🔒 Security Notes

- **Never commit** `serviceAccountKey.json` to Git
- Add to `.gitignore`:
```
serviceAccountKey.json
.env
venv/
__pycache__/
*.pyc
```

## 🌐 Deploying to Production

### Backend (FastAPI) - Deploy to:
- **Railway.app** (recommended, free tier)
- **Heroku**
- **Google Cloud Run**
- **AWS Lambda**

### Frontend (Streamlit) - Deploy to:
- **Streamlit Cloud** (recommended, free)
- **Heroku**
- **Railway.app**

### Update `.env` for production:
```env
API_BASE_URL=https://your-backend-url.com
```

## 🎓 Next Steps

1. Test locally first
2. Add more sample properties
3. Customize the scoring algorithm weights in `config.py`
4. Add more features (images, maps, etc.)
5. Deploy to production

## 📞 Support

If you encounter issues:
1. Check all files are in correct locations
2. Verify Firebase credentials
3. Ensure both terminals are running
4. Check console for error messages

Good luck with your Real Estate App! 🏠✨

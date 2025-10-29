"""
All-in-one startup script for Real Estate Application
This script helps you start both backend and frontend easily
"""
import subprocess
import sys
import os
import time
import platform

def print_banner():
    """Print welcome banner"""
    print("\n" + "="*60)
    print("🏠 Real Estate Finder - Quick Start")
    print("="*60 + "\n")

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        sys.exit(1)
    print(f"✅ Python version: {version.major}.{version.minor}.{version.micro}")

def check_files():
    """Check if required files exist"""
    required_files = [
        "main.py",
        "streamlit_app.py",
        "config.py",
        "requirements.txt"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
        else:
            print(f"✅ Found: {file}")
    
    if missing_files:
        print(f"\n❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        sys.exit(1)
    
    # Check Firebase credentials
    if not os.path.exists("serviceAccountKey.json"):
        print("\n⚠️  Warning: serviceAccountKey.json not found")
        print("   You need to download this from Firebase Console")
        print("   The app will fail to start without it")
        response = input("\n   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    else:
        print("✅ Found: serviceAccountKey.json")

def check_dependencies():
    """Check if dependencies are installed"""
    print("\n📦 Checking dependencies...")
    try:
        import fastapi
        import streamlit
        import firebase_admin
        print("✅ All dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("\n   Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed")
        return True

def start_backend():
    """Start FastAPI backend"""
    print("\n🚀 Starting Backend API...")
    if platform.system() == "Windows":
        return subprocess.Popen([sys.executable, "main.py"], 
                               creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        return subprocess.Popen([sys.executable, "main.py"])

def start_frontend():
    """Start Streamlit frontend"""
    print("🚀 Starting Frontend...")
    time.sleep(3)  # Wait for backend to start
    if platform.system() == "Windows":
        return subprocess.Popen(["streamlit", "run", "streamlit_app.py"],
                               creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        return subprocess.Popen(["streamlit", "run", "streamlit_app.py"])

def main():
    """Main function"""
    print_banner()
    
    print("🔍 Pre-flight checks...\n")
    check_python_version()
    check_files()
    check_dependencies()
    
    print("\n" + "="*60)
    print("Starting Application...")
    print("="*60)
    
    try:
        # Start backend
        backend_process = start_backend()
        print("✅ Backend started on http://localhost:8000")
        
        # Start frontend
        frontend_process = start_frontend()
        print("✅ Frontend starting on http://localhost:8501")
        
        print("\n" + "="*60)
        print("🎉 Application is running!")
        print("="*60)
        print("\nBackend API: http://localhost:8000")
        print("Frontend UI: http://localhost:8501")
        print("API Docs: http://localhost:8000/docs")
        print("\n💡 Tip: The browser should open automatically")
        print("   If not, manually visit http://localhost:8501")
        print("\n⚠️  Press Ctrl+C to stop both servers\n")
        
        # Keep script running
        try:
            backend_process.wait()
            frontend_process.wait()
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down...")
            backend_process.terminate()
            frontend_process.terminate()
            print("✅ Application stopped")
    
    except Exception as e:
        print(f"\n❌ Error starting application: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Startup cancelled")
        sys.exit(0)

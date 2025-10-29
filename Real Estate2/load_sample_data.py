"""
Script to load sample properties into the database
Run this after starting your backend API
"""
import requests
import json
import sys
import time

API_URL = "http://localhost:8000"

# Sample properties data
sample_properties = [
    {
        "name": "Luxury Villa - Whitefield",
        "location": "Bangalore",
        "community": "Whitefield",
        "price": 8500000,
        "area": "3000 sq.ft",
        "bedrooms": 4,
        "bathrooms": 3,
        "owner_name": "Rajesh Kumar",
        "owner_phone": "+91-9876543210",
        "owner_email": "rajesh.kumar@email.com",
        "amenities": ["gym", "pool", "parking", "garden", "security", "club_house"],
        "description": "Luxurious 4BHK villa in prime Whitefield location with modern amenities and spacious interiors."
    },
    {
        "name": "Cozy Apartment - Koramangala",
        "location": "Bangalore",
        "community": "Koramangala",
        "price": 4500000,
        "area": "1200 sq.ft",
        "bedrooms": 2,
        "bathrooms": 2,
        "owner_name": "Priya Sharma",
        "owner_phone": "+91-9876543211",
        "owner_email": "priya.sharma@email.com",
        "amenities": ["parking", "security", "power_backup", "elevator"],
        "description": "Well-maintained 2BHK apartment in the heart of Koramangala, close to restaurants and shopping."
    },
    {
        "name": "Modern Penthouse - Indiranagar",
        "location": "Bangalore",
        "community": "Indiranagar",
        "price": 12000000,
        "area": "2500 sq.ft",
        "bedrooms": 3,
        "bathrooms": 3,
        "owner_name": "Amit Patel",
        "owner_phone": "+91-9876543212",
        "owner_email": "amit.patel@email.com",
        "amenities": ["gym", "pool", "parking", "rooftop", "security", "intercom"],
        "description": "Stunning penthouse with panoramic city views, premium fittings, and rooftop access."
    },
    {
        "name": "Budget Studio - Electronic City",
        "location": "Bangalore",
        "community": "Electronic City",
        "price": 2500000,
        "area": "600 sq.ft",
        "bedrooms": 1,
        "bathrooms": 1,
        "owner_name": "Sneha Reddy",
        "owner_phone": "+91-9876543213",
        "owner_email": "sneha.reddy@email.com",
        "amenities": ["parking", "security"],
        "description": "Affordable studio apartment perfect for young professionals working in Electronic City."
    },
    {
        "name": "Family Home - HSR Layout",
        "location": "Bangalore",
        "community": "HSR Layout",
        "price": 6500000,
        "area": "1800 sq.ft",
        "bedrooms": 3,
        "bathrooms": 2,
        "owner_name": "Karthik Iyer",
        "owner_phone": "+91-9876543214",
        "owner_email": "karthik.iyer@email.com",
        "amenities": ["parking", "garden", "security", "playground", "club_house"],
        "description": "Spacious family home in well-established HSR Layout with parks and schools nearby."
    },
    {
        "name": "Luxury Condo - Banjara Hills",
        "location": "Hyderabad",
        "community": "Banjara Hills",
        "price": 15000000,
        "area": "3500 sq.ft",
        "bedrooms": 4,
        "bathrooms": 4,
        "owner_name": "Vikram Singh",
        "owner_phone": "+91-9876543215",
        "owner_email": "vikram.singh@email.com",
        "amenities": ["gym", "pool", "parking", "spa", "security", "concierge", "home_theater"],
        "description": "Ultra-luxurious condominium in prestigious Banjara Hills with world-class amenities."
    },
    {
        "name": "Smart Apartment - Gachibowli",
        "location": "Hyderabad",
        "community": "Gachibowli",
        "price": 5500000,
        "area": "1400 sq.ft",
        "bedrooms": 2,
        "bathrooms": 2,
        "owner_name": "Divya Nair",
        "owner_phone": "+91-9876543216",
        "owner_email": "divya.nair@email.com",
        "amenities": ["gym", "parking", "security", "smart_home", "power_backup"],
        "description": "Modern smart home with automated features near IT hubs and shopping centers."
    },
    {
        "name": "Villa with Pool - Jubilee Hills",
        "location": "Hyderabad",
        "community": "Jubilee Hills",
        "price": 18000000,
        "area": "4000 sq.ft",
        "bedrooms": 5,
        "bathrooms": 4,
        "owner_name": "Arjun Malhotra",
        "owner_phone": "+91-9876543217",
        "owner_email": "arjun.malhotra@email.com",
        "amenities": ["pool", "garden", "parking", "security", "home_theater", "gym", "guest_house"],
        "description": "Magnificent villa with private pool and landscaped gardens in elite Jubilee Hills."
    },
    {
        "name": "Downtown Apartment - Hitech City",
        "location": "Hyderabad",
        "community": "Hitech City",
        "price": 4800000,
        "area": "1100 sq.ft",
        "bedrooms": 2,
        "bathrooms": 2,
        "owner_name": "Meera Shah",
        "owner_phone": "+91-9876543218",
        "owner_email": "meera.shah@email.com",
        "amenities": ["gym", "parking", "security", "elevator", "intercom"],
        "description": "Convenient apartment in the heart of Hitech City, walking distance to offices."
    },
    {
        "name": "Eco-Friendly Home - Kondapur",
        "location": "Hyderabad",
        "community": "Kondapur",
        "price": 7200000,
        "area": "2000 sq.ft",
        "bedrooms": 3,
        "bathrooms": 3,
        "owner_name": "Ravi Kumar",
        "owner_phone": "+91-9876543219",
        "owner_email": "ravi.kumar@email.com",
        "amenities": ["solar_panels", "rainwater_harvesting", "garden", "parking", "security"],
        "description": "Sustainable home with solar panels and eco-friendly features in peaceful Kondapur."
    }
]

def check_api_health():
    """Check if API is running"""
    try:
        response = requests.get(f"{API_URL}/")
        return response.status_code == 200
    except:
        return False

def load_properties():
    """Load sample properties into database"""
    print("=" * 60)
    print("Loading Sample Properties into Database")
    print("=" * 60)
    
    # Check API health
    print("\n1. Checking API connection...")
    if not check_api_health():
        print("❌ API is not running!")
        print("Please start the backend first: python main.py")
        sys.exit(1)
    print("✅ API is running")
    
    # Load properties
    print(f"\n2. Loading {len(sample_properties)} properties...")
    success_count = 0
    failed_count = 0
    
    for idx, prop in enumerate(sample_properties, 1):
        try:
            response = requests.post(f"{API_URL}/properties", json=prop)
            if response.status_code == 200:
                print(f"✅ [{idx}/{len(sample_properties)}] Added: {prop['name']}")
                success_count += 1
            else:
                print(f"❌ [{idx}/{len(sample_properties)}] Failed: {prop['name']} - {response.json().get('detail', 'Unknown error')}")
                failed_count += 1
        except Exception as e:
            print(f"❌ [{idx}/{len(sample_properties)}] Error: {prop['name']} - {str(e)}")
            failed_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"✅ Successfully loaded: {success_count}")
    print(f"❌ Failed to load: {failed_count}")
    print(f"📊 Total: {len(sample_properties)}")
    print("=" * 60)
    
    if success_count > 0:
        print("\n🎉 Database populated! You can now use the application.")
        print("Run: streamlit run streamlit_app.py")
    else:
        print("\n⚠️ No properties were loaded. Please check the error messages above.")

if __name__ == "__main__":
    try:
        load_properties()
    except KeyboardInterrupt:
        print("\n\n⚠️ Operation cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")

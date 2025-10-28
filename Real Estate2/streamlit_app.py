import streamlit as st
import requests
import json

st.set_page_config(page_title="Real Estate Finder", layout="wide")

# --- API Configuration ---
API_BASE_URL = "http://localhost:8000"  # Change this to your deployed API URL

# --- Custom CSS ---
st.markdown("""
    <style>
        body {
            background-color: #BAC095;
            color: #3D4127;
        }
        .stApp {
            background-color: #BAC095;
        }
        .property-card {
            background-color: #D4DE95;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 4px 6px rgba(61,65,39,0.3);
        }
        .score-badge {
            background-color: #636B2F;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
        }
        .contact-card {
            background-color: #636B2F;
            color: white;
            border-radius: 10px;
            padding: 15px;
            margin-top: 10px;
        }
        .stTextInput > div > div > input {
            background-color: #D4DE95;
            color: #3D4127;
        }
        .stSelectbox > div > div {
            background-color: #D4DE95;
        }
    </style>
""", unsafe_allow_html=True)

# --- Session State Initialization ---
if "logged_in" not in st.session_state:
    st.session_state["logged_in"] = False
if "current_user" not in st.session_state:
    st.session_state["current_user"] = None
if "user_role" not in st.session_state:
    st.session_state["user_role"] = None
if "user_email" not in st.session_state:
    st.session_state["user_email"] = None

# --- Helper Functions ---
def login_user(email, password):
    """Login user via API"""
    try:
        response = requests.post(f"{API_BASE_URL}/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            return True, data
        else:
            return False, response.json().get("detail", "Login failed")
    except Exception as e:
        return False, f"Connection error: {str(e)}"

def register_user(email, password, username, role):
    """Register new user via API"""
    try:
        response = requests.post(f"{API_BASE_URL}/register", json={
            "email": email,
            "password": password,
            "username": username,
            "role": role
        })
        if response.status_code == 200:
            return True, "Registration successful!"
        else:
            return False, response.json().get("detail", "Registration failed")
    except Exception as e:
        return False, f"Connection error: {str(e)}"

def search_properties(price_min=None, price_max=None, amenities=None, location=None, community=None):
    """Search properties via API"""
    try:
        params = {}
        if price_min is not None:
            params["price_min"] = price_min
        if price_max is not None:
            params["price_max"] = price_max
        if amenities:
            params["amenities"] = amenities
        if location:
            params["location"] = location
        if community:
            params["community"] = community
        
        response = requests.get(f"{API_BASE_URL}/search", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return {"message": "Search failed", "top_matches": []}
    except Exception as e:
        st.error(f"Connection error: {str(e)}")
        return {"message": "Connection error", "top_matches": []}

def add_property(property_data):
    """Add property via API"""
    try:
        response = requests.post(f"{API_BASE_URL}/properties", json=property_data)
        if response.status_code == 200:
            return True, "Property added successfully!"
        else:
            return False, response.json().get("detail", "Failed to add property")
    except Exception as e:
        return False, f"Connection error: {str(e)}"

def update_property(property_id, property_data):
    """Update property via API"""
    try:
        response = requests.put(f"{API_BASE_URL}/properties/{property_id}", json=property_data)
        if response.status_code == 200:
            return True, "Property updated successfully!"
        else:
            return False, response.json().get("detail", "Failed to update property")
    except Exception as e:
        return False, f"Connection error: {str(e)}"

def delete_property(property_id):
    """Delete property via API"""
    try:
        response = requests.delete(f"{API_BASE_URL}/properties/{property_id}")
        if response.status_code == 200:
            return True, "Property deleted successfully!"
        else:
            return False, response.json().get("detail", "Failed to delete property")
    except Exception as e:
        return False, f"Connection error: {str(e)}"

# --- Sidebar Navigation ---
st.sidebar.title("🏠 Real Estate Finder")

if not st.session_state["logged_in"]:
    page = st.sidebar.radio("Go to", ["Home", "Login", "Sign Up"])
else:
    st.sidebar.write(f"👤 **{st.session_state['current_user']}**")
    st.sidebar.write(f"📧 {st.session_state['user_email']}")
    st.sidebar.write(f"🎭 Role: **{st.session_state['user_role']}**")
    st.sidebar.markdown("---")
    
    if st.session_state["user_role"] == "property_manager":
        page = st.sidebar.radio("Go to", ["Search Properties", "Manage Properties"])
    else:
        page = st.sidebar.radio("Go to", ["Search Properties"])
    
    if st.sidebar.button("🚪 Logout"):
        st.session_state["logged_in"] = False
        st.session_state["current_user"] = None
        st.session_state["user_role"] = None
        st.session_state["user_email"] = None
        st.rerun()

# --- Home Page ---
if page == "Home":
    st.title("🏡 Real Estate Finder")
    st.subheader("Find Your Dream Property or Manage Your Listings")
    st.image("https://images.unsplash.com/photo-1560518883-ce09059eeffa", use_container_width=True)
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        ### 🔍 For Property Seekers
        - Search properties by location, price, and amenities
        - View detailed property information
        - Contact property owners directly
        - Get smart recommendations based on your preferences
        """)
    
    with col2:
        st.markdown("""
        ### 🏢 For Property Managers
        - List and manage your properties
        - Update property details anytime
        - Receive inquiries from potential buyers
        - Track property performance
        """)

# --- Sign Up Page ---
elif page == "Sign Up":
    st.title("📝 Create an Account")
    
    with st.form("signup_form"):
        username = st.text_input("Username")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        confirm_password = st.text_input("Confirm Password", type="password")
        role = st.selectbox("I am a:", ["Property Seeker", "Property Manager"])
        
        signup_btn = st.form_submit_button("Sign Up")
        
        if signup_btn:
            if not username or not email or not password or not confirm_password:
                st.error("⚠️ Please fill out all fields.")
            elif password != confirm_password:
                st.error("⚠️ Passwords do not match.")
            elif len(password) < 6:
                st.error("⚠️ Password must be at least 6 characters long.")
            else:
                role_value = "property_manager" if role == "Property Manager" else "property_seeker"
                success, message = register_user(email, password, username, role_value)
                if success:
                    st.success(f"✅ {message} Please login to continue.")
                else:
                    st.error(f"❌ {message}")

# --- Login Page ---
elif page == "Login":
    st.title("🔐 Login")
    
    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        login_btn = st.form_submit_button("Login")
        
        if login_btn:
            if not email or not password:
                st.error("⚠️ Please fill in all fields.")
            else:
                success, data = login_user(email, password)
                if success:
                    st.session_state["logged_in"] = True
                    st.session_state["current_user"] = data["username"]
                    st.session_state["user_role"] = data["role"]
                    st.session_state["user_email"] = email
                    st.success(f"✅ Welcome, {data['username']}!")
                    st.rerun()
                else:
                    st.error(f"❌ {data}")

# --- Search Properties Page ---
elif page == "Search Properties":
    st.title("🔍 Search Properties")
    
    with st.form("search_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            location = st.text_input("Location (e.g., Bangalore, Hyderabad)")
            community = st.text_input("Community/Area")
            price_min = st.number_input("Minimum Price (₹)", min_value=0, value=0, step=100000)
        
        with col2:
            price_max = st.number_input("Maximum Price (₹)", min_value=0, value=10000000, step=100000)
            amenities_input = st.text_input("Amenities (comma-separated, e.g., gym, pool, parking)")
        
        search_btn = st.form_submit_button("🔎 Search")
    
    if search_btn:
        amenities_list = [a.strip() for a in amenities_input.split(",")] if amenities_input else None
        
        with st.spinner("Searching properties..."):
            results = search_properties(
                price_min=price_min if price_min > 0 else None,
                price_max=price_max if price_max > 0 else None,
                amenities=amenities_list,
                location=location if location else None,
                community=community if community else None
            )
        
        if results.get("top_matches"):
            st.success(f"Found {len(results['top_matches'])} properties (showing top matches)")
            st.info(f"Your search score: {results.get('user_score', 0)}")
            
            for prop in results["top_matches"]:
                score = prop.get("score", 0)
                score_percentage = int(score * 100)
                
                st.markdown(f"""
                <div class='property-card'>
                    <div style='display: flex; justify-content: space-between; align-items: center;'>
                        <h3>🏠 {prop.get('name', 'Unnamed Property')}</h3>
                        <span class='score-badge'>{score_percentage}% Match</span>
                    </div>
                    <p><b>📍 Location:</b> {prop.get('location', 'N/A')}</p>
                    <p><b>🏘️ Community:</b> {prop.get('community', 'N/A')}</p>
                    <p><b>💰 Price:</b> ₹{prop.get('price', 0):,}</p>
                    <p><b>📐 Area:</b> {prop.get('area', 'N/A')}</p>
                    <p><b>🛏️ Bedrooms:</b> {prop.get('bedrooms', 'N/A')}</p>
                    <p><b>🚿 Bathrooms:</b> {prop.get('bathrooms', 'N/A')}</p>
                    <p><b>✨ Amenities:</b> {', '.join(prop.get('amenities', [])) if prop.get('amenities') else 'None listed'}</p>
                </div>
                """, unsafe_allow_html=True)
                
                with st.expander("📞 Contact Owner"):
                    st.markdown(f"""
                    <div class='contact-card'>
                        <b>👤 Name:</b> {prop.get('owner_name', 'N/A')}<br>
                        <b>📱 Phone:</b> {prop.get('owner_phone', 'N/A')}<br>
                        <b>📧 Email:</b> {prop.get('owner_email', 'N/A')}
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.warning("No properties found matching your criteria. Try adjusting your search parameters.")

# --- Manage Properties Page (Property Manager Only) ---
elif page == "Manage Properties":
    st.title("🏢 Manage Your Properties")
    
    tab1, tab2 = st.tabs(["➕ Add New Property", "✏️ Edit Properties"])
    
    with tab1:
        st.subheader("Add New Property")
        with st.form("add_property_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                name = st.text_input("Property Name*")
                location = st.text_input("Location*")
                community = st.text_input("Community/Area*")
                price = st.number_input("Price (₹)*", min_value=0, step=100000)
                area = st.text_input("Area (e.g., 1200 sq.ft)*")
            
            with col2:
                bedrooms = st.number_input("Bedrooms*", min_value=1, max_value=10, value=2)
                bathrooms = st.number_input("Bathrooms*", min_value=1, max_value=10, value=2)
                owner_name = st.text_input("Owner Name*")
                owner_phone = st.text_input("Owner Phone*")
                owner_email = st.text_input("Owner Email*")
            
            amenities_input = st.text_input("Amenities (comma-separated, e.g., gym, pool, parking)")
            description = st.text_area("Property Description")
            
            submit_btn = st.form_submit_button("Add Property")
            
            if submit_btn:
                if not all([name, location, community, owner_name, owner_phone, owner_email]):
                    st.error("⚠️ Please fill in all required fields (marked with *).")
                else:
                    amenities_list = [a.strip() for a in amenities_input.split(",")] if amenities_input else []
                    
                    property_data = {
                        "name": name,
                        "location": location,
                        "community": community,
                        "price": price,
                        "area": area,
                        "bedrooms": bedrooms,
                        "bathrooms": bathrooms,
                        "owner_name": owner_name,
                        "owner_phone": owner_phone,
                        "owner_email": owner_email,
                        "amenities": amenities_list,
                        "description": description
                    }
                    
                    success, message = add_property(property_data)
                    if success:
                        st.success(f"✅ {message}")
                    else:
                        st.error(f"❌ {message}")
    
    with tab2:
        st.subheader("Your Properties")
        
        # Get all properties for this manager
        results = search_properties()
        
        if results.get("top_matches"):
            # Filter properties by current user's email
            user_properties = [p for p in results["top_matches"] 
                             if p.get("owner_email") == st.session_state["user_email"]]
            
            if user_properties:
                for prop in user_properties:
                    with st.expander(f"🏠 {prop.get('name', 'Unnamed')} - {prop.get('location', '')}"):
                        st.write(f"**Price:** ₹{prop.get('price', 0):,}")
                        st.write(f"**Area:** {prop.get('area', 'N/A')}")
                        st.write(f"**Bedrooms:** {prop.get('bedrooms', 'N/A')}")
                        st.write(f"**Bathrooms:** {prop.get('bathrooms', 'N/A')}")
                        st.write(f"**Community:** {prop.get('community', 'N/A')}")
                        
                        col1, col2 = st.columns([3, 1])
                        
                        with col1:
                            if st.button(f"✏️ Edit", key=f"edit_{prop['id']}"):
                                st.session_state[f"editing_{prop['id']}"] = True
                        
                        with col2:
                            if st.button(f"🗑️ Delete", key=f"delete_{prop['id']}"):
                                success, message = delete_property(prop['id'])
                                if success:
                                    st.success(message)
                                    st.rerun()
                                else:
                                    st.error(message)
                        
                        # Edit form
                        if st.session_state.get(f"editing_{prop['id']}", False):
                            with st.form(f"edit_form_{prop['id']}"):
                                new_name = st.text_input("Name", value=prop.get('name', ''))
                                new_price = st.number_input("Price", value=prop.get('price', 0), step=100000)
                                new_area = st.text_input("Area", value=prop.get('area', ''))
                                new_bedrooms = st.number_input("Bedrooms", value=prop.get('bedrooms', 2), min_value=1, max_value=10)
                                new_bathrooms = st.number_input("Bathrooms", value=prop.get('bathrooms', 2), min_value=1, max_value=10)
                                new_amenities = st.text_input("Amenities", value=', '.join(prop.get('amenities', [])))
                                
                                update_btn = st.form_submit_button("Update Property")
                                
                                if update_btn:
                                    updated_data = {
                                        "name": new_name,
                                        "price": new_price,
                                        "area": new_area,
                                        "bedrooms": new_bedrooms,
                                        "bathrooms": new_bathrooms,
                                        "amenities": [a.strip() for a in new_amenities.split(",")] if new_amenities else []
                                    }
                                    
                                    success, message = update_property(prop['id'], updated_data)
                                    if success:
                                        st.success(message)
                                        st.session_state[f"editing_{prop['id']}"] = False
                                        st.rerun()
                                    else:
                                        st.error(message)
            else:
                st.info("You haven't added any properties yet. Use the 'Add New Property' tab to get started!")
        else:
            st.info("No properties in the system yet.")

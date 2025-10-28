import streamlit as st
import requests
import json
from config import config

st.set_page_config(page_title=config.APP_NAME, layout="wide", page_icon="🏠")

# --- Custom CSS ---
st.markdown("""
    <style>
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
        div[data-testid="stTextInput"] > div > div > input,
        div[data-testid="stNumberInput"] > div > div > input {
            background-color: #D4DE95;
            color: #3D4127;
        }
        div[data-testid="stSelectbox"] > div > div {
            background-color: #D4DE95;
        }
        .success-message {
            background-color: #90EE90;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
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
if "user_id" not in st.session_state:
    st.session_state["user_id"] = None

# --- API Helper Functions ---
def api_request(method, endpoint, **kwargs):
    """Generic API request handler"""
    try:
        url = f"{config.API_BASE_URL}{endpoint}"
        response = requests.request(method, url, **kwargs)
        return response
    except requests.exceptions.ConnectionError:
        st.error("❌ Cannot connect to API. Make sure the backend is running!")
        return None
    except Exception as e:
        st.error(f"❌ Error: {str(e)}")
        return None

def login_user(email, password):
    """Login user via API"""
    response = api_request("POST", "/login", json={"email": email, "password": password})
    if response and response.status_code == 200:
        return True, response.json()
    elif response:
        return False, response.json().get("detail", "Login failed")
    return False, "Connection error"

def register_user(email, password, username, role):
    """Register new user via API"""
    response = api_request("POST", "/register", json={
        "email": email,
        "password": password,
        "username": username,
        "role": role
    })
    if response and response.status_code == 200:
        return True, "Registration successful!"
    elif response:
        return False, response.json().get("detail", "Registration failed")
    return False, "Connection error"

def search_properties(price_min=None, price_max=None, amenities=None, location=None, community=None):
    """Search properties via API"""
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
    
    response = api_request("GET", "/search", params=params)
    if response and response.status_code == 200:
        return response.json()
    return {"message": "Search failed", "top_matches": []}

def add_property(property_data):
    """Add property via API"""
    response = api_request("POST", "/properties", json=property_data)
    if response and response.status_code == 200:
        return True, "Property added successfully!"
    elif response:
        return False, response.json().get("detail", "Failed to add property")
    return False, "Connection error"

def update_property(property_id, property_data):
    """Update property via API"""
    response = api_request("PUT", f"/properties/{property_id}", json=property_data)
    if response and response.status_code == 200:
        return True, "Property updated successfully!"
    elif response:
        return False, response.json().get("detail", "Failed to update property")
    return False, "Connection error"

def delete_property(property_id):
    """Delete property via API"""
    response = api_request("DELETE", f"/properties/{property_id}")
    if response and response.status_code == 200:
        return True, "Property deleted successfully!"
    elif response:
        return False, response.json().get("detail", "Failed to delete property")
    return False, "Connection error"

def get_owner_properties(owner_email):
    """Get properties by owner email"""
    response = api_request("GET", f"/properties/owner/{owner_email}")
    if response and response.status_code == 200:
        return response.json().get("properties", [])
    return []

# --- Sidebar Navigation ---
st.sidebar.title("🏠 " + config.APP_NAME)

if not st.session_state["logged_in"]:
    page = st.sidebar.radio("Navigation", ["Home", "Login", "Sign Up"])
else:
    st.sidebar.success(f"✅ Logged in as **{st.session_state['current_user']}**")
    st.sidebar.info(f"📧 {st.session_state['user_email']}")
    st.sidebar.info(f"🎭 Role: **{st.session_state['user_role'].replace('_', ' ').title()}**")
    st.sidebar.markdown("---")
    
    if st.session_state["user_role"] == config.ROLE_PROPERTY_MANAGER:
        page = st.sidebar.radio("Navigation", ["Search Properties", "My Properties"])
    else:
        page = st.sidebar.radio("Navigation", ["Search Properties"])
    
    if st.sidebar.button("🚪 Logout", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

# --- Home Page ---
if page == "Home":
    st.title("🏡 " + config.APP_NAME)
    st.subheader("Find Your Dream Property or Manage Your Listings")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        ### 🔍 For Property Seekers
        - Search properties by location, price, and amenities
        - View detailed property information
        - Contact property owners directly
        - Get smart recommendations based on preferences
        """)
        st.image("https://images.unsplash.com/photo-1560518883-ce09059eeffa", use_container_width=True)
    
    with col2:
        st.markdown("""
        ### 🏢 For Property Managers
        - List and manage your properties
        - Update property details anytime
        - Receive inquiries from buyers
        - Track property performance
        """)
        st.image("https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf", use_container_width=True)

# --- Sign Up Page ---
elif page == "Sign Up":
    st.title("📝 Create an Account")
    
    with st.form("signup_form"):
        username = st.text_input("Username *")
        email = st.text_input("Email *")
        password = st.text_input("Password *", type="password")
        confirm_password = st.text_input("Confirm Password *", type="password")
        role = st.selectbox("I am a:", ["Property Seeker", "Property Manager"])
        
        signup_btn = st.form_submit_button("Sign Up", use_container_width=True)
        
        if signup_btn:
            if not username or not email or not password or not confirm_password:
                st.error("⚠️ Please fill out all fields.")
            elif password != confirm_password:
                st.error("⚠️ Passwords do not match.")
            elif len(password) < config.PASSWORD_MIN_LENGTH:
                st.error(f"⚠️ Password must be at least {config.PASSWORD_MIN_LENGTH} characters long.")
            else:
                role_value = config.ROLE_PROPERTY_MANAGER if role == "Property Manager" else config.ROLE_PROPERTY_SEEKER
                with st.spinner("Creating account..."):
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
        login_btn = st.form_submit_button("Login", use_container_width=True)
        
        if login_btn:
            if not email or not password:
                st.error("⚠️ Please fill in all fields.")
            else:
                with st.spinner("Logging in..."):
                    success, data = login_user(email, password)
                if success:
                    st.session_state["logged_in"] = True
                    st.session_state["user_id"] = data.get("user_id")
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
        
        search_btn = st.form_submit_button("🔎 Search", use_container_width=True)
    
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
            st.success(f"✅ Found {len(results['top_matches'])} properties")
            st.info(f"📊 Your search completeness score: {int(results.get('user_score', 0) * 100)}%")
            
            for idx, prop in enumerate(results["top_matches"], 1):
                score = prop.get("score", 0)
                score_percentage = int(score * 100)
                
                with st.container():
                    st.markdown(f"""
                    <div class='property-card'>
                        <div style='display: flex; justify-content: space-between; align-items: center;'>
                            <h3>#{idx}. 🏠 {prop.get('name', 'Unnamed Property')}</h3>
                            <span class='score-badge'>{score_percentage}% Match</span>
                        </div>
                        <p><b>📍 Location:</b> {prop.get('location', 'N/A')} | <b>🏘️ Community:</b> {prop.get('community', 'N/A')}</p>
                        <p><b>💰 Price:</b> ₹{prop.get('price', 0):,} | <b>📐 Area:</b> {prop.get('area', 'N/A')}</p>
                        <p><b>🛏️ Bedrooms:</b> {prop.get('bedrooms', 'N/A')} | <b>🚿 Bathrooms:</b> {prop.get('bathrooms', 'N/A')}</p>
                        <p><b>✨ Amenities:</b> {', '.join(prop.get('amenities', [])) if prop.get('amenities') else 'None listed'}</p>
                        <p><b>📝 Description:</b> {prop.get('description', 'No description available')}</p>
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
            st.warning("⚠️ No properties found matching your criteria. Try adjusting your search parameters.")

# --- My Properties Page (Property Manager Only) ---
elif page == "My Properties":
    st.title("🏢 My Properties")
    
    tab1, tab2 = st.tabs(["➕ Add New Property", "📋 Manage Properties"])
    
    with tab1:
        st.subheader("Add New Property")
        with st.form("add_property_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                name = st.text_input("Property Name *")
                location = st.text_input("Location *")
                community = st.text_input("Community/Area *")
                price = st.number_input("Price (₹) *", min_value=0, step=100000)
                area = st.text_input("Area (e.g., 1200 sq.ft) *")
            
            with col2:
                bedrooms = st.number_input("Bedrooms *", min_value=1, max_value=10, value=2)
                bathrooms = st.number_input("Bathrooms *", min_value=1, max_value=10, value=2)
                owner_name = st.text_input("Owner Name *", value=st.session_state["current_user"])
                owner_phone = st.text_input("Owner Phone *")
                owner_email = st.text_input("Owner Email *", value=st.session_state["user_email"])
            
            amenities_input = st.text_input("Amenities (comma-separated, e.g., gym, pool, parking)")
            description = st.text_area("Property Description")
            
            submit_btn = st.form_submit_button("➕ Add Property", use_container_width=True)
            
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
                    
                    with st.spinner("Adding property..."):
                        success, message = add_property(property_data)
                    if success:
                        st.success(f"✅ {message}")
                        st.balloons()
                    else:
                        st.error(f"❌ {message}")
    
    with tab2:
        st.subheader("Manage Your Properties")
        
        with st.spinner("Loading your properties..."):
            user_properties = get_owner_properties(st.session_state["user_email"])
        
        if user_properties:
            st.info(f"📊 You have {len(user_properties)} property/properties listed")
            
            for prop in user_properties:
                with st.expander(f"🏠 {prop.get('name', 'Unnamed')} - {prop.get('location', '')}"):
                    col1, col2 = st.columns([3, 1])
                    
                    with col1:
                        st.write(f"**💰 Price:** ₹{prop.get('price', 0):,}")
                        st.write(f"**📐 Area:** {prop.get('area', 'N/A')}")
                        st.write(f"**🛏️ Bedrooms:** {prop.get('bedrooms', 'N/A')} | **🚿 Bathrooms:** {prop.get('bathrooms', 'N/A')}")
                        st.write(f"**🏘️ Community:** {prop.get('community', 'N/A')}")
                        st.write(f"**✨ Amenities:** {', '.join(prop.get('amenities', [])) if prop.get('amenities') else 'None'}")
                        st.write(f"**📝 Description:** {prop.get('description', 'N/A')}")
                    
                    with col2:
                        if st.button("✏️ Edit", key=f"edit_btn_{prop['id']}", use_container_width=True):
                            st.session_state[f"editing_{prop['id']}"] = True
                        
                        if st.button("🗑️ Delete", key=f"delete_btn_{prop['id']}", use_container_width=True, type="secondary"):
                            if st.session_state.get(f"confirm_delete_{prop['id']}", False):
                                with st.spinner("Deleting..."):
                                    success, message = delete_property(prop['id'])
                                if success:
                                    st.success(message)
                                    st.rerun()
                                else:
                                    st.error(message)
                            else:
                                st.session_state[f"confirm_delete_{prop['id']}"] = True
                                st.warning("⚠️ Click Delete again to confirm")
                    
                    # Edit form
                    if st.session_state.get(f"editing_{prop['id']}", False):
                        st.markdown("---")
                        st.subheader("Edit Property Details")
                        
                        with st.form(f"edit_form_{prop['id']}"):
                            edit_col1, edit_col2 = st.columns(2)
                            
                            with edit_col1:
                                new_name = st.text_input("Name", value=prop.get('name', ''))
                                new_price = st.number_input("Price", value=prop.get('price', 0), step=100000)
                                new_area = st.text_input("Area", value=prop.get('area', ''))
                            
                            with edit_col2:
                                new_bedrooms = st.number_input("Bedrooms", value=prop.get('bedrooms', 2), min_value=1, max_value=10)
                                new_bathrooms = st.number_input("Bathrooms", value=prop.get('bathrooms', 2), min_value=1, max_value=10)
                                new_amenities = st.text_input("Amenities", value=', '.join(prop.get('amenities', [])))
                            
                            new_description = st.text_area("Description", value=prop.get('description', ''))
                            
                            col_update, col_cancel = st.columns(2)
                            with col_update:
                                update_btn = st.form_submit_button("💾 Update Property", use_container_width=True)
                            with col_cancel:
                                cancel_btn = st.form_submit_button("❌ Cancel", use_container_width=True)
                            
                            if update_btn:
                                updated_data = {
                                    "name": new_name,
                                    "price": new_price,
                                    "area": new_area,
                                    "bedrooms": new_bedrooms,
                                    "bathrooms": new_bathrooms,
                                    "amenities": [a.strip() for a in new_amenities.split(",")] if new_amenities else [],
                                    "description": new_description
                                }
                                
                                with st.spinner("Updating..."):
                                    success, message = update_property(prop['id'], updated_data)
                                if success:
                                    st.success(message)
                                    st.session_state[f"editing_{prop['id']}"] = False
                                    st.rerun()
                                else:
                                    st.error(message)
                            
                            if cancel_btn:
                                st.session_state[f"editing_{prop['id']}"] = False
                                st.rerun()
        else:
            st.info("📭 You haven't added any properties yet. Use the 'Add New Property' tab to get started!")
            st.image("https://images.unsplash.com/photo-1560518883-ce09059eeffa", use_container_width=True)

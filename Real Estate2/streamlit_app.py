import streamlit as st
import requests
import pandas as pd
import numpy as np
from config import config

st.set_page_config(page_title=config.APP_NAME, layout="wide", page_icon="🏠")

# ---------- Custom Styles ----------
st.markdown("""
    <style>
    .stApp {
        background-color: #1c1c1c;
        color: #ffffff;
        font-family: 'Segoe UI', sans-serif;
    }
    .title {
        color: #ffffff;
        text-align: center;
    }
    .subheader {
        color: #cccccc;
        text-align: center;
    }
    .property-card {
        background-color: #2c2c2c;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 4px 6px rgba(52, 152, 219, 0.3);
        border: 1px solid #3498db;
    }
    .score-badge {
        background-color: #3498db;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        display: inline-block;
        font-weight: bold;
    }
    .contact-card {
        background-color: #2c3e50;
        color: white;
        border-radius: 10px;
        padding: 15px;
        margin-top: 10px;
    }
    .stButton>button {
        background-color: #3498db;
        color: white;
        border-radius: 10px;
        border: none;
        font-size: 16px;
        padding: 0.5em 1em;
    }
    .stButton>button:hover {
        background-color: #2980b9;
    }
    .stTextInput>div>div>input,
    .stNumberInput>div>div>input,
    .stSelectbox>div>div>select,
    .stTextArea>div>div>textarea {
        background-color: #2c2c2c;
        color: #ffffff;
        border: 1px solid #3498db;
    }
    .success-message {
        background-color: #27ae60;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
    }
    </style>
""", unsafe_allow_html=True)

# ---------- Session State Initialization ----------
if "page" not in st.session_state:
    st.session_state.page = "home"
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "current_user" not in st.session_state:
    st.session_state.current_user = None
if "user_role" not in st.session_state:
    st.session_state.user_role = None
if "user_email" not in st.session_state:
    st.session_state.user_email = None
if "user_id" not in st.session_state:
    st.session_state.user_id = None

# ---------- API Helper Functions ----------
def api_request(method, endpoint, **kwargs):
    """Generic API request handler"""
    try:
        url = f"{config.API_BASE_URL}{endpoint}"
        response = requests.request(method, url, timeout=10, **kwargs)
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

# ---------- Page Navigation Function ----------
def go_to(page):
    st.session_state.page = page
    st.rerun()

# ============================================================
# HOME PAGE
# ============================================================
if st.session_state.page == "home":
    st.markdown("<h1 class='title'>🏠 Real Estate Location Predictor</h1>", unsafe_allow_html=True)
    st.markdown("<p class='subheader'>Find the best locations for your real estate investments with ease!</p>", unsafe_allow_html=True)

    st.image(
        "https://images.unsplash.com/photo-1598300056820-1c25aa9d6c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDR8fHJlYWwlMjBlc3RhdGUlMjBob21lfGVufDB8fHx8MTY5ODA2NzA1MQ&ixlib=rb-4.0.3&q=80&w=800",
        use_container_width=True
    )

    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Get Started", use_container_width=True):
            go_to("signup")

# ============================================================
# SIGN UP PAGE
# ============================================================
elif st.session_state.page == "signup":
    st.markdown("<h1 class='title'>📝 Create an Account</h1>", unsafe_allow_html=True)
    
    with st.form("signup_form"):
        new_user = st.text_input("Username *", placeholder="Enter a unique username")
        email = st.text_input("Email *", placeholder="your.email@example.com")
        new_pass = st.text_input("Password *", type="password", placeholder="Enter a strong password")
        confirm_pass = st.text_input("Confirm Password *", type="password", placeholder="Re-enter your password")
        role = st.selectbox("I am a *", ["Property Seeker", "Property Manager"])
        
        col1, col2 = st.columns(2)
        with col1:
            signup_btn = st.form_submit_button("Sign Up", use_container_width=True)
        with col2:
            back_btn = st.form_submit_button("Back to Home", use_container_width=True)
        
        if signup_btn:
            if not new_user or not email or not new_pass or not confirm_pass:
                st.error("⚠️ Please fill in all fields")
            elif new_pass != confirm_pass:
                st.error("⚠️ Passwords do not match")
            elif len(new_pass) < config.PASSWORD_MIN_LENGTH:
                st.error(f"⚠️ Password must be at least {config.PASSWORD_MIN_LENGTH} characters")
            else:
                role_value = config.ROLE_PROPERTY_MANAGER if role == "Property Manager" else config.ROLE_PROPERTY_SEEKER
                with st.spinner("Creating account..."):
                    success, message = register_user(email, new_pass, new_user, role_value)
                if success:
                    st.success(f"✅ {message}")
                    st.info("Please login to continue")
                    go_to("login")
                else:
                    st.error(f"❌ {message}")
        
        if back_btn:
            go_to("home")

# ============================================================
# LOGIN PAGE
# ============================================================
elif st.session_state.page == "login":
    st.markdown("<h1 class='title'>🔑 Login</h1>", unsafe_allow_html=True)
    
    with st.form("login_form"):
        username = st.text_input("Email", placeholder="your.email@example.com")
        password = st.text_input("Password", type="password", placeholder="Enter your password")
        
        col1, col2 = st.columns(2)
        with col1:
            login_btn = st.form_submit_button("Login", use_container_width=True)
        with col2:
            back_btn = st.form_submit_button("Back to Home", use_container_width=True)
        
        if login_btn:
            if not username or not password:
                st.error("⚠️ Please fill in all fields")
            else:
                with st.spinner("Logging in..."):
                    success, data = login_user(username, password)
                if success:
                    st.session_state.logged_in = True
                    st.session_state.user_id = data.get("user_id")
                    st.session_state.current_user = data["username"]
                    st.session_state.user_role = data["role"]
                    st.session_state.user_email = username
                    st.success(f"Welcome {data['username']}! 🎉")
                    go_to("role_selection")
                else:
                    st.error(f"❌ {data}")
        
        if back_btn:
            go_to("home")

# ============================================================
# ROLE SELECTION PAGE
# ============================================================
elif st.session_state.page == "role_selection":
    if not st.session_state.logged_in:
        go_to("login")
    
    st.markdown("<h1 class='title'>👤 Welcome Back!</h1>", unsafe_allow_html=True)
    st.markdown(f"<p class='subheader'>Logged in as: {st.session_state.current_user} ({st.session_state.user_role.replace('_', ' ').title()})</p>", unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    if st.session_state.user_role == config.ROLE_PROPERTY_MANAGER:
        with col1:
            if st.button("🏢 Manage Properties", use_container_width=True):
                go_to("manager_page")
        with col2:
            if st.button("🔍 Search Properties", use_container_width=True):
                go_to("buyer_page")
    else:
        with col1:
            if st.button("🔍 Search Properties", use_container_width=True):
                go_to("buyer_page")
        with col2:
            st.info("You're logged in as Property Seeker")
    
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🚪 Logout", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        go_to("home")

# ============================================================
# PROPERTY MANAGER PAGE
# ============================================================
elif st.session_state.page == "manager_page":
    if not st.session_state.logged_in:
        go_to("login")
    
    st.markdown("<h1 class='title'>🏢 Property Manager Dashboard</h1>", unsafe_allow_html=True)
    st.markdown("<p class='subheader'>Add or update your property details</p>", unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["➕ Add New Property", "📋 Manage Properties"])
    
    # ADD NEW PROPERTY TAB
    with tab1:
        with st.form("add_property_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                property_name = st.text_input("Property Name *")
                location = st.text_input("Location *", placeholder="e.g., Bangalore, Hyderabad")
                community = st.text_input("Community/Area *", placeholder="e.g., Whitefield, HSR Layout")
                price = st.number_input("Price (₹) *", min_value=100000, step=100000, value=5000000)
                area = st.text_input("Area *", placeholder="e.g., 1200 sq.ft", value="1200 sq.ft")
            
            with col2:
                bedrooms = st.slider("Bedrooms *", 1, 10, 3)
                bathrooms = st.slider("Bathrooms *", 1, 10, 2)
                owner_name = st.text_input("Owner Name *", value=st.session_state.current_user)
                owner_phone = st.text_input("Owner Phone *", placeholder="+91-9876543210")
                owner_email = st.text_input("Owner Email *", value=st.session_state.user_email)
            
            amenities_options = ["gym", "pool", "parking", "garden", "security", "club_house", 
                               "elevator", "power_backup", "intercom", "smart_home"]
            amenities = st.multiselect("Amenities", amenities_options, default=["parking", "security"])
            description = st.text_area("Property Description", placeholder="Describe your property...")
            
            submit_btn = st.form_submit_button("➕ Add Property", use_container_width=True)
            
            if submit_btn:
                if not all([property_name, location, community, owner_name, owner_phone, owner_email]):
                    st.error("⚠️ Please fill in all required fields (marked with *).")
                else:
                    property_data = {
                        "name": property_name,
                        "location": location,
                        "community": community,
                        "price": price,
                        "area": area,
                        "bedrooms": bedrooms,
                        "bathrooms": bathrooms,
                        "owner_name": owner_name,
                        "owner_phone": owner_phone,
                        "owner_email": owner_email,
                        "amenities": amenities,
                        "description": description
                    }
                    
                    with st.spinner("Adding property..."):
                        success, message = add_property(property_data)
                    if success:
                        st.success(f"✅ {message}")
                        st.balloons()
                    else:
                        st.error(f"❌ {message}")
    
    # MANAGE PROPERTIES TAB
    with tab2:
        st.subheader("Your Properties")
        
        with st.spinner("Loading your properties..."):
            user_properties = get_owner_properties(st.session_state.user_email)
        
        if user_properties:
            st.info(f"📊 You have {len(user_properties)} property/properties listed")
            
            for prop in user_properties:
                with st.expander(f"🏠 {prop.get('name', 'Unnamed')} - ₹{prop.get('price', 0):,}"):
                    col1, col2 = st.columns([3, 1])
                    
                    with col1:
                        st.write(f"**📍 Location:** {prop.get('location', 'N/A')}")
                        st.write(f"**🏘️ Community:** {prop.get('community', 'N/A')}")
                        st.write(f"**💰 Price:** ₹{prop.get('price', 0):,}")
                        st.write(f"**📐 Area:** {prop.get('area', 'N/A')}")
                        st.write(f"**🛏️ Bedrooms:** {prop.get('bedrooms', 'N/A')} | **🚿 Bathrooms:** {prop.get('bathrooms', 'N/A')}")
                        st.write(f"**✨ Amenities:** {', '.join(prop.get('amenities', [])) if prop.get('amenities') else 'None'}")
                        st.write(f"**📝 Description:** {prop.get('description', 'N/A')}")
                    
                    with col2:
                        if st.button("✏️ Edit", key=f"edit_btn_{prop['id']}", use_container_width=True):
                            st.session_state[f"editing_{prop['id']}"] = True
                            st.rerun()
                        
                        if st.button("🗑️ Delete", key=f"delete_btn_{prop['id']}", use_container_width=True):
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
                    
                    # EDIT FORM
                    if st.session_state.get(f"editing_{prop['id']}", False):
                        st.markdown("---")
                        st.subheader("Edit Property Details")
                        
                        with st.form(f"edit_form_{prop['id']}"):
                            edit_col1, edit_col2 = st.columns(2)
                            
                            with edit_col1:
                                new_name = st.text_input("Name", value=prop.get('name', ''))
                                new_location = st.text_input("Location", value=prop.get('location', ''))
                                new_community = st.text_input("Community", value=prop.get('community', ''))
                                new_price = st.number_input("Price", value=prop.get('price', 0), step=100000)
                            
                            with edit_col2:
                                new_area = st.text_input("Area", value=prop.get('area', ''))
                                new_bedrooms = st.slider("Bedrooms", 1, 10, value=prop.get('bedrooms', 2))
                                new_bathrooms = st.slider("Bathrooms", 1, 10, value=prop.get('bathrooms', 2))
                            
                            amenities_options = ["gym", "pool", "parking", "garden", "security", "club_house", 
                                               "elevator", "power_backup", "intercom", "smart_home"]
                            new_amenities = st.multiselect("Amenities", amenities_options, default=prop.get('amenities', []))
                            new_description = st.text_area("Description", value=prop.get('description', ''))
                            
                            col_update, col_cancel = st.columns(2)
                            with col_update:
                                update_btn = st.form_submit_button("💾 Update Property", use_container_width=True)
                            with col_cancel:
                                cancel_btn = st.form_submit_button("❌ Cancel", use_container_width=True)
                            
                            if update_btn:
                                updated_data = {
                                    "name": new_name,
                                    "location": new_location,
                                    "community": new_community,
                                    "price": new_price,
                                    "area": new_area,
                                    "bedrooms": new_bedrooms,
                                    "bathrooms": new_bathrooms,
                                    "amenities": new_amenities,
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
            st.info("📭 You haven't added any properties yet.")
    
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("⬅️ Back to Dashboard", use_container_width=True):
        go_to("role_selection")

# ============================================================
# BUYER PAGE
# ============================================================
elif st.session_state.page == "buyer_page":
    if not st.session_state.logged_in:
        go_to("login")
    
    st.markdown("<h1 class='title'>🏘️ Search Properties</h1>", unsafe_allow_html=True)
    st.markdown("<p class='subheader'>Filter and view property details</p>", unsafe_allow_html=True)
    
    with st.form("search_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            location = st.text_input("Location", placeholder="e.g., Bangalore, Hyderabad")
            community = st.text_input("Community/Area", placeholder="e.g., Whitefield, HSR Layout")
            price_min = st.number_input("Minimum Price (₹)", min_value=0, value=0, step=100000)
        
        with col2:
            price_max = st.number_input("Maximum Price (₹)", min_value=0, value=20000000, step=100000)
            amenities_options = ["gym", "pool", "parking", "garden", "security", "club_house", 
                               "elevator", "power_backup", "intercom", "smart_home"]
            selected_amenities = st.multiselect("Amenities", amenities_options)
        
        search_btn = st.form_submit_button("🔎 Search Properties", use_container_width=True)
    
    if search_btn:
        with st.spinner("Searching properties..."):
            results = search_properties(
                price_min=price_min if price_min > 0 else None,
                price_max=price_max if price_max > 0 else None,
                amenities=selected_amenities if selected_amenities else None,
                location=location if location else None,
                community=community if community else None
            )
        
        if results.get("top_matches"):
            st.success(f"✅ Found {len(results['top_matches'])} properties")
            st.info(f"📊 Your search completeness score: {int(results.get('user_score', 0) * 100)}%")
            
            for idx, prop in enumerate(results["top_matches"], 1):
                score = prop.get("score", 0)
                score_percentage = int(score * 100)
                
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
    
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("⬅️ Back to Dashboard", use_container_width=True):
        go_to("role_selection")

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import credentials, firestore
import hashlib

# Initialize Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI(title="Real Estate API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str
    role: str  # "property_manager" or "property_seeker"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PropertyCreate(BaseModel):
    name: str
    location: str
    community: str
    price: int
    area: str
    bedrooms: int
    bathrooms: int
    owner_name: str
    owner_phone: str
    owner_email: EmailStr
    amenities: List[str] = []
    description: str = ""

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    community: Optional[str] = None
    price: Optional[int] = None
    area: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    description: Optional[str] = None

# --- Helper Functions ---
def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def normalize(value, min_val, max_val):
    """Normalize value between 0 and 1"""
    if max_val == min_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)

# --- Authentication Endpoints ---
@app.post("/register")
async def register(user: UserRegister):
    """Register a new user"""
    users_ref = db.collection("users")
    
    # Check if user already exists
    existing_user = users_ref.where("email", "==", user.email).limit(1).stream()
    if list(existing_user):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user.role not in ["property_manager", "property_seeker"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user document
    user_data = {
        "email": user.email,
        "password": hash_password(user.password),
        "username": user.username,
        "role": user.role
    }
    
    users_ref.add(user_data)
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(user: UserLogin):
    """Login user"""
    users_ref = db.collection("users")
    
    # Find user by email
    user_query = users_ref.where("email", "==", user.email).limit(1).stream()
    user_docs = list(user_query)
    
    if not user_docs:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_doc = user_docs[0]
    user_data = user_doc.to_dict()
    
    # Verify password
    if user_data["password"] != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "username": user_data["username"],
        "role": user_data["role"],
        "email": user_data["email"]
    }

# --- Property Management Endpoints ---
@app.post("/properties")
async def create_property(property: PropertyCreate):
    """Add a new property"""
    properties_ref = db.collection("properties")
    
    property_data = property.dict()
    property_data["score"] = 0.0  # Initialize score
    
    doc_ref = properties_ref.add(property_data)
    return {
        "message": "Property added successfully",
        "id": doc_ref[1].id
    }

@app.put("/properties/{property_id}")
async def update_property(property_id: str, property: PropertyUpdate):
    """Update an existing property"""
    properties_ref = db.collection("properties")
    doc_ref = properties_ref.document(property_id)
    
    # Check if property exists
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in property.dict().items() if v is not None}
    
    if update_data:
        doc_ref.update(update_data)
    
    return {"message": "Property updated successfully"}

@app.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    """Delete a property"""
    properties_ref = db.collection("properties")
    doc_ref = properties_ref.document(property_id)
    
    # Check if property exists
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Property not found")
    
    doc_ref.delete()
    return {"message": "Property deleted successfully"}

@app.get("/properties/{property_id}")
async def get_property(property_id: str):
    """Get a single property by ID"""
    properties_ref = db.collection("properties")
    doc_ref = properties_ref.document(property_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return doc.to_dict() | {"id": doc.id}

# --- Search Endpoint ---
@app.get("/search")
async def search_properties(
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    amenities: Optional[List[str]] = Query(None),
    location: Optional[str] = None,
    community: Optional[str] = None,
):
    """Search properties with scoring algorithm"""
    properties_ref = db.collection("properties")
    properties = [p.to_dict() | {"id": p.id} for p in properties_ref.stream()]
    
    # Guard: No data
    if not properties:
        return {
            "message": "No properties found in database.",
            "user_score": 0,
            "top_matches": [],
            "total_properties_checked": 0
        }
    
    # Calculate user search completeness score
    user_score = 0
    weight_price = 0.3
    weight_amenity = 0.3
    weight_location = 0.2
    weight_community = 0.2
    
    if price_min is not None and price_max is not None:
        user_score += weight_price
    if amenities:
        user_score += weight_amenity
    if location:
        user_score += weight_location
    if community:
        user_score += weight_community
    
    # Get price range for normalization
    valid_prices = [p["price"] for p in properties if isinstance(p.get("price"), (int, float))]
    if not valid_prices:
        min_price = max_price = 0
    else:
        min_price, max_price = min(valid_prices), max(valid_prices)
    
    matched = []
    
    for p in properties:
        # Skip invalid documents
        if "price" not in p:
            continue
        
        price_score = 0
        amenity_score = 0
        location_score = 0
        community_score = 0
        
        # --- Price Score ---
        # Lower price = higher score (normalized)
        price_score = 1 - normalize(p["price"], min_price, max_price)
        
        # Bonus if within user's budget range
        if price_min and price_max and (price_min <= p["price"] <= price_max):
            price_score += 0.5
        
        # Cap at 1.0
        price_score = min(price_score, 1.0)
        
        # --- Amenities Score ---
        if amenities and isinstance(p.get("amenities"), list):
            matched_amenities = len(set(p["amenities"]) & set(amenities))
            if len(amenities) > 0:
                amenity_score = matched_amenities / len(amenities)
        
        # --- Location Score ---
        if location and p.get("location"):
            if p["location"].lower() == location.lower():
                location_score = 1.0
            elif location.lower() in p["location"].lower():
                location_score = 0.5
        
        # --- Community Score ---
        if community and p.get("community"):
            if p["community"].lower() == community.lower():
                community_score = 1.0
            elif community.lower() in p["community"].lower():
                community_score = 0.5
        
        # --- Calculate Weighted Total Score ---
        total_score = (
            weight_price * price_score +
            weight_amenity * amenity_score +
            weight_location * location_score +
            weight_community * community_score
        )
        
        p["score"] = round(total_score, 3)
        matched.append(p)
        
        # --- Update score in Firestore (only if changed) ---
        try:
            doc_ref = properties_ref.document(p["id"])
            existing_doc = doc_ref.get()
            if not existing_doc.exists or existing_doc.to_dict().get("score") != p["score"]:
                doc_ref.set({"score": p["score"]}, merge=True)
        except Exception as e:
            print(f"⚠️ Could not update score for {p['id']}: {e}")
    
    # Sort by score and return top matches
    top_matches = sorted(matched, key=lambda x: x["score"], reverse=True)[:10]
    
    return {
        "user_score": round(user_score, 3),
        "top_matches": top_matches,
        "total_properties_checked": len(matched)
    }

# --- Health Check Endpoint ---
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Real Estate API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

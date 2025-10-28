from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.preprocessing import MinMaxScaler
import math
import firebase_admin
from firebase_admin import credentials, firestore

# ---------- 1️⃣ Firebase Setup ----------
firebase_config = {
    "apiKey": "AIzaSyA2_60MAhoUCYcPKEPFEriRG7_lSlumTss",
    "authDomain": "real-estate-recommendati-183a5.firebaseapp.com",
    "projectId": "real-estate-recommendati-183a5",
    "storageBucket": "real-estate-recommendati-183a5.firebasestorage.app",
    "messagingSenderId": "257760305153",
    "appId": "1:257760305153:web:cb2c67480d8bdbac956000",
    "measurementId": "G-VJZSF5EPVR"
}

# Initialize Firebase using your service account key
try:
    cred = credentials.Certificate("serviceAccountKey.json")  # 🔑 your downloaded key file
    firebase_admin.initialize_app(cred)
except ValueError:
    pass  # ignore if already initialized

db = firestore.client()

# ---------- 2️⃣ FastAPI App ----------
app = FastAPI(title="Real Estate Scoring API")

# ---------- 3️⃣ User Input Schema ----------
class UserInput(BaseModel):
    min_price: int
    max_price: int
    amenities: List[str]
    community: str
    location: str


# ---------- 4️⃣ Helper Functions ----------
def compute_score(price, amenity_score, community_score, location_score, weights):
    """Weighted linear combination of all criteria."""
    return (
        weights["price"] * price +
        weights["amenities"] * amenity_score +
        weights["community"] * community_score +
        weights["location"] * location_score
    )


def location_similarity(user_loc: str, listing_loc: str):
    """Rough string-based location similarity."""
    if not listing_loc:
        return 0.0
    if user_loc.lower() == listing_loc.lower():
        return 1.0
    elif user_loc.split()[0].lower() == listing_loc.split()[0].lower():
        return 0.7
    else:
        return 0.5


# ---------- 5️⃣ Scoring + Firestore Update ----------
@app.post("/search")
def search_properties(user_input: UserInput):
    properties_ref = db.collection("properties")
    docs = properties_ref.stream()
    properties = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        properties.append(data)

    if not properties:
        return {"error": "No properties found in Firebase."}

    # --- Normalize prices ---
    all_prices = [p["price"] for p in properties if "price" in p] + [
        user_input.min_price, user_input.max_price
    ]
    scaler = MinMaxScaler()
    scaled_prices = scaler.fit_transform([[p] for p in all_prices])
    user_price_score = float((scaled_prices[-1][0] + scaled_prices[-2][0]) / 2)

    # --- User feature scores ---
    total_possible_amenities = len({a for p in properties for a in p.get("amenities", [])})
    user_amenity_score = len(user_input.amenities) / total_possible_amenities if total_possible_amenities else 0
    user_community_score = 1.0
    user_location_score = 1.0

    weights = {"price": 0.4, "amenities": 0.3, "community": 0.2, "location": 0.1}

    user_score = compute_score(user_price_score, user_amenity_score,
                               user_community_score, user_location_score, weights)

    # --- Compute scores for each property ---
    for p in properties:
        scaled_price = float(scaler.transform([[p["price"]]])[0][0])
        amenity_match = len(set(p.get("amenities", [])) & set(user_input.amenities)) / total_possible_amenities if total_possible_amenities else 0
        community_match = 1.0 if p.get("community") == user_input.community else 0.5
        location_match = location_similarity(user_input.location, p.get("location", ""))

        p["score"] = compute_score(scaled_price, amenity_match,
                                   community_match, location_match, weights)

        # --- Safe Firestore Update ---
        try:
            properties_ref.document(p["id"]).set(
                {**p, "score": p["score"]}, merge=True  # ✅ creates or updates field
            )
        except Exception as e:
            print(f"⚠️ Could not update {p['id']}: {e}")

    # --- Filter matches within ±10% ---
    TOLERANCE = 0.1
    matched = [p for p in properties if math.isclose(p["score"], user_score, rel_tol=TOLERANCE)]

    return {
        "user_score": round(user_score, 3),
        "matches": matched or "No close matches found"
    }

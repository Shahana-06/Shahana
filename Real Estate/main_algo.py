from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.preprocessing import MinMaxScaler
import math

app = FastAPI(title="Real Estate Scoring API")

# ---------- 1️⃣ Fake Listings Database ----------
listings = [
    {
        "id": 1,
        "price": 7500000,
        "amenities": ["gym", "parking", "pool"],
        "community": "family_friendly",
        "location": "Anna Nagar"
    },
    {
        "id": 2,
        "price": 5200000,
        "amenities": ["parking"],
        "community": "student_area",
        "location": "Kilpauk"
    },
    {
        "id": 3,
        "price": 8300000,
        "amenities": ["gym", "pool", "garden", "parking"],
        "community": "family_friendly",
        "location": "Nungambakkam"
    },
]

# ---------- 2️⃣ Define User Input Schema ----------
class UserInput(BaseModel):
    min_price: int
    max_price: int
    amenities: List[str]
    community: str
    location: str


# ---------- 3️⃣ Helper: Compute Score ----------
def compute_score(price, amenity_score, community_score, location_score, weights):
    return (
        weights["price"] * price +
        weights["amenities"] * amenity_score +
        weights["community"] * community_score +
        weights["location"] * location_score
    )


# ---------- 4️⃣ Helper: Location Similarity ----------
def location_similarity(user_loc: str, listing_loc: str):
    # Very simple district similarity rule
    if user_loc.lower() == listing_loc.lower():
        return 1.0
    elif user_loc.split()[0] == listing_loc.split()[0]:  # same district prefix
        return 0.7
    else:
        return 0.5


# ---------- 5️⃣ Main Scoring + Matching ----------
@app.post("/search")
def search_properties(user_input: UserInput):
    # Combine all prices for scaling
    all_prices = [l["price"] for l in listings] + [user_input.min_price, user_input.max_price]
    scaler = MinMaxScaler()
    scaled_prices = scaler.fit_transform([[p] for p in all_prices])

    # Extract scaled user price
    user_price_score = float((scaled_prices[-1][0] + scaled_prices[-2][0]) / 2)

    # Amenity coverage (fraction of amenities selected)
    total_possible_amenities = len({a for l in listings for a in l["amenities"]})
    user_amenity_score = len(user_input.amenities) / total_possible_amenities

    # Other user attributes
    user_community_score = 1.0
    user_location_score = 1.0

    # Define weights
    weights = {"price": 0.4, "amenities": 0.3, "community": 0.2, "location": 0.1}

    # Compute user score
    user_score = compute_score(user_price_score, user_amenity_score,
                               user_community_score, user_location_score, weights)

    # Compute each listing score and similarity
    for l in listings:
        scaled_price = float(scaler.transform([[l["price"]]])[0][0])
        amenity_match = len(set(l["amenities"]) & set(user_input.amenities)) / total_possible_amenities
        community_match = 1.0 if l["community"] == user_input.community else 0.5
        location_match = location_similarity(user_input.location, l["location"])

        l["score"] = compute_score(scaled_price, amenity_match,
                                   community_match, location_match, weights)

    # Matching logic — within ±10%
    TOLERANCE = 0.1
    matched = [
        l for l in listings if math.isclose(l["score"], user_score, rel_tol=TOLERANCE)
    ]

    # Return results
    return {
        "user_score": round(user_score, 3),
        "matches": matched or "No close matches found"
    }

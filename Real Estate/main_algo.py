from fastapi import FastAPI, Query
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
import math

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()
app = FastAPI(title="Property Scoring API")

def normalize(value, min_val, max_val):
    if max_val == min_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)

@app.get("/search")
async def search_properties(
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    amenities: Optional[List[str]] = Query(None),
    location: Optional[str] = None,
    community: Optional[str] = None,
):
    properties_ref = db.collection("properties")
    properties = [p.to_dict() | {"id": p.id} for p in properties_ref.stream()]

    # Guard: No data
    if not properties:
        return {"message": "No properties found in Firestore."}

    user_score = 0
    weight_price, weight_amenity, weight_location, weight_community = 0.3, 0.3, 0.2, 0.2

    if price_min is not None and price_max is not None:
        user_score += 1 * weight_price
    if amenities:
        user_score += 1 * weight_amenity
    if location:
        user_score += 1 * weight_location
    if community:
        user_score += 1 * weight_community

    valid_prices = [p["price"] for p in properties if isinstance(p.get("price"), (int, float))]
    if not valid_prices:
        min_price = max_price = 0
    else:
        min_price, max_price = min(valid_prices), max(valid_prices)

    matched = []
    for p in properties:
        # Skip invalid docs
        if "price" not in p:
            continue

        price_score = 0
        amenity_score = 0
        location_score = 0
        community_score = 0

        # --- Price Score ---
        price_score = 1 - normalize(p["price"], min_price, max_price)
        if price_min and price_max and (price_min <= p["price"] <= price_max):
            price_score += 0.5

        # --- Amenities Score ---
        if amenities and isinstance(p.get("amenities"), list):
            matched_amenities = len(set(p["amenities"]) & set(amenities))
            amenity_score = matched_amenities / len(amenities)

        # --- Location & Community ---
        if location and p.get("location") == location:
            location_score = 1
        if community and p.get("community") == community:
            community_score = 1

        # --- Weighted Total ---
        total_score = (
            weight_price * price_score
            + weight_amenity * amenity_score
            + weight_location * location_score
            + weight_community * community_score
        )

        p["score"] = round(total_score, 3)
        matched.append(p)

        # --- Update only if score changed ---
        try:
            doc_ref = properties_ref.document(p["id"])
            existing_doc = doc_ref.get()
            if not existing_doc.exists or existing_doc.to_dict().get("score") != p["score"]:
                doc_ref.set({"score": p["score"]}, merge=True)
        except Exception as e:
            print(f"⚠️ Could not update {p['id']}: {e}")


    top_matches = sorted(matched, key=lambda x: x["score"], reverse=True)[:5]
    return {
        "user_score": round(user_score, 3),
        "top_matches": top_matches,
        "total_properties_checked": len(properties),
    }

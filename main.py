from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import json

from database import Base, engine, get_db
from models import User, Listing
from schemas import RegisterIn, LoginIn, UserOut, ListingCreate, ListingOut
from auth import hash_password, verify_password, create_access_token, get_current_user_token

app = FastAPI(title="Real Estate Location Prediction API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# ---------- Auth ----------
@app.post("/auth/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    # ensure unique email
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password), role=payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role}

@app.post("/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id), user.role)
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# ---------- Listings ----------
@app.post("/listings", response_model=ListingOut)
def create_listing(payload: ListingCreate, user=Depends(get_current_user_token), db: Session = Depends(get_db)):
    if user.get("role") != "broker":
        raise HTTPException(status_code=403, detail="Only brokers can add listings")
    l = Listing(
        title=payload.title,
        location=payload.location,
        lat=payload.lat,
        lng=payload.lng,
        property_type=payload.property_type,
        price=payload.price,
        description=payload.description,
        amenities=json.dumps(payload.amenities or []),
        community_tags=json.dumps(payload.community_tags or []),
        owner_id=int(user["sub"]),
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    return to_listing_out(l)

def to_listing_out(l: Listing, score: Optional[float] = None) -> ListingOut:
    return ListingOut(
        id=l.id,
        title=l.title,
        location=l.location,
        lat=l.lat,
        lng=l.lng,
        property_type=l.property_type,
        price=l.price,
        description=l.description,
        amenities=json.loads(l.amenities or "[]"),
        community_tags=json.loads(l.community_tags or "[]"),
        score=score
    )

@app.get("/listings", response_model=List[ListingOut])
def search_listings(
    db: Session = Depends(get_db),
    location: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    keyword: Optional[str] = None,
    amenities: Optional[str] = None,  # CSV
    community_tags: Optional[str] = None,  # CSV
    sort_by: Optional[str] = Query(None, pattern="^(price|score)?$"),
):
    q = select(Listing)
    if location:
        q = q.where(Listing.location.ilike(f"%{location}%"))
    if property_type:
        q = q.where(Listing.property_type.ilike(f"%{property_type}%"))
    if min_price is not None:
        q = q.where(Listing.price >= min_price)
    if max_price is not None:
        q = q.where(Listing.price <= max_price)
    if keyword:
        like = f"%{keyword}%"
        q = q.where((Listing.title.ilike(like)) | (Listing.description.ilike(like)))

    rows = db.execute(q).scalars().all()

    # Parse filters
    amen_filter = [a.strip().lower() for a in amenities.split(",")] if amenities else []
    comm_filter = [c.strip().lower() for c in community_tags.split(",")] if community_tags else []

    def score_listing(l: Listing) -> float:
        l_amen = [a.lower() for a in json.loads(l.amenities or "[]")]
        l_comm = [c.lower() for c in json.loads(l.community_tags or "[]")]
        # Simple scoring: +2 per amenity match, +1.5 per community match, + small bonus for keyword in title
        score = 0.0
        score += 2.0 * sum(1 for a in amen_filter if a in l_amen)
        score += 1.5 * sum(1 for c in comm_filter if c in l_comm)
        if keyword:
            title = (l.title or "").lower()
            desc = (l.description or "").lower()
            if keyword.lower() in title: score += 1.0
            if keyword.lower() in desc: score += 0.5
        return score

    items = [(l, score_listing(l)) for l in rows]
    if sort_by == "price":
        items.sort(key=lambda x: x[0].price)
    else:
        # default relevance = score desc
        items.sort(key=lambda x: x[1], reverse=True if sort_by in (None, "", "score") else False)

    return [to_listing_out(l, s) for l, s in items]

@app.get("/listings/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    l = db.get(Listing, listing_id)
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    return to_listing_out(l)

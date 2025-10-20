from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    role: Literal["broker","finder"] = "finder"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    class Config:
        from_attributes = True

class ListingBase(BaseModel):
    title: str
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    property_type: str
    price: int
    description: Optional[str] = None
    amenities: List[str] = []
    community_tags: List[str] = []

class ListingCreate(ListingBase):
    pass

class ListingOut(ListingBase):
    id: int
    score: Optional[float] = None  # computed on search
    class Config:
        from_attributes = True

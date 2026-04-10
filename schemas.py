from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    department: Optional[str] = None
    passout_year: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    department: Optional[str] = None
    passout_year: Optional[int] = None
    mobile: Optional[str] = None
    parents_details: Optional[str] = None
    id_card_image: Optional[str] = None
    is_approved: bool = False
    is_admin: bool = False
    is_teacher: bool = False

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool = False
    is_teacher: bool = False

class DocumentResponse(BaseModel):
    id: int
    title: str
    file_path: str
    owner_id: int
    owner_name: Optional[str] = "Unknown"
    uploaded_at: Optional[str] = "Unknown"

    model_config = {"from_attributes": True}

class FlashcardBase(BaseModel):
    question: str
    answer: str

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: int
    document_id: int

    model_config = {"from_attributes": True}

class BookListingCreate(BaseModel):
    type: str
    title: str
    subject: Optional[str] = "General"
    condition: Optional[str] = "Not specified"
    price: int = 0
    contact: str
    location: Optional[str] = ""
    description: Optional[str] = ""

class BookListingResponse(BookListingCreate):
    id: str
    status: str
    owner: str # We'll return the user's name/email instead of just ID for simplicity
    buyer: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}

class CommunityPostCreate(BaseModel):
    board: str
    title: str
    message: str
    link: Optional[str] = ""

class CommunityPostResponse(CommunityPostCreate):
    id: str
    author: str # owner name
    help_count: int = 0
    created_at: str

    model_config = {"from_attributes": True}

class RoleUpdate(BaseModel):
    role: str

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    priority: str = "info"

class AnnouncementResponse(AnnouncementCreate):
    id: str
    author: str
    created_at: str

    model_config = {"from_attributes": True}

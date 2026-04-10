from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
import os
import shutil
import uuid
import json
import PyPDF2
from datetime import datetime, timezone
from groq import Groq as _GroqClient
from dotenv import load_dotenv

load_dotenv()
# Groq client (configured at request time so key can be set after startup)
_groq_api_key = os.getenv("GROQ_API_KEY") or ""
if not _groq_api_key:
    print("WARNING: GROQ_API_KEY is not set in .env — AI features will not work.")


import models, schemas, security
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudyHub API")

# Add CORS middleware to allow connections from a frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (change in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return FileResponse("frontend/index.html")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    """Retrieve details about the current authenticated user."""
    return current_user

@app.post("/register", response_model=schemas.UserResponse)
def register(
    email: str = Form(...),
    password: str = Form(...),
    department: Optional[str] = Form(None),
    passout_year: Optional[int] = Form(None),
    id_card_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(password)
    new_user = models.User(
        email=email, 
        hashed_password=hashed_password,
        department=department,
        passout_year=passout_year
    )
    
    if id_card_image:
        if not id_card_image.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG images are allowed")
            
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{id_card_image.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(id_card_image.file, buffer)
            
        new_user.id_card_image = file_path
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.email)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.is_admin,
        "is_teacher": user.is_teacher
    }

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Secure the filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save to database
    new_doc = models.Document(
        title=file.filename,
        file_path=file_path,
        owner_id=current_user.id,
        uploaded_at=datetime.utcnow().isoformat() + "Z"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc



def extract_text_from_pdf(file_path: str) -> str:
    """Helper function to extract text from a physical PDF file."""
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text

@app.post("/generate-flashcards/{document_id}")
def generate_flashcards(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch document from DB
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or you don't have access to it.")
        
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Physical PDF file not found on disk.")
        
    # 2. Extract text from PDF
    text = extract_text_from_pdf(document.file_path)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the provided PDF.")
        
    # 3. Generate Flashcards using Groq API
    try:
        if not _groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set in .env. Get a free key at console.groq.com")

        groq_client = _GroqClient(api_key=_groq_api_key)

        # Limit context to ~12000 chars (~3000 tokens) to stay within free tier safely
        context_text = text[:12000]

        prompt = f"""Based on the following text extracted from a document, generate exactly 5 key Q&A flashcards.
Format your response ENTIRELY as a valid JSON object with a single key 'flashcards' which contains an array of 5 objects.
Each object must have a 'question' key and an 'answer' key.
Do NOT wrap the response in markdown blocks like ```json.
Return ONLY the raw JSON string.

Text:
{context_text}"""

        chat = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1024,
        )
        response_text = chat.choices[0].message.content.strip()
        
        # Clean up any potential markdown formatting the AI might still add
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        flashcards_data = json.loads(response_text)
        
        # Save generated flashcards to the database
        for card in flashcards_data.get("flashcards", []):
            db_flashcard = models.Flashcard(
                question=card.get("question"),
                answer=card.get("answer"),
                document_id=document.id
            )
            db.add(db_flashcard)
        db.commit()

        return flashcards_data
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse generated flashcards into JSON: {str(e)}\nRaw Response: {response_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Gemini API: {str(e)}")


# == Gemini Document Q&A ==
from pydantic import BaseModel as _PydanticBase

class AskRequest(_PydanticBase):
    document_id: int
    question: str

@app.post("/api/ask")
async def ask_about_document(
    request: AskRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Answer a free-form student question about one of their uploaded docs using Gemini."""
    document = db.query(models.Document).filter(
        models.Document.id == request.document_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk.")
    try:
        with open(document.file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = " ".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read PDF: {str(e)}")
    if not text.strip():
        raise HTTPException(status_code=422, detail="PDF has no extractable text.")
    context = text[:8000]
    if not _groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set in .env. Get a free key at console.groq.com")
    groq_client = _GroqClient(api_key=_groq_api_key)
    prompt = (
        "You are a helpful study assistant. Answer the student question using the document below.\n"
        "Be concise and student-friendly. If the answer is not in the document, say so clearly.\n\n"
        f"Document: {document.title}\nContent: {context}\n\nQuestion: {request.question}\nAnswer:"
    )
    try:
        chat = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=512,
        )
        answer = chat.choices[0].message.content.strip()
        return {"answer": answer, "document": document.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")


@app.get("/documents/me", response_model=List[schemas.DocumentResponse])
def get_my_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all documents uploaded by the current authenticated user."""
    documents = db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()
    return documents

@app.get("/flashcards/{document_id}", response_model=List[schemas.FlashcardResponse])
def get_document_flashcards(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all flashcards generated for a specific document."""
    # Ensure document exists and belongs to user
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
        
    flashcards = db.query(models.Flashcard).filter(models.Flashcard.document_id == document_id).all()
    return flashcards

@app.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document and all related flashcards from the database and disk."""
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not current_user.is_admin and document.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        
    # Delete file from disk
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            print(f"Warning: Could not delete physical file: {e}")
            
    # Remove from database (cascading deletes flashcards automatically because of models.py relationship)
    db.delete(document)
    db.commit()
    return None

@app.get("/admin/stats")
def get_admin_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system-wide statistics. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    total_users = db.query(models.User).count()
    total_docs = db.query(models.Document).count()
    
    total_size_bytes = 0
    documents = db.query(models.Document).all()
    for doc in documents:
        if os.path.exists(doc.file_path):
            total_size_bytes += os.path.getsize(doc.file_path)
            
    if total_size_bytes < 1024 * 1024:
        storage_str = f"{total_size_bytes / 1024:.2f} KB"
    elif total_size_bytes < 1024 * 1024 * 1024:
        storage_str = f"{total_size_bytes / (1024 * 1024):.2f} MB"
    else:
        storage_str = f"{total_size_bytes / (1024 * 1024 * 1024):.2f} GB"

    return {"total_users": total_users, "total_documents": total_docs, "storage_used": storage_str}

@app.get("/admin/users")
def get_all_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a list of all users with their document counts. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    users = db.query(models.User).all()
    user_list = []
    for u in users:
        user_list.append({
            "id": u.id,
            "email": u.email,
            "is_admin": u.is_admin,
            "is_teacher": u.is_teacher,
            "document_count": len(u.documents)
        })
    return user_list

@app.get("/admin/documents", response_model=List[schemas.DocumentResponse])
def get_all_documents_admin(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    documents = db.query(models.Document).all()
    result = []
    for doc in documents:
        owner_name = doc.owner.email.split('@')[0] if doc.owner else 'Unknown'
        doc_dict = {
            "id": doc.id,
            "title": doc.title,
            "file_path": doc.file_path,
            "owner_id": doc.owner_id,
            "owner_name": owner_name,
            "uploaded_at": doc.uploaded_at or "Unknown"
        }
        result.append(doc_dict)
    return result

@app.put("/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: schemas.RoleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    allowed_roles = {"admin", "teacher", "student"}
    if role_data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.is_admin = (role_data.role == 'admin')
    user.is_teacher = (role_data.role == 'teacher')
    db.commit()
    return {"message": "Role updated successfully"}

@app.get("/api/teacher/students")
def get_teacher_students(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all non-admin, non-teacher users (i.e. students)"""
    if not current_user.is_teacher and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Teacher privileges required")
        
    students = db.query(models.User).filter(
        models.User.is_admin == False,
        models.User.is_teacher == False
    ).all()
    
    student_list = []
    for s in students:
        student_list.append({
            "id": str(s.id),
            "email": s.email,
            "name": s.email.split('@')[0],
            "department": s.department or "N/A",
            "passout_year": s.passout_year or "N/A",
            "mobile": s.mobile or "N/A"
        })
    return student_list

# --- Marketplace Endpoints ---

from datetime import datetime, timezone

@app.get("/api/market/books", response_model=List[schemas.BookListingResponse])
def get_book_listings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listings = db.query(models.BookListing).all()
    result = []
    for listing in listings:
        owner_name = listing.owner.email.split('@')[0] if listing.owner else 'Unknown'
        buyer_name = listing.buyer.email.split('@')[0] if listing.buyer else None
        
        # Build dictionary from SQLAlchemy object and map missing fields for the schema
        listing_dict = {
            "id": listing.id,
            "type": listing.type,
            "title": listing.title,
            "subject": listing.subject,
            "condition": listing.condition,
            "price": listing.price,
            "contact": listing.contact,
            "location": listing.location,
            "description": listing.description,
            "status": listing.status,
            "created_at": listing.created_at,
            "owner": owner_name,
            "buyer": buyer_name
        }
        result.append(listing_dict)
    return result

@app.post("/api/market/books", response_model=schemas.BookListingResponse)
def create_book_listing(
    listing: schemas.BookListingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing_id = f"book-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
    
    new_listing = models.BookListing(
        id=listing_id,
        type=listing.type,
        title=listing.title,
        subject=listing.subject,
        condition=listing.condition,
        price=listing.price,
        contact=listing.contact,
        location=listing.location,
        description=listing.description,
        status="available",
        owner_id=current_user.id,
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    
    owner_name = current_user.email.split('@')[0]
    
    listing_dict = {
        "id": new_listing.id,
        "type": new_listing.type,
        "title": new_listing.title,
        "subject": new_listing.subject,
        "condition": new_listing.condition,
        "price": new_listing.price,
        "contact": new_listing.contact,
        "location": new_listing.location,
        "description": new_listing.description,
        "status": new_listing.status,
        "created_at": new_listing.created_at,
        "owner": owner_name,
        "buyer": None
    }
    return listing_dict

@app.put("/api/market/books/{listing_id}")
def mark_book_sold(
    listing_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(models.BookListing).filter(models.BookListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if listing.status == 'sold':
        return {"message": "Already sold"}
        
    listing.status = 'sold'
    # if the current_user is not the owner, they are the buyer
    if listing.owner_id != current_user.id:
        listing.buyer_id = current_user.id
        
    db.commit()
    return {"message": "Listing updated"}

# --- Community Endpoints ---

@app.get("/api/community/posts", response_model=List[schemas.CommunityPostResponse])
def get_community_posts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()
    result = []
    for post in posts:
        author_name = post.owner.email.split('@')[0] if post.owner else 'Unknown'
        post_dict = {
            "id": post.id,
            "board": post.board,
            "title": post.title,
            "message": post.message,
            "link": post.link,
            "help_count": post.help_count,
            "created_at": post.created_at,
            "author": author_name
        }
        result.append(post_dict)
    return result

@app.post("/api/community/posts", response_model=schemas.CommunityPostResponse)
def create_community_post(
    post: schemas.CommunityPostCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post_id = f"post-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
    
    new_post = models.CommunityPost(
        id=post_id,
        board=post.board,
        title=post.title,
        message=post.message,
        link=post.link,
        owner_id=current_user.id,
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    author_name = current_user.email.split('@')[0]
    
    post_dict = {
        "id": new_post.id,
        "board": new_post.board,
        "title": new_post.title,
        "message": new_post.message,
        "link": new_post.link,
        "help_count": new_post.help_count,
        "created_at": new_post.created_at,
        "author": author_name
    }
    return post_dict

@app.put("/api/community/posts/{post_id}/help")
def increment_help_count(
    post_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post.help_count += 1
    db.commit()
    return {"message": "Help count increased", "help_count": post.help_count}

# --- Announcements Endpoints ---

@app.get("/api/announcements", response_model=List[schemas.AnnouncementResponse])
def get_announcements(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    anns = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    result = []
    for ann in anns:
        author_name = ann.owner.email.split('@')[0] if ann.owner else "Teacher"
        result.append({
            "id": ann.id,
            "title": ann.title,
            "body": ann.body,
            "priority": ann.priority,
            "author": author_name,
            "created_at": ann.created_at
        })
    return result

@app.post("/api/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(
    ann: schemas.AnnouncementCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_teacher and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Teacher privileges required")
    
    ann_id = f"ann-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
    new_ann = models.Announcement(
        id=ann_id,
        title=ann.title,
        body=ann.body,
        priority=ann.priority,
        owner_id=current_user.id,
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    
    author_name = current_user.email.split('@')[0]
    return {
        "id": new_ann.id,
        "title": new_ann.title,
        "body": new_ann.body,
        "priority": new_ann.priority,
        "author": author_name,
        "created_at": new_ann.created_at
    }

@app.delete("/api/announcements/{ann_id}")
def delete_announcement(
    ann_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_teacher and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Teacher privileges required")
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted"}


# Mount uploads purely for retrieving ID card images in the profile panel
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount static files to serve other HTML/CSS/JS files directly from root
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

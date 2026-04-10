from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    department = Column(String, nullable=True)
    passout_year = Column(Integer, nullable=True)
    id_card_image = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_teacher = Column(Boolean, default=False)
    mobile = Column(String, nullable=True)
    parents_details = Column(String, nullable=True)

    documents = relationship("Document", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    file_path = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(String, nullable=True)

    owner = relationship("User", back_populates="documents")
    flashcards = relationship("Flashcard", back_populates="document", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    answer = Column(String)
    document_id = Column(Integer, ForeignKey("documents.id"))

    document = relationship("Document", back_populates="flashcards")

class BookListing(Base):
    __tablename__ = "book_listings"

    id = Column(String, primary_key=True, index=True) # e.g. 'book-timestamp-random'
    type = Column(String) # 'sell' or 'buy'
    title = Column(String)
    subject = Column(String, nullable=True)
    condition = Column(String, nullable=True)
    price = Column(Integer, default=0)
    contact = Column(String)
    location = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="available") # 'available', 'sold'
    owner_id = Column(Integer, ForeignKey("users.id"))
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(String) # Storing as ISO string

    owner = relationship("User", foreign_keys=[owner_id])
    buyer = relationship("User", foreign_keys=[buyer_id])

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(String, primary_key=True, index=True)
    board = Column(String) # 'notes', 'help', 'offtopic'
    title = Column(String)
    message = Column(String)
    link = Column(String, nullable=True)
    help_count = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(String) # Storing as ISO string

    owner = relationship("User")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    body = Column(String)
    priority = Column(String, default="info")
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(String)

    owner = relationship("User")

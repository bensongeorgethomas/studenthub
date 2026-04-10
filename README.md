![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

# 🎓 StudentHub

**StudentHub** is a full-stack, role-based academic management platform designed to streamline operations between Admins, Teachers, and Students. It features secure JWT authentication, an AI-powered study assistant, community boards, a study timer, marketplace, and real-time announcements — all in one unified platform.

---

## ✨ Features

### 🔐 Security & Authentication
- **Role-Based Access Control (RBAC)**: Distinct portals for Admins, Teachers, and Students.
- **JWT Authentication**: Stateless, token-based auth with configurable expiry.
- **Data Protection**:
  - Environment-based configuration (`.env`).
  - Password hashing via `bcrypt`.
  - CORS protection on all API routes.
  - Secure session management.

### 🤖 AI Study Assistant
- **Groq-Powered Chatbot**: Context-aware AI tutor available to students 24/7.
- **Wikipedia Lookup**: Instant in-app knowledge search without leaving the platform.
- **ISBN Book Lookup**: Search and discover books by ISBN directly from the dashboard.

### 📚 Academic Tools
- **Study Timer**: Pomodoro-style timer with session tracking and progress history.
- **Achievements System**: Gamified milestones to reward student engagement and effort.
- **Announcements**: Teachers and admins can broadcast notices to students in real time.
- **Shopping Marketplace**: Students can browse and request academic resources and materials.

### 👥 Community Boards
- **Notes Community**: Share and discover study notes with peers.
- **Help Community**: Ask questions and get answers from classmates or teachers.
- **Off-Topic Community**: A casual space for general student discussion.

### 🖥️ Role Portals

- **Student Portal**:
  - Personalized dashboard with GPA, attendance, and upcoming deadlines.
  - Access to all study tools, AI chat, communities, and marketplace.
  - Editable profile with academic details.

- **Teacher Portal**:
  - Dashboard overview of class performance and task status.
  - Manage grades, attendance, assignments, and announcements.
  - Direct communication channel with students.
  - Student performance analytics and records.

- **Admin Portal**:
  - Full user management (create, edit, deactivate accounts).
  - Document management and system-wide analytics.
  - Platform-wide announcement broadcasting.
  - Application settings and configuration.

---

## 📸 Screen Gallery

| **Student Login** | **Student Dashboard** |
|:---:|:---:|
| <img src="screenshots/login.png" alt="Student Login" width="400"> | <img src="screenshots/student_dashboard.png" alt="Student Dashboard" width="400"> |
| _Secure role-based authentication_ | _Personalized student workspace_ |

| **Student Dashboard with AI** | **Teacher Login** |
|:---:|:---:|
| <img src="screenshots/student_dashboard_ai.png" alt="Student Dashboard with AI Chat" width="400"> | <img src="screenshots/teacher_login.png" alt="Teacher Login" width="400"> |
| _AI study assistant & community spaces_ | _Faculty access portal_ |

| **Teacher Dashboard** | |
|:---:|:---:|
| <img src="screenshots/teacher_dashboard.png" alt="Teacher Dashboard" width="400"> | |
| _Class overview, assignments & attendance_ | |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, FastAPI |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Database** | PostgreSQL (via SQLAlchemy ORM) |
| **AI Integration** | Groq API (LLaMA 3) |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **Server** | Uvicorn (ASGI) |

---

## 🚀 Getting Started

### Prerequisites
- Python >= 3.10
- PostgreSQL database
- A free [Groq API key](https://console.groq.com)

### Step 1: Clone the Repository
```bash
git clone https://github.com/bensongeorgethomas/studenthub.git
cd studenthub
```

### Step 2: Create a Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and fill in your configuration:
   ```env
   # Groq API Key (free at https://console.groq.com)
   GROQ_API_KEY=your_groq_api_key_here

   # PostgreSQL Database URL
   SQLALCHEMY_DATABASE_URL=postgresql://postgres:yourpassword@localhost/studyhub_db

   # JWT Security (generate a strong random key for production)
   SECRET_KEY=generate_a_strong_random_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### Step 5: Set Up the Database
1. Create a PostgreSQL database named `studyhub_db`.
2. Run the migration script to create all tables:
   ```bash
   python migrate_db.py
   ```
3. (Optional) Seed initial users:
   ```bash
   python create_users.py
   ```

### Step 6: Run the Application
```bash
# Start the backend API server
uvicorn main:app --reload --port 8000
```
Then open `frontend/index.html` in your browser, or serve the `frontend/` folder with any static file server.

Alternatively, use the included batch script (Windows):
```bash
start.bat
```

---

## 📁 Directory Structure
```
studenthub/
├── frontend/
│   ├── index.html              # Landing page
│   ├── login.html / register.html
│   ├── styles.css
│   ├── student/                # Student portal pages & scripts
│   │   ├── dashboard.html
│   │   ├── ai-chat.js
│   │   ├── study-timer.html
│   │   ├── achievements.html
│   │   ├── shopping.html
│   │   └── ...community boards, profile, lookups
│   ├── teacher/                # Teacher portal pages & scripts
│   │   ├── teacher-dashboard.html
│   │   ├── teacher-grades.html
│   │   ├── teacher-attendance.html
│   │   └── ...announcements, communication, records
│   └── admin/                  # Admin portal pages & scripts
│       ├── dashboard.html
│       ├── usermanagement.html
│       ├── analytics.html
│       └── ...documents, settings
├── main.py                     # FastAPI app & all API routes
├── models.py                   # SQLAlchemy database models
├── schemas.py                  # Pydantic request/response schemas
├── database.py                 # DB connection & session config
├── security.py                 # JWT & password hashing utilities
├── migrate_db.py               # Database migration script
├── create_users.py             # Seed script for default users
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
├── .gitignore
└── start.bat                   # Windows startup script
```

---

## 🔒 Security Best Practices
- **Never commit `.env`**: This file contains your API keys and database credentials.
- **Rotate secrets regularly**: Use a strong, randomly generated `SECRET_KEY` in production.
- **Use HTTPS in production**: Always serve the app over HTTPS when deployed publicly.
- **Keep Groq API keys private**: Treat your API key like a password — revoke and rotate if exposed.

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

---

*Built with ❤️ for better student learning experiences.*

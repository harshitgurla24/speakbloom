# 🌸 SpeakBloom - Master Your Accent

A full-stack web application that helps users practice pronunciation in **12 languages** with real-time speech recognition, AI-generated practice text via Groq API, pronunciation scoring, and **admin dashboard** for managing users and tracking statistics.

**Key Features:**
- 🎤 Real-time speech recognition (Web Speech API)
- 🤖 AI-generated practice content (Groq API)
- 📊 User performance tracking & statistics
- 🛡️ Admin panel to manage users and view analytics
- 🔐 Encrypted API key storage
- 🎮 20 game levels with progressive difficulty

---

## 📁 Project Structure

```
final_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                ← FastAPI app + all routes
│   │   ├── models.py              ← SQLAlchemy database models
│   │   ├── admin.py               ← Admin panel logic & utilities
│   │   ├── api_keys.py            ← Encryption & API key management
│   │   ├── text_generator.py      ← Groq AI text generation
│   │   └── pronunciation.py       ← Word comparison & scoring
│   ├── data/                      ← SQLite database (local dev only)
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── constants.js
│   │   ├── apiClient.js
│   │   ├── components/
│   │   │   ├── Navbar.jsx         ← Navigation with admin link
│   │   │   ├── ApiKeyModal.jsx
│   │   │   ├── WordHighlighter.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── pages/
│   │       ├── AdminPanel.jsx     ← Admin dashboard
│   │       ├── HomePage.jsx
│   │       ├── AuthPage.jsx
│   │       ├── PracticePage.jsx
│   │       ├── ResultPage.jsx
│   │       ├── GamePage.jsx
│   │       ├── GameLevelPage.jsx
│   │       └── ProfilePage.jsx
│
├── ADMIN_PANEL_GUIDE.md           ← Detailed admin panel documentation
├── README.md                       ← This file
└── .gitignore
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Browser | Chrome/Edge (Web Speech API) |

### Backend Setup

```bash
# Backend directory
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate              # Windows
# source venv/bin/activate         # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file with configuration (see below)
```

**Create `backend/.env`:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=274205766354-7bjv7n17vqmddlmavsbnd6scliroajrt.apps.googleusercontent.com

# JWT Configuration  
APP_JWT_SECRET=your-secret-key-here-change-in-production
APP_JWT_ALGORITHM=HS256
APP_JWT_EXPIRE_HOURS=24

# Database (leave commented for local SQLite)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Admin emails (comma-separated)
ADMIN_EMAILS=your-email@example.com

# API Key Encryption (auto-generated if not set)
# API_KEY_ENCRYPTION_KEY=your-encryption-key-here
```

**Start backend:**
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Create .env file
# VITE_API_BASE_URL=http://localhost:8000 (default, for local dev)

# Start dev server
npm run dev
```

**Access the app:** http://localhost:5173

---

## 👨‍💼 Admin Panel

### Access

1. Set your email in `backend/.env` `ADMIN_EMAILS`
2. Login with that Google account
3. Click red **🛡️ Admin** button in navbar
4. View dashboard with all user statistics

### Features

- **Dashboard Stats:**
  - Total users
  - Active users (today & this week)
  - Average score
  - Total practice sessions

- **User Management:**
  - View all users with their scores
  - Filter by proficiency level
  - Search by email/name
  - Sort by various metrics
  - Export user data to CSV

- **User Tracking:**
  - Registration date
  - Last activity timestamp
  - Total score & current level
  - Languages attempted
  - Number of sessions

**See [ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md) for complete admin documentation.**

---

## 💾 Database & Analytics

### Data Tracking

**User Statistics** (tracked automatically):
- Registration timestamp
- Total score accumulated
- Current proficiency level (beginner/intermediate/advanced)
- Number of practice sessions
- Languages attempted
- Last activity time

**Session History** (each practice session):
- Language practiced
- Difficulty level selected
- Text length
- Accuracy score
- Fluency rating
- Session duration

### Database Deployment

**Local Development:**
- Uses SQLite database: `backend/data/app.db`
- File-based, auto-creates on startup

**Production (Render):**
- Requires PostgreSQL for persistent data
- SQLite files are ephemeral on Render
- Uncomment `DATABASE_URL` in `.env` and point to PostgreSQL instance

---

## 🔐 API Key Management

### User Workflow

1. **First Login:** User creates account via Google OAuth
2. **Add API Key:** Click "🔑 Add API" button if needed
3. **Get Groq Key:** Visit https://console.groq.com/keys
4. **Save Key:** Encrypted and stored per-user
5. **Practice:** Generate AI content with stored key

### Security

- **Encryption:** Fernet (256-bit AES via `cryptography`)
- **Storage:** Database table `user_api_keys` with encrypted values
- **Per-User:** Each user has isolated API key
- **No Plain Text:** Keys never stored unencrypted
- **Production Ready:** Works on cloud platforms

---

## 📡 API Endpoints

### Authentication

**`POST /auth/google`**
```json
{
  "credential": "google-oauth-token"
}
```
Returns: `access_token`, `user` info

**`GET /auth/me`**
Returns current authenticated user info

---

### User Statistics

**`POST /user/stats/update`** (called after each session)
```json
{
  "accuracy": 85.5,
  "fluency": 80.0,
  "score": 85,
  "language": "en-US",
  "level": "medium",
  "text_length": "medium",
  "duration_seconds": 45.5
}
```

---

### Admin Endpoints (require admin role)

**`GET /admin/dashboard`**
Returns: Dashboard stats + all users with details

**`GET /admin/users`**
Returns: List of all users and their statistics

**`GET /admin/stats`**
Returns: Summary statistics (users count, active, average score, etc.)

---

### Practice Endpoints

**`POST /generate-text`** (AI-generated content)
```json
{
  "language": "en-US",
  "length": "medium",
  "level": "easy"
}
```

**`POST /analyze-pronunciation`** (score pronunciation)
```json
{
  "original_text": "The original text",
  "spoken_text": "User's spoken translation",
  "time_taken": 45.5
}
```

---

### API Key Management

**`POST /api-key/save`**
```json
{
  "api_key": "gsk_your_groq_key",
  "provider": "groq"
}
```

**`GET /api-key/status`**
Returns: Whether user has API key configured

**`DELETE /api-key/delete`**
Removes user's stored API key
  "spoken_text": "the sun rises every morning",
  "time_taken": 18.5
}
```

**Response:**
```json
{
  "accuracy": 93.5,
  "correct_words": ["the", "sun", "rises", "every", "morning"],
  "wrong_words": ["truly"],
  "total_words": 40,
  "words_spoken": 38,
  "speaking_speed": 123.2,
  "fluency_rating": "Excellent",
  "word_comparison": [
    { "word": "the", "status": "correct" },
    { "word": "truly", "status": "wrong" }
  ]
}
```

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| 🌐 Multi-language | 12 languages: English, Hindi, Marathi, Gujarati, Bengali, Arabic, Telugu, Odia, Tamil, Punjabi, Sanskrit, Malayalam |
| 🔐 Secure API Keys | User-managed Groq API keys with Fernet encryption |
| 🤖 AI Text Generation | Groq LLaMA 3.1 (user's API key required) |
| 🎤 Live Speech Recognition | Web Speech API — real-time transcript |
| 📊 Accuracy Scoring | Word-level comparison, correct/wrong/missed counts |
| 🟢🔴 Word Highlighting | Green = correct, Red = missed/wrong |
| ⚡ Speaking Speed | Calculated in words per minute (WPM) |
| 🏆 Fluency Rating | Excellent / Good / Average / Needs Practice |
| 🎮 Gamified Levels | 20 progressive difficulty levels |
| 📱 Responsive Design | Mobile-friendly, works on all screens |
| 🎨 Modern UI | Tailwind CSS with animations & gradients |

---

## 🔧 Tech Stack

**Frontend**
- **React 18.2** (Vite 5.1)
- **React Router v6.22** (navigation)
- **Tailwind CSS v3.4** (styling)
- **axios 1.6** (HTTP client)
- **react-icons v5.6** (UI icons)
- **Web Speech API** (speech recognition + synthesis)

**Backend**
- **Python 3.10+**
- **FastAPI** (web framework)
- **Uvicorn** (ASGI server)
- **Pydantic v2** (data validation)
- **Groq SDK** (LLM API)
- **cryptography** (Fernet encryption)
- **python-jose** (JWT tokens)
- **google-auth** (OAuth verification)

**Security**
- **Fernet Encryption** (256-bit AES, time-based)
- **JWT Authentication** (Google OAuth + custom tokens)
- **Environment Variables** (.env for secrets)
- **Per-User Encrypted Storage** (file-based)

---

## 🌐 Browser Support

The Web Speech API (speech recognition + text-to-speech) is required. Supported browsers:
- ✅ **Google Chrome** (recommended)
- ✅ **Microsoft Edge**
- ❌ **Firefox** (not supported)
- ❌ **Safari** (limited support)

---

## 🚀 Deployment

### Local vs Production Database

**Local Development (SQLite):**
```
backend/data/app.db (auto-created)
- File-based database
- Perfect for local testing
- Auto-creates tables on startup
```

**Production (PostgreSQL):**
```
Required for: Render, Railway, Heroku, etc.
Reason: File systems are ephemeral on containers
```

### Backend Deployment (Render)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **On Render:**
   - Connect GitHub repository
   - Set "Start Command": `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set environment variables:
     ```
     GOOGLE_CLIENT_ID=your_id
     APP_JWT_SECRET=your_secret_key
     APP_JWT_ALGORITHM=HS256
     APP_JWT_EXPIRE_HOURS=24
     API_KEY_ENCRYPTION_KEY=your_encryption_key
     ADMIN_EMAILS=your-email@example.com
     DATABASE_URL=postgresql://user:pass@host:5432/dbname
     ```

3. **Database Setup:**
   - Create PostgreSQL database on Render
   - Copy connection string to `DATABASE_URL`
   - SQLAlchemy will auto-create tables on first run

### Frontend Deployment

1. **Update `.env`:**
   ```bash
   VITE_API_BASE_URL=https://your-backend-domain
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel/Netlify:**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Output directory: `dist`

---

## 🛡️ Admin Panel Setup

### Enable Admin Access

1. **Add email to `backend/.env`:**
   ```env
   ADMIN_EMAILS=harshitgurla24@navgurukul.org,other-admin@example.com
   ```

2. **Login with admin email** via Google OAuth

3. **Admin button appears** in navbar: **🛡️ Admin**

### Admin Features

- **View Dashboard:** Total users, active users, average score, total sessions
- **User List:** Search, filter by level, sort by score/activity
- **Export Data:** Download all user data as CSV
- **Performance Metrics:** Track user progress across languages & levels

**Full docs:** See [ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md)

---

## 🗄️ Database Schema

### User Authentication
```
user_api_keys
├── id (int) primary key
├── user_email (string) indexed
├── provider (string)
├── encrypted_key (text) — Fernet encrypted
├── created_at (datetime)
└── updated_at (datetime)
```

### User Statistics
```
user_stats
├── id (int) primary key
├── user_email (string) unique, indexed
├── user_name (string)
├── user_picture (string)
├── total_score (float)
├── current_level (string) — beginner/intermediate/advanced
├── total_sessions (int)
├── languages_attempted (string) — comma-separated
├── created_at (datetime)
├── updated_at (datetime)
└── last_activity (datetime)
```

### Session History
```
session_history
├── id (int) primary key
├── user_email (string) indexed
├── language (string) indexed
├── level (string)
├── text_length (string)
├── accuracy (float)
├── fluency (float)
├── score (float)
├── duration_seconds (float)
└── created_at (datetime) indexed
```

---

## 🐛 Troubleshooting

### Admin Button Not Showing

**Problem:** Red admin button doesn't appear in navbar

**Solutions:**
1. ✅ Verify email is in `backend/.env` `ADMIN_EMAILS`
2. ✅ Check browser console (F12 → Console) for errors
3. ✅ Hard refresh page (Ctrl+Shift+R)
4. ✅ Check backend logs for `[is_admin]` messages
5. ✅ Logout and login again

### API Calls Failing (404)

**Problem:** Frontend gets 404 errors from backend

**Solutions:**
1. Check `frontend/.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000  # Local
   VITE_API_BASE_URL=https://your-domain    # Production
   ```
2. Verify backend is running: `http://localhost:8000` should return `{"message": "...running"}`
3. Check CORS settings in `backend/app/main.py`

### Database Duplicate Index Error

**Problem:** Render deployment fails with `relation "idx_created_at" already exists`

**Solution:** Indexes in SQLAlchemy are auto-created. Remove duplicate `__table_args__` definitions or handle with migrations.

### Encryption Key Issues

**Local Dev:** Leave `API_KEY_ENCRYPTION_KEY` blank initially

**Production:** Always set a fixed key:
```python
from cryptography.fernet import Fernet
key = Fernet.generate_key().decode()
print(key)  # Copy this value to .env
```

### Web Speech API Not Working

**Problem:** Speech recognition won't start

**Solutions:**
1. ✅ Use Chrome or Edge browser (Firefox/Safari have limited support)
2. ✅ HTTPS required on production (localhost OK for dev)
3. ✅ Allow microphone permissions when browser asks
4. ✅ Check browser console for errors

---

## 📊 Supported Languages

| Language | Code | Recognition |
|----------|------|-------------|
| English | `en-US` | ✅ |
| Hindi | `hi-IN` | ✅ |
| Marathi | `mr-IN` | ✅ |
| Gujarati | `gu-IN` | ✅ |
| Bengali | `bn-IN` | ✅ |
| Arabic | `ar-SA` | ✅ |
| Telugu | `te-IN` | ✅ |
| Odia | `or-IN` | ✅ |
| Tamil | `ta-IN` | ✅ |
| Punjabi | `pa-IN` | ✅ |
| Sanskrit | `sa-IN` | ✅ |
| Malayalam | `ml-IN` | ✅ |

---

## 🔗 Useful Links

- **Groq Console:** https://console.groq.com/keys
- **Google OAuth Setup:** https://console.developers.google.com
- **Render Dashboard:** https://dashboard.render.com
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Fernet Encryption:** https://cryptography.io/en/latest/fernet/

---

## 📚 Documentation

- [Admin Panel Guide](ADMIN_PANEL_GUIDE.md) — Managing users & analytics
- [API Reference](#-api-endpoints) — Complete endpoint documentation
- [Database Schema](#-database-schema) — Understanding the data model

---

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] User achievement badges
- [ ] Leaderboards
- [ ] Teacher management mode
- [ ] Bulk user import
- [ ] Custom pronunciation rules

---

## 💬 Support & Contact

For issues, questions, or feature requests:
1. Check existing GitHub issues
2. Open a new issue with detailed description
3. Include error logs and browser console output

**Happy Learning! 🌸**

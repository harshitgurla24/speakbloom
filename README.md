# 🌸 SpeakBloom - Master Your Accent

A full-stack web application that helps users practice pronunciation in **12 languages** — English, Hindi, Marathi, Gujarati, Bengali, Arabic, Telugu, Odia, Tamil, Punjabi, Sanskrit, and Malayalam — with real-time speech recognition, AI-generated practice text via Groq API, and accurate pronunciation scoring.

**Key Feature**: Users manage their own Groq API keys securely with encrypted storage. No practice content without an API key! 🔐

---

## 📁 Project Structure

```
final_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                ← FastAPI app + all routes
│   │   ├── api_keys.py            ← Encryption & API key management
│   │   ├── text_generator.py      ← Groq AI text generation
│   │   └── pronunciation.py       ← Word comparison & scoring
│   ├── data/                      ← Local SQLite fallback (dev only)
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── speakbloom-logo.png
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── constants.js
        ├── apiClient.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ApiKeyModal.jsx      ← User API key management
        │   ├── WordHighlighter.jsx
        │   ├── StatCard.jsx
        │   ├── Loader.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx
        └── pages/
            ├── HomePage.jsx
            ├── AuthPage.jsx
            ├── PracticePage.jsx
            ├── GamePage.jsx
            ├── GameLevelPage.jsx
            ├── ResultPage.jsx
            └── ProfilePage.jsx
```

---

## 🚀 Running Locally

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Modern Browser | Chrome or Edge (Web Speech API support) |

---

### 1 — Backend Setup (FastAPI)

```bash
# From the project root
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (see below)
# Copy/paste the configuration below into backend/.env
```

**Create `backend/.env`:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# JWT Configuration
APP_JWT_SECRET=your-super-secret-key-change-this
APP_JWT_ALGORITHM=HS256
APP_JWT_EXPIRE_HOURS=24

# API Key Encryption (Fernet)
API_KEY_ENCRYPTION_KEY=your-encryption-key-here

# Database (use managed Postgres in production)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

> **Getting Encryption Key**: Leave `API_KEY_ENCRYPTION_KEY` blank on first run only for local testing. For production, always set a fixed value.

**Start the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**

---

### 2 — Frontend Setup (React + Vite)

Open a **second terminal**:

```bash
cd frontend

# Install JavaScript dependencies
npm install

# Start the Vite dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔐 API Key Management System

### User Setup (First-Time)

1. **Open HomePage** → No API key banner shows up (clean interface)
2. **Select language, length, difficulty** → Choose settings
3. **Click "Start Practice"** → Error: `"🔑 Please add your Groq API key first!"`
4. **Click "Add Now"** → ApiKeyModal opens with step-by-step guide
5. **Get API Key**:
   - Go to https://console.groq.com/keys
   - Create a free account
   - Generate an API key (starts with `gsk_`)
6. **Add & Save**:
   - Paste key in modal → Click "✅ Add API Key"
  - Key is encrypted and stored in database
   - Page auto-reloads
   - Navbar button disappears ✨
7. **Ready to Practice!** 🎉

### Key Storage & Security

- **Storage**: Database table `user_api_keys` (persistent across deploys)
- **Encryption**: Fernet (256-bit AES) via `cryptography` library
- **Per-User**: One encrypted record per user + provider
- **No Plain Text**: Keys are always encrypted before storing
- **Deploy Ready**: Works on cloud instances where local filesystem is ephemeral

---

## 📡 API Reference

### Authentication

All endpoints require Google OAuth token in header:
```
Authorization: Bearer {id_token}
```

---

### `POST /auth/google`

**Request:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "sub": "118127...",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

---

### `POST /api-key/save`

Save user's Groq API key (encrypted).

**Request:**
```json
{
  "api_key": "gsk_your_api_key_here",
  "provider": "groq"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key saved successfully",
  "has_api_key": true
}
```

---

### `GET /api-key/status`

Check if user has API key without retrieving it.

**Response:**
```json
{
  "has_api_key": true,
  "provider": "groq",
  "message": "API key is configured"
}
```

---

### `DELETE /api-key/delete`

Remove user's stored API key.

**Response:**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

### `POST /generate-text`

Generate practice paragraph (requires user's API key).

**Request:**
```json
{
  "language": "en-US",
  "length": "medium",
  "level": "easy"
}
```

**Supported Languages:**
`en-US`, `hi-IN`, `mr-IN`, `gu-IN`, `bn-IN`, `ar-SA`, `te-IN`, `or-IN`, `ta-IN`, `pa-IN`, `sa-IN`, `ml-IN`

**Supported Lengths:** `short`, `medium`, `long`

**Supported Levels:** `easy`, `medium`, `hard`

**Response:**
```json
{
  "text": "Technology has changed the way we live…",
  "language": "en-US",
  "length": "medium",
  "level": "easy"
}
```

**Error (No API Key):**
```json
{
  "detail": "Groq API key not found. Please add your API key from https://console.groq.com/keys"
}
```

---

### `POST /analyze-pronunciation`

Compare spoken text against original and return detailed scores.

**Request:**
```json
{
  "original_text": "The sun rises every morning…",
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

### Backend (Railway / Render)

1. Set service root directory to `backend/`
2. Start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
3. Add required environment variables:
  - `GOOGLE_CLIENT_ID`
  - `APP_JWT_SECRET`
  - `APP_JWT_ALGORITHM=HS256`
  - `APP_JWT_EXPIRE_HOURS=24`
  - `API_KEY_ENCRYPTION_KEY`
  - `DATABASE_URL`

### Frontend (Vercel / Netlify)

Deploy the `frontend/` directory and add these environment variables:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_BASE_URL=https://your-backend-domain`

Then run build command:
```bash
npm run build
```

---

## 📚 Project Highlights

- **User-Centric Design**: Users manage their own Groq API keys
- **Secure Encryption**: Fernet cipher (industry-standard AES-256)
- **Real-time Feedback**: Word-by-word pronunciation accuracy
- **Gamification**: 20 levels with increasing difficulty
- **Multi-Language**: 12+ languages with native support
- **Modern Stack**: React + FastAPI + Tailwind CSS
- **Google OAuth**: Secure, passwordless authentication

---

## 🤝 Contributing

Contributions welcome! Fork, branch, commit, and submit a pull request.

---

## 📄 License

MIT License — feel free to use in personal or commercial projects.

---

## 💬 Support

Questions? Issues? Open a GitHub issue or contact the development team.

**Happy Learning! 🎉**

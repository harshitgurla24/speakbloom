# 🌸 SpeakBloom - Master Your Accent

A full-stack web application that helps users practise pronunciation in **12 languages** — English, Hindi, Marathi, Gujarati, Bengali, Arabic, Telugu, Odia, Tamil, Punjabi, Sanskrit, and Malayalam — with real-time speech recognition, AI-generated practice text, and accurate scoring.

---

## 📁 Project Structure

```
final_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            ← FastAPI app + routes
│   │   ├── pronunciation.py   ← word comparison & scoring logic
│   │   └── text_generator.py  ← paragraph generation (placeholder + OpenAI)
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── constants.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── WordHighlighter.jsx
        │   ├── StatCard.jsx
        │   └── Loader.jsx
        └── pages/
            ├── HomePage.jsx
            ├── PracticePage.jsx
            ├── ResultPage.jsx
            └── ListeningPage.jsx
```

---

## 🚀 Running Locally

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

### 1 — Backend (FastAPI)

```bash
# From the project root
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**

> **Optional – OpenAI integration**
> If you have an OpenAI API key, set it before starting the server:
> ```bash
> set OPENAI_API_KEY=sk-...   # Windows CMD
> $env:OPENAI_API_KEY="sk-..." # PowerShell
> ```
> Without a key the app uses high-quality built-in placeholder paragraphs for every language.

---

### 2 — Frontend (React + Vite)

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

## 🌐 Browser Requirement

The Web Speech API (speech recognition + text-to-speech) requires **Google Chrome** or **Microsoft Edge**. Firefox does not support `SpeechRecognition`.

---

## 📡 API Reference

### `POST /generate-text`

Generates a practice paragraph.

**Request Body**
```json
{
  "language": "en-US",
  "length": "medium"
}
```

**Supported languages:** `en-US`, `hi-IN`, `mr-IN`, `gu-IN`, `bn-IN`, `ar-SA`, `te-IN`, `or-IN`, `ta-IN`, `pa-IN`, `sa-IN`, `ml-IN`  
**Supported lengths:** `short`, `medium`, `long`

**Response**
```json
{
  "text": "Technology has changed the way we live…",
  "language": "en-US",
  "length": "medium"
}
```

---

### `POST /analyze-pronunciation`

Compares spoken text against original and returns scores.

**Request Body**
```json
{
  "original_text": "The sun rises every morning…",
  "spoken_text":   "the sun rises every morning",
  "time_taken":    18.5
}
```

**Response**
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
    { "word": "the",   "status": "correct" },
    { "word": "truly", "status": "wrong"   }
  ]
}
```

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🌐 Multi-language | English, Hindi, Marathi, Gujarati, Bengali, Arabic, Telugu, Odia, Tamil, Punjabi, Sanskrit, Malayalam |
| 🤖 AI Text Generation | OpenAI GPT-3.5 (with built-in fallback paragraphs) |
| 🎤 Speech Recognition | Web Speech API — real-time, streamed transcript |
| 📊 Accuracy Scoring | Word-level comparison, correct/wrong counts |
| 🟢🔴 Word Highlighting | Green = correct, Red = missed/wrong |
| ⚡ Speaking Speed | Calculated in words per minute |
| 🏆 Fluency Rating | Excellent / Good / Average / Needs Practice |
| 🎧 Listening Mode | TTS playback (max 2 plays), then record & compare |

---

## 🔧 Tech Stack

**Frontend**
- React 18 (Vite)
- React Router v6
- Tailwind CSS v3
- Axios
- Web Speech API (SpeechRecognition + SpeechSynthesis)

**Backend**
- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic v2
- OpenAI SDK (optional)

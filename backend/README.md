# KARIGAR X - Python FastAPI Backend

Minimal Python FastAPI service providing API endpoints for the KARIGAR X mobile application.

---

## 🛠️ Setup & Local Execution

### Prerequisites
- Python 3.10+ (Verified Python 3.13+)

### 1. Create and Activate Virtual Environment
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate virtual environment (macOS / Linux)
# source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Development Server
```bash
uvicorn main:app --reload --port 8000
```

---

## 📍 Available Endpoints

- **Root API Info**: `GET http://localhost:8000/`
- **Health Check Endpoint**: `GET http://localhost:8000/api/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🌐 CORS Configuration

Cross-Origin Resource Sharing (CORS) is enabled for local frontend development on:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

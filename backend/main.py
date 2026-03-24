from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import random
import time

load_dotenv()

app = FastAPI(title="ParkingMudde AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Mock Database
users_db = {"admin": "password123"}
reports_db = []
vehicles_db = {
    "admin": [
        {"id": "1", "plate": "HR 26 DQ 1234", "model": "Swift", "color": "White"}
    ]
}

class VehicleRequest(BaseModel):
    plate: str
    model: str
    color: str

@app.get("/api/vehicles")
async def get_vehicles(username: str = "admin"):
    return vehicles_db.get(username, [])

@app.post("/api/vehicles")
async def add_vehicle(request: VehicleRequest, username: str = "admin"):
    if username not in vehicles_db:
        vehicles_db[username] = []
    
    new_vehicle = {
        "id": str(random.randint(1000, 9999)),
        "plate": request.plate,
        "model": request.model,
        "color": request.color
    }
    vehicles_db[username].append(new_vehicle)
    return new_vehicle

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    phone: str

class GeoCheckRequest(BaseModel):
    lat: float
    lng: float

class ParkingAnalysisResponse(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[str] = None
    plate_detected: bool
    footpath_prob: float
    crosswalk_prob: float
    double_park_prob: float
    no_parking_sign_prob: float
    blocking_entrance_prob: float
    score: int
    verdict: str
    reason_codes: List[str]

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/login")
async def login(request: LoginRequest):
    if request.username in users_db and users_db[request.username] == request.password:
        return {"status": "success", "token": "mock-jwt-token", "username": request.username}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/register")
async def register(request: RegisterRequest):
    if request.username in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    users_db[request.username] = request.password
    return {"status": "success", "message": "User registered"}

@app.get("/api/reports", response_model=List[ParkingAnalysisResponse])
async def get_reports():
    return sorted(reports_db, key=lambda x: x['timestamp'], reverse=True)

@app.post("/api/geo-check")
async def geo_check(request: GeoCheckRequest):
    return {
        "near_junction": random.random() > 0.8,
        "near_pedestrian_crossing": random.random() > 0.85,
        "near_hospital_school": random.random() > 0.9,
        "near_bus_stop": random.random() > 0.85
    }

def calculate_parking_score(ai_probs: dict, geo_data: dict) -> tuple[int, str, List[str]]:
    score = 0
    reasons = []

    if ai_probs.get("footpath_prob", 0) > 0.6:
        score += 35
        reasons.append("Parked on footpath")
    if ai_probs.get("crosswalk_prob", 0) > 0.6:
        score += 35
        reasons.append("Parked on pedestrian crossing")
    if ai_probs.get("double_park_prob", 0) > 0.6:
        score += 25
        reasons.append("Double parked")
    if ai_probs.get("blocking_entrance_prob", 0) > 0.6:
        score += 30
        reasons.append("Blocking property entrance/exit")
    if ai_probs.get("no_parking_sign_prob", 0) > 0.6:
        score += 40
        reasons.append("Parked in No Parking Zone")
    if ai_probs.get("no_stopping_sign_prob", 0) > 0.6:
        score += 45
        reasons.append("Stopped in No Stopping Zone")
    if ai_probs.get("yellow_box_prob", 0) > 0.6:
        score += 30
        reasons.append("Parked on yellow box marking")

    if geo_data.get("near_junction"):
        score += 25
        reasons.append("Parked near junction/intersection")
    if geo_data.get("near_hospital_school"):
        score += 25
        reasons.append("Parked near hospital / school entry")
    if geo_data.get("near_bus_stop"):
        score += 25
        reasons.append("Parked at bus stop / bus lane")

    score = min(100, score)

    if score <= 29:
        verdict = "CORRECT"
    elif score <= 59:
        verdict = "SUSPICIOUS"
    else:
        verdict = "WRONG_PARKING"

    return score, verdict, reasons

@app.post("/api/analyze", response_model=ParkingAnalysisResponse)
async def analyze_parking(request: Request, file: UploadFile = File(...)):
    client_ip = request.client.host
    current_time = time.time()
    if client_ip in user_rate_limits:
        requests = [t for t in user_rate_limits[client_ip] if current_time - t < 3600]
        if len(requests) >= 5:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
        requests.append(current_time)
        user_rate_limits[client_ip] = requests
    else:
        user_rate_limits[client_ip] = [current_time]

    try:
        image_data = await file.read()
        
        img_hash = hashlib.md5(image_data).hexdigest()
        if img_hash in image_hashes:
            raise HTTPException(status_code=400, detail="Duplicate image detected. Please capture a new photo.")
        image_hashes.add(img_hash)

        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = """Analyze this image for parking violations in India. 
        Return ONLY a JSON object with probabilities (0.0 to 1.0) for the following:
        {
          "plate_detected": bool,
          "footpath_prob": float,
          "crosswalk_prob": float,
          "double_park_prob": float,
          "no_parking_sign_prob": float,
          "no_stopping_sign_prob": float,
          "blocking_entrance_prob": float,
          "yellow_box_prob": float
        }"""

        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_data}
        ])
        
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        ai_probs = json.loads(json_text)
        
        geo_data = {
            "near_junction": random.random() > 0.8,
            "near_pedestrian_crossing": random.random() > 0.85,
            "near_hospital_school": random.random() > 0.9,
            "near_bus_stop": random.random() > 0.85
        }

        score, verdict, reason_codes = calculate_parking_score(ai_probs, geo_data)
        
        result = {
            "id": str(random.randint(10000, 99999)),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "plate_detected": ai_probs.get("plate_detected", True),
            "footpath_prob": ai_probs.get("footpath_prob", 0.0),
            "crosswalk_prob": ai_probs.get("crosswalk_prob", 0.0),
            "double_park_prob": ai_probs.get("double_park_prob", 0.0),
            "no_parking_sign_prob": ai_probs.get("no_parking_sign_prob", 0.0),
            "blocking_entrance_prob": ai_probs.get("blocking_entrance_prob", 0.0),
            "score": score,
            "verdict": verdict,
            "reason_codes": reason_codes
        }
        
        reports_db.append(result)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

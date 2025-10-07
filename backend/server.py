from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime, timezone

# Import auth modules
from auth_routes import router as auth_router
from auth_middleware import get_current_active_user
from auth_models import User
from auth_utils import hash_password, prepare_user_for_mongo


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Store database in app state for dependency injection
app.state.db = db

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/estradas-rurais")
async def get_estradas_rurais(current_user: User = Depends(get_current_active_user)):
    import aiohttp
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://sheets.googleapis.com/v4/spreadsheets/1jaHnRgqRyMLjZVvaRSkG2kOyZ4kMEBgsPhwYIGVj490/values/A:G?key=AIzaSyBdd6E9Dz5W68XdhLCsLIlErt1ylwTt5Jk"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    raise Exception(f"API request failed with status {response.status}")
    except Exception as e:
        logger.error(f"Error fetching Google Sheets data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data from Google Sheets")

# Include routers in the main app
app.include_router(api_router)
app.include_router(auth_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

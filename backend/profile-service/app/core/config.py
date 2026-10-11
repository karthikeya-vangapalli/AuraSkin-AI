from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically locate possible .env paths relative to this file
current_file = Path(__file__).resolve()
service_dir = current_file.parents[2]      # backend/profile-service
backend_dir = current_file.parents[3]      # backend
config_dir = current_file.parent           # backend/profile-service/app/core

env_candidates = [
    service_dir / ".env",
    backend_dir / ".env",
    config_dir / ".env",
    Path(".env"),
]

for p in env_candidates:
    if p.exists() and p.is_file():
        load_dotenv(dotenv_path=p, override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Skin Intelligence - Profile Service"
    API_V1_STR: str = "/api/v1"
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "skin_profile_db"
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=[str(p) for p in env_candidates if p.exists()],
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

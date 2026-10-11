from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically locate possible .env paths relative to this file
current_file = Path(__file__).resolve()
service_dir = current_file.parents[2]      # backend/user-service
backend_dir = current_file.parents[3]      # backend
config_dir = current_file.parent           # backend/user-service/app/core

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
    PROJECT_NAME: str = "Skin Intelligence - User Service"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "123456"
    POSTGRES_DB: str = "skincare_db"
    DATABASE_URL: Optional[str] = "postgresql+asyncpg://postgres:123456@localhost:5432/skincare_db"

    model_config = SettingsConfigDict(
        env_file=[str(p) for p in env_candidates if p.exists()],
        case_sensitive=True,
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()

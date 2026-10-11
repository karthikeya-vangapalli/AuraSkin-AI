import os

HOST = "0.0.0.0"
PORT = 8003


class Settings:
	SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-in-production")
	ALGORITHM = os.getenv("ALGORITHM", "HS256")


settings = Settings()

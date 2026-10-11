import os

HOST = "0.0.0.0"
PORT = 8003


class Settings:
	SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET", "auraskin_super_secret_production_key_2026_jwt_token"))
	ALGORITHM = os.getenv("ALGORITHM", "HS256")


settings = Settings()

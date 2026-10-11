from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import HOST, PORT
from app.api.v1.endpoints.skin import router as skin_router
from app.api.v1.endpoints.ingredients import router as ingredients_router
from app.api.v1.endpoints.recommendations import router as recommendations_router

app = FastAPI(title="AI Skin Service", version="1.0.0")

origins = [
    "https://aura-skin-ai-flame.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(skin_router, prefix="/api/v1")
app.include_router(ingredients_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")

from app.services.recommendation_engine import PRODUCT_CATALOG

@app.get("/health")
def health_check():
    catalog_count = len(PRODUCT_CATALOG)
    overall_status = "healthy" if catalog_count > 0 else "degraded"
    return {
        "status": overall_status,
        "service": "AI Skin Service",
        "catalog_size": catalog_count
    }

@app.get("/api/v1/skin/health")
def proxied_health_check():
    return health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)

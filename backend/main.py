import sys
import pathlib
import importlib.util
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resolve backend root and microservices base directories
BACKEND_DIR = pathlib.Path(__file__).resolve().parent

# Force load the root .env file BEFORE loading microservice modules
load_dotenv(dotenv_path=BACKEND_DIR / ".env", override=True)

USER_SERVICE_DIR = BACKEND_DIR / "user-service"
PROFILE_SERVICE_DIR = BACKEND_DIR / "profile-service"
AI_SKIN_SERVICE_DIR = BACKEND_DIR / "ai-skin-service"

# Ensure microservice directories are available in sys.path
for srv_dir in (str(USER_SERVICE_DIR), str(PROFILE_SERVICE_DIR), str(AI_SKIN_SERVICE_DIR)):
    if srv_dir not in sys.path:
        sys.path.insert(0, srv_dir)


def load_service_module(service_dir: pathlib.Path, rel_path: str, module_name: str):
    """
    Dynamically load a microservice module and ensure its local 'app' package
    takes precedence without causing namespace collisions with peer microservices.
    """
    # Also load the specific microservice .env if present
    load_dotenv(dotenv_path=service_dir / ".env", override=True)

    srv_dir_str = str(service_dir)
    if srv_dir_str in sys.path:
        sys.path.remove(srv_dir_str)
    sys.path.insert(0, srv_dir_str)

    # Purge cached local 'app' package modules to cleanly load the target microservice
    for key in list(sys.modules.keys()):
        if key == "app" or key.startswith("app."):
            del sys.modules[key]

    target_file = service_dir / rel_path
    spec = importlib.util.spec_from_file_location(module_name, target_file)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module {module_name} from {target_file}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


# 1. Load User Service database and router
user_db_mod = load_service_module(USER_SERVICE_DIR, "app/core/database.py", "user_service_db")
user_router_mod = load_service_module(USER_SERVICE_DIR, "app/api/v1/router.py", "user_service_router")

# 2. Load Profile Service database and router
profile_db_mod = load_service_module(PROFILE_SERVICE_DIR, "app/core/database.py", "profile_service_db")
profile_router_mod = load_service_module(PROFILE_SERVICE_DIR, "app/api/v1/router.py", "profile_service_router")

# 3. Load AI Skin Service analyze router
ai_analyze_mod = load_service_module(AI_SKIN_SERVICE_DIR, "app/api/v1/endpoints/analyze.py", "ai_skin_service_analyze")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan handler to initialize PostgreSQL tables and MongoDB Beanie ODM connections.
    """
    # Initialize PostgreSQL tables (user-service)
    try:
        if hasattr(user_db_mod, "engine") and hasattr(user_db_mod, "Base"):
            async with user_db_mod.engine.begin() as conn:
                await conn.run_sync(user_db_mod.Base.metadata.create_all)
            print("[Lifespan] PostgreSQL tables verified/created successfully.")
    except Exception as exc:
        print(f"[Lifespan Warning] PostgreSQL initialization skipped or failed: {exc}")

    # Initialize MongoDB Beanie ODM (profile-service)
    try:
        if hasattr(profile_db_mod, "init_db"):
            await profile_db_mod.init_db()
            print("[Lifespan] MongoDB Beanie ODM initialized successfully.")
    except Exception as exc:
        print(f"[Lifespan Warning] MongoDB initialization skipped or failed: {exc}")

    yield


# Create unified root FastAPI app
app = FastAPI(
    title="AuraSkin AI Unified API",
    description="Unified API Gateway merging User Service, Profile & Lifestyle Service, and AI Skin Intelligence Service.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Global CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount User Service routes under /api/v1
app.include_router(user_router_mod.api_router, prefix="/api/v1")

# Mount Profile & Lifestyle routes under /api/v1
app.include_router(profile_router_mod.api_router, prefix="/api/v1")

# Mount AI Skin Analysis routes under /api/v1/ai
app.include_router(ai_analyze_mod.router, prefix="/api/v1/ai", tags=["AI Skin Scanner"])


@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "AuraSkin AI Unified Gateway",
        "services_merged": ["user-service", "profile-service", "ai-skin-service"],
        "port": 8000,
    }
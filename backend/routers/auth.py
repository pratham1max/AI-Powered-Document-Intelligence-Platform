"""
Auth router — Firebase handles all authentication.
The backend only exposes /auth/me to return the current user's DB record.
User creation/upsert happens automatically in the get_current_user dependency.
"""
from fastapi import APIRouter, Depends
from models.models import User
from schemas.schemas import UserOut
from routers.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.database import get_async_db
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])

logger = logging.getLogger(__name__)

@router.get("/")
async def list_users(
    db: AsyncSession = Depends(get_async_db)
):
    """List all users """
    try:
        users = await db.execute(select(User).order_by(User.created_at.desc()))
        users = users.scalars().all()
        return [
            UserResponse(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                is_superuser=user.is_superuser,
                last_login=user.last_login
            )
                for user in users
            ]
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list users")

@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_async_db)
    ):

    """Get user details by ID"""

    user = await db.execute(select(User).where(User.id == user_id))
    if not user.scalar():
        raise HTTPException(status_code=404, detail="User not found")

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        last_login=user.last_login
    )
    return user_response

@router.post("/")
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new user"""
    try:
        # check if user already exists
        user_exists = await db.execute(select(User).where(User.email == user.email))
        if user_exists.scalar():
            raise HTTPException(status_code=400, detail="User already exists")

        user = User(
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            hashed_password=user.password,
            is_active=True,
            is_superuser=False,
            last_login=datetime.now()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            last_login=user.last_login
        )
        return user_response
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create user")

@router.put("/{user_id}")
async def update_user(
    user_id: int, 
    userUpdate: UserUpdate, 
    db: AsyncSession = Depends(get_async_db)):
    """Update a user by ID"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if userUpdate.first_name:
            user.first_name = userUpdate.first_name
        if userUpdate.last_name:
            user.last_name = userUpdate.last_name
        if userUpdate.is_superuser:
            user.is_superuser = userUpdate.is_superuser
        await db.commit()
        await db.refresh(user)
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            last_login=user.last_login
        )
        return user_response
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user")

@router.delete("/{user_id}")
async def delete_user(
    user_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a user by ID"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await db.delete(user)
        await db.commit()
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            last_login=user.last_login
        )
        return user_response
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user")



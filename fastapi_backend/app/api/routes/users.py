from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import logging

from app.schemas.user import UserResponse, UserResponseWithFaculty, UserRoleUpdate, UserUpdate
from app.database import get_async_db
from app.models.user import User, VerifyStatus, UserRoles
from app.middleware.authorization import require_basic_or_higher, require_faculty_admin_or_higher

router = APIRouter(prefix="/api/users", tags=["users"])

logger = logging.getLogger(__name__)

@router.get("", response_model=List[UserResponseWithFaculty])
@require_faculty_admin_or_higher(require_admin_verified=True)
async def list_users(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """List users based on role: SuperAdmin sees all, FacultyAdmin sees their faculty users"""
    try:
        user_info = request.state.current_user
        user_role = user_info["role"]
        user_faculty_id = user_info["faculty_id"]
        
        if user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can see all users
            result = await db.execute(
                select(User).options(selectinload(User.faculty)).order_by(User.created_at.desc())
            )
        elif user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only see users from their faculty
            result = await db.execute(
                select(User).options(selectinload(User.faculty)).where(User.faculty_id == user_faculty_id).order_by(User.created_at.desc())
            )
        else:
            # Basic users cannot list users
            raise HTTPException(status_code=403, detail="Insufficient permissions to list users")
        
        users = result.scalars().all()
        return [UserResponseWithFaculty.from_orm(user) for user in users]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list users")

@router.get("/{user_id}", response_model=UserResponseWithFaculty)
@require_basic_or_higher(require_admin_verified=True)
async def get_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Get user details by ID with role-based access control"""
    try:
        user_info = request.state.current_user
        current_user_id = user_info["id"]
        current_user_role = user_info["role"]
        current_user_faculty_id = user_info["faculty_id"]
        
        # Get the requested user
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check access permissions
        if current_user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can see any user
            pass
        elif current_user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only see users from their faculty
            if user.faculty_id != current_user_faculty_id:
                raise HTTPException(status_code=403, detail="Access denied. User not in your faculty")
        elif current_user_role == UserRoles.BASIC.value:
            # Basic users can only see themselves
            if user.id != current_user_id:
                raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile")
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")

        return UserResponseWithFaculty.from_orm(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user")


@router.put("/{user_id}", response_model=UserResponse)
@require_basic_or_higher(require_admin_verified=True)
async def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Update a user by ID with role-based access control"""
    try:
        user_info = request.state.current_user
        current_user_id = user_info["id"]
        current_user_role = user_info["role"]
        current_user_faculty_id = user_info["faculty_id"]
        
        # Get the user to update
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check update permissions
        if current_user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can update any user
            pass
        elif current_user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only update users from their faculty
            if user.faculty_id != current_user_faculty_id:
                raise HTTPException(status_code=403, detail="Access denied. User not in your faculty")
        elif current_user_role == UserRoles.BASIC.value:
            # Basic users can only update themselves
            if user.id != current_user_id:
                raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile")
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")
        
        # Update fields if provided
        if user_update.first_name is not None:
            user.first_name = user_update.first_name
        if user_update.last_name is not None:
            user.last_name = user_update.last_name
        if user_update.faculty_id is not None:
            user.faculty_id = user_update.faculty_id
            
        await db.commit()
        
        # Re-query the user with faculty relationship to avoid greenlet issues
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        updated_user = result.scalar_one()
        
        return UserResponse.from_orm(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user")
    
@router.patch("/{user_id}/verify", response_model=UserResponse)
@require_faculty_admin_or_higher(require_admin_verified=True)
async def verify_user(
    user_id: int, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Verify a user by setting their verify status to admin verified"""
    try:
        user_info = request.state.current_user
        current_user_role = user_info["role"]
        current_user_faculty_id = user_info["faculty_id"]
        
        # Get the user to verify
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check verification permissions
        if current_user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can verify any user
            pass
        elif current_user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only verify users from their faculty
            if user.faculty_id != current_user_faculty_id:
                raise HTTPException(status_code=403, detail="Access denied. User not in your faculty")
        else:
            # Basic users cannot verify users
            raise HTTPException(status_code=403, detail="Insufficient permissions to verify users")
        
        # Update verify status to admin verified
        user.verify_status = VerifyStatus.ADMINVERIFIED
        
        await db.commit()
        
        # Re-query the user with faculty relationship to avoid greenlet issues
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        updated_user = result.scalar_one()
        
        return UserResponse.from_orm(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to verify user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify user")

@router.patch("/{user_id}/update-role", response_model=UserResponse)
@require_faculty_admin_or_higher(require_admin_verified=True)
async def update_role(
    user_id: int, 
    user_role_update: UserRoleUpdate, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Update a user's role by ID with role-based access control"""
    try:
        user_info = request.state.current_user
        current_user_role = user_info["role"]
        current_user_faculty_id = user_info["faculty_id"]
        
        # Get the user to update role
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check role update permissions
        if current_user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can update any user's role
            pass
        elif current_user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only update roles for users in their faculty
            if user.faculty_id != current_user_faculty_id:
                raise HTTPException(status_code=403, detail="Access denied. User not in your faculty")
        else:
            # Basic users cannot update roles
            raise HTTPException(status_code=403, detail="Insufficient permissions to update user roles")
        
        # Convert string role to enum
        try:
            new_role = UserRoles(user_role_update.role)
            user.role = new_role
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {user_role_update.role}")
        
        await db.commit()
        
        # Re-query the user with faculty relationship to avoid greenlet issues
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        updated_user = result.scalar_one()
        
        return UserResponse.from_orm(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user role: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user role")
    

@router.delete("/{user_id}", response_model=UserResponse)
@require_basic_or_higher(require_admin_verified=True)
async def delete_user(
    user_id: int, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a user by ID with role-based access control"""
    try:
        user_info = request.state.current_user
        current_user_id = user_info["id"]
        current_user_role = user_info["role"]
        current_user_faculty_id = user_info["faculty_id"]
        
        # Get the user to delete
        result = await db.execute(
            select(User).options(selectinload(User.faculty)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check deletion permissions
        if current_user_role == UserRoles.SUPERADMIN.value:
            # SuperAdmin can delete any user
            pass
        elif current_user_role == UserRoles.FACULTYADMIN.value:
            # FacultyAdmin can only delete users from their faculty
            if user.faculty_id != current_user_faculty_id:
                raise HTTPException(status_code=403, detail="Access denied. User not in your faculty")
        elif current_user_role == UserRoles.BASIC.value:
            # Basic users can only delete themselves
            if user.id != current_user_id:
                raise HTTPException(status_code=403, detail="Access denied. You can only delete your own profile")
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")
        
        # Store user data before deletion for response
        user_response = UserResponse.from_orm(user)
        
        await db.delete(user)
        await db.commit()
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user")



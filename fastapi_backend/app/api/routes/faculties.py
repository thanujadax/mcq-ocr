from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas.faculty import FacultyAdmin, FacultyCreate, FacultyResponse, FacultyUpdate
from app.database import get_async_db
from app.models.faculty import Faculty
from app.models.user import User
from app.models.user import UserRoles
from app.middleware.authorization import require_basic_or_higher, require_superadmin

router = APIRouter(prefix="/api/faculties", tags=["faculties"])

logger = logging.getLogger(__name__)


@router.get("", response_model=List[FacultyResponse])
async def list_faculties(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """List all faculties"""
    try:
        result = await db.execute(select(Faculty).order_by(Faculty.created_at.desc()))
        faculties = result.scalars().all()
        return [FacultyResponse.from_orm(faculty) for faculty in faculties]
    except Exception as e:
        logger.error(f"Failed to list faculties: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list faculties")


@router.get("/{faculty_id}", response_model=FacultyResponse)
async def get_faculty(
    faculty_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Get faculty details by ID"""
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    faculty = result.scalar_one_or_none()
    
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return FacultyResponse.from_orm(faculty)


@router.post("", response_model=FacultyResponse, status_code=201)
@require_superadmin(require_admin_verified=True)
async def create_faculty(
    faculty_data: FacultyCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new faculty"""
    try:
        # Check if faculty already exists
        result = await db.execute(select(Faculty).where(Faculty.name == faculty_data.name))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Faculty with this name already exists")

        new_faculty = Faculty(
            name=faculty_data.name
        )
        
        db.add(new_faculty)
        await db.commit()
        await db.refresh(new_faculty)
        
        return FacultyResponse.from_orm(new_faculty)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create faculty: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create faculty")


@router.put("/{faculty_id}", response_model=FacultyResponse)
@require_superadmin(require_admin_verified=True)
async def update_faculty(
    faculty_id: int, 
    faculty_update: FacultyUpdate, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Update a faculty by ID"""
    try:
        faculty = await db.get(Faculty, faculty_id)
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        # Update fields if provided
        if faculty_update.name is not None:
            # Check if new name already exists for another faculty
            result = await db.execute(
                select(Faculty).where(
                    Faculty.name == faculty_update.name,
                    Faculty.id != faculty_id
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Faculty with this name already exists")
            
            faculty.name = faculty_update.name
            
        await db.commit()
        await db.refresh(faculty)
        
        return FacultyResponse.from_orm(faculty)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update faculty: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update faculty")


@router.delete("/{faculty_id}", response_model=FacultyResponse)
@require_superadmin(require_admin_verified=True)
async def delete_faculty(
    faculty_id: int, 
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a faculty by ID"""
    try:
        faculty = await db.get(Faculty, faculty_id)
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        # Check if faculty has associated users
        
        user_result = await db.execute(select(User).where(User.faculty_id == faculty_id))
        associated_users = user_result.scalars().all()
        
        if associated_users:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete faculty. {len(associated_users)} user(s) are associated with this faculty."
            )
        
        # Store faculty data before deletion for response
        faculty_response = FacultyResponse.from_orm(faculty)
        
        await db.delete(faculty)
        await db.commit()
        
        return faculty_response
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete faculty: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete faculty")
    

@router.get("/{faculty_id}/admins", response_model=List[FacultyAdmin])
@require_basic_or_higher(require_admin_verified=False)
async def get_faculty_admins(
    faculty_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Get all admin users for a specific faculty"""
    try:

        # Check if user has permission to view faculty admins
        current_user = request.state.current_user
        
        # Handle both User objects and dict objects (for super user)
        if isinstance(current_user, dict):
            user_role = current_user.get("role")
            user_faculty_id = current_user.get("faculty_id")
        else:
            user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
            user_faculty_id = current_user.faculty_id
            
        if user_role != UserRoles.SUPERADMIN.value and user_faculty_id != faculty_id:
            raise HTTPException(status_code=403, detail="Access denied. You can only view admins from your own faculty.")

        # First check if faculty exists
        faculty_result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
        faculty = faculty_result.scalar_one_or_none()
        
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        

        
        # Get all admin users for this faculty
        
        admin_users_result = await db.execute(
            select(User).where(
                User.faculty_id == faculty_id,
                User.role == UserRoles.FACULTYADMIN)
            )
        
        admin_users = admin_users_result.scalars().all()
        
        return [FacultyAdmin.from_orm(user) for user in admin_users]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get faculty admins: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get faculty admins")

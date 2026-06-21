from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Request
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging

from app.schemas.template import TemplateResponse, TemplateCreate, TemplateUpdate
from app.models import Template, TemplateConfigJob
from app.models.template import TemplateConfigStatus, TemplateConfigType
from app.models.template_config_job import TemplateConfigJobPriority
from app.database import get_async_db
from app.queue import submit_template_config_job
from app.models.file import FileOrFolder
from app.websocket import WebSocketManager
from app.api.deps import get_websocket_manager
from app.storage.shared_storage import SharedStorage
from app.models.file import FileOrFolder, FileOrFolderStatus
from app.middleware.authorization import require_non_super_admin
from app.middleware.websocket_auth import authorize_websocket
from app.models.user import UserRoles

router = APIRouter(prefix="/api/templates", tags=["templates"])
logger = logging.getLogger(__name__)

@router.post("", status_code=201)
@require_non_super_admin(require_admin_verified=True)
async def create_template(
    request: Request,
    template: TemplateCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new template and return job_id for configuration"""
    # Get user from token for ownership tracking
    user_id = request.state.current_user.id
    try:
        # Step 1: Add details to template table
        template_record = Template(
            name=template.name,
            description=template.description,
            config_type=template.config_type,
            status=TemplateConfigStatus.QUEUED,
            num_questions=0,  # Will be updated after configuration
            num_of_options_per_question=template.num_of_options_per_question or 0,
            num_of_columns=template.num_of_columns,
            num_of_rows_per_column=template.num_of_rows_per_column,
            template_file_id=None, # Will be set after processing
            configuration_file_id=None,  # Will be set after processing
            created_by=user_id
        )
        
        db.add(template_record)
        await db.commit()
        await db.refresh(template_record)

        # Generate paths for configuration
        random_id = str(uuid.uuid4())[:8]
        template_config_path = f"templates/{user_id}/{template_record.id}_{random_id}_config.json"
        output_image_path = f"templates/{user_id}/{template_record.id}_{random_id}_template.jpg"
        result_image_path = f"intermediate/templates/{user_id}/{template_record.id}_{random_id}_result.jpg" if template.save_intermediate_results else None

        # Verify template file exists
        template_file = await db.get(FileOrFolder, template.template_file_id)
        if not template_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template file with id {template.template_file_id} not found"
            )
        
        # Create configuration job
        config_job = TemplateConfigJob(
            name=f"Config for {template.name}",
            description=f"Template configuration for {template.name}",
            template_id=template_record.id,
            template_path=template_file.path,
            template_config_path=template_config_path,
            output_image_path=output_image_path,
            debug_image_path=result_image_path,
            save_intermediate_results=template.save_intermediate_results,
            priority=TemplateConfigJobPriority.NORMAL,
            num_of_columns=template.num_of_columns,
            num_of_rows_per_column=template.num_of_rows_per_column,
            num_of_options_per_question=template.num_of_options_per_question,
            created_by=user_id
        )
        
        db.add(config_job)
        await db.commit()
        await db.refresh(config_job)

        # Return response with job_id
        return {
            "job_id": config_job.id
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )

@router.get("", response_model=List[TemplateResponse])
@require_non_super_admin(require_admin_verified=True)
async def list_templates(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    config_type: Optional[TemplateConfigType] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    List all templates
    """
    # Get user from token for ownership filtering
    user_id = request.state.current_user.id
    try:
        query = select(Template)
        query = query.where(Template.created_by == user_id)
        
        if config_type:
            query = query.where(Template.config_type == config_type)
        
        query = query.offset(skip).limit(limit).order_by(Template.created_at.desc())
        
        result = await db.execute(query)
        templates = result.scalars().all()
        
        return [
            TemplateResponse(
                id=template.id,
                name=template.name,
                description=template.description,
                status=template.status,
                config_type=template.config_type,
                configuration_file_id=template.configuration_file_id,
                template_file_id=template.template_file_id,
                num_questions=template.num_questions,
                num_of_columns= template.num_of_columns,
                num_of_rows_per_column= template.num_of_rows_per_column,
                num_of_options_per_question=template.num_of_options_per_question,
                created_at=template.created_at,
                updated_at=template.updated_at,
                created_by=template.created_by
            )
            for template in templates
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list templates: {str(e)}"
        )

@router.get("/{template_id}", response_model=TemplateResponse)
@require_non_super_admin(require_admin_verified=True)
async def get_template(
    request: Request,
    template_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get template details by ID
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id
    try:
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )
        
        return TemplateResponse(
            id=template.id,
            name=template.name,
            description=template.description,
            status=template.status,
            config_type=template.config_type,
            configuration_file_id=template.configuration_file_id,
            template_file_id=template.template_file_id,
            num_questions=template.num_questions,
            num_of_columns= template.num_of_columns,
            num_of_rows_per_column= template.num_of_rows_per_column,
            num_of_options_per_question=template.num_of_options_per_question,
            created_at=template.created_at,
            updated_at=template.updated_at,
            created_by=template.created_by
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template: {str(e)}"
        )

@router.get("/config-job/{templateConfigJob_id}")
@require_non_super_admin(require_admin_verified=True)
async def get_template_config_job(
    request: Request,
    templateConfigJob_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get template config job details by ID
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id
    try:
        templateConfigJob = await db.get(TemplateConfigJob, templateConfigJob_id)
        if not templateConfigJob or templateConfigJob.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {templateConfigJob} not found"
            )
        
        return {
            "template_id":templateConfigJob.template_id
        }
        
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get templateConfigJob: {str(e)}"
        )

@router.put("/{template_id}", response_model=TemplateResponse)
@require_non_super_admin(require_admin_verified=True)
async def update_template(
    request: Request,
    template_id: int,
    template_update: TemplateCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a template by ID
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id
    try:
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )
        
        # Update template fields
        template.name = template_update.name
        template.description = template_update.description
        template.config_type = template_update.config_type
        template.template_file_id = template_update.template_file_id
        
        await db.commit()
        await db.refresh(template)
        
        return TemplateResponse(
            id=template.id,
            name=template.name,
            description=template.description,
            status=template.status,
            config_type=template.config_type,
            configuration_file_id=template.configuration_file_id,
            template_file_id=template.template_file_id,
            num_questions=template.num_questions,
            num_of_columns= template.num_of_columns,
            num_of_rows_per_column= template.num_of_rows_per_column,
            num_of_options_per_question=template.num_of_options_per_question,
            created_at=template.created_at,
            updated_at=template.updated_at,
            created_by=template.created_by
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update template: {str(e)}"
        )

@router.delete("/{template_id}")
@require_non_super_admin(require_admin_verified=True)
async def delete_template(
    request: Request,
    template_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete a template by ID, including associated files stored in shared storage.
    Steps:
     1. Fetch template record and ensure ownership.
     2. For template.template_file_id and template.configuration_file_id:
         - Look up the FileOrFolder record to obtain the real path.
         - Delete the file or directory from shared storage.
         - Delete the FileOrFolder DB record (optional but done here).
     3. Delete the Template record.
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id
    shared_storage = SharedStorage()

    try:
        # 1) Fetch template record
        template = await db.get(Template, template_id)
        if not template or template.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )

    

        # Helper to delete file/folder given a FileOrFolder id
        async def _delete_file_or_folder_record(file_id: int):
            """
            Returns tuple (deleted_path, deleted_db_id) or (None, None) if not found.
            """
            result = await db.execute(
                select(FileOrFolder).where(
                    FileOrFolder.id == file_id,
                    FileOrFolder.created_by == user_id,
                    FileOrFolder.status == FileOrFolderStatus.UPLOADED
                )
            )
            file_record = result.scalar_one_or_none()
            if not file_record:
                # Not found in DB or not owned by user
                logger.info(f"FileOrFolder id={file_id} not found or not owned by user {user_id}")
                return None, None

            file_path = file_record.path  # path string expected
            logger.info(f"Deleting shared storage path for FileOrFolder id={file_id}: {file_path}")


            try:
                
                    # Delete file
                await shared_storage.delete_file(file_path)

                # After physical deletion, remove DB record
                file_record.status = FileOrFolderStatus.DELETED
                await db.flush()

                
                return 

            except FileNotFoundError:
                # File already removed on disk; still delete DB record
                try:
                    file_record.status = FileOrFolderStatus.DELETED
                    await db.flush()

                except Exception as e:
                    logger.exception("Failed to delete FileOrFolder DB record after missing file: %s", e)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to clean up DB record for file id {file_id}: {str(e)}"
                    )
                logger.info(f"File not present on disk for path: {file_path}. DB record removed.")
                return 

            except Exception as e:
                logger.exception("Error deleting file/folder %s: %s", file_path, e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to delete file/folder {file_path}: {str(e)}"
                )

        # 2) Delete template file (if present)
        if getattr(template, "template_file_id", None):
            await _delete_file_or_folder_record(template.template_file_id)

        # 3) Delete configuration file/folder (if present)
        if getattr(template, "configuration_file_id", None):
            await _delete_file_or_folder_record(template.configuration_file_id)

        # 4) Delete template DB record
        await db.delete(template)
        await db.commit()

        return 

    except HTTPException:
        # Re-raise HTTPExceptions so FastAPI handles them as-is
        raise
    except Exception as e:
        # Rollback on unexpected exceptions
        await db.rollback()
        logger.exception("Failed to delete template %s: %s", template_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete template: {str(e)}"
        )
@router.websocket("/{job_id}/configure")
async def configure_template_websocket(
    job_id: int,
    websocket: WebSocket,
    db: AsyncSession = Depends(get_async_db),
    websocket_manager: WebSocketManager = Depends(get_websocket_manager)
):
    """Configure template via WebSocket"""
    logger.info(f"WebSocket endpoint called for template config job {job_id}")
    
    try:
        
        # Authorize WebSocket connection after accepting
        user = await authorize_websocket(
            websocket,
            allowed_roles=[UserRoles.BASIC, UserRoles.FACULTYADMIN],
            require_admin_verified=True
        )
        user_id = user.id
        logger.info(f"WebSocket authorization successful for user {user_id}")
        
        # Connect to WebSocket manager
        await websocket_manager.connect_template_config(str(job_id), websocket)
        logger.info(f"WebSocket connection established for template config job {job_id}")

        # Get the config job
        result = await db.execute(
            select(TemplateConfigJob).where(
                TemplateConfigJob.id == job_id,
                TemplateConfigJob.created_by == user_id
            )
        )
        config_job = result.scalar_one_or_none()

        if not config_job:
            await websocket.send_json({
                "status": "error",
                "message": "Template configuration job not found"
            })
            await websocket_manager.disconnect_template_config(str(job_id), websocket)
            return

        # Submit job to queue
        try:
            logger.info(f"Submitting template config job {job_id} to queue")
            await submit_template_config_job(job_id)
            
            # Send queued status
            await websocket.send_json({
                "status": "queued",
                "message": "Template configuration job queued successfully"
            })
            
            # Keep connection alive - wait for disconnection
            try:
                while True:
                    try:
                        await websocket.receive_text()
                    except WebSocketDisconnect:
                        logger.info(f"WebSocket connection closed by client for job {job_id}")
                        break
                    except Exception as e:
                        logger.error(f"Error receiving WebSocket message for job {job_id}: {e}")
                        break
            finally:
                # Ensure we disconnect from the WebSocket manager
                await websocket_manager.disconnect_template_config(str(job_id), websocket)
                logger.info(f"Cleaned up WebSocket connection for job {job_id}")

        except Exception as e:
            logger.error(f"Failed to submit template config job {job_id} to queue: {e}")
            await websocket.send_json({
                "status": "error",
                "message": f"Failed to submit configuration job: {str(e)}"
            })
            await websocket_manager.disconnect_template_config(str(job_id), websocket)
            return

    except WebSocketDisconnect:
        # WebSocket was properly closed during authorization
        logger.info(f"WebSocket authorization failed for template config job {job_id}")
    except Exception as e:
        logger.error(f"Failed to configure template job {job_id}: {str(e)}")
        # Don't try to send messages if WebSocket was never accepted
        # The authorization function handles closing the connection

@router.put("/edit/{template_id}")
@require_non_super_admin(require_admin_verified=True)
async def update_template_details(
    request: Request,
    template_id: int,
    updated_data: TemplateUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update template name and description in both Template and TemplateConfigJob tables.
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id

    try:
        # 1️⃣ Fetch template record
        result = await db.execute(
            select(Template).where(
                Template.id == template_id,
                Template.created_by == user_id
            )
        )
        template_record = result.scalar_one_or_none()

        if not template_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with id {template_id} not found"
            )

        # 2️⃣ Update name & description in Template table
        template_record.name = updated_data.name
        template_record.description = updated_data.description

        # 3️⃣ Fetch related TemplateConfigJob record
        job_result = await db.execute(
            select(TemplateConfigJob).where(
                TemplateConfigJob.template_id == template_id
            )
        )
        config_job = job_result.scalar_one_or_none()

        # 4️⃣ Update config job’s name & description
        if config_job:
            config_job.name = f"Config for {updated_data.name}"
            config_job.description = f"Template configuration for {updated_data.name}"

        # 5️⃣ Commit all changes
        await db.commit()
        await db.refresh(template_record)

        logger.info(f"Updated template {template_id} successfully")

        return 
        

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update template: {str(e)}"
        )

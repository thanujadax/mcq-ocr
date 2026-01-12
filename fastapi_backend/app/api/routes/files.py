from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, BackgroundTasks, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.file import DownloadType, FileResponse, FileResponse
from app.storage.shared_storage import SharedStorage
import logging

from app.models.file import FileOrFolder, FileOrFolderStatus, FileOrFolderType
from app.database import get_async_db

router = APIRouter(prefix="/api/files", tags=["files"])

logger = logging.getLogger(__name__)

@router.post("/upload", response_model=FileResponse)
async def upload_file(file: UploadFile = File(...),
    file_type: str = Form(...),
    db: AsyncSession = Depends(get_async_db)):
    """
    Upload a file to the system
    """
    # TODO: Get user ID from token
    user_id = 1
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    

    random_id = str(uuid.uuid4())[:8]
    upload_dir = f'uploads/{file_type}s/{user_id}'
    file_name = f"{file.filename.split('.')[0]}_{random_id}.{file.filename.split('.')[-1]}"
    extension = file.filename.split('.')[-1] if file.filename.split('.')[-1] and file.filename.split('.')[-1] != 'zip' else None
    final_path = f"{upload_dir}/{file_name}"

    # Read file content as bytes
    file_content = await file.read()
    
    shared_storage = SharedStorage()
    await shared_storage.save_file(file_content, final_path)

    # If zip file
    if file.filename.endswith('.zip'):
        try:
            logger.info(f"Unzipping file: {final_path}")
            final_path = await shared_storage.unzip_file(final_path)
            logger.info(f"Unzipped file: {final_path}")
        except Exception as e:
            logger.error(f"Failed to unzip file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to unzip file")
    
    if file_type == 'template':
        file_type = FileOrFolderType.TEMPLATE
    elif file_type == 'answer_sheet':
        file_type = FileOrFolderType.ANSWER_SHEETS_FOLDER
    elif file_type == 'marking_scheme':
        file_type = FileOrFolderType.MARKING_SCHEME
    else:
        file_type = FileOrFolderType.OTHER

    if shared_storage.file_exists(final_path):
        file_and_folder = FileOrFolder(
            name=file_name,
            original_name=file.filename,
            extension=extension,
            path=final_path,
            size=file.size if file.size else 0,
            file_type=file_type,
            status=FileOrFolderStatus.UPLOADED,
            deletion_date=datetime.now() + timedelta(days=7),
            created_by=user_id,
        )
        db.add(file_and_folder)
        await db.commit()
        await db.refresh(file_and_folder)
    
        return FileResponse(
            filename=file_name,
            file_id=file_and_folder.id,
            file_size=file_and_folder.size,
            file_type=file_and_folder.file_type,
            status=file_and_folder.status,
            deletion_date=file_and_folder.deletion_date,
            created_by=file_and_folder.created_by,
            created_at=file_and_folder.created_at,
            updated_at=file_and_folder.updated_at
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to upload file")

# Chunked upload endpoints for very large files
@router.post("/upload/large/chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    original_name: str = Form(...),
    save_path: str = Form(...),
    file_type: str = Form(...)
):
    """
    Upload a single chunk of a large file
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Create temporary directory for chunks
    temp_dir = Path(f"temp/uploads/{upload_id}")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Save chunk to temporary file
    chunk_path = temp_dir / f"chunk_{chunk_index:04d}"
    
    try:
        # Read chunk content as bytes
        chunk_content = await file.read()
        
        shared_storage = SharedStorage()
        await shared_storage.save_chunk(chunk_content, chunk_path, chunk_index)
        
        # Save upload metadata
        metadata = {
            "upload_id": upload_id,
            "original_name": original_name,
            "total_chunks": total_chunks,
            "file_type": file_type,
            "save_path": save_path,
            "chunks_received": [],
            "created_at": datetime.now().isoformat()
        }
        
        await shared_storage.update_chunks_received_metadata(temp_dir, metadata, chunk_index)
        
        return {
            "message": f"Chunk {chunk_index + 1}/{total_chunks} uploaded successfully",
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
            "upload_id": upload_id
        }
        
    except Exception as e:
        # Clean up failed chunk
        if chunk_path.exists():
            chunk_path.unlink()
        raise HTTPException(status_code=500, detail=f"Chunk upload failed: {str(e)}")

@router.post("/upload/large/finalize", response_model=FileResponse)
async def finalize_upload(
    upload_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Finalize chunked upload by combining all chunks
    """
    # TODO: Get user ID from token
    user_id = 1

    temp_dir = Path(f"temp/uploads/{upload_id}")
    
    if not temp_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")
    
    try:
        # Load metadata
        shared_storage = SharedStorage()
        metadata = await shared_storage.get_metadata(temp_dir)
        
        original_name = metadata["original_name"]
        total_chunks = metadata["total_chunks"]
        file_type = metadata["file_type"]
        chunks_received = metadata["chunks_received"]
        
        # Check if all chunks are received
        if len(chunks_received) != total_chunks:
            missing_chunks = set(range(total_chunks)) - set(chunks_received)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing chunks: {sorted(missing_chunks)}"
            )
        
        # Generate final file name and path
        random_id = str(uuid.uuid4())[:8]
        upload_dir = f'uploads/{file_type}s/{user_id}'
        file_name = f"{original_name.split('.')[0]}_{random_id}"
        extension = original_name.split('.')[-1] if '.' in original_name else None
        final_path = f"{upload_dir}/{file_name}"
        
        # Combine all chunks
        try:
            await shared_storage.combine_chunks(temp_dir, total_chunks, final_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to combine chunks: {str(e)}")
        
        # Get final file size
        file_size = (shared_storage.base_path / final_path).stat().st_size if shared_storage.file_exists(final_path) else 0
        
        # Clean up temporary files
        await shared_storage.delete_directory(temp_dir)
        
        # Create database record
        if shared_storage.file_exists(final_path):
            file_and_folder = FileOrFolder(
                name=file_name,
                original_name=original_name,
                extension=extension,
                path=final_path,
                size=file_size,
                file_type=file_type,
                status=FileOrFolderStatus.UPLOADED,
                deletion_date=datetime.now() + timedelta(days=7),
                created_by=user_id,
            )
            db.add(file_and_folder)
            await db.commit()
            await db.refresh(file_and_folder)
            
            # Process file in background
            # background_tasks.add_task(process_large_file, final_path, file_and_folder.id)
            
            return FileResponse(
                filename=file_name,
                file_id=file_and_folder.id,
                file_size=file_and_folder.size,
                file_type=file_and_folder.file_type,
                status=file_and_folder.status,
                deletion_date=file_and_folder.deletion_date,
                created_by=file_and_folder.created_by,
                created_at=file_and_folder.created_at,
                updated_at=file_and_folder.updated_at
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to finalize file upload")
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if temp_dir.exists():
            await shared_storage.delete_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"Upload finalization failed: {str(e)}")

@router.delete("/upload/cancel/{upload_id}")
async def cancel_upload(upload_id: str):
    """
    Cancel a chunked upload and clean up temporary files
    """
    temp_dir = Path(f"temp/uploads/{upload_id}")
    
    if not temp_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")

    shared_storage = SharedStorage()
    try:
        await shared_storage.delete_directory(temp_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel upload: {str(e)}")

    return {"message": "Upload cancelled and cleaned up successfully"}

@router.get("/", response_model=List[FileResponse])
async def list_files(
    folder: str = Query(None),
    file_type: str = Query(None),
    db: AsyncSession = Depends(get_async_db)
):
    """
    List all uploaded files with optional filtering by folder or file type
    """
    # TODO: Get user ID from token
    user_id = 1
    
    try:
        # Build query
        query = select(FileOrFolder).where(
            FileOrFolder.created_by == user_id
        ).order_by(FileOrFolder.created_at.desc())
        
        # Add optional filters
        if file_type:
            query = query.where(FileOrFolder.file_type == file_type)
        
        if folder:
            query = query.where(FileOrFolder.path.like(f"%{folder}%"))
        
        # Execute query
        result = await db.execute(query)
        files = result.scalars().all()
        
        # Convert to response format
        file_responses = []
        for file in files:
            file_responses.append(FileResponse(
                filename=file.name,
                file_id=file.id,
                file_size=file.size,
                file_type=file.file_type,
                status=file.status,
                deletion_date=file.deletion_date,
                created_by=file.created_by,
                created_at=file.created_at,
                updated_at=file.updated_at
            ))
        
        return file_responses
        
    except Exception as e:
        logger.error(f"Failed to list files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/download")
async def download_file(
    method: DownloadType = Query(..., description="Download method: 'file_id' or 'path'"),
    file_id: Optional[int] = Query(None, description="File ID if using 'file_id' method"),
    path: Optional[str] = Query(None, description="File path if using 'path' method"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Download a file by ID
    """
    # TODO: Get user ID from token
    user_id = 1
    
    try:
        # Query for the file
        if method == DownloadType.FILEID:
            if not file_id:
                raise HTTPException(status_code=400, detail="file_id is required when using 'file_id' method")
            
            result = await db.execute(
                select(FileOrFolder).where(
                    FileOrFolder.id == file_id,
                    FileOrFolder.created_by == user_id,
                    FileOrFolder.status == FileOrFolderStatus.UPLOADED
                )
            )
            file = result.scalar_one_or_none()
            
            if not file:
                raise HTTPException(status_code=404, detail="File not found")
            file_path = file.path
            filename = file.original_name or file.name
            file_size = file.size
            file_extension = file.extension
        else:
            if not path:
                raise HTTPException(status_code=400, detail="path is required when using 'path' method")
            file_path = path
            filename = Path(path).name
            file_size = None
            file_extension = Path(path).suffix[1:] if Path(path).suffix else None
            file = None  # No file object when using path method
        
        # Check if file exists in storage
        shared_storage = SharedStorage()
        if not shared_storage.file_exists(file_path):
            raise HTTPException(status_code=404, detail="File not found in storage")
        
        # Get file content as bytes
        file_content = await shared_storage.get_file(file_path)
        
        # Calculate actual content length
        actual_content_length = len(file_content)
        
        # Create streaming response
        def iterfile():
            yield file_content
        
        # Determine content type based on extension
        content_type = "application/octet-stream"
        if file_extension:
            if file_extension.lower() in ['jpg', 'jpeg']:
                content_type = "image/jpeg"
            elif file_extension.lower() == 'png':
                content_type = "image/png"
            elif file_extension.lower() == 'pdf':
                content_type = "application/pdf"
            elif file_extension.lower() == 'zip':
                content_type = "application/zip"
            elif file_extension.lower() in ['xlsx', 'xls']:
                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
        return StreamingResponse(
            iterfile(),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(actual_content_length)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file")

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Get file details by ID
    """
    # TODO: Get user ID from token
    user_id = 1
    
    try:
        # Query for the file
        result = await db.execute(
            select(FileOrFolder).where(
                FileOrFolder.id == file_id,
                FileOrFolder.created_by == user_id,
                FileOrFolder.status != FileOrFolderStatus.DELETED
            )
        )
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            filename=file.name,
            file_id=file.id,
            file_size=file.size,
            file_type=file.file_type,
            status=file.status,
            deletion_date=file.deletion_date,
            created_by=file.created_by,
            created_at=file.created_at,
            updated_at=file.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")

@router.delete("/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Delete a file by ID (soft delete - marks as deleted)
    """
    # TODO: Get user ID from token
    user_id = 1
    
    try:
        # Query for the file
        result = await db.execute(
            select(FileOrFolder).where(
                FileOrFolder.id == file_id,
                FileOrFolder.created_by == user_id,
                FileOrFolder.status != FileOrFolderStatus.DELETED
            )
        )
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Soft delete - mark as deleted instead of physically removing
        file.status = FileOrFolderStatus.DELETED
        file.deletion_date = datetime.now()
        
        await db.commit()
        await db.refresh(file)
        
        # Optionally delete from storage as well
        shared_storage = SharedStorage()
        try:
            if shared_storage.file_exists(file.path):
                await shared_storage.delete_file(file.path)
                logger.info(f"Physical file deleted from storage: {file.path}")
        except Exception as storage_error:
            logger.warning(f"Failed to delete physical file from storage: {storage_error}")
            # Continue with database deletion even if storage deletion fails
        
        return {"message": f"File {file_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")



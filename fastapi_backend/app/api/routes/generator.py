import datetime
from fastapi import APIRouter, HTTPException, Form, Response, Request, Depends
import uuid
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.file import FileResponse
from app.storage.shared_storage import SharedStorage
from app.template_generator import generate_template_pdf
from app.middleware.authorization import require_non_super_admin
from app.models.file import FileOrFolder, FileOrFolderStatus, FileOrFolderType
from app.database import get_async_db
import logging

router = APIRouter(prefix="/api/custom_template", tags=["custom_template"])

logger = logging.getLogger(__name__)

@router.post("/generate", response_model=FileResponse, status_code=201)
@require_non_super_admin(require_admin_verified=True)
async def generate_pdf(
    request: Request,
    title: str = Form(...),
    questions: int = Form(...),
    options: int = Form(...),
    max_qpc: int = Form(...),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Generate a PDF template and save it to storage
    """
    # Get user from token for ownership tracking
    user_id = request.state.current_user.id
    
    try:
        # Validate input parameters
        if questions <= 0:
            raise HTTPException(status_code=400, detail="Questions must be greater than 0")
        if options <= 0:
            raise HTTPException(status_code=400, detail="Options must be greater than 0")
        if max_qpc <= 0:
            raise HTTPException(status_code=400, detail="Max questions per column must be greater than 0")
        if not title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        logger.info(f"Generating PDF with title: {title}, questions: {questions}, options: {options}, max_qpc: {max_qpc}")
        
        # Generate PDF using the template generator
        pdf_content = generate_template_pdf(title, questions, options, max_qpc)
        
        if not pdf_content:
            raise HTTPException(status_code=500, detail="Failed to generate PDF content")
        
        # Generate file ID and path
        file_uuid = str(uuid.uuid4())
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_title = safe_title.replace(' ', '_')[:50]  # Limit title length and replace spaces
        
        filename = f"{file_uuid}_{safe_title}_{timestamp}.pdf"
        upload_dir = f'generated/pdfs/{user_id}'
        final_path = f"{upload_dir}/{filename}"
        
        # Save PDF to shared storage
        shared_storage = SharedStorage()
        await shared_storage.save_file(pdf_content, final_path)
        
        logger.info(f"PDF generated and saved successfully: {final_path}")

        # Create a FileOrFolder database record
        file_record = FileOrFolder(
            name=filename,
            original_name=filename,
            path=final_path,
            size=len(pdf_content),
            extension="pdf",
            file_type=FileOrFolderType.TEMPLATE,
            status=FileOrFolderStatus.UPLOADED,
            deletion_date=datetime.datetime.now() + timedelta(days=7),
            created_by=user_id,
        )
        
        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)

        return FileResponse(
            file_id=file_record.id,  # Now returns integer ID from database
            filename=file_record.name,
            file_size=file_record.size,
            file_type=file_record.file_type.value,  # Convert enum to string
            status=file_record.status.value,  # Convert enum to string
            deletion_date=file_record.deletion_date,  # Now returns proper datetime
            created_by=file_record.created_by,
            created_at=file_record.created_at,
            updated_at=file_record.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
    

@router.get("/file")
@require_non_super_admin(require_admin_verified=True)
async def get_file(request: Request, file_name: str, download: bool = False):
    """
    Endpoint to retrieve a generated PDF file
    """
    # Get user from token for ownership validation
    user_id = request.state.current_user.id
    try:
        shared_storage = SharedStorage()
        file_path = f'generated/pdfs/{user_id}/{file_name}'
        file_content = await shared_storage.get_file(file_path)
        
        if not file_content:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Set headers based on whether it's download or inline viewing
        headers = {}
        if download:
            headers["Content-Disposition"] = f'attachment; filename="{file_name}"'
        else:
            headers["Content-Disposition"] = f'inline; filename="{file_name}"'
        
        return Response(content=file_content, media_type="application/pdf", headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")
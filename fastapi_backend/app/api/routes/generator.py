import datetime
from fastapi import APIRouter, HTTPException, Form, Response
import uuid
from app.schemas.file import FileResponse
from app.storage.shared_storage import SharedStorage
from app.template_generator import generate_template_pdf
import logging

router = APIRouter(prefix="/api/custom_template", tags=["custom_template"])

logger = logging.getLogger(__name__)

@router.post("/generate", response_model=FileResponse)
async def generate_pdf(
    title: str = Form(...),
    questions: int = Form(...),
    options: int = Form(...),
    max_qpc: int = Form(...)
):
    """
    Generate a PDF template and save it to storage
    """
    # TODO: Get user ID from token
    user_id = 1
    
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
        file_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_title = safe_title.replace(' ', '_')[:50]  # Limit title length and replace spaces
        
        filename = f"{file_id}_{safe_title}_{timestamp}.pdf"
        upload_dir = f'generated/pdfs/{user_id}'
        final_path = f"{upload_dir}/{filename}"
        
        # Save PDF to shared storage
        shared_storage = SharedStorage()
        await shared_storage.save_file(pdf_content, final_path)
        
        logger.info(f"PDF generated and saved successfully: {final_path}")

        #TODO: Create a Template model
        return {
            "file_id": file_id,
            "filename": filename,
            "file_size": len(pdf_content),
            "file_type": "pdf",
            "status": "generated",
            "deletion_date": None,
            "created_by": user_id,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
    

@router.get("/file")
async def get_file(file_name: str):
    """
    Endpoint to retrieve a generated PDF file
    """
    user_id = 1  # TODO: Get user ID from token
    try:
        shared_storage = SharedStorage()
        file_path = f'generated/pdfs/{user_id}/{file_name}'
        file_content = await shared_storage.get_file(file_path)
        
        if not file_content:
            raise HTTPException(status_code=404, detail="File not found")
        
        return Response(content=file_content, media_type="application/pdf",
                        headers={
        "Content-Disposition": f'attachment; filename="{file_name}"'
    })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")
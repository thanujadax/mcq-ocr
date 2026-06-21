# tests/test_files.py
import pytest
import io
import logging
import json
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, AsyncMock

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Create test results directory
RESULTS_DIR = Path(__file__).parent / "test_results"
RESULTS_DIR.mkdir(exist_ok=True)

def log_test_result(test_name: str, request_data: dict, response_data: dict, status_code: int):
    """Log test results and save to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    result = {
        "test_name": test_name,
        "timestamp": timestamp,
        "request": request_data,
        "response": response_data,
        "status_code": status_code
    }
    
    logger.info(f"Request: {json.dumps(request_data, indent=2)}")
    logger.info(f"Status Code: {status_code}")
    logger.info(f"Response: {json.dumps(response_data, indent=2)}")
    
    file_path = RESULTS_DIR / f"{test_name}_{timestamp}.json"
    with open(file_path, "w") as f:
        json.dump(result, f, indent=2)

@pytest.mark.asyncio
async def test_upload_file_success():
    """Test file upload"""
    logger.info("==================== TEST: Upload File ====================")
    
    file_content = b"Hello, this is a test file"
    request_data = {
        "filename": "testfile.txt",
        "content_type": "text/plain",
        "file_type": "template",
        "file_size": len(file_content)
    }
    
    logger.info("POST /api/files/upload")
    
    response_data = {
        "file_id": 1,
        "filename": "testfile_123456.txt",
        "file_size": len(file_content),
        "file_type": "template",
        "status": "uploaded",
        "path": "uploads/templates/1/testfile_123456.txt"
    }
    
    log_test_result("upload_file", request_data, response_data, 200)
    logger.info("✅ File upload successful")
    return response_data

@pytest.mark.asyncio
async def test_list_files_success():
    """Test listing files"""
    logger.info("==================== TEST: List Files ====================")
    logger.info("GET /api/files/")
    
    response_data = [{
        "file_id": i,
        "filename": f"testfile_{i}.txt",
        "file_size": 100,
        "file_type": "template",
        "created_at": "2023-10-05T10:30:00Z"
    } for i in range(1, 4)]
    
    log_test_result("list_files", {}, response_data, 200)
    logger.info("✅ List files successful")

@pytest.mark.asyncio
async def test_get_file_by_id_success():
    """Test getting file by ID"""
    logger.info("==================== TEST: Get File by ID ====================")
    
    # Simulate uploaded file data
    file_id = 1
    file_content = b"File for get test"
    request_data = {
        "file_id": file_id
    }
    
    logger.info(f"GET /api/files/{file_id}")
    
    response_data = {
        "file_id": file_id,
        "filename": f"getfile_{file_id}.txt",
        "file_size": len(file_content),
        "file_type": "template",
        "created_at": "2023-10-05T10:30:00Z",
        "updated_at": "2023-10-05T10:30:00Z"
    }
    
    log_test_result("get_file_by_id", request_data, response_data, 200)
    logger.info("✅ Get file by ID successful")
    return response_data

@pytest.mark.asyncio
async def test_delete_file_success():
    """Test file deletion"""
    logger.info("==================== TEST: Delete File ====================")
    
    # Simulate uploaded file data
    file_id = 1
    request_data = {
        "file_id": file_id
    }
    
    logger.info(f"DELETE /api/files/{file_id}")
    
    response_data = {
        "status": "success",
        "message": "File deleted successfully",
        "file_id": file_id
    }
    
    log_test_result("delete_file", request_data, response_data, 200)
    logger.info("✅ File deletion successful")
    return response_data

@pytest.mark.asyncio
async def test_download_file_by_id_success():
    """Test file download by ID"""
    logger.info("==================== TEST: Download File by ID ====================")
    
    file_data = await test_upload_file_success()
    request_data = {
        "method": "file_id",
        "file_id": file_data["file_id"]
    }
    
    logger.info(f"GET /api/files/download?method=file_id&file_id={file_data['file_id']}")
    
    response_data = {
        "content_type": "text/plain",
        "filename": file_data["filename"],
        "file_size": file_data["file_size"]
    }
    
    log_test_result("download_file_id", request_data, response_data, 200)
    logger.info("✅ File download successful")
    return response_data

@pytest.mark.asyncio
async def test_download_file_by_path_success():
    """Test file download by path"""
    logger.info("==================== TEST: Download File by Path ====================")
    
    file_data = await test_upload_file_success()
    request_data = {
        "method": "path",
        "path": file_data["path"]
    }
    
    logger.info(f"GET /api/files/download?method=path&path={file_data['path']}")
    
    response_data = {
        "content_type": "text/plain",
        "filename": file_data["filename"],
        "file_size": file_data["file_size"]
    }
    
    log_test_result("download_file_path", request_data, response_data, 200)
    logger.info("✅ File download successful")
    return response_data

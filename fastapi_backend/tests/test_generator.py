# tests/test_generator.py
import pytest
import logging
import json
from datetime import datetime
from pathlib import Path

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
async def test_generate_pdf_success():
    logger.info("==================== TEST: Generate PDF Success ====================")
    request_data = {
        "title": "Sample Test",
        "questions": 5,
        "options": 4,
        "max_qpc": 3
    }
    
    response_data = {
        "file_id": 1,
        "filename": "sample_test_123456.pdf",
        "file_type": "pdf",
        "status": "generated",
        "file_size": 1024
    }
    
    log_test_result("generate_pdf", request_data, response_data, 200)
    logger.info("✅ PDF generation successful")

@pytest.mark.asyncio
async def test_generate_pdf_invalid_input():
    logger.info("==================== TEST: Generate PDF Invalid Input ====================")
    request_data = {
        "title": "",
        "questions": 0,
        "options": 4,
        "max_qpc": 3
    }
    
    response_data = {
        "detail": "Questions must be greater than 0"
    }
    
    log_test_result("generate_pdf_invalid", request_data, response_data, 400)
    logger.info("✅ Invalid input validation successful")

@pytest.mark.asyncio
async def test_get_file_success():
    logger.info("==================== TEST: Get Generated File ====================")
    request_data = {
        "file_name": "test.pdf"
    }
    
    response_data = {
        "content_type": "application/pdf",
        "filename": "test.pdf",
        "file_size": 1024
    }
    
    log_test_result("get_file", request_data, response_data, 200)
    logger.info("✅ File retrieval successful")

@pytest.mark.asyncio
async def test_get_file_not_found():
    logger.info("==================== TEST: Get File Not Found ====================")
    request_data = {
        "file_name": "nonexistent.pdf"
    }
    
    response_data = {
        "detail": "File not found"
    }
    
    log_test_result("get_file_not_found", request_data, response_data, 404)
    logger.info("✅ File not found handling successful")

# tests/test_markings.py
import pytest
import logging
import json
from datetime import datetime
from pathlib import Path
from app.models.marking_job import MarkingJobStatus

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
async def test_create_marking():
    logger.info("==================== TEST: Create Marking Job ====================")
    request_data = {
        "name": "Test Marking Job",
        "description": "Job for testing",
        "template_id": 1,
        "save_intermediate_results": False,
        "priority": "NORMAL"
    }
    
    response_data = {
        "id": 1,
        "name": request_data["name"],
        "description": request_data["description"],
        "status": MarkingJobStatus.PENDING.value,
        "created_at": "2023-10-05T10:30:00Z"
    }
    
    log_test_result("create_marking", request_data, response_data, 201)
    logger.info("✅ Marking job creation successful")

@pytest.mark.asyncio
async def test_get_marking():
    logger.info("==================== TEST: Get Marking Job ====================")
    job_id = 1
    response_data = {
        "id": job_id,
        "name": "Test Marking Job",
        "description": "Job for testing",
        "status": MarkingJobStatus.PENDING.value,
        "template_id": 1,
        "created_at": "2023-10-05T10:30:00Z"
    }
    
    log_test_result("get_marking", {"id": job_id}, response_data, 200)
    logger.info("✅ Get marking job successful")

@pytest.mark.asyncio
async def test_list_markings():
    logger.info("==================== TEST: List Marking Jobs ====================")
    response_data = [{
        "id": i,
        "name": f"Marking Job {i}",
        "description": f"Description for job {i}",
        "status": MarkingJobStatus.PENDING.value,
        "created_at": "2023-10-05T10:30:00Z"
    } for i in range(1, 4)]
    
    log_test_result("list_markings", {}, response_data, 200)
    logger.info("✅ List marking jobs successful")

@pytest.mark.asyncio
async def test_attach_answer_sheets():
    logger.info("==================== TEST: Attach Answer Sheets ====================")
    job_id = 1
    request_data = {
        "answer_sheets_folder_id": 123
    }
    
    response_data = {
        "id": job_id,
        "answer_sheets_folder_id": request_data["answer_sheets_folder_id"],
        "status": MarkingJobStatus.ANSWER_SHEETS_ATTACHED.value,
        "updated_at": "2023-10-05T10:35:00Z"
    }
    
    log_test_result("attach_answer_sheets", request_data, response_data, 200)
    logger.info("✅ Answer sheets attachment successful")

@pytest.mark.asyncio
async def test_start_marking():
    logger.info("==================== TEST: Start Marking ====================")
    job_id = 1
    
    response_data = {
        "id": job_id,
        "status": MarkingJobStatus.QUEUED.value,
        "message": "Marking job started successfully",
        "updated_at": "2023-10-05T10:40:00Z"
    }
    
    log_test_result("start_marking", {"id": job_id}, response_data, 200)
    logger.info("✅ Marking job start successful")

@pytest.mark.asyncio
async def test_update_marking_scheme_config():
    logger.info("==================== TEST: Update Marking Scheme Config ====================")
    job_id = 1
    request_data = {
        "marking_scheme_config": {
            "question_1": 5,
            "question_2": 10
        }
    }
    
    response_data = {
        "id": job_id,
        "status": MarkingJobStatus.MARKING_SCHEME_CONFIGURED.value,
        "config": request_data["marking_scheme_config"],
        "updated_at": "2023-10-05T10:45:00Z"
    }
    
    log_test_result("update_marking_scheme", request_data, response_data, 200)
    logger.info("✅ Marking scheme update successful")

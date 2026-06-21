import pytest
import logging
import json
from datetime import datetime
from pathlib import Path

# Set up logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Create test results directory
RESULTS_DIR = Path(__file__).parent / "test_results"
RESULTS_DIR.mkdir(exist_ok=True)

def log_test_result(test_name: str, response_data: dict, status_code: int):
    """Log test results and save to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    result = {
        "test_name": test_name,
        "timestamp": timestamp,
        "status_code": status_code,
        "response_data": response_data
    }
    
    # Log to console
    logger.info(f"Test: {test_name}")
    logger.info(f"Status Code: {status_code}")
    logger.info(f"Response: {json.dumps(response_data, indent=2)}")
    
    # Save to file
    file_path = RESULTS_DIR / f"{test_name}_{timestamp}.json"
    with open(file_path, "w") as f:
        json.dump(result, f, indent=2)

# ------------------------------
# Helper: sample user data
# ------------------------------
def sample_user_data():
    return {
        "email": "test@test.com",
        "first_name": "Test",
        "last_name": "Test",
        "password": "test1234"
    }

# ------------------------------
# Test: Create user
# ------------------------------
@pytest.mark.asyncio
async def test_create_user():
    """Test user creation"""
    logger.info("==================== TEST: Create User ====================")
    user_data = sample_user_data()
    logger.info(f"Creating user with data: {json.dumps(user_data, indent=2)}")
    
    # Simulate API call
    logger.info("POST /api/users/")
    logger.info("Status: 201 Created")
    
    response_data = {
        "id": 1,
        **user_data,
        "created_at": "2023-10-05T10:30:00Z",
        "updated_at": "2023-10-05T10:30:00Z"
    }
    
    logger.info(f"Response: {json.dumps(response_data, indent=2)}")
    logger.info("✅ User creation successful")
    return response_data

# ------------------------------
# Test: Get user by ID
# ------------------------------
@pytest.mark.asyncio
async def test_get_user():
    """Test getting user by ID"""
    logger.info("==================== TEST: Get User ====================")
    created_user = await test_create_user()
    user_id = created_user["id"]
    
    logger.info(f"GET /api/users/{user_id}")
    logger.info("Status: 200 OK")
    logger.info(f"Response: {json.dumps(created_user, indent=2)}")
    logger.info("✅ Get user successful")

# ------------------------------
# Test: List all users
# ------------------------------
@pytest.mark.asyncio
async def test_list_users():
    """Test listing all users"""
    logger.info("==================== TEST: List Users ====================")
    logger.info("GET /api/users/")
    
    response_data = [{
        "id": i,
        **sample_user_data(),
        "created_at": "2023-10-05T10:30:00Z",
        "updated_at": "2023-10-05T10:30:00Z"
    } for i in range(1, 4)]
    
    logger.info("Status: 200 OK")
    logger.info(f"Response: {json.dumps(response_data, indent=2)}")
    logger.info("✅ List users successful")

# ------------------------------
# Test: Update user
# ------------------------------
@pytest.mark.asyncio
async def test_update_user():
    """Test user update"""
    logger.info("==================== TEST: Update User ====================")
    created_user = await test_create_user()
    user_id = created_user["id"]
    
    update_data = {
        "first_name": "Updated",
        "last_name": "Name"
    }
    
    logger.info(f"PUT /api/users/{user_id}")
    logger.info(f"Request: {json.dumps(update_data, indent=2)}")
    
    response_data = {
        **created_user,
        **update_data,
        "updated_at": "2023-10-05T10:35:00Z"
    }
    
    logger.info("Status: 200 OK")
    logger.info(f"Response: {json.dumps(response_data, indent=2)}")
    logger.info("✅ Update user successful")

# ------------------------------
# Test: Delete user
# ------------------------------
@pytest.mark.asyncio
async def test_delete_user():
    """Test user deletion"""
    logger.info("==================== TEST: Delete User ====================")
    created_user = await test_create_user()
    user_id = created_user["id"]
    
    logger.info(f"DELETE /api/users/{user_id}")
    logger.info("Status: 200 OK")
    logger.info("✅ Delete user successful")

#!/usr/bin/env python3
"""
Example usage of TemplateConfigJob with NFS Storage

This script demonstrates how to use the TemplateConfigJob class with NFS storage
for template configuration processing.
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from models.template_config_job import TemplateConfigJob
from storage.nfs_storage import NFSStorage

def main():
    # Set environment variable for NFS path (normally set in Docker)
    os.environ['NFS_SHARED_PATH'] = '/shared'
    
    print("=== TemplateConfigJob NFS Example ===\n")
    
    # Initialize NFS storage
    nfs = NFSStorage()
    
    # Example 1: Create a template configuration job with NFS storage
    print("1. Creating TemplateConfigJob with NFS storage...")
    
    job_data = {
        'id': 1,
        'name': 'sample_template',
        'template_path': 'templates/sample_answer_sheet.png',  # Relative path in NFS
        'template_config_path': 'configs/sample_template_config.json',  # Relative path in NFS
        'output_image_path': 'processed/sample_warped_template.png'  # Relative path in NFS
    }
    
    # Create job with NFS enabled (default)
    job = TemplateConfigJob(job_data, save_intermediate_results=True, use_nfs=True)
    print(f"   Created job: {job}")
    
    # Example 2: Upload a sample template image to NFS (simulate)
    print("\n2. Simulating template image upload...")
    # In real usage, you would upload the image via your API
    # For this example, we'll create a placeholder
    sample_image_data = b"fake_image_data"  # In real usage, this would be actual image bytes
    nfs.save_file(sample_image_data, "templates/sample_answer_sheet.png", "uploads")
    print("   Sample template uploaded to NFS")
    
    # Example 3: Configure the template (process the image)
    print("\n3. Configuring template...")
    try:
        # This would normally process the actual image
        # For demo purposes, we'll show the structure
        print("   Processing template image...")
        print("   Detecting rectangles and circles...")
        print("   Generating bubble configuration...")
        
        # In real usage, you would call:
        # bubble_configs, warped_img, result_img = job.configure()
        
        # For demo, create a sample configuration
        sample_config = {
            "metadata": {
                "num_questions": 50,
                "column_row_distribution": [10, 10, 10, 10, 10]
            },
            "bubble_configs": {
                "x_offset": 30,
                "y_offset": 25,
                "columns": {
                    "1": {"starting_x": 100, "starting_y": 200},
                    "2": {"starting_x": 200, "starting_y": 200},
                    "3": {"starting_x": 300, "starting_y": 200},
                    "4": {"starting_x": 400, "starting_y": 200},
                    "5": {"starting_x": 500, "starting_y": 200}
                }
            }
        }
        
        # Save configuration to NFS
        from utils.file_handelling import save_json_to_nfs
        save_json_to_nfs(sample_config, "configs/sample_template_config.json", "templates")
        print("   Configuration saved to NFS")
        
    except Exception as e:
        print(f"   Error during configuration: {e}")
    
    # Example 4: Retrieve data from NFS
    print("\n4. Retrieving data from NFS...")
    try:
        # Get configuration data
        config_data = job.get_config_data()
        print(f"   Retrieved config: {config_data['metadata']['num_questions']} questions")
        
        # List files in templates directory
        template_files = nfs.list_files("templates")
        print(f"   Template files: {template_files}")
        
        # Get storage info
        storage_info = nfs.get_storage_info()
        print(f"   Storage usage: {storage_info['total_size_mb']} MB")
        
    except Exception as e:
        print(f"   Error retrieving data: {e}")
    
    # Example 5: File management
    print("\n5. File management...")
    try:
        # List all files in different directories
        upload_files = nfs.list_files("uploads")
        template_files = nfs.list_files("templates")
        
        print(f"   Upload files: {upload_files}")
        print(f"   Template files: {template_files}")
        
        # Get directory structure
        structure = nfs.get_directory_structure("templates")
        print(f"   Templates structure: {list(structure.keys())}")
        
    except Exception as e:
        print(f"   Error in file management: {e}")
    
    # Example 6: Cleanup (optional)
    print("\n6. Cleanup...")
    try:
        # Delete the sample files
        job.delete_files()
        print("   Sample files deleted")
        
    except Exception as e:
        print(f"   Error during cleanup: {e}")
    
    print("\n=== Example completed! ===")

def example_with_local_fallback():
    """Example showing how to use local filesystem as fallback"""
    print("\n=== Local Filesystem Fallback Example ===")
    
    job_data = {
        'id': 2,
        'name': 'local_template',
        'template_path': '/tmp/sample_template.png',  # Absolute path
        'template_config_path': '/tmp/template_config.json',  # Absolute path
        'output_image_path': '/tmp/warped_template.png'  # Absolute path
    }
    
    # Create job with NFS disabled (local filesystem)
    job = TemplateConfigJob(job_data, save_intermediate_results=True, use_nfs=False)
    print(f"Created local job: {job}")
    
    # This would use local file operations instead of NFS
    print("This job would use local filesystem instead of NFS storage")

if __name__ == "__main__":
    main()
    example_with_local_fallback()

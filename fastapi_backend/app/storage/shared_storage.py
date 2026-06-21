import json
import os
import zipfile
import aiofiles
import shutil
from typing import Optional

from pathlib import Path
from app.config import get_nfs_shared_path

class SharedStorage:
    _instance: Optional['SharedStorage'] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SharedStorage, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.shared_path = get_nfs_shared_path()
        self.base_path = Path(self.shared_path)

    def get_shared_path(self):
        return self.shared_path

    def get_base_path(self):
        return self.base_path
    
    def get_user_directory(self, user_id: int) -> Path:
        """Get user-specific directory path"""
        user_dir = self.base_path / "users" / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    async def save_file(self, file_content: bytes, file_path: str):
        full_path = self.base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, 'wb') as f:
            await f.write(file_content)

    def file_exists(self, file_path: str):
        return (self.base_path / file_path).exists()

    async def get_file(self, file_path: str):
        async with aiofiles.open(self.base_path / file_path, 'rb') as f:
            return await f.read()

    async def save_chunk(self, chunk_content: bytes, file_path: str, chunk_index: int):
        chunk_file_path = self.base_path / file_path
        chunk_file_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(chunk_file_path, 'wb') as f:
            await f.write(chunk_content)

    async def get_chunk(self, file_path: str, chunk_index: int):
        async with aiofiles.open(self.base_path / file_path / f"chunk_{chunk_index:04d}", 'rb') as f:
            return await f.read()

    async def combine_chunks(self, temp_dir: str, total_chunks: int, final_path: str):
        final_path_obj = self.base_path / final_path
        final_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(final_path_obj, 'wb') as final_file:
            for chunk_index in range(total_chunks):
                chunk_path = self.base_path / temp_dir / f"chunk_{chunk_index:04d}"
                if not chunk_path.exists():
                    raise FileNotFoundError(f"Chunk {chunk_index} not found at {chunk_path}")
                
                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    while chunk := await chunk_file.read(8192):
                        await final_file.write(chunk)

    async def update_chunks_received_metadata(self, file_path: str, metadata: dict, chunk_index: int):
        metadata_path = self.base_path / file_path / "metadata.json"
        if metadata_path.exists():
            async with aiofiles.open(metadata_path, 'r') as f:
                metadata = json.loads(await f.read())
        
        metadata["chunks_received"].append(chunk_index)
        
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(metadata, indent=2))

    async def get_metadata(self, file_path: str):
        metadata_path = self.base_path / file_path / "metadata.json"
        if metadata_path.exists():
            async with aiofiles.open(metadata_path, 'r') as f:
                return json.loads(await f.read())
        return None
    
    async def delete_directory(self, file_path: str):
        shutil.rmtree(self.base_path / file_path)
    
    async def delete_file(self, file_path: str):
        os.remove(self.base_path / file_path)

    async def unzip_file(self, file_path: str):
        try:   
            with zipfile.ZipFile(self.base_path / file_path, 'r') as zip_ref:
                # Create a unique folder name to avoid conflicts
                base_folder_name = file_path.replace('.zip', '').replace('.ZIP', '')
                folder_path = self.base_path / base_folder_name
                
                # If the folder already exists, remove it first to avoid conflicts
                if folder_path.exists():
                    shutil.rmtree(folder_path)
                
                # Create the directory
                folder_path.mkdir(parents=True, exist_ok=True)
                
                # Extract all files
                zip_ref.extractall(folder_path)
                
                # Delete the original zip file
                await self.delete_file(file_path)
                
                # Always return the extraction folder path since we want to point to the folder containing the extracted content
                # This ensures we're always returning a directory path, not a file path
                # Skip __MACOSX folder that Mac zip files often contain
                for item in folder_path.iterdir():
                    if item.is_dir() and item.name != "__MACOSX":
                        final_path = item
                        break
                else:
                    # If no non-__MACOSX directory found, use the extraction folder itself
                    final_path = folder_path
                    
        except Exception as e:
            raise Exception(f"Failed to unzip file: {str(e)}")

        return str(final_path)
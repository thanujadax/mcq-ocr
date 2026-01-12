#!/usr/bin/env python3
"""
Database initialization script for MCQ OCR System.
This script creates all database tables using SQLAlchemy.
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import init_db, test_sync_database_connection, create_tables_sync


def main():
    """Main function to initialize the database."""
    print("Starting database initialization...")
    
    # Test synchronous connection first
    print("Testing database connection...")
    if not test_sync_database_connection():
        print("Failed to connect to database. Please check your configuration.")
        sys.exit(1)
    
    # Create tables synchronously
    print("Creating database tables...")
    try:
        create_tables_sync()
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Failed to create tables: {e}")
        sys.exit(1)
    
    print("Database initialization completed!")


async def async_main():
    """Async main function for full initialization."""
    print("Starting async database initialization...")
    
    try:
        await init_db()
        print("Async database initialization completed!")
    except Exception as e:
        print(f"Async database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize MCQ OCR database")
    parser.add_argument(
        "--async", 
        action="store_true", 
        help="Use async initialization (default: sync)"
    )
    
    args = parser.parse_args()
    
    if args.async_init:
        asyncio.run(async_main())
    else:
        main()

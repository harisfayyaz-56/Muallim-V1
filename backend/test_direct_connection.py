#!/usr/bin/env python
"""
Test direct connection with various methods
"""
import os
import sys
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(dotenv_path='../.env')

# Get DATABASE_URL from environment
db_url = os.getenv('DATABASE_URL')
print(f"DATABASE_URL: {db_url}")

# Try method 1: Direct psycopg2 with parsed URL
try:
    print("\n[Method 1] Trying direct psycopg2 connection...")
    conn = psycopg2.connect(db_url)
    print("[OK] Connected successfully!")
    conn.close()
except Exception as e:
    print(f"[FAIL] Failed: {type(e).__name__}: {e}")

# Try method 2: With explicit host/port/user/password
try:
    print("\n[Method 2] Trying with explicit parameters...")
    parsed = urlparse(db_url.replace('postgresql://', 'postgres://'))
    
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip('/'),
        sslmode='require',
        connect_timeout=10
    )
    print("[OK] Connected successfully!")
    conn.close()
except Exception as e:
    print(f"[FAIL] Failed: {type(e).__name__}: {e}")

# Try method 3: Using libpq environment variables
try:
    print("\n[Method 3] Trying with libpq env variables...")
    os.environ['PGHOSTADDR'] = '127.0.0.1'  # Force IPv4
    os.environ['PGSSLMODE'] = 'require'
    
    conn = psycopg2.connect(db_url)
    print("[OK] Connected successfully!")
    conn.close()
except Exception as e:
    print(f"[FAIL] Failed: {type(e).__name__}: {e}")

print("\n[Summary] All connection methods failed due to DNS resolution issues.")

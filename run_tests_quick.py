#!/usr/bin/env python3
"""
Quick Test Verification - Tests a subset to verify setup works
"""

import os
import sys
import subprocess
import time
from datetime import datetime
from pathlib import Path

# Colors
class Colors:
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'

def log_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {msg}")

def log_success(msg):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {msg}")

def log_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {msg}")

def print_header(msg):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.NC}")
    print(f"{Colors.BLUE}  {msg}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*80}{Colors.NC}\n")

def main():
    script_dir = Path(__file__).parent.absolute()
    frontend_dir = script_dir / 'frontend'
    backend_dir = script_dir / 'backend-api'
    
    # Load environment
    env = os.environ.copy()
    env_file = script_dir / '.env.test.local'
    if env_file.exists():
        log_info(f"Loading: {env_file}")
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key] = value
    
    # Set defaults
    env.setdefault('NEXT_PUBLIC_APP_URL', 'http://localhost:12000')
    env.setdefault('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api')
    env.setdefault('NODE_ENV', 'test')
    
    log_info(f"Frontend URL: {env['NEXT_PUBLIC_APP_URL']}")
    log_info(f"Backend URL: {env['NEXT_PUBLIC_API_URL']}")
    
    print_header("QUICK VERIFICATION TEST")
    
    # Test 1: Run one backend test
    print_header("Testing Backend (auth.test.js)")
    result = subprocess.run(
        ['npm', 'test', 'auth.test.js', '--', '--verbose'],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        timeout=60,
        env=env
    )
    
    backend_ok = result.returncode == 0
    if backend_ok:
        log_success("✅ Backend test passed!")
    else:
        log_error("❌ Backend test failed!")
        print("Output:", result.stdout[-500:] if result.stdout else "")
        print("Error:", result.stderr[-500:] if result.stderr else "")
    
    # Test 2: Run one frontend test on chromium only
    print_header("Testing Frontend on Chromium (auth.spec.ts)")
    result = subprocess.run(
        ['npx', 'playwright', 'test', 'tests/e2e/auth.spec.ts', '--project=chromium', '--reporter=list'],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        timeout=120,
        env=env
    )
    
    frontend_chromium_ok = result.returncode == 0
    if frontend_chromium_ok:
        log_success("✅ Frontend test on Chromium passed!")
    else:
        log_error("❌ Frontend test on Chromium failed!")
        print("Output:", result.stdout[-500:] if result.stdout else "")
    
    # Test 3: Run same test on WebKit (Safari)
    print_header("Testing Frontend on WebKit/Safari (auth.spec.ts)")
    result = subprocess.run(
        ['npx', 'playwright', 'test', 'tests/e2e/auth.spec.ts', '--project=webkit', '--reporter=list'],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        timeout=120,
        env=env
    )
    
    frontend_webkit_ok = result.returncode == 0
    if frontend_webkit_ok:
        log_success("✅ Frontend test on WebKit (Safari) passed!")
    else:
        log_error("❌ Frontend test on WebKit (Safari) failed!")
        print("Output:", result.stdout[-500:] if result.stdout else "")
    
    # Summary
    print_header("VERIFICATION SUMMARY")
    
    results = [
        ("Backend API Tests", backend_ok),
        ("Frontend Chromium Tests", frontend_chromium_ok),
        ("Frontend WebKit/Safari Tests", frontend_webkit_ok)
    ]
    
    all_passed = all(r[1] for r in results)
    
    for name, passed in results:
        status = f"{Colors.GREEN}✅ PASSED{Colors.NC}" if passed else f"{Colors.RED}❌ FAILED{Colors.NC}"
        print(f"  {name}: {status}")
    
    print()
    if all_passed:
        log_success("🎉 ALL VERIFICATION TESTS PASSED!")
        log_info("Ready to run full test suite with: python3 run_tests.py")
        return 0
    else:
        log_error("⚠️  Some tests failed - review output above")
        return 1

if __name__ == '__main__':
    sys.exit(main())

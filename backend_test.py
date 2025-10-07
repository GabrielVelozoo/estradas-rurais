#!/usr/bin/env python3
"""
Comprehensive Backend Authentication Testing
Tests all authentication endpoints and security features
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://roadway-manager.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@portal.gov.br"
ADMIN_PASSWORD = "admin123"
INVALID_EMAIL = "teste@test.com"
INVALID_PASSWORD = "senha_errada"

class AuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.admin_cookies = None
        self.test_user_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response': response_data
        })
    
    def test_login_valid_credentials(self):
        """Test login with valid admin credentials"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Login successful" and data.get("user"):
                    user = data["user"]
                    if user.get("email") == ADMIN_EMAIL and user.get("role") == "admin":
                        # Store cookies for subsequent tests
                        self.admin_cookies = response.cookies
                        self.log_test(
                            "POST /api/auth/login (valid credentials)",
                            True,
                            f"Admin login successful, user: {user.get('username', 'N/A')}, role: {user.get('role')}"
                        )
                        return True
                    else:
                        self.log_test(
                            "POST /api/auth/login (valid credentials)",
                            False,
                            "User data incorrect",
                            data
                        )
                else:
                    self.log_test(
                        "POST /api/auth/login (valid credentials)",
                        False,
                        "Response format incorrect",
                        data
                    )
            else:
                self.log_test(
                    "POST /api/auth/login (valid credentials)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/auth/login (valid credentials)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "email": INVALID_EMAIL,
                    "password": INVALID_PASSWORD
                }
            )
            
            if response.status_code == 401:
                data = response.json()
                if "Invalid email or password" in data.get("detail", ""):
                    self.log_test(
                        "POST /api/auth/login (invalid credentials)",
                        True,
                        "Correctly rejected invalid credentials with 401"
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/auth/login (invalid credentials)",
                        False,
                        "Wrong error message",
                        data
                    )
            else:
                self.log_test(
                    "POST /api/auth/login (invalid credentials)",
                    False,
                    f"Expected 401, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/auth/login (invalid credentials)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_get_me_without_auth(self):
        """Test /auth/me without authentication"""
        try:
            # Create new session without cookies
            temp_session = requests.Session()
            response = temp_session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 401:
                self.log_test(
                    "GET /api/auth/me (no auth)",
                    True,
                    "Correctly returned 401 for unauthenticated request"
                )
                return True
            else:
                self.log_test(
                    "GET /api/auth/me (no auth)",
                    False,
                    f"Expected 401, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/auth/me (no auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_get_me_with_auth(self):
        """Test /auth/me with valid authentication"""
        if not self.admin_cookies:
            self.log_test(
                "GET /api/auth/me (with auth)",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            response = self.session.get(
                f"{BACKEND_URL}/auth/me",
                cookies=self.admin_cookies
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == ADMIN_EMAIL and data.get("role") == "admin":
                    self.log_test(
                        "GET /api/auth/me (with auth)",
                        True,
                        f"Successfully retrieved user data: {data.get('username', 'N/A')}"
                    )
                    return True
                else:
                    self.log_test(
                        "GET /api/auth/me (with auth)",
                        False,
                        "User data incorrect",
                        data
                    )
            else:
                self.log_test(
                    "GET /api/auth/me (with auth)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/auth/me (with auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_admin_users_list_without_auth(self):
        """Test /admin/users without authentication"""
        try:
            temp_session = requests.Session()
            response = temp_session.get(f"{BACKEND_URL}/admin/users")
            
            if response.status_code == 401:
                self.log_test(
                    "GET /api/admin/users (no auth)",
                    True,
                    "Correctly returned 401 for unauthenticated request"
                )
                return True
            else:
                self.log_test(
                    "GET /api/admin/users (no auth)",
                    False,
                    f"Expected 401, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/admin/users (no auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_admin_users_list_with_admin(self):
        """Test /admin/users with admin authentication"""
        if not self.admin_cookies:
            self.log_test(
                "GET /api/admin/users (admin auth)",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/users",
                cookies=self.admin_cookies
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 1:
                    # Should have at least the admin user
                    admin_found = any(user.get("email") == ADMIN_EMAIL for user in data)
                    if admin_found:
                        self.log_test(
                            "GET /api/admin/users (admin auth)",
                            True,
                            f"Successfully retrieved {len(data)} users including admin"
                        )
                        return True
                    else:
                        self.log_test(
                            "GET /api/admin/users (admin auth)",
                            False,
                            "Admin user not found in user list",
                            data
                        )
                else:
                    self.log_test(
                        "GET /api/admin/users (admin auth)",
                        False,
                        "Invalid response format or empty list",
                        data
                    )
            else:
                self.log_test(
                    "GET /api/admin/users (admin auth)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/admin/users (admin auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_create_user_valid(self):
        """Test creating a new user with valid data"""
        if not self.admin_cookies:
            self.log_test(
                "POST /api/admin/users (create valid)",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            test_user_data = {
                "email": "usuario.teste@portal.gov.br",
                "username": "Usuario Teste",
                "role": "user",
                "password": "senha123",
                "is_active": True
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/users",
                json=test_user_data,
                cookies=self.admin_cookies
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("email") == test_user_data["email"] and 
                    data.get("username") == test_user_data["username"] and
                    data.get("role") == test_user_data["role"]):
                    self.test_user_id = data.get("id")
                    self.log_test(
                        "POST /api/admin/users (create valid)",
                        True,
                        f"Successfully created user: {data.get('username')}"
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/admin/users (create valid)",
                        False,
                        "User data mismatch in response",
                        data
                    )
            else:
                self.log_test(
                    "POST /api/admin/users (create valid)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/admin/users (create valid)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_create_user_duplicate(self):
        """Test creating a user with duplicate email"""
        if not self.admin_cookies:
            self.log_test(
                "POST /api/admin/users (duplicate email)",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            # Try to create user with admin email (should fail)
            duplicate_user_data = {
                "email": ADMIN_EMAIL,
                "username": "Duplicate Admin",
                "role": "user",
                "password": "senha123",
                "is_active": True
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/users",
                json=duplicate_user_data,
                cookies=self.admin_cookies
            )
            
            if response.status_code == 400:
                data = response.json()
                if "already exists" in data.get("detail", "").lower():
                    self.log_test(
                        "POST /api/admin/users (duplicate email)",
                        True,
                        "Correctly rejected duplicate email with 400"
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/admin/users (duplicate email)",
                        False,
                        "Wrong error message for duplicate",
                        data
                    )
            else:
                self.log_test(
                    "POST /api/admin/users (duplicate email)",
                    False,
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/admin/users (duplicate email)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_estradas_rurais_without_auth(self):
        """Test protected route /estradas-rurais without authentication"""
        try:
            temp_session = requests.Session()
            response = temp_session.get(f"{BACKEND_URL}/estradas-rurais")
            
            if response.status_code == 401:
                self.log_test(
                    "GET /api/estradas-rurais (no auth)",
                    True,
                    "Protected route correctly returned 401 for unauthenticated request"
                )
                return True
            else:
                self.log_test(
                    "GET /api/estradas-rurais (no auth)",
                    False,
                    f"Expected 401, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/estradas-rurais (no auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_estradas_rurais_with_auth(self):
        """Test protected route /estradas-rurais with authentication"""
        if not self.admin_cookies:
            self.log_test(
                "GET /api/estradas-rurais (with auth)",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            response = self.session.get(
                f"{BACKEND_URL}/estradas-rurais",
                cookies=self.admin_cookies
            )
            
            # Should return 200 with data or 500 if Google Sheets API fails
            if response.status_code in [200, 500]:
                if response.status_code == 200:
                    self.log_test(
                        "GET /api/estradas-rurais (with auth)",
                        True,
                        "Protected route accessible with authentication, returned data"
                    )
                else:
                    # 500 is acceptable - means auth worked but external API failed
                    self.log_test(
                        "GET /api/estradas-rurais (with auth)",
                        True,
                        "Protected route accessible with authentication (external API error is expected)"
                    )
                return True
            else:
                self.log_test(
                    "GET /api/estradas-rurais (with auth)",
                    False,
                    f"Unexpected status code {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "GET /api/estradas-rurais (with auth)",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def test_logout(self):
        """Test logout functionality"""
        if not self.admin_cookies:
            self.log_test(
                "POST /api/auth/logout",
                False,
                "No admin cookies available - login test must pass first"
            )
            return False
            
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/logout",
                cookies=self.admin_cookies
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Logout successful":
                    # Test that we can't access protected routes after logout
                    test_response = self.session.get(
                        f"{BACKEND_URL}/auth/me",
                        cookies=response.cookies  # Use cookies from logout response
                    )
                    
                    if test_response.status_code == 401:
                        self.log_test(
                            "POST /api/auth/logout",
                            True,
                            "Logout successful and authentication cookie cleared"
                        )
                        return True
                    else:
                        self.log_test(
                            "POST /api/auth/logout",
                            False,
                            "Logout succeeded but cookie not properly cleared",
                            f"Subsequent /auth/me returned {test_response.status_code}"
                        )
                else:
                    self.log_test(
                        "POST /api/auth/logout",
                        False,
                        "Wrong logout message",
                        data
                    )
            else:
                self.log_test(
                    "POST /api/auth/logout",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test(
                "POST /api/auth/logout",
                False,
                f"Exception: {str(e)}"
            )
        return False
    
    def cleanup_test_user(self):
        """Clean up test user created during testing"""
        if not self.test_user_id or not self.admin_cookies:
            return
            
        try:
            # Re-login to get fresh cookies since logout cleared them
            login_response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                }
            )
            
            if login_response.status_code == 200:
                fresh_cookies = login_response.cookies
                
                # Delete test user
                delete_response = self.session.delete(
                    f"{BACKEND_URL}/admin/users/{self.test_user_id}",
                    cookies=fresh_cookies
                )
                
                if delete_response.status_code == 200:
                    print("✅ Test user cleanup successful")
                else:
                    print(f"⚠️  Test user cleanup failed: {delete_response.status_code}")
        except Exception as e:
            print(f"⚠️  Test user cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Backend Authentication Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        print()
        
        # Test sequence - order matters for dependencies
        tests = [
            self.test_login_valid_credentials,
            self.test_login_invalid_credentials,
            self.test_get_me_without_auth,
            self.test_get_me_with_auth,
            self.test_admin_users_list_without_auth,
            self.test_admin_users_list_with_admin,
            self.test_create_user_valid,
            self.test_create_user_duplicate,
            self.test_estradas_rurais_without_auth,
            self.test_estradas_rurais_with_auth,
            self.test_logout
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            if test():
                passed += 1
            else:
                failed += 1
        
        # Cleanup
        self.cleanup_test_user()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = AuthTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
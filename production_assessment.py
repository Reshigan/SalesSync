#!/usr/bin/env python3
"""
SalesSync Production Commercial Readiness Assessment
Comprehensive testing and evaluation of the production deployment
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class ProductionAssessment:
    def __init__(self, base_url: str = "http://ss.gonxt.tech"):
        self.base_url = base_url
        self.session = requests.Session()
        # Disable SSL verification for testing (self-signed certificate)
        self.session.verify = False
        # Suppress SSL warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        self.test_results = {}
        self.auth_token = None
        
    def log_test(self, category: str, test_name: str, status: str, details: str = ""):
        """Log test results"""
        if category not in self.test_results:
            self.test_results[category] = []
        
        self.test_results[category].append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {category} - {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_infrastructure(self):
        """Test basic infrastructure and connectivity"""
        print("\n🏗️ TESTING INFRASTRUCTURE")
        
        try:
            response = self.session.get(self.base_url, timeout=10)
            if response.status_code == 200:
                self.log_test("Infrastructure", "Website Accessibility", "PASS", 
                            f"Status: {response.status_code}, Response time: {response.elapsed.total_seconds():.2f}s")
            else:
                self.log_test("Infrastructure", "Website Accessibility", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Infrastructure", "Website Accessibility", "FAIL", str(e))
        
        # Test API endpoint
        try:
            api_response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            if api_response.status_code == 200:
                self.log_test("Infrastructure", "API Health Check", "PASS", 
                            f"Status: {api_response.status_code}")
            else:
                self.log_test("Infrastructure", "API Health Check", "FAIL", 
                            f"Status: {api_response.status_code}")
        except Exception as e:
            self.log_test("Infrastructure", "API Health Check", "FAIL", str(e))
        
        # Test HTTPS/SSL
        if self.base_url.startswith("https://"):
            self.log_test("Infrastructure", "HTTPS/SSL", "PASS", "Site uses HTTPS")
        else:
            self.log_test("Infrastructure", "HTTPS/SSL", "FAIL", "Site not using HTTPS")
    
    def test_authentication(self):
        """Test authentication system"""
        print("\n🔐 TESTING AUTHENTICATION")
        
        # Test login endpoint
        try:
            login_data = {
                "email": "test@example.com",
                "password": "testpassword"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/login", 
                                       json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.auth_token = data["token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_test("Authentication", "Login API", "PASS", "Token received")
                else:
                    self.log_test("Authentication", "Login API", "FAIL", "No token in response")
            elif response.status_code == 401:
                self.log_test("Authentication", "Login API", "PARTIAL", 
                            "Endpoint exists but credentials invalid (expected)")
            else:
                self.log_test("Authentication", "Login API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Authentication", "Login API", "FAIL", str(e))
        
        # Test registration endpoint
        try:
            register_data = {
                "email": "newuser@example.com",
                "password": "newpassword",
                "name": "Test User"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/register", 
                                       json=register_data, timeout=10)
            
            if response.status_code in [200, 201]:
                self.log_test("Authentication", "Registration API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 409:
                self.log_test("Authentication", "Registration API", "PARTIAL", 
                            "User already exists (expected)")
            else:
                self.log_test("Authentication", "Registration API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Authentication", "Registration API", "FAIL", str(e))
    
    def test_core_features(self):
        """Test core business features"""
        print("\n🏢 TESTING CORE FEATURES")
        
        # Test customers API
        try:
            response = self.session.get(f"{self.base_url}/api/customers", timeout=10)
            if response.status_code == 200:
                self.log_test("Core Features", "Customers API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Core Features", "Customers API", "PARTIAL", 
                            "Requires authentication (expected)")
            else:
                self.log_test("Core Features", "Customers API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Core Features", "Customers API", "FAIL", str(e))
        
        # Test inventory API
        try:
            response = self.session.get(f"{self.base_url}/api/inventory", timeout=10)
            if response.status_code == 200:
                self.log_test("Core Features", "Inventory API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Core Features", "Inventory API", "PARTIAL", 
                            "Requires authentication (expected)")
            else:
                self.log_test("Core Features", "Inventory API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Core Features", "Inventory API", "FAIL", str(e))
        
        # Test sales API
        try:
            response = self.session.get(f"{self.base_url}/api/sales", timeout=10)
            if response.status_code == 200:
                self.log_test("Core Features", "Sales API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Core Features", "Sales API", "PARTIAL", 
                            "Requires authentication (expected)")
            else:
                self.log_test("Core Features", "Sales API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Core Features", "Sales API", "FAIL", str(e))
        
        # Test transactions API
        try:
            response = self.session.get(f"{self.base_url}/api/transactions", timeout=10)
            if response.status_code == 200:
                self.log_test("Core Features", "Transactions API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Core Features", "Transactions API", "PARTIAL", 
                            "Requires authentication (expected)")
            else:
                self.log_test("Core Features", "Transactions API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Core Features", "Transactions API", "FAIL", str(e))
    
    def test_enterprise_features(self):
        """Test enterprise-specific features"""
        print("\n🏆 TESTING ENTERPRISE FEATURES")
        
        # Test AI predictions API
        try:
            response = self.session.get(f"{self.base_url}/api/ai/predictions", timeout=10)
            if response.status_code == 200:
                self.log_test("Enterprise Features", "AI Predictions API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Enterprise Features", "AI Predictions API", "PARTIAL", 
                            "Requires authentication (expected)")
            elif response.status_code == 404:
                self.log_test("Enterprise Features", "AI Predictions API", "FAIL", 
                            "Endpoint not found - feature not deployed")
            else:
                self.log_test("Enterprise Features", "AI Predictions API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Enterprise Features", "AI Predictions API", "FAIL", str(e))
        
        # Test workflows API
        try:
            response = self.session.get(f"{self.base_url}/api/workflows", timeout=10)
            if response.status_code == 200:
                self.log_test("Enterprise Features", "Workflows API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Enterprise Features", "Workflows API", "PARTIAL", 
                            "Requires authentication (expected)")
            elif response.status_code == 404:
                self.log_test("Enterprise Features", "Workflows API", "FAIL", 
                            "Endpoint not found - feature not deployed")
            else:
                self.log_test("Enterprise Features", "Workflows API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Enterprise Features", "Workflows API", "FAIL", str(e))
        
        # Test advanced analytics API
        try:
            response = self.session.get(f"{self.base_url}/api/analytics/advanced", timeout=10)
            if response.status_code == 200:
                self.log_test("Enterprise Features", "Advanced Analytics API", "PASS", 
                            f"Status: {response.status_code}")
            elif response.status_code == 401:
                self.log_test("Enterprise Features", "Advanced Analytics API", "PARTIAL", 
                            "Requires authentication (expected)")
            elif response.status_code == 404:
                self.log_test("Enterprise Features", "Advanced Analytics API", "FAIL", 
                            "Endpoint not found - feature not deployed")
            else:
                self.log_test("Enterprise Features", "Advanced Analytics API", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Enterprise Features", "Advanced Analytics API", "FAIL", str(e))
    
    def test_performance(self):
        """Test performance characteristics"""
        print("\n⚡ TESTING PERFORMANCE")
        
        # Test page load times
        start_time = time.time()
        try:
            response = self.session.get(self.base_url, timeout=30)
            load_time = time.time() - start_time
            
            if load_time < 3.0:
                self.log_test("Performance", "Page Load Time", "PASS", 
                            f"{load_time:.2f}s (< 3s)")
            elif load_time < 5.0:
                self.log_test("Performance", "Page Load Time", "PARTIAL", 
                            f"{load_time:.2f}s (acceptable but could be better)")
            else:
                self.log_test("Performance", "Page Load Time", "FAIL", 
                            f"{load_time:.2f}s (too slow)")
        except Exception as e:
            self.log_test("Performance", "Page Load Time", "FAIL", str(e))
        
        # Test API response times
        api_endpoints = ["/api/health", "/api/customers", "/api/inventory"]
        total_response_time = 0
        successful_tests = 0
        
        for endpoint in api_endpoints:
            start_time = time.time()
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                response_time = time.time() - start_time
                total_response_time += response_time
                successful_tests += 1
                
                if response_time < 1.0:
                    status = "PASS"
                elif response_time < 2.0:
                    status = "PARTIAL"
                else:
                    status = "FAIL"
                
                self.log_test("Performance", f"API Response Time {endpoint}", status, 
                            f"{response_time:.2f}s")
            except Exception as e:
                self.log_test("Performance", f"API Response Time {endpoint}", "FAIL", str(e))
        
        if successful_tests > 0:
            avg_response_time = total_response_time / successful_tests
            if avg_response_time < 1.0:
                self.log_test("Performance", "Average API Response Time", "PASS", 
                            f"{avg_response_time:.2f}s")
            else:
                self.log_test("Performance", "Average API Response Time", "PARTIAL", 
                            f"{avg_response_time:.2f}s")
    
    def generate_report(self):
        """Generate comprehensive assessment report"""
        print("\n" + "="*80)
        print("🏢 SALESSYNC COMMERCIAL READINESS ASSESSMENT")
        print("="*80)
        
        total_tests = 0
        passed_tests = 0
        partial_tests = 0
        failed_tests = 0
        
        for category, tests in self.test_results.items():
            print(f"\n📊 {category.upper()}")
            print("-" * 50)
            
            category_pass = 0
            category_total = len(tests)
            
            for test in tests:
                status_emoji = "✅" if test["status"] == "PASS" else "❌" if test["status"] == "FAIL" else "⚠️"
                print(f"{status_emoji} {test['test']}: {test['status']}")
                if test["details"]:
                    print(f"   {test['details']}")
                
                total_tests += 1
                if test["status"] == "PASS":
                    passed_tests += 1
                    category_pass += 1
                elif test["status"] == "PARTIAL":
                    partial_tests += 1
                    category_pass += 0.5
                else:
                    failed_tests += 1
            
            category_percentage = (category_pass / category_total) * 100 if category_total > 0 else 0
            print(f"Category Score: {category_percentage:.1f}% ({category_pass}/{category_total})")
        
        # Overall assessment
        overall_score = ((passed_tests + (partial_tests * 0.5)) / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n🎯 OVERALL ASSESSMENT")
        print("-" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Partial: {partial_tests} ⚠️")
        print(f"Failed: {failed_tests} ❌")
        print(f"Overall Score: {overall_score:.1f}%")
        
        # Commercial readiness assessment
        if overall_score >= 90:
            readiness = "🟢 READY FOR COMMERCIAL DEPLOYMENT"
            recommendation = "System is production-ready with minor optimizations needed."
        elif overall_score >= 75:
            readiness = "🟡 NEAR COMMERCIAL READY"
            recommendation = "System needs some improvements before commercial deployment."
        elif overall_score >= 60:
            readiness = "🟠 DEVELOPMENT STAGE"
            recommendation = "System requires significant work before commercial deployment."
        else:
            readiness = "🔴 NOT READY"
            recommendation = "System needs major development work before commercial deployment."
        
        print(f"\n{readiness}")
        print(f"Recommendation: {recommendation}")
        
        return {
            "overall_score": overall_score,
            "readiness": readiness,
            "recommendation": recommendation,
            "test_results": self.test_results,
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "partial": partial_tests,
                "failed": failed_tests
            }
        }
    
    def run_assessment(self):
        """Run complete assessment"""
        print("🚀 Starting SalesSync Production Assessment...")
        print(f"Target: {self.base_url}")
        print(f"Time: {datetime.now().isoformat()}")
        
        self.test_infrastructure()
        self.test_authentication()
        self.test_core_features()
        self.test_enterprise_features()
        self.test_performance()
        
        return self.generate_report()

if __name__ == "__main__":
    assessment = ProductionAssessment()
    report = assessment.run_assessment()
    
    # Save report to file
    with open("production_assessment_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: production_assessment_report.json")
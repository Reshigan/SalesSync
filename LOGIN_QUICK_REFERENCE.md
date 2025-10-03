# 🔐 Login API - Quick Reference Card

**Status:** ✅ FIXED & WORKING  
**Date:** 2025-10-03

---

## 🚀 How to Login

### Required Header
```
X-Tenant-Code: DEMO
```

### Request
```bash
POST /api/auth/login
Content-Type: application/json
X-Tenant-Code: DEMO

{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "..." },
    "tenant": { "code": "DEMO", "name": "..." },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Response (Error - Missing Tenant Code)
```json
{
  "success": false,
  "error": {
    "message": "Tenant code header (X-Tenant-Code) is required",
    "code": "TENANT_REQUIRED"
  }
}
```

---

## 📦 Available Tenants

| Tenant Code | Name | Test User | Password |
|-------------|------|-----------|----------|
| `DEMO` | Demo Company | admin@demo.com | admin123 |
| `PEPSI_SA` | Pepsi South Africa | (contact admin) | (contact admin) |

---

## 🔑 Using the Token

### All API Requests Need:
```
Authorization: Bearer <token>
X-Tenant-Code: DEMO
```

### Example
```bash
GET /api/customers
Authorization: Bearer eyJhbGci...
X-Tenant-Code: DEMO
```

---

## ⚡ Quick Test Commands

### Test Login
```bash
curl -X POST http://localhost:12000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

### Test Profile
```bash
TOKEN="your-token-here"
curl -X GET http://localhost:12000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: DEMO"
```

### Test Customers API
```bash
TOKEN="your-token-here"
curl -X GET http://localhost:12000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: DEMO"
```

---

## 🐛 Common Issues

### ❌ "Tenant code header required"
**Problem:** Missing `X-Tenant-Code` header  
**Solution:** Add header to request

### ❌ "Invalid or inactive tenant"
**Problem:** Wrong tenant code  
**Solution:** Use `DEMO` or `PEPSI_SA`

### ❌ "Invalid email or password"
**Problem:** Wrong credentials  
**Solution:** Check email and password

### ❌ 401 Unauthorized
**Problem:** Token expired or invalid  
**Solution:** Login again to get new token

---

## 📖 Full Documentation

- **Detailed Test Report:** `LOGIN_TEST_REPORT.md`
- **Production Fix Summary:** `PRODUCTION_LOGIN_FIX_SUMMARY.md`
- **API Docs:** http://localhost:12000/api-docs

---

## ✅ Status Check

```bash
# Check if backend is running
curl http://localhost:12000/api/health

# Test login (should return success: true)
curl -s -X POST http://localhost:12000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}' \
  | jq '.success'
```

Expected output: `true`

---

**Last Updated:** 2025-10-03  
**Version:** 1.0 (Post-Fix)

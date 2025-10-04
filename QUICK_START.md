# SalesSync - Quick Start Guide

## 🚀 Access the Application

### Production URL
**https://ss.gonxt.tech**

### Login Credentials

#### Vantax Food Distribution Tenant

**Administrator**
```
Email: admin@vantax.co.za
Password: vantax2024
```

**Manager**
```
Email: manager@vantax.co.za
Password: vantax2024
```

**Supervisor**
```
Email: supervisor@vantax.co.za
Password: vantax2024
```

**Field Agents**
```
agent1@vantax.co.za / vantax2024
agent2@vantax.co.za / vantax2024
agent3@vantax.co.za / vantax2024
```

## 📊 Demo Data Overview

- **Tenant**: Vantax Food Distribution (FMCG South Africa)
- **Period**: 12 months (Oct 2024 - Oct 2025)
- **Products**: 10 FMCG items (Beverages, Dairy, Bread, Snacks)
- **Customers**: 100 retail outlets
- **Orders**: 3,000+ transactions
- **Visits**: 7,000+ customer visits
- **Regions**: Gauteng, Western Cape, KwaZulu-Natal

## 🔧 Server Management

### SSH Access
```bash
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com
```

### Check Service Status
```bash
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 list"
```

### Restart Services
```bash
# Restart all
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 restart all"

# Restart backend only
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 restart salessync-backend"

# Restart frontend only
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 restart salessync-frontend"
```

### View Logs
```bash
# Backend logs
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 logs salessync-backend --lines 50"

# Frontend logs
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "pm2 logs salessync-frontend --lines 50"
```

## 🗄️ Database Access

### Connect to Database
```bash
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "sqlite3 ~/salessync-production/backend-api/database/salessync.db"
```

### Quick Queries
```bash
# Count records
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "sqlite3 ~/salessync-production/backend-api/database/salessync.db 'SELECT COUNT(*) as orders FROM orders; SELECT COUNT(*) as customers FROM customers;'"

# List users
ssh -i "SSAI.pem" ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com "sqlite3 ~/salessync-production/backend-api/database/salessync.db 'SELECT email, role FROM users;'"
```

## 🧪 API Testing

### Login Test
```bash
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: VANTAX" \
  -d '{"email":"admin@vantax.co.za","password":"vantax2024"}'
```

### Get Orders (with token)
```bash
# First, login and get token
TOKEN=$(curl -s -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: VANTAX" \
  -d '{"email":"admin@vantax.co.za","password":"vantax2024"}' | jq -r '.data.token')

# Then use token to get orders
curl -s https://ss.gonxt.tech/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: VANTAX" | jq '.data | length'
```

## 📱 Module Access

All modules are accessible after login:

1. **Dashboard** - `/dashboard`
2. **Orders** - `/orders`
3. **Customers** - `/customers`
4. **Products** - `/products`
5. **Field Activities** - `/field-activities`
6. **Van Sales** - `/van-sales`
7. **Merchandising** - `/merchandising`
8. **Promotions** - `/promotions`
9. **Surveys** - `/surveys`
10. **Reports** - `/reports`

## 🔐 Security Notes

- ✅ SSL/TLS enabled (HTTPS)
- ✅ JWT authentication
- ✅ Tenant isolation
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ⚠️ Demo passwords - change in production

## 📞 Support

- **Repository**: https://github.com/Reshigan/SalesSync
- **Branch**: deployment/vantax-production
- **Documentation**: See VANTAX_DEPLOYMENT_COMPLETE.md

---

**Last Updated**: October 4, 2025  
**Status**: ✅ Production Ready

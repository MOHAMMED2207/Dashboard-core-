# Postman Testing Guide - Step by Step

## 📋 Setup Postman Collection

### 1. Create New Collection
- افتح Postman
- اضغط على "New" → "Collection"
- اسم الـ Collection: **"Dashboard API"**

### 2. Create Environment Variables
- اضغط على "Environments" في الـ sidebar
- اضغط على "+" لإنشاء Environment جديد
- الاسم: **"Dashboard Local"**
- أضف المتغيرات التالية:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:5000` | `http://localhost:5000` |
| `token` | (سيتم ملؤه بعد Login) | |
| `companyId` | (سيتم ملؤه بعد Create Company) | |
| `dashboardId` | (سيتم ملؤه بعد Create Dashboard) | |

---

## 🧪 Test Sequence

## Test 1: Health Check ✅

### Request
```
GET {{base_url}}/api/health
```

### Expected Response (200)
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123.456
}
```

---

## Test 2: Register User 👤

### Request
```
POST {{base_url}}/api/auth/register
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "fullname": "Ahmed Mohamed",
  "username": "ahmed123",
  "email": "ahmed@example.com",
  "Password": "Ahmed@123",
  "Phone": "01234567890"
}
```

### Expected Response (201)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "fullname": "Ahmed Mohamed",
    "username": "ahmed123",
    "email": "ahmed@example.com"
  }
}
```

### ⚠️ If Email Exists
```json
{
  "error": "Email already exists"
}
```

---

## Test 3: Login 🔐

### Request
```
POST {{base_url}}/api/auth/login
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "email": "ahmed@example.com",
  "Password": "Ahmed@123"
}
```

### Expected Response (200)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "fullname": "Ahmed Mohamed",
    "username": "ahmed123",
    "email": "ahmed@example.com",
    "role": "User"
  }
}
```

### 📝 Important: Save Token
1. انسخ قيمة الـ `token` من الـ Response
2. في Postman Environment، ضع الـ Token في متغير `token`
3. أو استخدم Tests Script:

```javascript
// في tab "Tests" في Postman
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("Token saved:", jsonData.token);
}
```

---

## Test 4: Get Current User 👨‍💼

### Request
```
GET {{base_url}}/api/auth/me
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "_id": "...",
  "fullname": "Ahmed Mohamed",
  "username": "ahmed123",
  "email": "ahmed@example.com",
  "role": "User",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Test 5: Create Company 🏢

### Request
```
POST {{base_url}}/api/companies
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "name": "Tech Solutions Egypt",
  "industry": "Technology",
  "size": "51-200",
  "email": "info@techsolutions.com",
  "website": "https://techsolutions.com",
  "country": "Egypt",
  "city": "Cairo",
  "phone": "01001234567"
}
```

### Expected Response (201)
```json
{
  "message": "Company created successfully",
  "company": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "Tech Solutions Egypt",
    "industry": "Technology",
    "size": "51-200",
    "email": "info@techsolutions.com",
    "subscription": "free",
    "owner": "...",
    "members": [
      {
        "userId": "...",
        "role": "owner",
        "permissions": ["*"]
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 📝 Save Company ID
```javascript
// في tab "Tests"
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("companyId", jsonData.company._id);
    console.log("Company ID saved:", jsonData.company._id);
}
```

---

## Test 6: Get My Companies 🏢

### Request
```
GET {{base_url}}/api/companies/my-companies
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "companies": [
    {
      "_id": "...",
      "name": "Tech Solutions Egypt",
      "logo": null,
      "industry": "Technology",
      "size": "51-200",
      "subscription": "free",
      "userRole": "owner",
      "statistics": {
        "totalUsers": 0,
        "totalRevenue": 0
      }
    }
  ],
  "count": 1
}
```

---

## Test 7: Get Company Details 📊

### Request
```
GET {{base_url}}/api/companies/{{companyId}}
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "_id": "...",
  "name": "Tech Solutions Egypt",
  "industry": "Technology",
  "size": "51-200",
  "email": "info@techsolutions.com",
  "subscription": "free",
  "owner": "...",
  "members": [...],
  "settings": {
    "currency": "USD",
    "language": "en",
    "timezone": "UTC"
  },
  "statistics": {...},
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Test 8: Create Dashboard 📊

### Request
```
POST {{base_url}}/api/dashboards
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "companyId": "{{companyId}}",
  "name": "Sales Dashboard",
  "description": "Track sales performance and metrics",
  "type": "personal",
  "category": "sales",
  "widgets": []
}
```

### Expected Response (201)
```json
{
  "message": "Dashboard created successfully",
  "dashboard": {
    "_id": "...",
    "companyId": "...",
    "userId": "...",
    "name": "Sales Dashboard",
    "description": "Track sales performance and metrics",
    "type": "personal",
    "category": "sales",
    "widgets": [],
    "viewCount": 0,
    "createdAt": "..."
  }
}
```

### 📝 Save Dashboard ID
```javascript
// في tab "Tests"
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("dashboardId", jsonData.dashboard._id);
    console.log("Dashboard ID saved:", jsonData.dashboard._id);
}
```

---

## Test 9: Add Widget to Dashboard 🔧

### Request
```
POST {{base_url}}/api/dashboards/{{dashboardId}}/widgets
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "type": "kpi",
  "title": "Total Revenue",
  "config": {
    "dataSource": "/api/analytics/revenue",
    "refreshInterval": 300,
    "dateRange": "last30days",
    "chartType": "line",
    "showGrid": true,
    "colors": ["#3b82f6"]
  },
  "position": {
    "x": 0,
    "y": 0,
    "w": 4,
    "h": 3
  }
}
```

### Expected Response (200)
```json
{
  "message": "Widget added successfully",
  "widget": {
    "id": "widget-1234567890-abc123",
    "type": "kpi",
    "title": "Total Revenue",
    "config": {...},
    "position": {...}
  }
}
```

---

## Test 10: Get Dashboard with Widgets 📈

### Request
```
GET {{base_url}}/api/dashboards/{{dashboardId}}
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "_id": "...",
  "name": "Sales Dashboard",
  "description": "...",
  "widgets": [
    {
      "id": "widget-1234567890-abc123",
      "type": "kpi",
      "title": "Total Revenue",
      "config": {...},
      "position": {...}
    }
  ],
  "viewCount": 1,
  "lastViewedAt": "..."
}
```

---

## Test 11: Update Company 🔄

### Request
```
PUT {{base_url}}/api/companies/{{companyId}}
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "name": "Tech Solutions Egypt - Updated",
  "website": "https://new-techsolutions.com",
  "settings": {
    "currency": "EGP",
    "language": "ar",
    "timezone": "Africa/Cairo"
  }
}
```

### Expected Response (200)
```json
{
  "message": "Company updated successfully",
  "company": {
    "_id": "...",
    "name": "Tech Solutions Egypt - Updated",
    "website": "https://new-techsolutions.com",
    "settings": {
      "currency": "EGP",
      "language": "ar",
      "timezone": "Africa/Cairo"
    }
  }
}
```

---

## Test 12: Get Company Statistics 📊

### Request
```
GET {{base_url}}/api/companies/{{companyId}}/statistics
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "statistics": {
    "totalUsers": 0,
    "totalRevenue": 0,
    "activeProjects": 0,
    "completedTasks": 0,
    "dashboards": 1,
    "reports": 0,
    "analytics": 0,
    "members": 1
  },
  "recentActivity": [
    {
      "_id": "...",
      "action": "dashboard.create",
      "category": "dashboard",
      "details": {...},
      "createdAt": "..."
    }
  ],
  "subscription": {
    "plan": "free",
    "isActive": true,
    "expiresAt": "..."
  }
}
```

---

## Test 13: Add Member to Company 👥

### Request
```
POST {{base_url}}/api/companies/{{companyId}}/members
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "email": "mohamed@example.com",
  "role": "manager",
  "permissions": ["dashboard.create", "analytics.read"]
}
```

### Expected Response (200)
```json
{
  "message": "Member added successfully",
  "member": {
    "userId": "...",
    "username": "mohamed123",
    "email": "mohamed@example.com",
    "role": "manager"
  }
}
```

### ⚠️ Note:
المستخدم يجب أن يكون مسجل أولاً. إذا لم يكن موجود:
```json
{
  "error": "User not found with this email"
}
```

---

## Test 14: Create Analytics Data 📈

### Request
```
POST {{base_url}}/api/analytics/{{companyId}}/custom
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw - JSON)
```json
{
  "type": "sales",
  "category": "daily",
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "data": {
    "metrics": {
      "total": 150000,
      "average": 5000,
      "min": 1000,
      "max": 15000,
      "growth": 25,
      "growthRate": 0.25,
      "change": 30000,
      "changeRate": 0.25
    },
    "breakdown": [
      {
        "label": "Product A",
        "value": 60000,
        "percentage": 40
      },
      {
        "label": "Product B",
        "value": 90000,
        "percentage": 60
      }
    ],
    "timeSeries": [
      {
        "timestamp": "2024-01-01",
        "value": 5000
      },
      {
        "timestamp": "2024-01-02",
        "value": 5500
      }
    ]
  }
}
```

### Expected Response (201)
```json
{
  "message": "Analytics created successfully",
  "analytics": {
    "_id": "...",
    "companyId": "...",
    "type": "sales",
    "category": "daily",
    "data": {...},
    "status": "completed",
    "createdAt": "..."
  }
}
```

---

## Test 15: Get Analytics Overview 🎯

### Request
```
GET {{base_url}}/api/analytics/{{companyId}}/overview?days=30
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "overview": {
    "sales": {
      "current": 150000,
      "change": 30000,
      "changeRate": 0.25,
      "trend": "up"
    },
    "revenue": null,
    "users": null,
    "traffic": null,
    "conversion": null,
    "performance": null
  },
  "period": {
    "start": "2024-01-05T10:00:00.000Z",
    "end": "2024-02-04T10:00:00.000Z"
  },
  "totalInsights": 0,
  "lastUpdated": "..."
}
```

---

## Test 16: Get KPIs 🎯

### Request
```
GET {{base_url}}/api/analytics/{{companyId}}/kpis
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "kpis": [
    {
      "id": "total_sales",
      "name": "Total Sales",
      "value": 150000,
      "change": 25,
      "trend": "up",
      "icon": "shopping-cart",
      "color": "blue"
    },
    {
      "id": "revenue",
      "name": "Revenue",
      "value": 0,
      "change": 0,
      "trend": "stable",
      "icon": "dollar-sign",
      "color": "green"
    },
    {
      "id": "active_users",
      "name": "Active Users",
      "value": 0,
      "change": 0,
      "trend": "stable",
      "icon": "users",
      "color": "purple"
    },
    {
      "id": "conversion_rate",
      "name": "Conversion Rate",
      "value": 0,
      "change": 0,
      "trend": "stable",
      "icon": "trending-up",
      "color": "orange",
      "suffix": "%"
    }
  ]
}
```

---

## Test 17: Get Specific Analytics Type 📊

### Request
```
GET {{base_url}}/api/analytics/{{companyId}}/sales?days=30
Authorization: Bearer {{token}}
```

### Expected Response (200)
```json
{
  "type": "sales",
  "timeSeries": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "value": 5000,
      "change": 0
    },
    {
      "timestamp": "2024-01-02T00:00:00.000Z",
      "value": 5500,
      "change": 500
    }
  ],
  "current": {
    "total": 150000,
    "average": 5000,
    "growth": 25
  },
  "breakdown": [...],
  "insights": [],
  "predictions": {},
  "anomalies": []
}
```

---

## 🎯 Common Errors & Solutions

### Error 1: "Access Denied" (403)
```json
{
  "error": "Access Denied"
}
```
**Solution**: تأكد من إضافة الـ Token في الـ Authorization Header

### Error 2: "Company not found" (404)
```json
{
  "error": "Company not found"
}
```
**Solution**: تأكد من أن الـ `companyId` صحيح في الـ Environment Variables

### Error 3: "Invalid or expired token" (401)
```json
{
  "error": "Invalid or expired token"
}
```
**Solution**: قم بعمل Login مرة أخرى واحصل على Token جديد

### Error 4: "You are not a member of this company" (403)
```json
{
  "error": "You are not a member of this company"
}
```
**Solution**: تأكد أنك تستخدم الـ Company التي أنشأتها أو أنك عضو فيها

---

## 📝 Postman Tests Script Template

أضف هذا الكود في tab "Tests" لكل request:

```javascript
// Check status code
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Check response time
pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

// Save token (for Login endpoint)
if (pm.response.code === 200 && pm.response.json().token) {
    pm.environment.set("token", pm.response.json().token);
    console.log("Token saved");
}

// Save companyId (for Create Company endpoint)
if (pm.response.code === 201 && pm.response.json().company) {
    pm.environment.set("companyId", pm.response.json().company._id);
    console.log("Company ID saved");
}

// Save dashboardId (for Create Dashboard endpoint)
if (pm.response.code === 201 && pm.response.json().dashboard) {
    pm.environment.set("dashboardId", pm.response.json().dashboard._id);
    console.log("Dashboard ID saved");
}
```

---

## 🚀 Quick Start Checklist

- [ ] السيرفر شغال على `http://localhost:5000`
- [ ] MongoDB متصل
- [ ] Postman Environment مُعد بالـ Variables
- [ ] سجلت مستخدم جديد (Register)
- [ ] عملت Login وحفظت الـ Token
- [ ] أنشأت Company وحفظت الـ ID
- [ ] أنشأت Dashboard وحفظت الـ ID
- [ ] جربت إضافة Widget
- [ ] جربت Analytics APIs

---

**Happy Testing! 🎉**

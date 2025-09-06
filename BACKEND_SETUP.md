# 🔧 Backend Setup Guide for Hichhki Admin Panel

This guide will help you configure the admin panel to work with your real backend API.

## 📋 Prerequisites

1. **Backend API Running**: Your Hichhki backend should be running and accessible
2. **Admin Routes**: Ensure your backend has the admin API routes implemented
3. **Admin User**: You should have admin credentials created in your backend

## 🌐 API Configuration

### 1. Environment Variables

Create a `.env` file in the `hichhki-admin` root directory:

```bash
# .env
VITE_API_URL=http://localhost:3000/api/v1/admin
```

**Update the URL to match your backend:**
- **Local Development**: `http://localhost:3000/api/v1/admin`
- **Production**: `https://yourdomain.com/api/v1/admin`
- **Custom Port**: `http://localhost:5000/api/v1/admin`

### 2. Default Configuration

If you don't set `VITE_API_URL`, the admin panel will use:
```
http://localhost:3000/api/v1/admin
```

## 🔐 Admin Authentication Setup

### 1. Backend Admin Routes Required

Your backend should have these admin routes implemented:

```javascript
// Authentication
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/auth/me

// Dashboard
GET  /api/v1/admin/dashboard

// Products
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/:id
PUT    /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id

// Categories
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
GET    /api/v1/admin/categories/:id
PUT    /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id

// Orders
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:id
PATCH /api/v1/admin/orders/:id/status

// Users
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/status
PATCH  /api/v1/admin/users/:id/role
DELETE /api/v1/admin/users/:id

// Banners
GET    /api/v1/admin/banners
POST   /api/v1/admin/banners
GET    /api/v1/admin/banners/:id
PUT    /api/v1/admin/banners/:id
DELETE /api/v1/admin/banners/:id

// Coupons
GET    /api/v1/admin/coupons
POST   /api/v1/admin/coupons
GET    /api/v1/admin/coupons/:id
PUT    /api/v1/admin/coupons/:id
DELETE /api/v1/admin/coupons/:id
```

### 2. Admin User Creation

Ensure you have an admin user in your backend:

```javascript
// Example admin user structure
{
  id: "admin-001",
  email: "admin@hichhki.com",
  name: "Admin User",
  isAdmin: true,
  password: "your-secure-password"
}
```

## 🚀 Testing the Connection

### 1. Start Your Backend
```bash
# In your backend directory
npm start
# or
node server.js
# or whatever command starts your backend
```

### 2. Start the Admin Panel
```bash
# In hichhki-admin directory
npm run dev
```

### 3. Test Login
- Navigate to `http://localhost:5173`
- Use your real admin credentials
- Should redirect to dashboard after successful login

## 🔍 Troubleshooting

### Issue 1: Connection Refused
**Error**: `Failed to fetch` or `Connection refused`
**Solution**: 
- Check if your backend is running
- Verify the port number in `VITE_API_URL`
- Check firewall settings

### Issue 2: CORS Error
**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`
**Solution**: Ensure your backend has CORS configured:
```javascript
// In your backend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### Issue 3: 404 Not Found
**Error**: `404 Not Found` for admin routes
**Solution**: 
- Verify admin routes are implemented in your backend
- Check the API base path matches `/api/v1/admin`
- Ensure routes are properly registered

### Issue 4: Authentication Failed
**Error**: `401 Unauthorized` or `Invalid credentials`
**Solution**:
- Verify admin user exists in your backend
- Check password hashing/verification
- Ensure `isAdmin: true` field is set

## 📱 API Response Format

Your backend should return responses in this format:

```javascript
// Success Response
{
  "ok": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt-token-here"
  }
}

// Error Response
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 🔒 Security Considerations

1. **HTTPS in Production**: Use HTTPS for production deployments
2. **JWT Tokens**: Implement proper JWT token validation
3. **Rate Limiting**: Add rate limiting to prevent brute force attacks
4. **Input Validation**: Validate all input data on the backend
5. **Admin Role Check**: Ensure only admin users can access admin routes

## 📞 Support

If you encounter issues:

1. **Check Browser Console** for error messages
2. **Verify Backend Logs** for server-side errors
3. **Test API Endpoints** directly with Postman/curl
4. **Check Network Tab** in browser DevTools for failed requests

## 🎯 Success Indicators

Your admin panel is properly connected when:
- ✅ Login page loads without errors
- ✅ Login with real credentials succeeds
- ✅ Redirects to dashboard after login
- ✅ Dashboard loads with real data
- ✅ All admin sections are accessible
- ✅ No console errors related to API calls

---

**Happy Admin Panel Setup! 🚀**

# 🚀 Quick Setup Checklist for Real Backend

## ✅ **Step 1: Backend Configuration**

- [ ] **Backend is running** on your preferred port (e.g., 3000, 5000)
- [ ] **Admin routes are implemented** in your backend
- [ ] **Admin user exists** with `isAdmin: true` flag
- [ ] **CORS is configured** to allow admin panel requests

## ✅ **Step 2: Environment Setup**

Create `.env` file in `hichhki-admin` root:
```bash
VITE_API_URL=http://localhost:YOUR_PORT/api/v1/admin
```

**Examples:**
- Port 3000: `VITE_API_URL=http://localhost:3000/api/v1/admin`
- Port 5000: `VITE_API_URL=http://localhost:5000/api/v1/admin`
- Custom domain: `VITE_API_URL=https://yourdomain.com/api/v1/admin`

## ✅ **Step 3: Test Connection**

1. **Start your backend**
2. **Start admin panel**: `npm run dev`
3. **Navigate to**: `http://localhost:5173`
4. **Login with your real admin credentials**

## ✅ **Step 4: Verify Success**

- [ ] Login page loads without errors
- [ ] Login succeeds with real credentials
- [ ] Redirects to dashboard
- [ ] Dashboard shows real data
- [ ] No console errors

## 🔧 **If Issues Occur**

### **Check Browser Console** for error messages
### **Verify Backend Logs** for server errors
### **Test API Endpoint** directly:
```bash
curl -X POST http://localhost:YOUR_PORT/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

## 📱 **Required Backend Routes**

Your backend must have these endpoints:
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/me`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/products`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/categories`
- `GET /api/v1/admin/banners`
- `GET /api/v1/admin/coupons`

## 🎯 **Success Message**

When everything works:
> "Login successful!" → Redirects to dashboard → Shows real data

---

**Need help? Check BACKEND_SETUP.md for detailed troubleshooting! 🛠️**

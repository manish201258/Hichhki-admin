# Admin Login Guide

## Issue Resolution

The "GET http://localhost:3000/api/v1/admin/categories net::ERR_CONNECTION_REFUSED" error occurs because the frontend is not authenticated when trying to access the Products page.

## Solution

### Step 1: Access the Admin Login
1. Navigate to the root URL of your admin panel (e.g., `http://localhost:8080/`)
2. This will automatically show the admin login form

### Step 2: Login with Admin Credentials
Use these credentials:
- **Email**: `admin@hichhki.com`
- **Password**: `admin123`

### Step 3: Access Protected Pages
After successful login:
1. You'll be redirected to the dashboard (`/admin`)
2. You can now access the Products page (`/admin/products`)
3. All API calls will include the authentication token

## Why This Happens

The Products page is protected by `PrivateRoute` which requires:
1. A valid authentication token
2. User to have admin roles
3. Token to be stored in localStorage

## Testing the Backend

The backend is working correctly:
- ✅ Server running on port 3000
- ✅ Admin login endpoint working
- ✅ JWT authentication working
- ✅ Protected routes accessible with valid token

## Frontend Authentication Flow

1. User visits `/` → Shows login form
2. User enters credentials → API call to `/api/v1/admin/auth/login`
3. Backend validates credentials → Returns JWT token
4. Frontend stores token in localStorage
5. User redirected to dashboard
6. All subsequent API calls include `Authorization: Bearer <token>` header

## Troubleshooting

If you still get authentication errors after login:
1. Check browser console for token storage
2. Verify localStorage has `adminToken` and `adminRefreshToken`
3. Check if token has expired (JWT tokens expire after 15 minutes)
4. Try refreshing the page or logging out and back in

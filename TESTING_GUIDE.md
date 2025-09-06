# 🧪 Hichhki Admin Panel Testing Guide

This guide will help you test the admin authentication, protected routes, and overall functionality.

## 🚀 Quick Start Testing

### 1. Start the Development Server
```bash
cd hichhki-admin
npm run dev
```

### 2. Access the Admin Panel
- Navigate to `http://localhost:5173`
- You should see the Hichhki Admin login page

## 🔐 Authentication Flow Testing

### ✅ Test 1: Login Page Display
**Expected Result**: 
- Hichhki Admin branding is visible
- Login form with email and password fields
- Development mode indicator (blue box) showing test credentials
- Test credentials should be pre-filled: `admin@hichhki.com` / `admin123`

### ✅ Test 2: Form Validation
**Test Cases**:
1. **Empty form submission**: Should show "Please fill in all fields" error
2. **Invalid email format**: Should show validation error
3. **Missing password**: Should show validation error

### ✅ Test 3: Login Process
**Test Cases**:
1. **Valid credentials**: Should show "Login successful!" toast and redirect to `/admin`
2. **Invalid credentials**: Should show "Login failed" error message
3. **Loading state**: Button should show "Signing in..." and be disabled during login

## 🛡️ Protected Routes Testing

### ✅ Test 4: Route Protection
**Test Cases**:
1. **Without login**: Try to access `/admin` directly - should redirect to `/`
2. **With valid login**: Should access dashboard successfully
3. **All admin routes**: Verify these are protected:
   - `/admin` (Dashboard)
   - `/admin/products`
   - `/admin/orders`
   - `/admin/users`
   - `/admin/categories`
   - `/admin/banners`
   - `/admin/coupons`
   
   - `/admin/analytics`
   - `/admin/settings`
   - `/admin/profile`

### ✅ Test 5: Authentication Persistence
**Test Cases**:
1. **Page refresh**: Login should persist after refreshing the page
2. **New tab**: Should remain logged in when opening admin panel in new tab
3. **Token validation**: Should verify stored token on app load

## 📊 Dashboard Testing

### ✅ Test 6: Dashboard Display
**Expected Result**:
- Welcome message with admin name
- Statistics cards showing totals
- Recent orders and products
- Quick action buttons
- Refresh functionality

### ✅ Test 7: Navigation
**Test Cases**:
1. **Sidebar navigation**: All menu items should be clickable
2. **Active states**: Current page should be highlighted
3. **Collapsible sidebar**: Should expand/collapse properly
4. **Profile section**: Should show admin user info

## 🔄 Logout Testing

### ✅ Test 8: Logout Process
**Test Cases**:
1. **Logout button**: Click profile in sidebar to access logout
2. **Logout confirmation**: Should show "Logged out successfully" toast
3. **Redirect**: Should redirect to login page (`/`)
4. **Session clear**: Should not be able to access admin routes after logout

## 🐛 Common Issues & Solutions

### Issue 1: Router Context Error
**Error**: `useNavigate() may be used only in the context of a <Router> component`
**Solution**: ✅ **FIXED** - Restructured App.tsx to wrap AuthProvider inside BrowserRouter

### Issue 2: Login Not Redirecting
**Possible Causes**:
- Backend API not responding
- Invalid credentials
- Network issues
**Solution**: Check browser console for errors, verify backend is running

### Issue 3: Protected Routes Not Working
**Possible Causes**:
- Authentication context not properly initialized
- Token validation failing
**Solution**: Check localStorage for adminUser and adminToken, verify API responses

## 🧪 Manual Testing Checklist

### Authentication
- [ ] Login page loads correctly
- [ ] Form validation works
- [ ] Login with test credentials succeeds
- [ ] Redirect to dashboard works
- [ ] Loading states display properly
- [ ] Error messages show for invalid login

### Route Protection
- [ ] Direct access to `/admin` redirects to login
- [ ] All admin routes are protected
- [ ] Authenticated users can access admin routes
- [ ] Unauthenticated users are redirected

### Dashboard & Navigation
- [ ] Dashboard loads with user info
- [ ] Sidebar navigation works
- [ ] All menu items are accessible
- [ ] Profile section shows correct user info

### Session Management
- [ ] Login persists after page refresh
- [ ] Token validation works
- [ ] Logout clears session
- [ ] Logout redirects to login page

## 🔧 Development Testing Tips

### 1. Use Browser DevTools
- **Console**: Check for JavaScript errors
- **Network**: Monitor API requests/responses
- **Application**: Check localStorage for auth data
- **Elements**: Verify UI components render correctly

### 2. Test Different Scenarios
- **Valid login**: `admin@hichhki.com` / `admin123`
- **Invalid login**: Try wrong credentials
- **Empty form**: Submit without entering data
- **Network issues**: Disconnect internet to test error handling

### 3. Verify API Integration
- Check that the admin API client is properly configured
- Verify the backend endpoints are accessible
- Test with real backend if available

## 🎯 Success Criteria

The admin panel is working correctly when:
1. ✅ Login page displays properly
2. ✅ Authentication flow works end-to-end
3. ✅ Protected routes redirect unauthorized users
4. ✅ Dashboard loads for authenticated users
5. ✅ Navigation between admin sections works
6. ✅ Logout process completes successfully
7. ✅ Session persistence works across page refreshes

## 🚨 If Tests Fail

1. **Check browser console** for error messages
2. **Verify backend API** is running and accessible
3. **Check network requests** in DevTools
4. **Verify environment variables** are set correctly
5. **Check localStorage** for authentication data
6. **Restart development server** if needed

## 📞 Support

If you encounter issues that aren't covered in this guide:
1. Check the browser console for error messages
2. Verify the backend API is running
3. Check the README.md for setup instructions
4. Review the component files for any missing dependencies

---

**Happy Testing! 🎉**

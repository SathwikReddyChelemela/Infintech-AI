# JWT Authentication - Quick Start

## ✅ What Changed

Your application now uses **JWT (JSON Web Tokens)** instead of Basic Authentication.

### Key Changes:
1. ✅ **Automatic token injection** - axios interceptor adds JWT to all requests
2. ✅ **No password storage** - Only JWT token stored in localStorage
3. ✅ **Auto-logout on expiration** - Token expires after 30 minutes
4. ✅ **More secure** - Industry-standard authentication

---

## 🚀 How to Use

### Step 1: Clear Old Data
Open browser console (F12) and run:
```javascript
localStorage.clear();
```

### Step 2: Refresh & Login
1. Refresh the page: http://localhost:3000
2. Login with credentials:
   - Username: `customer1`
   - Password: `password`

### Step 3: Test
- ✅ Click "View Applications" - should work!
- ✅ Submit new application - should work!
- ✅ All API calls automatically include JWT

---

## 🔍 Verify It's Working

### In Browser Console:
```javascript
// Check token exists
localStorage.getItem('token')
// Should show: "eyJhbGci..."

// Check user data (no password!)
JSON.parse(localStorage.getItem('user'))
// Should show: { username: "customer1", role: "customer" }
```

### In Network Tab:
1. Open DevTools → Network
2. Click any action (View Applications, etc.)
3. Click on request → Headers
4. Should see:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 What You Need to Know

### Token Expiration:
- **Duration:** 30 minutes
- **After expiry:** Automatically logged out
- **To change:** Edit `ACCESS_TOKEN_EXPIRE_MINUTES` in `server/auth/jwt_utils.py`

### How It Works:
```
Login → Get JWT Token → Store in localStorage
         ↓
All API Requests → axios interceptor adds: "Authorization: Bearer <token>"
         ↓
Backend validates token → Process request
```

### Security:
- ✅ No password stored in frontend
- ✅ Token is signed and verified
- ✅ Automatic expiration
- ✅ Production-ready

---

## 🐛 Troubleshooting

### Problem: 401 Unauthorized
**Solution:** Token expired or invalid
```javascript
localStorage.clear();
// Login again
```

### Problem: No Authorization header
**Solution:** Interceptor not loaded, restart React app
```bash
cd client-react
# Press Ctrl+C to stop
npm start
```

### Problem: Still using Basic Auth
**Solution:** Hard refresh browser
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R

---

## 📚 Full Documentation

See `JWT_AUTHENTICATION_GUIDE.md` for:
- Complete implementation details
- Security best practices
- Production recommendations
- Advanced features (refresh tokens, etc.)

---

## ✅ Summary

**Before:**
```javascript
// Stored username + password in localStorage ❌
// Passed credentials on every request ❌
```

**After:**
```javascript
// Store JWT token only ✅
// Automatic token injection via interceptor ✅
// More secure & standard ✅
```

**No changes needed in your components!**  
The interceptor handles everything automatically. Just clear storage and login again! 🎉

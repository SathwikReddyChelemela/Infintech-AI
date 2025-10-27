# 🔍 Troubleshooting Guide - "What Went Wrong?"

## Current Status: ✅ SERVERS RUNNING

### Backend (Port 8000):
✅ **Running successfully**
- URL: http://localhost:8000
- Status: Ready to accept requests

### Frontend (Port 3000):
✅ **Running successfully**  
- URL: http://localhost:3000
- Status: Compiled and ready

---

## Most Common Issues & Solutions

### 1. ❌ "Failed to load applications" Error

**What causes it:**
- Backend server not running
- JWT token expired or missing
- Authentication configuration issues

**How to fix:**
```javascript
// Step 1: Clear browser storage
localStorage.clear();

// Step 2: Refresh page and login again
// Username: customer1
// Password: password

// Step 3: Check JWT token exists
localStorage.getItem('token');
// Should show: "eyJhbGci..."
```

**Check Network Tab:**
1. Open DevTools (F12) → Network tab
2. Try loading applications
3. Look for failed requests (red)
4. Check error details:
   - **401 Unauthorized** → JWT token missing/expired → Clear storage & login
   - **403 Forbidden** → Wrong role/permissions → Check user role
   - **500 Server Error** → Backend issue → Check server logs
   - **Network Error** → Backend down → Restart backend server

---

### 2. ❌ "Invalid authentication credentials"

**What causes it:**
- Mixed Basic Auth + JWT (now fixed!)
- No JWT token in localStorage
- Token expired (30 min default)

**How to fix:**
```javascript
// Clear and re-login
localStorage.clear();
// Refresh page
// Login again
```

**Verify JWT is working:**
```javascript
// In Console (F12)
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token:', token?.substring(0, 50) + '...');
```

---

### 3. ❌ Backend Server Not Running

**Symptoms:**
- "Network Error" in frontend
- Can't access http://localhost:8000
- "Connection refused" errors

**Check if running:**
```bash
lsof -ti:8000
# If empty → server is down
```

**Start backend:**
```bash
cd /Users/sathwik/Desktop/rbac-medicalAssistant-main/server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
🔗 Using MongoDB URI: mongodb+srv://...
✅ Successfully connected to MongoDB Atlas!
✅ Database indexes created successfully!
INFO:     Application startup complete.
```

---

### 4. ❌ Frontend Server Not Running

**Symptoms:**
- Can't access http://localhost:3000
- Page won't load

**Check if running:**
```bash
lsof -ti:3000
# If empty → frontend is down
```

**Start frontend:**
```bash
cd /Users/sathwik/Desktop/rbac-medicalAssistant-main/client-react
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view client-react in the browser.
Local: http://localhost:3000
```

---

### 5. ❌ MongoDB Connection Errors

**Symptoms:**
- Backend crashes on startup
- "Failed to connect to MongoDB" errors

**Check .env file:**
```bash
# In server/.env
MONGO_URI=mongodb+srv://username:password@cluster...
DB_NAME=rbac-users
```

**Common issues:**
- ❌ Wrong credentials
- ❌ IP not whitelisted in MongoDB Atlas
- ❌ Network/firewall blocking connection
- ❌ Missing certifi package

**Fix:**
```bash
pip install certifi pymongo
```

---

### 6. ❌ Port Already in Use

**Error:**
```
ERROR: [Errno 48] Address already in use
```

**Kill existing process:**
```bash
# Kill backend (port 8000)
pkill -f "uvicorn main:app"
lsof -ti:8000 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Then restart servers
```

---

### 7. ❌ JWT Token Expired

**Symptoms:**
- Suddenly logged out
- 401 errors after working for a while
- Token expiration: 30 minutes (default)

**How to fix:**
```javascript
// Just login again - token will refresh
localStorage.clear();
// Refresh and login
```

**Change expiration time:**
```python
# In server/auth/jwt_utils.py
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour instead of 30 min
```

---

### 8. ❌ CORS Errors

**Symptoms:**
- "CORS policy" errors in console
- "Access-Control-Allow-Origin" errors

**Check backend CORS:**
```python
# In server/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Check proxy:**
```json
// In client-react/package.json
{
  "proxy": "http://localhost:8000"
}
```

---

### 9. ❌ Package/Dependency Errors

**Backend errors:**
```bash
cd server
pip install -r requirements.txt

# If specific package missing:
pip install fastapi uvicorn pymongo python-jose bcrypt certifi
```

**Frontend errors:**
```bash
cd client-react
rm -rf node_modules package-lock.json
npm install

# If specific package missing:
npm install @mui/material @emotion/react @emotion/styled axios
```

---

### 10. ❌ Browser Console Errors

**Check for errors:**
1. Open DevTools (F12)
2. Console tab
3. Look for red errors

**Common frontend errors:**

**"user is not defined"**
```javascript
// Fix: Check if user exists before using
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
  // Redirect to login
}
```

**"Cannot read property of undefined"**
```javascript
// Fix: Add optional chaining
user?.username  // Instead of user.username
data?.applications  // Instead of data.applications
```

**"Unexpected token"**
- Syntax error in code
- Check recent file changes
- Look for missing brackets/parentheses

---

## Debugging Checklist

When something goes wrong, check in this order:

### 1. ✅ Are servers running?
```bash
lsof -ti:8000  # Backend
lsof -ti:3000  # Frontend
```

### 2. ✅ Is JWT token valid?
```javascript
localStorage.getItem('token')  // Should exist
localStorage.getItem('user')   // Should have username & role
```

### 3. ✅ Check Network tab
- Open DevTools → Network
- Try the action that fails
- Look for failed requests (red)
- Check status code (401, 403, 500, etc.)

### 4. ✅ Check Console
- Open DevTools → Console
- Look for red errors
- Read error messages carefully

### 5. ✅ Check Backend logs
- Look at terminal where backend is running
- Check for errors/exceptions
- Look for request logs

### 6. ✅ Try clearing storage
```javascript
localStorage.clear();
// Refresh and login again
```

---

## Step-by-Step Recovery Guide

If everything is broken, follow these steps:

### Step 1: Stop Everything
```bash
# Kill all processes
pkill -f "uvicorn"
pkill -f "node"

# Or manually press Ctrl+C in terminals
```

### Step 2: Clear Browser Data
```javascript
// In Console (F12)
localStorage.clear();
sessionStorage.clear();
// Then refresh page (Cmd+R or Ctrl+R)
```

### Step 3: Start Backend
```bash
cd /Users/sathwik/Desktop/rbac-medicalAssistant-main/server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Wait for:**
```
✅ Successfully connected to MongoDB Atlas!
INFO: Application startup complete.
```

### Step 4: Start Frontend
```bash
# In new terminal
cd /Users/sathwik/Desktop/rbac-medicalAssistant-main/client-react
npm start
```

**Wait for:**
```
Compiled successfully!
```

### Step 5: Test Login
1. Go to http://localhost:3000
2. Login:
   - Username: `customer1`
   - Password: `password`
3. Should see dashboard ✅

### Step 6: Verify JWT
```javascript
// In Console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### Step 7: Test Functionality
- Try viewing applications
- Try submitting application
- Check Network tab for errors

---

## Quick Reference - Common Commands

### Check Server Status:
```bash
lsof -ti:8000  # Backend
lsof -ti:3000  # Frontend
```

### Start Servers:
```bash
# Backend
cd server && uvicorn main:app --reload

# Frontend
cd client-react && npm start
```

### Kill Servers:
```bash
pkill -f "uvicorn"    # Backend
pkill -f "node"       # Frontend
```

### Clear Browser:
```javascript
localStorage.clear();
```

### Check Logs:
```bash
# Backend: Look at terminal output
# Frontend: DevTools → Console
```

---

## Error Code Reference

| Code | Meaning | Solution |
|------|---------|----------|
| **200** | ✅ Success | Everything OK |
| **401** | ❌ Unauthorized | Clear storage & login |
| **403** | ❌ Forbidden | Check user role/permissions |
| **404** | ❌ Not Found | Check endpoint URL |
| **500** | ❌ Server Error | Check backend logs |
| **Network Error** | ❌ Can't connect | Check if backend running |

---

## Getting More Help

### 1. Check Backend Logs
Look at terminal where backend is running for detailed errors

### 2. Check Browser Console
DevTools (F12) → Console tab for frontend errors

### 3. Check Network Tab
DevTools → Network → Look for failed requests

### 4. Check Documentation
- `JWT_AUTHENTICATION_GUIDE.md` - JWT setup
- `AUTHENTICATION_FIX.md` - Recent fixes
- `MONGODB_ATLAS_COLLECTIONS.md` - Database info

---

## Current Configuration

### Backend:
- **Port:** 8000
- **Auth:** JWT (Bearer tokens)
- **Database:** MongoDB Atlas
- **Token Expiry:** 30 minutes

### Frontend:
- **Port:** 3000
- **Proxy:** → http://localhost:8000
- **Auth:** JWT via axios interceptor

### Test Users:
```
customer1 / password
analyst1 / password
underwriter1 / password
admin1 / password
```

---

## What's Working Now

✅ Backend server running on port 8000
✅ Frontend server running on port 3000  
✅ MongoDB Atlas connected
✅ JWT authentication configured
✅ Axios interceptor adding JWT automatically
✅ All API endpoints operational

---

## Summary

**Most issues are solved by:**
1. ✅ Restart servers
2. ✅ Clear localStorage
3. ✅ Login again
4. ✅ Check Network tab for specific errors

**Both servers are now running!**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

**Try accessing the app and let me know if you see any specific errors!** 🚀

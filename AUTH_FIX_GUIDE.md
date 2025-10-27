# Authentication Fix for 403 Forbidden Errors

## Problem
Getting 403 Forbidden errors when accessing `/customer/dashboard`, `/analyst/dashboard` endpoints after login.

## Root Cause
The user object stored in localStorage after login didn't include the password needed for Basic Authentication on subsequent API calls.

## Solution Applied

### 1. Updated Auth.js
**File:** `client-react/src/components/Auth.js`

**Change:** Store user credentials with password for Basic Auth
```javascript
// Before
localStorage.setItem('user', JSON.stringify(response.data.user));
onLogin(response.data.user);

// After  
const userWithAuth = {
  ...response.data.user,
  username: email,
  password: password
};
localStorage.setItem('user', JSON.stringify(userWithAuth));
onLogin(userWithAuth);
```

### 2. Updated Auth.js - Use Proxy
**File:** `client-react/src/components/Auth.js`

**Change:** Use relative URL instead of absolute URL
```javascript
// Before
const response = await axios.post('http://localhost:8000/auth/login', formData, {

// After
const response = await axios.post('/auth/login', formData, {
```

This allows the React proxy (configured in package.json) to handle the request.

## How It Works

### Authentication Flow:
```
1. User enters username/password in login form
2. Auth component sends credentials to /auth/login
3. Backend returns JWT token + user data
4. Frontend stores:
   - JWT token in localStorage
   - User object WITH password in localStorage
5. Subsequent API calls use Basic Auth:
   axios.get('/customer/dashboard', {
     auth: {
       username: user.username,
       password: user.password
     }
   })
```

### Why Basic Auth?
The backend routes use `Depends(get_current_user)` which extracts credentials from:
- Authorization header (Basic Auth)
- Or JWT token

Since we're passing `auth` parameter to axios, it uses Basic Authentication.

## Testing the Fix

### Step 1: Restart React App
```bash
cd client-react
# Kill existing process
# Ctrl+C if running
npm start
```

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or manually:
   - Clear localStorage: `localStorage.clear()`
   - Clear cookies

### Step 3: Login Again
1. Go to http://localhost:3000
2. Enter credentials:
   - Username: `customer1` (or `analyst1`, `underwriter1`, `admin1`)
   - Password: `password`
3. Click Login

### Step 4: Verify
1. Should see dashboard load successfully
2. Check browser DevTools → Network tab
3. Should see successful 200 responses for:
   - `/customer/dashboard` (if customer)
   - `/analyst/dashboard` (if analyst)
   - etc.

### Step 5: Test "View Applications"
1. Click "View Applications" button
2. Should see dialog with applications list
3. Should NOT see "Failed to load applications" error
4. Applications should auto-refresh every 10 seconds

## Alternative: Use JWT Bearer Token

If you prefer JWT Bearer token instead of Basic Auth, update API calls:

### Option A: Add axios interceptor
```javascript
// In index.js or App.js
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Option B: Update backend auth handler
Modify `server/auth/routes.py` to accept Bearer token in addition to Basic Auth.

## Current Configuration

### package.json (Proxy)
```json
{
  "proxy": "http://localhost:8000"
}
```

This means:
- React dev server runs on port 3000
- API calls to `/api/*` are proxied to `http://localhost:8000`
- No CORS issues

### Backend (FastAPI)
```python
# Running on http://localhost:8000
uvicorn main:app --reload
```

## Troubleshooting

### Still getting 403?

**Check 1: Clear localStorage**
```javascript
// In browser console
localStorage.clear();
// Then login again
```

**Check 2: Verify user object has password**
```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('user')));
// Should show: { username: "...", password: "...", role: "..." }
```

**Check 3: Check Network tab**
```
1. Open DevTools → Network tab
2. Try accessing dashboard
3. Click on failed request
4. Check "Request Headers"
5. Should see: Authorization: Basic <base64-encoded-credentials>
```

**Check 4: Restart both servers**
```bash
# Terminal 1 - Backend
cd server
uvicorn main:app --reload

# Terminal 2 - Frontend  
cd client-react
npm start
```

### Getting CORS errors?

Make sure backend has CORS middleware enabled in `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Security Note

**⚠️ Important:** Storing passwords in localStorage is NOT recommended for production!

### Production Recommendations:
1. **Use HTTP-only cookies** for JWT tokens
2. **Use refresh tokens** for long sessions
3. **Never store passwords** in frontend storage
4. **Implement proper session management**

### For This Project (Development):
- We store password for Basic Auth convenience
- This is acceptable for local development/testing
- Should be changed before production deployment

## Summary of Changes

### Files Modified:
1. ✅ `client-react/src/components/Auth.js`
   - Store username & password with user object
   - Use relative URL for proxy

2. ✅ `client-react/src/index.js`
   - Removed axios baseURL (use proxy instead)

### Next Steps:
1. **Restart React app** (npm start)
2. **Clear browser cache & localStorage**
3. **Login again** with credentials
4. **Test "View Applications"** feature
5. Should work without 403 errors! ✅

## Expected Behavior After Fix

### Customer Login:
```
1. Login as customer1
2. See Customer Homepage
3. Click "View Applications"
4. See dialog with submitted applications
5. Auto-refresh every 10 seconds
6. No 403 errors in console
```

### Analyst Login:
```
1. Login as analyst1
2. See Analyst Dashboard
3. See list of submitted applications
4. Click "Review" on any application
5. See application details
6. Can verify documents with LLM
7. No 403 errors in console
```

## Verification Commands

### Check if servers are running:
```bash
# Check backend
lsof -ti:8000

# Check frontend
lsof -ti:3000
```

### Test API directly:
```bash
# Test login
curl -X POST http://localhost:8000/auth/login \
  -F "username=customer1" \
  -F "password=password"

# Test dashboard (with Basic Auth)
curl -u customer1:password http://localhost:8000/customer/dashboard
```

---

**Status:** ✅ Fix Applied - Please restart React app and test!

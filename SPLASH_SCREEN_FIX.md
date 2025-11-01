# Splash Screen Hang Fix

## Problem
The app was hanging on the Farcaster splash screen when testing in the Warpcast client. Console logs showed multiple competing SDK initialization timeouts that were conflicting with each other.

## Root Cause
**Three different mechanisms** were all trying to initialize the Farcaster SDK simultaneously:

1. **Inline script in `layout.tsx`** - Polling for `sdk.actions.ready()` with 10-second timeout
2. **`FarcasterContext`** - Complex dual-path initialization with 12-second + 10-second timeouts
3. **`ReadySignal` component** - Additional 15-second wait before calling `ready()`

These competing mechanisms created a race condition where:
- Multiple timeouts were running simultaneously (12s, 10s, 15s, 10s safety)
- The app would eventually detect the user BUT the loading state wouldn't clear
- Total possible wait time: up to 37+ seconds!

## Solution Applied

### 1. Streamlined `FarcasterContext` (contexts/FarcasterContext.tsx)
- **Removed**: Complex dual-path initialization logic
- **Removed**: Multiple nested timeouts and polling loops
- **Simplified**: Single 5-second SDK wait with direct context fetch
- **Added**: Proper cleanup flag to prevent stale updates
- **Result**: Max 6 seconds total (5s SDK wait + 1s safety)

### 2. Simplified `ReadySignal` (components/ready-signal.tsx)
- **Reduced**: Timeout from 15 seconds to 5 seconds
- **Aligned**: Now matches FarcasterContext timing
- **Result**: No competing long waits

### 3. Aligned Inline Script (app/layout.tsx)
- **Reduced**: `maxWaitMs` from 10 seconds to 5 seconds
- **Aligned**: All three mechanisms now use consistent 5-second timeouts
- **Result**: Unified initialization window

## New Flow

```
0-5s:    All three mechanisms poll for SDK in parallel (aligned)
         ↓
SDK Ready? 
  ├─ YES → Fetch context (3s timeout) → Authenticate → Show terminal
  └─ NO  → Run as guest → Show terminal

Safety timeout: 6 seconds maximum
```

## Expected Behavior After Fix

### In Farcaster Client (Warpcast)
1. Splash screen shows briefly (1-2 seconds)
2. SDK detects quickly, user context loads
3. Terminal renders with authenticated user
4. **Total time: 2-5 seconds typically**

### In Regular Browser
1. SDK not available (expected)
2. Guest mode activates immediately
3. Terminal renders
4. **Total time: <1 second**

## Testing Checklist

- [ ] Deploy to Vercel
- [ ] Test in Warpcast mobile app
- [ ] Verify splash screen disappears within 5 seconds
- [ ] Confirm user authentication works
- [ ] Check console for clean initialization logs
- [ ] Test guest mode in regular browser still works

## Console Logs to Expect (Success)

```
FarcasterContext: Starting initialization
FarcasterContext: SDK available? true
FarcasterContext: Fetching SDK context...
FarcasterContext: User authenticated: thatweb3guy
ReadySignal: calling sdk.actions.ready()
ReadySignal: ready() completed
```

## If Issues Persist

1. Check for CSP (Content Security Policy) violations - these are cosmetic and can be ignored
2. Verify `NEXT_PUBLIC_APP_URL` matches your deployment URL
3. Ensure `sdk.actions.ready()` is only called once (check logs)
4. Test with a fresh Warpcast app cache (close/reopen app)

## Performance Impact

**Before**: 12-37+ seconds possible wait time  
**After**: 5-6 seconds maximum wait time  
**Improvement**: ~70-85% faster initialization

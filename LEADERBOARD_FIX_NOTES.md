# Leaderboard Fix Investigation Notes

## Root Cause Analysis

### Problem
Leaderboard submission fails on TestFlight with "Submission Failed" error.

### Findings

1. **Railway server IS running** at `https://ravishing-smile-production.up.railway.app`
   - Health check returns 200 OK
   - tRPC endpoints are accessible
   - `getTop10` returns empty array `[]` (could be empty table OR catch block returning `[]`)

2. **INSERT fails** - Direct curl test:
   ```
   curl -s -X POST "https://ravishing-smile-production.up.railway.app/api/trpc/leaderboard.submitScore" \
     -H "Content-Type: application/json" \
     -d '{"json":{"initials":"TST","score":7,"totalProblems":10,"operation":"addition","difficulty":"easy"}}'
   ```
   Returns: `{"result":{"data":{"json":{"success":false,"error":"Failed to add entry"}}}}`

3. **Migration history shows the problem:**
   - Migrations 0000-0005 were MySQL syntax (enum, AUTO_INCREMENT)
   - Migration 0006 (`0006_gigantic_felicia_hardy.sql`) DROPS all 3 leaderboard tables
   - No new migration was created to recreate them in PostgreSQL syntax
   - Current schema (`drizzle/schema.ts`) uses pgTable, serial, text (PostgreSQL)
   - `drizzle.config.ts` was still set to `dialect: "mysql"` (FIXED to "postgresql")

4. **Two possible scenarios on Railway:**
   - Tables were dropped by migration 0006 and never recreated → INSERT fails with "relation does not exist"
   - Tables exist but have wrong column types (MySQL enum vs text) → INSERT fails with type mismatch

5. **Secondary issue: `EXPO_PUBLIC_API_BASE_URL` was missing from `eas.json`**
   - Native app uses `getApiBaseUrl()` which falls back to empty string on native
   - Without this env var, the native app can't reach the Railway server
   - FIXED: Added to eas.json production env

## Fixes Applied

1. Fixed `drizzle.config.ts` dialect from "mysql" to "postgresql"
2. Created `server/_core/auto-migrate.ts` - auto-creates tables on server startup
3. Added `EXPO_PUBLIC_API_BASE_URL` to `eas.json` production env
4. Updated `db.ts` to append `sslmode=require` for Railway connections
5. Improved error logging in `db.ts` to show actual error messages
6. Added `/api/db-status` diagnostic endpoint

## What Needs to Happen

1. Deploy new server code to Railway (publish) → auto-migration will create tables
2. Rebuild native app with new `eas.json` → app will have correct API URL
3. Verify with `/api/db-status` endpoint after deployment

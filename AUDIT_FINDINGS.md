# YaYa Math - Pre-Publish Code Audit Findings

## CRITICAL BUGS (Must Fix Before Publishing)

### 1. Speed & Daily Submission False-Success Bug
**Files:** `app/enter-initials-speed.tsx` (line 103), `app/enter-initials-daily.tsx` (line 101)
**Issue:** After `retryWithBackoff` completes, the code checks `result.success` (which indicates the retry wrapper succeeded in calling the API), but does NOT check `result.data.success` (which indicates the server actually wrote to the database). If the server returns `{ success: false, error: "..." }` (e.g., DB unavailable), the speed and daily screens treat it as a successful submission and navigate away.
**Fix:** Mirror the pattern in `enter-initials.tsx` (line 103-107) which correctly checks both `result.success && result.data` then `submissionResult.success`.

### 2. Practice Screen Accuracy Calculation Off-by-One
**File:** `app/practice.tsx` (line 283-284)
**Issue:** When the last question is answered correctly, `correctCount` hasn't been updated yet (setState is async), so the accuracy passed to results is `correctCount/questionCount` instead of `(correctCount+1)/questionCount`. The `correct` param passed is also the stale value.
**Fix:** Calculate final correct count inline: `const finalCorrect = isCorrect ? correctCount + 1 : correctCount;` and use that for both the router params.

### 3. "Practice Again" Button Loses Settings
**File:** `app/results.tsx` (line 114)
**Issue:** `handlePracticeAgain` navigates to `/practice?operations=${operations}` but does NOT pass `difficulty`, `questionCount`, or `speedMode` params. The practice screen will use defaults (50 questions, easy difficulty).
**Fix:** Include all params: `/practice?operations=${operations}&speedMode=${isSpeedMode}&difficulty=${difficulty}&questionCount=${total}`

### 4. Admin Password Exposed in Client HTML
**File:** `server/_core/index.ts` (line 333)
**Issue:** The admin page template string interpolates `ADMIN_PASSWORD` directly into the HTML/JS sent to the browser: `const ADMIN_PASSWORD = '${ADMIN_PASSWORD}';`. Anyone can view-source the admin page and see the password.
**Fix:** Move password verification to server-side only. The client should POST the password to a server endpoint that validates it and returns a session token or success/failure.

## HIGH PRIORITY (Should Fix)

### 5. Rate Limiter IPv6 Warning
**File:** `server/_core/rate-limit.ts`
**Issue:** The custom `keyGenerator` manually reads `req.ip` without using `express-rate-limit`'s built-in `ipKeyGenerator` helper, causing a runtime ValidationError warning about IPv6 bypass. This warning is logged on every server restart.
**Fix:** Import and use `ipKeyGenerator` from `express-rate-limit` or set `validate: { ip: false }` to suppress the warning if the custom logic is intentional.

### 6. Mixed Styling Approach (NativeWind className vs StyleSheet)
**Files:** 10 out of 14 app screens still use `className` (NativeWind)
**Issue:** The home screen and practice screen were converted to StyleSheet, but results.tsx, all enter-initials screens, leaderboard.tsx, speed-leaderboard.tsx, daily-challenge.tsx, daily-challenge-results.tsx, daily-challenge-leaderboard.tsx, and statistics.tsx still use NativeWind className. Since NativeWind was previously causing issues with EAS builds, this inconsistency could cause styling failures in production.
**Status:** This was a known migration that was partially completed. The app currently ships with both approaches.

### 7. Leaderboard Query Doesn't Filter by Both Operation AND Difficulty
**File:** `server/db.ts` (lines 110-118)
**Issue:** The `getTop10Leaderboard` function applies operation and difficulty filters as separate `.where()` calls. In Drizzle ORM, chaining `.where()` replaces the previous condition rather than AND-ing them. So if both operation and difficulty are provided, only the difficulty filter is applied.
**Fix:** Use `and()` from drizzle-orm: `.where(and(eq(leaderboard.operation, operation), eq(leaderboard.difficulty, difficulty)))` when both are provided.

### 8. Speed Leaderboard Screen Missing Difficulty Filter
**File:** `app/speed-leaderboard.tsx`
**Issue:** The standalone speed leaderboard screen only filters by operation, not by difficulty. Users who complete speed mode on "hard" difficulty are ranked alongside "easy" difficulty users.
**Fix:** Add difficulty filter tabs matching the main leaderboard screen.

## MEDIUM PRIORITY (Polish)

### 9. `userAnswer` Max Length Too Short for Some Answers
**File:** `app/practice.tsx` (line 238)
**Issue:** `userAnswer.length < 3` limits input to 3 digits. But on "hard" difficulty, multiplication can produce answers up to 30×30=900 (3 digits OK), but subtraction of negative results or division could theoretically need more. Actually, max answer is 30×30=900 for multiplication, so 3 digits is correct. However, addition on hard (1-30) can produce max 60, which is fine. This is actually OK.

### 10. No Loading State When Fetching Leaderboard Data on Results Screen
**File:** `app/results.tsx`
**Issue:** The results screen queries leaderboard data to determine if the score is a high score, but there's no loading indicator. If the query is slow, the user might tap "Practice Again" before the "Submit to Leaderboard" button appears.
**Fix:** Add a brief loading state or delay the action buttons until the leaderboard check completes.

### 11. Profile Screen Hardcoded Colors
**File:** `app/(tabs)/profile.tsx`
**Issue:** Several styles hardcode `#B6FFFB` (old brand color) instead of using the current brand color `#3dcfc2`.
**Fix:** Replace hardcoded values with theme color references.

### 12. `ExpoConfig` Type Not Used in app.config.ts
**File:** `app.config.ts` (line 41)
**Issue:** The config object is typed as a plain object literal instead of `ExpoConfig`. The import exists but isn't used.
**Fix:** Either add `: ExpoConfig` type annotation or remove the unused import.

## LOW PRIORITY (Nice-to-Have)

### 13. OAuth Callback Has Excessive console.log
**File:** `app/oauth/callback.tsx` - 32 console.log/warn/error statements
**Impact:** Clutters device logs in production. Not a functional issue.

### 14. `StyleSheet.create()` Inside Component Body
**Files:** `app/(tabs)/index.tsx`, `app/practice.tsx`
**Issue:** StyleSheet.create() is called inside the component function, recreating styles on every render. Should be moved outside or memoized.
**Impact:** Minor performance concern, not a crash risk.

### 15. Daily Challenge Uses Fixed 20 Questions
**File:** `app/daily-challenge.tsx` (line 24)
**Issue:** Daily challenge always uses 20 questions regardless of the user's question count preference. This is intentional (daily challenge is standardized), but could be confusing.

## CONFIGURATION ISSUES

### 16. Missing `difficulty` Param in Results → Practice Again Flow
Already captured in Bug #3 above.

### 17. EAS Build Config Looks Good
- `eas.json` has `EXPO_PUBLIC_API_BASE_URL` set correctly
- `appVersionSource: "remote"` with `autoIncrement: true`
- Production env has `NODE_ENV: "production"`

### 18. App Store Compliance
- Privacy policy endpoint exists at `/privacy`
- `ITSAppUsesNonExemptEncryption: false` is set
- Background modes removed (previous Apple rejection fix)
- No camera/location/contacts permissions requested

## SUMMARY OF RECOMMENDED FIXES BEFORE PUBLISH

| Priority | Item | Effort |
|----------|------|--------|
| CRITICAL | Fix speed/daily false-success bug | 15 min |
| CRITICAL | Fix accuracy off-by-one in practice | 10 min |
| CRITICAL | Fix "Practice Again" losing settings | 5 min |
| CRITICAL | Fix admin password exposure | 30 min |
| HIGH | Fix rate limiter IPv6 warning | 10 min |
| HIGH | Fix Drizzle AND filter for leaderboard | 15 min |
| HIGH | Add difficulty filter to speed leaderboard | 20 min |
| MEDIUM | Fix profile hardcoded colors | 10 min |
| LOW | Move StyleSheet outside components | 15 min |
| LOW | Remove excessive OAuth logging | 5 min |

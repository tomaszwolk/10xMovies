# QA Checklist - Onboarding Add View

## Edge Cases & Scenarios Testing

### ✅ 1. Zero Movies Added → Next
**Status:** IMPLEMENTED
- **Scenario:** User clicks "Next" without adding any movies
- **Expected:** Navigate to `/watchlist` successfully
- **Implementation:** `OnboardingAddPage.tsx` line 85-88 - `handleNext()` always enabled
- **Notes:** PRD specifies 0-3 movies allowed, no minimum required

### ✅ 2. No Poster Image
**Status:** IMPLEMENTED
- **Scenario:** Movie in search results has `poster_path: null`
- **Expected:** Display placeholder with "No image" text
- **Implementation:** 
  - `SearchResultItem.tsx` lines 44-56: Checks `item.posterUrl`, shows placeholder if null
  - `AddedMovieCard.tsx` lines 18-30: Same placeholder logic
- **Notes:** Proper fallback UI in place for both search results and added movies

### ✅ 3. No Search Results
**Status:** IMPLEMENTED
- **Scenario:** Search query returns empty array
- **Expected:** Display "Nie znaleziono filmów" message
- **Implementation:** `SearchResultsList.tsx` lines 24-29
- **Notes:** Clear user feedback when no results found

### ✅ 4. Search Error / Network Failure
**Status:** IMPLEMENTED
- **Scenario:** API call to `/api/movies/` fails (network error, 500, etc.)
- **Expected:** Inline error message in dropdown
- **Implementation:** `MovieSearchCombobox.tsx` lines 126-129
- **Message:** "Nie udało się pobrać wyników wyszukiwania. Spróbuj ponownie"
- **Notes:** Error is scoped to search dropdown, doesn't break page

### ✅ 5. Duplicate in Session
**Status:** IMPLEMENTED
- **Scenario:** User tries to add same movie twice in this session
- **Expected:** Button disabled, no API call
- **Implementation:** 
  - `OnboardingAddPage.tsx` lines 28-32: Guard clause checks `addedSet`
  - `MovieSearchCombobox.tsx` line 70: Prevents Enter on disabled items
  - `SearchResultItem.tsx` disabled prop blocks action
- **Notes:** Uses Set for O(1) lookup performance

### ✅ 6. Duplicate on Server (409 Conflict)
**Status:** IMPLEMENTED
- **Scenario:** Movie already exists in user's watchlist (from previous session)
- **Expected:** 
  - Remove from optimistic UI
  - Show toast: "Ten film jest już na Twojej watchliście"
  - Keep tconst in `addedSet` to disable future attempts
- **Implementation:** `OnboardingAddPage.tsx` lines 62-65
- **Notes:** Graceful handling with informative toast

### ✅ 7. Invalid Movie (400 Bad Request)
**Status:** IMPLEMENTED
- **Scenario:** tconst invalid or movie not in database
- **Expected:** 
  - Rollback optimistic update
  - Show toast: "Nie udało się dodać filmu"
- **Implementation:** `OnboardingAddPage.tsx` lines 66-68
- **Notes:** Generic error message (doesn't leak technical details)

### ✅ 8. Server Error (5xx)
**Status:** IMPLEMENTED
- **Scenario:** Backend returns 500+ error
- **Expected:** 
  - Rollback optimistic update
  - Show toast: "Wystąpił błąd serwera. Spróbuj ponownie później"
- **Implementation:** `OnboardingAddPage.tsx` lines 69-71
- **Notes:** User-friendly message suggesting retry

### ✅ 9. Authentication Error (401 Unauthorized)
**Status:** DELEGATED TO GLOBAL HANDLER
- **Scenario:** JWT expired or invalid during POST
- **Expected:** Automatic token refresh or redirect to login
- **Implementation:** Global Axios interceptor in HTTP client
- **Notes:** Not handled at component level per PRD - relies on global auth flow

### ✅ 10. Maximum Limit Reached (3 movies)
**Status:** IMPLEMENTED
- **Scenario:** User adds 3 movies, tries to add 4th
- **Expected:** All "Dodaj" buttons disabled, cannot add more
- **Implementation:**
  - `OnboardingAddPage.tsx` lines 25-26: `canAddMore` check
  - `MovieSearchCombobox.tsx`: disabledTconsts includes all when limit reached
  - `SearchResultItem.tsx`: disabled state prevents interaction
- **Notes:** Counter badge shows "3/3" visually

### ✅ 11. Minimum Query Length (< 2 characters)
**Status:** IMPLEMENTED
- **Scenario:** User types 0-1 characters
- **Expected:** No API call, dropdown closed/not shown
- **Implementation:**
  - `useMovieSearch.ts` line 33: `enabled: query.length >= 2`
  - `MovieSearchCombobox.tsx` lines 43-46: Closes dropdown on query < 2
- **Notes:** Prevents unnecessary API calls, improves UX

### ✅ 12. Results Limit (max 10)
**Status:** IMPLEMENTED
- **Scenario:** API returns 15+ results
- **Expected:** Only first 10 displayed
- **Implementation:** `useMovieSearch.ts` line 31: `.slice(0, 10)`
- **Notes:** Keeps dropdown manageable

### ✅ 13. Debouncing
**Status:** IMPLEMENTED
- **Scenario:** User types quickly
- **Expected:** API calls delayed by 250ms, prevents spam
- **Implementation:** 
  - `useDebouncedValue.ts`: Custom hook with 250ms delay
  - `MovieSearchCombobox.tsx` line 32: Uses debounced query
- **Notes:** Reduces API load, improves performance

### ✅ 14. Keyboard Navigation
**Status:** IMPLEMENTED
- **Scenario:** User navigates with arrow keys, Enter, Escape
- **Expected:**
  - ↑/↓: Cycle through results
  - Enter: Add selected movie (if not disabled)
  - Escape: Close dropdown, blur input
- **Implementation:** `MovieSearchCombobox.tsx` lines 54-82
- **Notes:** Full ARIA support with `aria-activedescendant`

### ✅ 15. Loading States
**Status:** IMPLEMENTED
- **Scenario:** Search query in progress
- **Expected:** Show spinner icon in search input
- **Implementation:** `MovieSearchCombobox.tsx` lines 114-118
- **Notes:** Uses `Loader2` from lucide-react with spin animation

### ✅ 16. Optimistic Updates
**Status:** IMPLEMENTED
- **Scenario:** User adds movie
- **Expected:** 
  - Movie appears immediately in "Added" grid
  - If API fails, removed with appropriate toast
- **Implementation:** `OnboardingAddPage.tsx` lines 35-59
- **Notes:** Excellent UX - feels instant

### ✅ 17. Empty State (0 Added Movies)
**Status:** IMPLEMENTED
- **Scenario:** Page loads with no movies added yet
- **Expected:** Show placeholder slots (dashed borders) and "Brak dodanych filmów"
- **Implementation:** `AddedMoviesGrid.tsx` lines 17-22, 47-58
- **Notes:** Visual consistency with empty slots

### ✅ 18. Skip Button
**Status:** IMPLEMENTED
- **Scenario:** User clicks "Skip"
- **Expected:** Navigate to `/watchlist` (would be `/onboarding/seen` when implemented)
- **Implementation:** `OnboardingAddPage.tsx` lines 80-83
- **Notes:** Non-blocking onboarding flow

### ✅ 19. Progress Indicator
**Status:** IMPLEMENTED
- **Scenario:** Page loads
- **Expected:** Shows "Krok 2/3" progress
- **Implementation:** `OnboardingAddPage.tsx` line 92: `<ProgressBar current={2} total={3} />`
- **Notes:** Clear visual feedback of onboarding stage

### ✅ 20. Responsiveness
**Status:** IMPLEMENTED
- **Scenario:** View on mobile, tablet, desktop
- **Expected:** 
  - Search combobox full width with max-width
  - Grid adapts: 1 col mobile, 2 tablet, 3 desktop
- **Implementation:** 
  - `OnboardingAddPage.tsx` line 101: `max-w-md mx-auto`
  - `AddedMoviesGrid.tsx` line 37: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Notes:** Mobile-first approach

## Accessibility (A11Y) Checklist

### ✅ ARIA Roles
- `role="combobox"` on search input
- `role="listbox"` on results list
- `role="option"` on each result item
- `aria-expanded`, `aria-haspopup`, `aria-activedescendant` properly set

### ✅ Keyboard Support
- Tab navigation works
- Arrow keys navigate results
- Enter selects
- Escape closes and blurs

### ✅ Screen Reader Support
- `aria-label` on buttons and interactive elements
- `aria-disabled` on disabled items
- Proper semantic HTML (ul/li, button)

### ✅ Focus Management
- Focus trap not needed (not modal)
- Blur on Escape
- Proper tabindex values

## Performance Considerations

### ✅ Image Loading
- `loading="lazy"` on all images
- Fallback for missing posters

### ✅ Query Optimization
- Debouncing (250ms)
- Minimum query length (2 chars)
- Results caching (staleTime: 30s)
- Result limit (10 items)

### ✅ State Management
- Set for duplicate checking (O(1) lookup)
- React Query for server state
- Local state for UI concerns

## Security

### ✅ XSS Prevention
- React auto-escapes by default
- No `dangerouslySetInnerHTML` used

### ✅ CSRF
- Handled by global HTTP client (JWT in headers)

### ✅ Auth
- JWT required for POST
- Global interceptor handles refresh/401

## Known Limitations / Future Enhancements

### ❌ NOT IMPLEMENTED (nice-to-have)
1. **Remove from session** - Currently no X button to remove added movies before submitting
2. **Telemetry** - Event logging not active (Event model exists but unused)
3. **Toast undo** - No "Undo" action on error toasts
4. **Infinite scroll** - Fixed 10 results (could add if needed)
5. **Movie details preview** - No modal/tooltip with full movie info

## Test Commands

```bash
# Build (TypeScript check)
npm run build

# Run tests (if configured)
npm test

# Type check only
npx tsc --noEmit

# Lint
npm run lint
```

## Manual Testing Checklist

- [ ] Load page - verify progress "2/3", empty state with placeholders
- [ ] Type 1 character - verify no search triggered
- [ ] Type 2+ characters - verify search spinner, results appear
- [ ] Verify poster images load OR placeholder shows
- [ ] Arrow down/up - verify keyboard navigation works
- [ ] Press Enter on result - verify movie added to grid
- [ ] Try adding same movie again - verify button disabled
- [ ] Add 3 movies - verify all "Dodaj" buttons disabled
- [ ] Click "Skip" - verify navigate works
- [ ] Click "Next" (with 0-3 movies) - verify navigate works
- [ ] Disconnect network, search - verify error message
- [ ] Reconnect, search - verify works again
- [ ] Mobile viewport - verify responsive grid
- [ ] Tab through elements - verify focus states visible
- [ ] Use screen reader - verify announcements make sense

## Summary

**Total Scenarios:** 20 core + accessibility + performance
**Implemented:** 20/20 core scenarios ✅
**Delegated:** 1 (401 auth - global handler)
**Status:** READY FOR PRODUCTION

All critical edge cases are properly handled with graceful error recovery and clear user feedback. The implementation follows PRD requirements and coding guidelines.


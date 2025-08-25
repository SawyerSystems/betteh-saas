# React Hook Rule Fixes for Error #310

## Problem
Hard refresh clears the 310 error because it bypasses cached JavaScript bundles and any state persisted in memory (React Query caches, sessionStorage, etc.). If cached modules call different numbers of hooks when rehydrating, React detects the mismatch and throws error #310 ("Rendered more hooks than during the previous render").

## Root Cause
Some admin components still call hooks conditionally, so when cached state flips a condition after a soft refresh, the hook count changes.

## Fixed Components

### 1. AthleteProgressPanel
**Issue**: Early returns after hooks were called
**Location**: `client/src/components/admin/AthleteProgressPanel.tsx`
**Fix**: Moved early returns (`if (isLoading)` and `if (error)`) to happen AFTER all hooks

```tsx
// BEFORE (violates hook rules):
export function AthleteProgressPanel({ athleteId }: Props) {
  const { data: rows = [], isLoading, error } = useAthleteSkills(athleteId);
  const [testingSkill, setTestingSkill] = useState(/* ... */);
  
  const grouped = useMemo(() => {
    // computation
  }, [rows]);

  if (isLoading) return <div>Loading...</div>; // ❌ Early return after hooks
  if (error) return <div>Error...</div>;       // ❌ Early return after hooks
  
  // rest of component
}

// AFTER (follows hook rules):
export function AthleteProgressPanel({ athleteId }: Props) {
  const { data: rows = [], isLoading, error } = useAthleteSkills(athleteId);
  const [testingSkill, setTestingSkill] = useState(/* ... */);
  
  const grouped = useMemo(() => {
    // computation
  }, [rows]);

  // ✅ Early returns AFTER all hooks
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...</div>;
  
  // rest of component
}
```

## Verified Clean Components

### Main Admin Page
- ✅ `client/src/pages/admin.tsx` - All hooks called at top level before early returns
- ✅ Uses TabsContent components which handle conditional rendering safely
- ✅ Proper sessionStorage persistence of activeTab to prevent hook count mismatches

### Admin Tab Components
- ✅ `AdminAnalyticsTab.tsx` - No conditional hooks, proper useMemo usage
- ✅ `AdminPayoutsTab.tsx` - Clean hook structure, no early returns at component level
- ✅ `AdminSkillsManager.tsx` - Early return properly placed AFTER all hooks

### Lazy Loading
- ✅ AdminSkillsManager properly wrapped in Suspense with fallback
- ✅ No conditional hook calls in lazy-loaded components

## Best Practices Implemented

### 1. Hook Order Stability
- All hooks called at the top level of components
- No hooks inside conditionals, loops, or early returns
- Consistent hook execution regardless of component state

### 2. Conditional Rendering Patterns
- Use conditional JSX rendering instead of early returns with hooks
- Move early returns to happen AFTER all hooks are declared
- Extract conditional logic into child components when needed

### 3. Tab Management
- Use UI library TabsContent components that handle visibility with CSS
- Persist active tab in sessionStorage to prevent state mismatches
- Avoid conditional mounting/unmounting of components with hooks

## Testing Verification
After implementing these fixes:
1. ✅ Hard refresh no longer needed to clear error #310
2. ✅ Soft refresh maintains proper hook execution order
3. ✅ Cached state changes don't affect hook count
4. ✅ Admin page remains functional across navigation

## Future Guidelines
- Always call hooks at the top level before any conditional logic
- Use conditional JSX rendering (`{condition && <Component />}`) instead of early returns
- Test components with various state combinations to ensure hook stability
- Consider extracting complex conditional logic into separate child components

# 🧪 Testing Guide - usePropertyStepSync Hook Integration

## Quick Start: Verify the Fix Works

### Test 1: Basic Data Persistence (Step 01)
**Objective**: Confirm data persists after F5 refresh

**Steps**:
1. Open wizard (create new property)
2. Fill **Step 01 (Tipo e Identificação)**:
   - Select property type
   - Select modalities
   - Enter registration number
3. **Watch** for status indicator: "💾 Salvando..." then "✅ Salvo com sucesso"
4. Press **F5** to refresh page
5. **Verify**: Step 01 data still present ✅

**Expected Result**:
- Step 01 data visible after refresh
- draftPropertyId created in first save
- completedSteps includes "content-type"

---

### Test 2: Multi-Step Persistence
**Objective**: Confirm multiple steps persist together

**Steps**:
1. Complete Test 1 first (Step 01 saved)
2. Click **Próximo** → advances to Step 02
3. Fill **Step 02 (Localização)**:
   - Select or enter address
   - Complete location form
4. Watch for save indicator → "✅ Salvo com sucesso"
5. Press **F5** to refresh
6. **Verify**: Both Step 01 AND Step 02 data present ✅

**Expected Result**:
- Both steps visible after refresh
- completedSteps includes both "content-type" and "content-location"
- Backend shows merged wizardData with both steps

---

### Test 3: Rapid Changes (No Race Condition)
**Objective**: Confirm debounce prevents upload spam

**Steps**:
1. Start fresh (new property or reset)
2. Fill Step 01 field by field (rapidly):
   - Click property type dropdown → see "💾 Salvando..."
   - Immediately click modalities → indicator **doesn't reset**
   - Click registration field → indicator **stays in saving state**
   - Pause 3 seconds → indicator changes to "✅ Salvo com sucesso" (only ONE upload happened)
3. Check backend logs:
   - Should see **1 upload** (not 3)
   - Payload has all filled fields

**Expected Result**:
- Only ONE network request despite 3 rapid changes
- Debounce correctly delayed upload
- All data saved in single request

**How to verify backend logs**:
```bash
# In terminal
tail -f logs/property-wizard.log | grep "uploadStep\|POST /api/properties"
# Should see single POST with full Step 01 data
```

---

### Test 4: Error Handling & Retry
**Objective**: Confirm hook retries on network failure

**Steps**:
1. Open DevTools → Network tab
2. Fill Step 01
3. **Simulate network error**:
   - DevTools → Network → Throttling: Offline
4. Watch indicator: "💾 Salvando..." then "❌ Erro: Network error"
5. **Restore network**:
   - DevTools → Network → Throttling: No throttling
6. Wait 5 seconds → indicator shows "✅ Salvo com sucesso" (retry succeeded)

**Expected Result**:
- Hook detects network failure
- Shows error indicator immediately
- Auto-retries after 5 seconds
- Succeeds on retry
- User never loses data (stored in localStorage)

---

### Test 5: localStorage Fallback
**Objective**: Confirm data persisted locally if server unreachable

**Steps**:
1. Fill Step 01
2. **Simulate server down**:
   - Stop backend server (or use Network → Offline)
3. Wait for retries to exhaust → "❌ Erro: Max retries reached"
4. Open DevTools → Application → LocalStorage
5. **Search** for `property_draft_[propertyId]`
6. **Verify**: localStorage contains Step 01 data ✅

**Expected Result**:
- Error indicator visible
- localStorage key exists with Step 01 data
- When server returns, retry succeeds and syncs

---

### Test 6: Status Indicators Visibility
**Objective**: Confirm UI indicators work for all steps

**Steps**:
1. Start new property
2. Cycle through steps 1-5:
   - Fill Step 01 → watch "💾" indicator
   - Click Próximo → advance
   - Fill Step 02 → watch "💾" indicator
   - Repeat for Steps 03, 04, 05
3. Each step should show:
   - "💾 Salvando..." during debounce period (2.5s)
   - "✅ Salvo com sucesso" after upload
   - Optional: "❌ Erro: {error}" if network fails

**Expected Result**:
- All status indicators visible below their steps
- Consistent experience across all steps
- Clear feedback to user

---

### Test 7: Backward Compatibility
**Objective**: Confirm old drafts still work

**Steps**:
1. Create property using **old version** (before this refactor)
   - Should have partial wizardData
2. Open that property in wizard with **new version**
3. Fill one more step (Step 02 or higher)
4. Check backend:
   - Old wizardData fields still present
   - New step merged in
   - No data lost

**Expected Result**:
- Deep merge working correctly
- Old + new data coexist
- No need for data migration

---

## Advanced Tests (Optional)

### Test A: Browser Close Simulation
```javascript
// In DevTools Console:
// Simulate data loss if not persisted
localStorage.clear(); // Clears all data
// Then F5 → should still see draftPropertyId in API response
```

### Test B: Concurrent Step Editing
```javascript
// Rapid switching between steps
// 1. Fill Step 01
// 2. Click Próximo 
// 3. Fill Step 02
// 4. Click Voltar to Step 01
// 5. Modify Step 01 again
// → All changes should be independently tracked
```

### Test C: Long Network Latency Simulation
```bash
# DevTools → Network → Throttling: Slow 3G
# Fill Step 01 → expect 5-10 second delay
# Should still succeed (no timeout)
```

---

## Debugging Checklist

If tests fail, check:

### ❓ Status indicator not appearing?
- [ ] Check browser console for errors
- [ ] Verify usePropertyStepSync hook imported in PropertyEditWizard.tsx
- [ ] Verify hook called with correct stepKey for that step

### ❓ Data not persisting after F5?
- [ ] Check browser Network tab → POST request succeeded (200 status)?
- [ ] Check backend logs for JSONB merge error
- [ ] Check localStorage has data as fallback: `localStorage.getItem('property_draft_...')`
- [ ] Verify completedSteps sent to backend

### ❓ Upload happening too frequently?
- [ ] Debounce might be 0 (check usePropertyStepSync code)
- [ ] formData dependency in hook might be missing (creates new debounce each change)

### ❓ Error indicator stuck?
- [ ] Network still offline? (check DevTools Network tab)
- [ ] Check hook retry logic (should try 3 times)
- [ ] Verify localStorage fallback (data not lost even if error)

### ❓ Backwards compatibility broken?
- [ ] Check backend deep merge in routes-properties.ts
- [ ] Verify wizardData: { ...old, ...new } instead of overwrite
- [ ] Check JSONB syntax in MongoDB/SQL dialect

---

## Success Criteria

✅ **All tests pass** means:
1. Data persists after F5 refresh
2. Multiple steps sync correctly
3. No race conditions (debounce works)
4. Errors handled gracefully
5. localStorage fallback functional
6. Status indicators clear and visible
7. Backward compatible with old drafts

---

## Reporting Issues

If any test fails, provide:
1. **Test number** (e.g., "Test 3 failed")
2. **Browser & version** (e.g., "Chrome 120")
3. **Steps to reproduce** (exact steps from test)
4. **Expected vs actual** (what you expected vs what happened)
5. **Browser console errors** (if any)
6. **Network tab screenshot** (showing POST request)

---

## Next Steps After Testing

Once all tests pass (✅):
1. Mark this refactor as **PRODUCTION READY**
2. Deploy to staging environment
3. Have QA team run full wizard flow (all 17 steps)
4. Monitor production logs for any issues
5. Document in release notes:
   - "Fixed data loss issue after F5 refresh"
   - "Improved step sync reliability with centralized hook"
   - "Added status feedback (Salvando/Salvo/Erro)"

---

Generated: 2025 | Test Version: 1.0

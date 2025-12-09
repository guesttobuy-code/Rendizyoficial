# Refactor plan: `PropertyEditorPage`

Goal: refactor `PropertyEditorPage` to align the UI 17-step flow with the domain `PropertyDraft` shape (6 PropertyStep enums). Ensure save calls map correctly and payloads are wrapped in domain keys (e.g., `{ address: ... }`). Reduce runtime crashes and add tests where feasible.

Steps:
1. Audit all uses of `saveStep(...)` across `pages/PropertyEditorPage.tsx` and components under `components/properties/steps` to document mismatches between UI step ids and domain `PropertyStep` enums.
2. Add a lightweight mapper utility `utils/propertyStepMapper.ts` that maps `PropertyStepId` (UI) -> `PropertyStep` (domain) and provides the expected payload key (e.g., `address`, `basicInfo`).
3. Update step components to call a single helper `saveDomainStep(stepId, payload)` that uses the mapper to call `saveStep(domainStep, { <key>: payload })`.
4. Add unit tests for the mapper and for `SavePropertyStepUseCase` behavior when receiving wrapped updates.
5. Manually test flows:
   - Create new property -> Step 2 (Location): CEP lookup, save, image upload.
   - Edit existing property -> ensure no regression in other steps.
6. Submit PR with changes and request 1-2 reviewers.

Notes:
- Keep changes small and atomic; do not attempt large refactors in a single PR.
- If a step requires broader domain changes, open a follow-up design PR first.

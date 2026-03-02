# TrackReady by RevSpace

## Current State
The app is fully client-side with all data stored in `localStorage`. Every hook (useCars, useEvents, useChecklist, useTireLogs, useLapNotes, useWear) reads and writes to browser storage with hardcoded seed/mock data. The backend is a stub with only a `ping()` function. Internet Identity auth is wired in (`useInternetIdentity`) but the app renders without requiring login. No data persists across browsers/devices.

## Requested Changes (Diff)

### Add
- Internet Identity sign-in gate: user must authenticate before accessing any feature; show a branded login screen if not authenticated
- Full Motoko backend with per-principal data storage for all six data types: Cars, TrackEvents, ChecklistItems, TireLogSessions, LapNotes, WearEntries
- Backend CRUD operations for all six entities, keyed by caller principal
- Sign-out button in the sidebar/nav
- Loading states while data fetches from backend

### Modify
- All six data hooks (useCars, useEvents, useChecklist, useTireLogs, useLapNotes, useWear) — remove localStorage, remove all seed/mock data, replace with backend API calls
- App.tsx — wrap with InternetIdentityProvider, gate content behind authenticated check
- Sidebar and MobileNav — add sign-out button with current user principal display

### Remove
- All SEED_* and DEFAULT_ITEMS mock data arrays in every hook
- All `loadFromStorage` / `saveToStorage` / `localStorage` calls
- All hardcoded ids like `car-1`, `event-1`, etc.

## Implementation Plan
1. Generate Motoko backend with stable storage for all six entity types per principal (Cars, Events, ChecklistItems, TireLogSessions, LapNotes, WearEntries)
2. Select `authorization` component for Internet Identity support
3. Rewrite all six hooks to use async backend calls via `useActor`
4. Add login screen component shown when user is unauthenticated
5. Wrap App with InternetIdentityProvider; add loading state during auth init
6. Add sign-out to Sidebar and MobileNav
7. Add loading spinners in each page while data loads from backend

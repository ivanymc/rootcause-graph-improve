# UPDATE

This file lists changes in this repo based on the full git history, comparing the initial commit to the current HEAD.

## Summary of changes (init → latest)
### Frontend
- Added graph reset UX and lifecycle handling: reset button in the editor, reset-all on app load, and intervention/simulation reset when a graph is reset. (`frontend/src/app/_components/GraphEditor.tsx`, `frontend/src/app/page.tsx`, `frontend/src/hooks/useGraphApi.ts`, `frontend/src/server/api/routers/graph.ts`)
- Added node search + focus in the graph view with debounced search, keyboard navigation, dropdown results, and focused-node highlight in the visualization. (`frontend/src/app/_components/GraphEditor.tsx`, `frontend/src/app/_components/GraphVisualization.tsx`)
- Improved graph visualization styling/physics and emphasis behavior (edge widths, repulsion, focus highlighting). (`frontend/src/app/_components/GraphVisualization.tsx`)
- Graph list now receives data from parent and shows skeleton loading state. (`frontend/src/app/_components/GraphList.tsx`, `frontend/src/app/page.tsx`)
- Intervention UX improvements: auto-focus value input on node select, Enter-to-add intervention. (`frontend/src/app/_components/InterventionPanel.tsx`)
- API base URL now switches based on `NEXT_ENV` for prod vs local. (`frontend/src/lib/api.ts`, `frontend/src/server/api/routers/graph.ts`)
- Added tRPC error handler type annotations to fix TS build error. (`frontend/src/app/api/trpc/[trpc]/route.ts`)
- Table layout tweaks in the editor (centered headers/cells, padding adjustments). (`frontend/src/app/_components/GraphEditor.tsx`)

### Backend
- Added reset endpoints for all graphs and single graph. (`backend/app/main.py`)
- Persisted default graph definitions and added reset logic to storage. (`backend/app/storage.py`)
- Graph validation now allows cycles (cycle detection removed from error reporting). (`backend/app/graph.py`)
- Added backend run instructions and pinned FastAPI/Uvicorn requirements. (`backend/README.md`, `backend/requirements.txt`)

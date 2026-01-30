# UPDATE

This document lists all features and changes made to the codebase, ordered by importance.

---

## Overview

A causal graph visualization and simulation tool with:
- **Backend:** Python FastAPI with full CRUD API for graphs, nodes, and edges
- **Frontend:** Next.js with tRPC integration for type-safe API calls
- **Visualization:** ECharts force-directed graph with interactive features

---

## 1. Backend REST API

Full REST API for graph manipulation built with FastAPI.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/graphs` | GET | List all graphs (sorted by node count) |
| `/graphs/{id}` | GET | Get single graph with nodes/edges |
| `/graphs/{id}/validate` | GET | Validate graph structure |
| `/graphs/{id}/simulate` | POST | Run what-if simulation |
| `/graphs/{id}/reset` | POST | Reset graph to default |
| `/graphs/reset` | POST | Reset all graphs |
| `/graphs/{id}/nodes` | POST | Add node |
| `/graphs/{id}/nodes/{node_id}` | PUT/DELETE | Update/delete node |
| `/graphs/{id}/edges` | POST | Add edge |
| `/graphs/{id}/edges/{index}` | PUT/DELETE | Update/delete edge |

**Backend Features:**
- In-memory storage with persisted defaults for reset capability
- Configurable CORS via `CORS_ORIGINS` env variable
- Graph validation allows cycles (informational only, not blocking)

**Files:** `main.py`, `storage.py`, `graph.py`

---

## 2. tRPC API Integration

Type-safe API communication between Next.js frontend and Python backend.

**Architecture:**
- tRPC router wraps all Python backend endpoints
- Zod schemas for input validation
- React Query integration for caching and mutations

**Custom Hooks:**
```typescript
// Queries
useGraph(id)          // Fetch single graph
useGraphs()           // Fetch all graphs
useValidateGraph(id)  // Validate graph

// Mutations
useAddNode(graphId)      useUpdateNode(graphId)      useDeleteNode(graphId)
useAddEdge(graphId)      useUpdateEdge(graphId)      useDeleteEdge(graphId)
useResetGraph(graphId)   useResetAllGraphs()         useSimulation(graphId)
```

**Cache Invalidation:** All CRUD mutations automatically invalidate related queries.

**Files:** `useGraphApi.ts`, `graph.ts` (router), `apiBaseUrl.ts`

---

## 3. Graph Visualization (ECharts)

Interactive force-directed graph visualization for causal models.

**Force Layout Settings:**
- `repulsion: 700` - Node spacing
- `gravity: 0.1` - Center attraction
- `edgeLength: 200` - Target edge length

**Interactions:**
- Zoom (scroll), Pan (drag background), Drag nodes
- Click node to focus and highlight adjacency

**Visual Styling:**
- Node colors by type: continuous (blue), categorical (green), binary (yellow)
- Edge colors by weight: positive (green), negative (red)
- Logarithmic node sizing based on values
- Focused node: yellow border/glow + 30% size increase

**Files:** `GraphVisualization.tsx`

---

## 4. Node Search & Navigation

Find and focus specific nodes in large graphs (supports 2000+ nodes).

**Features:**
- Search bar with autocomplete dropdown
- Search by node name or ID
- Debounced search (150ms) for performance
- Dropdown limited to 50 items with "more nodes..." indicator

**Keyboard Navigation:**
| Key | Action |
|-----|--------|
| `↓` / `↑` | Navigate dropdown |
| `Enter` | Select highlighted node |
| `Escape` | Close dropdown |

**UX Details:**
- Click-outside closes dropdown
- Yellow highlight on matching text
- Focus indicator badge with clear (X) button
- State resets when changing graphs

**Files:** `GraphEditor.tsx`

---

## 5. Table View with CRUD

View and modify graph structure in table format.

**Features:**
- Toggle between Graph/Table view
- Nodes table: Name, Type, Base Value, Simulated, Actions
- Edges table: Source, Target, Weight, Actions
- Add Node/Edge forms with inline editing
- Delete with confirmation dialog
- Real-time validation badge (Valid DAG / Invalid Graph)
- Sticky headers for scrolling

**Files:** `GraphEditor.tsx`

---

## 6. Graph Reset

Restore graphs to original state.

**Features:**
- Reset button in graph editor header
- Reset all graphs on app load (clean state)
- Clears: graph data, node search, simulation results, interventions

**Implementation:** Backend stores original graph definitions; frontend uses component key change to remount InterventionPanel.

**Files:** `GraphEditor.tsx`, `page.tsx`, `main.py`, `storage.py`

---

## Bug Fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| **Stale interventions after graph switch** | High | Added useEffect to clear intervention state when graphId changes |
| **parseFloat NaN sent to backend** | High | Added `createIntervention()` helper with NaN validation |
| **React hooks order violation** | High | Moved useMemo before early returns with null checks inside |
| **Search dropdown not closing** | Medium | Added click-outside handler with ref |

**Files:** `InterventionPanel.tsx`, `intervention.ts`, `GraphEditor.tsx`

---

## Environment Configuration

### Frontend
- `NEXT_ENV`: `dev` | `prod` (replaces NODE_ENV)
- `NEXT_PUBLIC_API_URL`: API URL for production

**Logic:** Uses `localhost:8000` when `NEXT_ENV=dev`, otherwise requires `NEXT_PUBLIC_API_URL`.

### Backend
- `CORS_ORIGINS`: Comma-separated allowed origins (default: `http://localhost:3000`)

**Files:** `env.js`, `apiBaseUrl.ts`, `main.py`

---

## Code Cleanup

**Removed Files:**
- `frontend/src/lib/api.ts` - Old REST client (replaced by tRPC)
- `frontend/src/app/_components/post.tsx` - T3 demo component
- `frontend/src/server/api/routers/post.ts` - T3 demo router
- `frontend/src/trpc/server.ts` - Unused server utilities

**Refactored:**
- GraphList: Changed from internal fetching to props-based design
- State lifted to `page.tsx` for better control

---

## UI/UX Improvements

- Auto-select first graph on app load
- Skeleton loading states for graph list
- Mobile-responsive sidebars with overlay
- Centered and sticky table headers
- **Intervention panel:** Auto-focus value input when selecting node, press `Enter` to add

---

## File Reference

| File | Purpose |
|------|---------|
| `main.py` | FastAPI endpoints |
| `storage.py` | Graph data persistence |
| `graph.py` | Validation logic |
| `graph.ts` (router) | tRPC procedures |
| `useGraphApi.ts` | tRPC hooks |
| `apiBaseUrl.ts` | API URL configuration |
| `GraphVisualization.tsx` | ECharts rendering |
| `GraphEditor.tsx` | Search, CRUD UI, table view |
| `InterventionPanel.tsx` | What-if management |
| `ResultsView.tsx` | Simulation results |
| `GraphList.tsx` | Graph selection sidebar |
| `page.tsx` | App layout |
| `intervention.ts` | Intervention validation |
| `env.js` | Environment variables |

---

*Last updated: January 30, 2025*

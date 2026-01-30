for data sci


Frontend:

Frontend Code Health Check Report
Critical Issues
1. NEXT_PUBLIC_API_URL Not Validated by Env Schema
Severity: Critical | api.ts:16-17 vs env.js:18-19

The API uses NEXT_PUBLIC_API_URL but it's not defined in the env schema, bypassing build-time validation:


// api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// env.js - Missing!
client: {
  // NEXT_PUBLIC_CLIENTVAR: z.string(),  // ❌ NEXT_PUBLIC_API_URL not here
},
Risk: App silently falls back to localhost in production if env var is missing.

Fix: Add to env.js:


client: {
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
},
runtimeEnv: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}
High Severity Issues

<!-- 2. Stale Interventions After Graph Switch
Severity: High | InterventionPanel.tsx:19-21

Interventions state persists when switching graphs. Old node IDs cause 400 errors.


const [interventions, setInterventions] = useState<Intervention[]>([]);
// ❌ Never cleared when graphId changes
Fix:


useEffect(() => {
  setInterventions([]);
  setSelectedNodeId("");
  setForcedValue("");
}, [graphId]);

3. parseFloat Returns NaN Without Guard
Severity: High | InterventionPanel.tsx:32


{ node_id: selectedNodeId, forced_value: parseFloat(forcedValue) }
If forcedValue is empty string or non-numeric, parseFloat returns NaN which gets sent to backend.

Fix:


const handleAddIntervention = () => {
  if (!selectedNodeId || !forcedValue) return;
  const numValue = parseFloat(forcedValue);
  if (Number.isNaN(numValue)) return;  // Add this guard
  // ...
} -->

4. No API Error Boundary - Unhandled Promise Rejection
Severity: High | api.ts:31-35

If the backend is down, response.json() fails silently:


if (!response.ok) {
  const error = (await response.json().catch(() => ({}))) as { detail?: string };
  throw new Error(error.detail ?? `API Error: ${response.status}`);
}
Issue: Network errors (CORS, connection refused) throw different errors that aren't caught here. The .catch(() => ({})) masks the real error.

Fix: Add network error handling:


async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ... });
  } catch (e) {
    throw new Error(`Network error: Unable to reach API server`);
  }
  // ... rest
}
Medium Severity Issues

5. Missing Loading State in ResultsView
Severity: Medium | ResultsView.tsx:12


const { data: graph } = useGraph(graphId);
// ❌ No isLoading check - getNodeName may return nodeId instead of name during load
When results arrive before graph data, node names show as IDs.

<!-- 6. Type Mismatch - Intervention forced_value
Severity: Medium | types.ts:35 vs InterventionPanel.tsx:32

Type allows string | number but component always converts to number:


// types.ts
forced_value: number | string;

// InterventionPanel.tsx - always parseFloat
forced_value: parseFloat(forcedValue)  // ❌ Categorical nodes need strings
Categorical/binary node interventions will break. -->

7. No Request Timeout/Cancellation
Severity: Medium | api.ts:23

Large graph simulations can hang indefinitely:


const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  // ❌ No AbortController
});
Fix:


async function fetchApi<T>(endpoint: string, options?: RequestInit, timeoutMs = 30000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    // ...
  } finally {
    clearTimeout(timeoutId);
  }
}

8. URL Path Injection
Severity: Medium | api.ts:50

Graph IDs are interpolated directly into URL:


getGraph: (id: string) => fetchApi<CausalGraph>(`/graphs/${id}`),
If id contains / or .., it breaks or manipulates the path.

Fix: Use encodeURIComponent(id).

9. Unnecessary Re-renders - getNodeName Inside Render
Severity: Medium | ResultsView.tsx:19-23, InterventionPanel.tsx:76-79


const getNodeName = (nodeId: string) => {
  const node = graph.nodes.find((n) => n.id === nodeId);  // O(n) per call
  return node?.name ?? nodeId;
};
Called for every node in map. Should be memoized:


const nodeNameMap = useMemo(
  () => new Map(graph?.nodes.map(n => [n.id, n.name]) ?? []),
  [graph?.nodes]
);

10. Query Key Collision Risk
Severity: Medium | useGraphApi.ts:26-30


queryKey: ["graphs", id],  // For single graph
queryKey: ["graphs"],      // For all graphs
When id is falsy, both resolve to similar keys. Already guarded by enabled: !!id, but fragile.

Low Severity Issues
11. Dead Code - Entire tRPC Infrastructure Unused
Severity: Low | Multiple files

These files are scaffolding that's never used (REST is used instead):

src/server/api/ - entire directory
src/trpc/server.ts
src/app/api/trpc/[trpc]/route.ts
src/server/api/routers/post.ts - mock data
~400 lines of unused code. Consider removing or documenting intent.

12. Artificial Delay in Development
Severity: Low | trpc.ts:82-86


if (t._config.isDev) {
  const waitMs = Math.floor(Math.random() * 400) + 100;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}
This affects tRPC calls (which aren't used), but if tRPC is enabled later, random 100-500ms delays will confuse developers.

13. No Error Boundary Component
Severity: Low | layout.tsx

No React error boundary. Unhandled errors crash the entire app.

Fix: Add error.tsx in app directory or wrap with ErrorBoundary.

14. Accessibility Issues
Severity: Low | Multiple components

No aria-label on buttons with only "x" text (InterventionPanel.tsx:157)
No keyboard navigation hints
Color-only status indicators (red/green) - fails WCAG for colorblind users
15. Console Logging in Production
Severity: Low | InterventionPanel.tsx:63


console.error("Simulation failed:", error);
Should use proper error reporting in production.

Summary Table
#	Issue	Severity	Location
1	API URL not in env schema	Critical	env.js, api.ts
2	Stale interventions on graph switch	High	InterventionPanel.tsx
3	parseFloat NaN not guarded	High	InterventionPanel.tsx:32
4	Network errors not handled	High	api.ts:31
5	Missing loading state in ResultsView	Medium	ResultsView.tsx:12
6	Type mismatch: forced_value	Medium	types.ts vs component
7	No request timeout	Medium	api.ts
8	URL path injection	Medium	api.ts:50
9	Unoptimized getNodeName	Medium	ResultsView, InterventionPanel
10	Query key collision risk	Medium	useGraphApi.ts
11	Dead tRPC code (~400 lines)	Low	src/server/, src/trpc/
12	Random artificial delay	Low	trpc.ts:82
13	No error boundary	Low	layout.tsx
14	Accessibility gaps	Low	Multiple
15	Console.error in production	Low	InterventionPanel.tsx:63




Backend:
Code Health Check Report
Critical Issues
1. Simulation Runs Without Validation Check
Severity: Critical | main.py:80-95

The /simulate endpoint runs simulations without verifying the graph is a valid DAG. Invalid graphs (with cycles) may cause infinite loops or incorrect results.


@app.post("/graphs/{graph_id}/simulate", response_model=SimulationResponse)
async def run_simulation(graph_id: str, request: SimulationRequest):
    graph = storage.get_graph(graph_id)
    # ... validates intervention nodes exist
    # ❌ MISSING: validate_graph(graph) check before simulate
    return simulate(graph, request.interventions)
Fix: Add validation before simulation:


validation = validate_graph(graph)
if not validation.is_valid:
    raise HTTPException(status_code=400, detail="Cannot simulate invalid graph")
2. Thread Safety - Race Conditions in Storage
Severity: Critical | storage.py:59-67

In-memory dict is not thread-safe. Concurrent requests can cause data corruption or KeyError exceptions.


def create_graph(self, graph: CausalGraph) -> CausalGraph:
    self._graphs[graph.id] = graph  # ❌ No lock
    
def delete_graph(self, graph_id: str) -> bool:
    if graph_id in self._graphs:  # ❌ TOCTOU race condition
        del self._graphs[graph_id]
Fix: Add threading lock:


from threading import Lock

class GraphStorage:
    def __init__(self):
        self._lock = Lock()
        self._graphs: dict[str, CausalGraph] = {}
    
    def delete_graph(self, graph_id: str) -> bool:
        with self._lock:
            return self._graphs.pop(graph_id, None) is not None
High Severity Issues
3. No Rate Limiting - DoS Vulnerability
Severity: High | main.py:80

The simulation endpoint with 2000-node graphs is computationally expensive. No rate limiting allows abuse.

Fix: Add rate limiting middleware (e.g., slowapi).

4. Stale Interventions State After Graph Change
Severity: High | InterventionPanel.tsx:16-21

When user switches graphs, interventions array is NOT cleared. Old node IDs may not exist in new graph, causing 400 errors on simulation.


const [interventions, setInterventions] = useState<Intervention[]>([]);
// ❌ No useEffect to clear when graphId changes
Fix: Clear interventions on graph change:


useEffect(() => {
  setInterventions([]);
}, [graphId]);
5. parseFloat Returns NaN Without Validation
Severity: High | InterventionPanel.tsx:32-40

parseFloat(forcedValue) can return NaN for invalid input (e.g., empty string after deleting), which propagates to backend.


{ node_id: selectedNodeId, forced_value: parseFloat(forcedValue) }
// ❌ If forcedValue = "" or "abc", this becomes NaN
Fix: Validate before adding:


const numValue = parseFloat(forcedValue);
if (isNaN(numValue)) return;
Medium Severity Issues
6. Performance - Adjacency List Rebuilt Every Iteration
Severity: Medium | simulator.py:26-27

Adjacency list is rebuilt inside the loop on every iteration (up to 1000 times).


for iteration in range(max_iterations):
    adjacency = _build_adjacency(graph)  # ❌ O(edges) called 1000x
Fix: Move outside loop:


adjacency = _build_adjacency(graph)
for iteration in range(max_iterations):
    # use adjacency
7. CORS Hardcoded to localhost
Severity: Medium | main.py:26-32


allow_origins=["http://localhost:3000"],  # ❌ Won't work in production
Fix: Use environment variable:


allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:3000")]
8. No Timeout on Frontend API Calls
Severity: Medium | api.ts:23-29

Large graph simulations could hang indefinitely.


const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  // ❌ No AbortController timeout
});
Fix: Add abort timeout:


const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
const response = await fetch(url, { signal: controller.signal, ...options });
9. Graph ID Not Validated as URL-Safe
Severity: Medium | api.ts:50

Graph IDs are directly interpolated into URL without encoding:


getGraph: (id: string) => fetchApi<CausalGraph>(`/graphs/${id}`),
// ❌ If id contains "/" or special chars, URL breaks
Fix: Use encodeURIComponent(id).

Low Severity Issues
10. Silent Error Swallowing
Severity: Low | InterventionPanel.tsx:62-64


} catch (error) {
  console.error("Simulation failed:", error);  // ❌ User sees nothing
}
Note: The component does show simulation.error.message below, but the catch block logs without re-throwing, which is fine since React Query handles the error state.

11. Unused tRPC Setup (Dead Code)
Severity: Low | src/trpc/ & src/server/

Full tRPC infrastructure exists but REST is used instead. This is ~500 lines of unused code.

12. No Input Length Validation
Severity: Low | models.py:12-17

No max length on name fields - could accept arbitrarily large strings:


class Node(BaseModel):
    id: str          # ❌ No max_length
    name: str        # ❌ Could be megabytes
Fix: Add Pydantic constraints:


name: str = Field(..., max_length=255)
Summary Table
#	Issue	Severity	File
1	Simulation without validation	Critical	main.py:80
2	Thread-unsafe storage	Critical	storage.py
3	No rate limiting	High	main.py
4	Stale interventions state	High	InterventionPanel.tsx
5	NaN from parseFloat	High	InterventionPanel.tsx:32
6	Adjacency rebuilt in loop	Medium	simulator.py:27
7	Hardcoded CORS	Medium	main.py:28
8	No API timeout	Medium	api.ts
9	URL injection risk	Medium	api.ts:50
10	Silent error logging	Low	InterventionPanel.tsx:63
11	Unused tRPC code	Low	src/trpc/, src/server/
12	No input length limits	Low	models.py
Priority: Fix #1 and #2 first - they can cause incorrect behavior and crashes under concurrent load.
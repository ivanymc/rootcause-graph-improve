/**
 * REST API client for the Python FastAPI backend.
 *
 * NOTE: This does NOT use tRPC since the backend is Python.
 * We use plain fetch() with proper TypeScript types.
 */

import type {
  CausalGraph,
  CreateGraphRequest,
  Intervention,
  SimulationResponse,
  ValidationResult,
  CreateNodeRequest,
  UpdateNodeRequest,
  CreateEdgeRequest,
  UpdateEdgeRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_ENV === "prod" ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new Error(error.detail ?? `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const graphApi = {
  /**
   * List all available causal graphs.
   */
  listGraphs: () => fetchApi<CausalGraph[]>("/graphs"),

  /**
   * Get a specific graph by ID.
   */
  getGraph: (id: string) => fetchApi<CausalGraph>(`/graphs/${id}`),

  /**
   * Create a new causal graph.
   */
  createGraph: (data: CreateGraphRequest) =>
    fetchApi<CausalGraph>("/graphs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a graph by ID.
   */
  deleteGraph: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/graphs/${id}`, { method: "DELETE" }),

  /**
   * Run a what-if simulation with interventions.
   */
  simulate: (graphId: string, interventions: Intervention[]) =>
    fetchApi<SimulationResponse>(`/graphs/${graphId}/simulate`, {
      method: "POST",
      body: JSON.stringify({ interventions }),
    }),

  /**
   * Validate that a graph is a valid DAG.
   */
  validateGraph: (id: string) =>
    fetchApi<ValidationResult>(`/graphs/${id}/validate`),

  // ============ Node CRUD ============

  /**
   * Add a new node to a graph.
   */
  addNode: (graphId: string, data: CreateNodeRequest) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/nodes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing node in a graph.
   */
  updateNode: (graphId: string, nodeId: string, data: UpdateNodeRequest) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/nodes/${nodeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a node from a graph.
   */
  deleteNode: (graphId: string, nodeId: string) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/nodes/${nodeId}`, {
      method: "DELETE",
    }),

  // ============ Edge CRUD ============

  /**
   * Add a new edge to a graph.
   */
  addEdge: (graphId: string, data: CreateEdgeRequest) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/edges`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing edge in a graph.
   */
  updateEdge: (graphId: string, edgeIndex: number, data: UpdateEdgeRequest) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/edges/${edgeIndex}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete an edge from a graph.
   */
  deleteEdge: (graphId: string, edgeIndex: number) =>
    fetchApi<CausalGraph>(`/graphs/${graphId}/edges/${edgeIndex}`, {
      method: "DELETE",
    }),
};

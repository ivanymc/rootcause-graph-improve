/**
 * TypeScript types matching the backend Pydantic models.
 */

export type NodeType = "continuous" | "categorical" | "binary";

export interface Node {
  id: string;
  name: string;
  node_type: NodeType;
  base_value: number | string;
  possible_values?: string[] | null;
}

export interface Edge {
  source_id: string;
  target_id: string;
  weight: number;
}

export interface CausalGraph {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface CreateGraphRequest {
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface Intervention {
  node_id: string;
  forced_value: number | string;
}

export interface SimulationRequest {
  interventions: Intervention[];
}

export interface SimulationResult {
  node_id: string;
  original_value: number | string;
  simulated_value: number | string;
}

export interface SimulationResponse {
  results: SimulationResult[];
  computation_time_ms: number;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
}

// CRUD Request Types
export interface CreateNodeRequest {
  name: string;
  node_type: NodeType;
  base_value: number | string;
  possible_values?: string[];
}

export interface UpdateNodeRequest {
  name?: string;
  node_type?: NodeType;
  base_value?: number | string;
  possible_values?: string[];
}

export interface CreateEdgeRequest {
  source_id: string;
  target_id: string;
  weight: number;
}

export interface UpdateEdgeRequest {
  source_id?: string;
  target_id?: string;
  weight?: number;
}

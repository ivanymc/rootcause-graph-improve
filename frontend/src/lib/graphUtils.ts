/**
 * Graph utility functions for validation and manipulation.
 */

import type { CausalGraph, Node, Edge, SimulationResult } from "./types";

/**
 * Find a node by ID in a graph.
 */
export function findNodeById(graph: CausalGraph, nodeId: string): Node | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

/**
 * Find a node by name in a graph (case-insensitive).
 */
export function findNodeByName(graph: CausalGraph, name: string): Node | undefined {
  const lowerName = name.toLowerCase();
  return graph.nodes.find((n) => n.name.toLowerCase() === lowerName);
}

/**
 * Get all edges that connect to a specific node (incoming or outgoing).
 */
export function getNodeEdges(graph: CausalGraph, nodeId: string): Edge[] {
  return graph.edges.filter(
    (e) => e.source_id === nodeId || e.target_id === nodeId
  );
}

/**
 * Get incoming edges to a node.
 */
export function getIncomingEdges(graph: CausalGraph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.target_id === nodeId);
}

/**
 * Get outgoing edges from a node.
 */
export function getOutgoingEdges(graph: CausalGraph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.source_id === nodeId);
}

/**
 * Check if an edge would create a self-loop.
 */
export function isSelfLoop(sourceId: string, targetId: string): boolean {
  return sourceId === targetId;
}

/**
 * Check if an edge already exists in the graph.
 */
export function edgeExists(
  graph: CausalGraph,
  sourceId: string,
  targetId: string
): boolean {
  return graph.edges.some(
    (e) => e.source_id === sourceId && e.target_id === targetId
  );
}

/**
 * Check if a node ID is unique in the graph.
 */
export function isNodeIdUnique(graph: CausalGraph, nodeId: string): boolean {
  return !graph.nodes.some((n) => n.id === nodeId);
}

/**
 * Validate that all edge references point to existing nodes.
 */
export function validateEdgeReferences(graph: CausalGraph): string[] {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const errors: string[] = [];

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source_id)) {
      errors.push(`Edge references non-existent source node: ${edge.source_id}`);
    }
    if (!nodeIds.has(edge.target_id)) {
      errors.push(`Edge references non-existent target node: ${edge.target_id}`);
    }
  }

  return errors;
}

/**
 * Calculate the simulation delta for a result.
 */
export function calculateDelta(result: SimulationResult): number | null {
  if (
    typeof result.original_value === "number" &&
    typeof result.simulated_value === "number"
  ) {
    return result.simulated_value - result.original_value;
  }
  return null;
}

/**
 * Filter simulation results to only show nodes that changed.
 */
export function getChangedNodes(
  results: SimulationResult[],
  threshold = 0.0001
): SimulationResult[] {
  return results.filter((r) => {
    const delta = calculateDelta(r);
    return delta !== null && Math.abs(delta) > threshold;
  });
}

/**
 * Sort nodes alphabetically by name.
 */
export function sortNodesByName(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter nodes by search query (matches name or ID).
 */
export function filterNodesByQuery(nodes: Node[], query: string): Node[] {
  if (!query.trim()) return nodes;
  const lowerQuery = query.toLowerCase();
  return nodes.filter(
    (node) =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get nodes grouped by type.
 */
export function groupNodesByType(nodes: Node[]): Record<string, Node[]> {
  return nodes.reduce(
    (acc, node) => {
      const type = node.node_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(node);
      return acc;
    },
    {} as Record<string, Node[]>
  );
}

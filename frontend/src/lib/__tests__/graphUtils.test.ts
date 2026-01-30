import {
  findNodeById,
  findNodeByName,
  getNodeEdges,
  getIncomingEdges,
  getOutgoingEdges,
  isSelfLoop,
  edgeExists,
  isNodeIdUnique,
  validateEdgeReferences,
  calculateDelta,
  getChangedNodes,
  sortNodesByName,
  filterNodesByQuery,
  groupNodesByType,
} from "../graphUtils";
import type { CausalGraph, Node, SimulationResult } from "../types";

// Test fixtures
const mockGraph: CausalGraph = {
  id: "test-graph",
  name: "Test Graph",
  nodes: [
    { id: "node-1", name: "Node One", node_type: "continuous", base_value: 100 },
    { id: "node-2", name: "Node Two", node_type: "categorical", base_value: "A" },
    { id: "node-3", name: "Node Three", node_type: "binary", base_value: 1 },
    { id: "node-4", name: "Another Node", node_type: "continuous", base_value: 50 },
  ],
  edges: [
    { source_id: "node-1", target_id: "node-2", weight: 0.5 },
    { source_id: "node-1", target_id: "node-3", weight: -0.3 },
    { source_id: "node-2", target_id: "node-4", weight: 1.0 },
  ],
};

describe("findNodeById", () => {
  it("should find a node by ID", () => {
    const node = findNodeById(mockGraph, "node-2");
    expect(node).toBeDefined();
    expect(node?.name).toBe("Node Two");
  });

  it("should return undefined for non-existent ID", () => {
    const node = findNodeById(mockGraph, "non-existent");
    expect(node).toBeUndefined();
  });
});

describe("findNodeByName", () => {
  it("should find a node by exact name (case-insensitive)", () => {
    const node = findNodeByName(mockGraph, "node one");
    expect(node).toBeDefined();
    expect(node?.id).toBe("node-1");
  });

  it("should return undefined for non-existent name", () => {
    const node = findNodeByName(mockGraph, "Non Existent");
    expect(node).toBeUndefined();
  });
});

describe("getNodeEdges", () => {
  it("should return all edges connected to a node", () => {
    const edges = getNodeEdges(mockGraph, "node-1");
    expect(edges).toHaveLength(2);
  });

  it("should return empty array for node with no edges", () => {
    const graphWithIsolatedNode: CausalGraph = {
      ...mockGraph,
      nodes: [...mockGraph.nodes, { id: "isolated", name: "Isolated", node_type: "continuous", base_value: 0 }],
    };
    const edges = getNodeEdges(graphWithIsolatedNode, "isolated");
    expect(edges).toHaveLength(0);
  });
});

describe("getIncomingEdges", () => {
  it("should return only incoming edges", () => {
    const edges = getIncomingEdges(mockGraph, "node-2");
    expect(edges).toHaveLength(1);
    expect(edges[0]?.source_id).toBe("node-1");
  });

  it("should return empty array for source nodes", () => {
    const edges = getIncomingEdges(mockGraph, "node-1");
    expect(edges).toHaveLength(0);
  });
});

describe("getOutgoingEdges", () => {
  it("should return only outgoing edges", () => {
    const edges = getOutgoingEdges(mockGraph, "node-1");
    expect(edges).toHaveLength(2);
  });

  it("should return empty array for leaf nodes", () => {
    const edges = getOutgoingEdges(mockGraph, "node-3");
    expect(edges).toHaveLength(0);
  });
});

describe("isSelfLoop", () => {
  it("should return true for same source and target", () => {
    expect(isSelfLoop("node-1", "node-1")).toBe(true);
  });

  it("should return false for different source and target", () => {
    expect(isSelfLoop("node-1", "node-2")).toBe(false);
  });
});

describe("edgeExists", () => {
  it("should return true for existing edge", () => {
    expect(edgeExists(mockGraph, "node-1", "node-2")).toBe(true);
  });

  it("should return false for non-existing edge", () => {
    expect(edgeExists(mockGraph, "node-2", "node-1")).toBe(false);
  });

  it("should return false for reversed edge direction", () => {
    // Edge exists from node-1 to node-2, not the reverse
    expect(edgeExists(mockGraph, "node-2", "node-1")).toBe(false);
  });
});

describe("isNodeIdUnique", () => {
  it("should return true for unique ID", () => {
    expect(isNodeIdUnique(mockGraph, "new-node")).toBe(true);
  });

  it("should return false for existing ID", () => {
    expect(isNodeIdUnique(mockGraph, "node-1")).toBe(false);
  });
});

describe("validateEdgeReferences", () => {
  it("should return empty array for valid graph", () => {
    const errors = validateEdgeReferences(mockGraph);
    expect(errors).toHaveLength(0);
  });

  it("should return errors for invalid source references", () => {
    const invalidGraph: CausalGraph = {
      ...mockGraph,
      edges: [{ source_id: "non-existent", target_id: "node-2", weight: 1 }],
    };
    const errors = validateEdgeReferences(invalidGraph);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("non-existent");
  });

  it("should return errors for invalid target references", () => {
    const invalidGraph: CausalGraph = {
      ...mockGraph,
      edges: [{ source_id: "node-1", target_id: "non-existent", weight: 1 }],
    };
    const errors = validateEdgeReferences(invalidGraph);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("non-existent");
  });
});

describe("calculateDelta", () => {
  it("should calculate delta for numeric values", () => {
    const result: SimulationResult = {
      node_id: "node-1",
      original_value: 100,
      simulated_value: 150,
    };
    expect(calculateDelta(result)).toBe(50);
  });

  it("should handle negative deltas", () => {
    const result: SimulationResult = {
      node_id: "node-1",
      original_value: 100,
      simulated_value: 80,
    };
    expect(calculateDelta(result)).toBe(-20);
  });

  it("should return null for non-numeric values", () => {
    const result: SimulationResult = {
      node_id: "node-1",
      original_value: "A",
      simulated_value: "B",
    };
    expect(calculateDelta(result)).toBeNull();
  });
});

describe("getChangedNodes", () => {
  const results: SimulationResult[] = [
    { node_id: "node-1", original_value: 100, simulated_value: 150 },
    { node_id: "node-2", original_value: 50, simulated_value: 50 },
    { node_id: "node-3", original_value: 200, simulated_value: 200.00001 },
  ];

  it("should filter out nodes with no change", () => {
    const changed = getChangedNodes(results);
    expect(changed).toHaveLength(1);
    expect(changed[0]?.node_id).toBe("node-1");
  });

  it("should respect custom threshold", () => {
    const changed = getChangedNodes(results, 0.001);
    expect(changed).toHaveLength(1);
  });
});

describe("sortNodesByName", () => {
  it("should sort nodes alphabetically", () => {
    const sorted = sortNodesByName(mockGraph.nodes);
    expect(sorted[0]?.name).toBe("Another Node");
    expect(sorted[1]?.name).toBe("Node One");
  });

  it("should not mutate original array", () => {
    const original = [...mockGraph.nodes];
    sortNodesByName(mockGraph.nodes);
    expect(mockGraph.nodes).toEqual(original);
  });
});

describe("filterNodesByQuery", () => {
  it("should filter nodes by name", () => {
    const filtered = filterNodesByQuery(mockGraph.nodes, "one");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("node-1");
  });

  it("should filter nodes by ID", () => {
    const filtered = filterNodesByQuery(mockGraph.nodes, "node-2");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Node Two");
  });

  it("should be case-insensitive", () => {
    const filtered = filterNodesByQuery(mockGraph.nodes, "NODE");
    expect(filtered).toHaveLength(4);
  });

  it("should return all nodes for empty query", () => {
    const filtered = filterNodesByQuery(mockGraph.nodes, "");
    expect(filtered).toHaveLength(mockGraph.nodes.length);
  });

  it("should return all nodes for whitespace query", () => {
    const filtered = filterNodesByQuery(mockGraph.nodes, "   ");
    expect(filtered).toHaveLength(mockGraph.nodes.length);
  });
});

describe("groupNodesByType", () => {
  it("should group nodes by their type", () => {
    const grouped = groupNodesByType(mockGraph.nodes);
    expect(grouped.continuous).toHaveLength(2);
    expect(grouped.categorical).toHaveLength(1);
    expect(grouped.binary).toHaveLength(1);
  });

  it("should handle empty array", () => {
    const grouped = groupNodesByType([]);
    expect(Object.keys(grouped)).toHaveLength(0);
  });
});

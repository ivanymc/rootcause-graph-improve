"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, BarChart3, Table2, Check, X, Loader2 } from "lucide-react";
import {
  useGraph,
  useValidateGraph,
  useAddNode,
  useUpdateNode,
  useDeleteNode,
  useAddEdge,
  useUpdateEdge,
  useDeleteEdge,
  useResetGraph,
} from "~/hooks/useGraphApi";
import { GraphVisualization } from "./GraphVisualization";
import type { SimulationResponse, Node, Edge, CreateNodeRequest, CreateEdgeRequest } from "~/lib/types";

type ViewMode = "graph" | "table";

interface GraphEditorProps {
  graphId: string | null;
  simulationResults: SimulationResponse | null;
}

export function GraphEditor({ graphId, simulationResults }: GraphEditorProps) {
  const { data: graph, isLoading } = useGraph(graphId);
  const { data: validation } = useValidateGraph(graphId);
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // CRUD mutations
  const addNode = useAddNode(graphId);
  const updateNode = useUpdateNode(graphId);
  const deleteNode = useDeleteNode(graphId);
  const addEdge = useAddEdge(graphId);
  const updateEdge = useUpdateEdge(graphId);
  const deleteEdge = useDeleteEdge(graphId);
  const resetGraph = useResetGraph(graphId);

  // Node editing state
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);

  // Edge editing state
  const [editingEdge, setEditingEdge] = useState<{ edge: Edge; index: number } | null>(null);
  const [showAddEdge, setShowAddEdge] = useState(false);

  if (!graphId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Select a graph from the sidebar to view it
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        Graph not found
      </div>
    );
  }

  // Get node name by id for edge display
  const getNodeName = (nodeId: string) => {
    const node = graph.nodes.find((n) => n.id === nodeId);
    return node?.name ?? nodeId;
  };

  // Build a map of simulation results for quick lookup
  const simulationMap = new Map<string, { original: number | string; simulated: number | string }>();
  if (simulationResults) {
    for (const result of simulationResults.results) {
      simulationMap.set(result.node_id, {
        original: result.original_value,
        simulated: result.simulated_value,
      });
    }
  }

  // Node CRUD handlers
  const handleAddNode = (data: CreateNodeRequest) => {
    if (!graphId) return;
    addNode.mutate(
      { graphId, data },
      { onSuccess: () => setShowAddNode(false) }
    );
  };

  const handleUpdateNode = (nodeId: string, data: CreateNodeRequest) => {
    if (!graphId) return;
    updateNode.mutate(
      { graphId, nodeId, data },
      { onSuccess: () => setEditingNode(null) }
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!graphId) return;
    if (confirm("Delete this node? This will also remove connected edges.")) {
      deleteNode.mutate({ graphId, nodeId });
    }
  };

  // Edge CRUD handlers
  const handleAddEdge = (data: CreateEdgeRequest) => {
    if (!graphId) return;
    addEdge.mutate(
      { graphId, data },
      { onSuccess: () => setShowAddEdge(false) }
    );
  };

  const handleUpdateEdge = (edgeIndex: number, data: CreateEdgeRequest) => {
    if (!graphId) return;
    updateEdge.mutate(
      { graphId, edgeIndex, data },
      { onSuccess: () => setEditingEdge(null) }
    );
  };

  const handleDeleteEdge = (edgeIndex: number) => {
    if (!graphId) return;
    if (confirm("Delete this edge?")) {
      deleteEdge.mutate({ graphId, edgeIndex });
    }
  };

  // Check if any mutation is pending
  const isMutating =
    addNode.isPending ||
    updateNode.isPending ||
    deleteNode.isPending ||
    addEdge.isPending ||
    updateEdge.isPending ||
    deleteEdge.isPending ||
    resetGraph.isPending;

  const handleResetGraph = () => {
    if (!graphId) return;
    if (confirm("Reset this graph to its default state? This will discard changes.")) {
      resetGraph.mutate({ id: graphId });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{graph.name}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetGraph}
            disabled={isMutating}
            className="rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            Reset Graph
          </button>
          {/* View Mode Toggle */}
          <div className="flex rounded bg-gray-800 p-1">
            <button
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === "graph"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Graph</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Table2 size={16} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {isMutating && (
            <span className="flex items-center gap-1.5 text-sm text-yellow-400">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          )}

          {validation && (
            <span
              className={`rounded px-2 py-1 text-sm ${
                validation.is_valid
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {validation.is_valid ? "Valid DAG" : "Invalid Graph"}
            </span>
          )}
          <span className="text-sm text-gray-400">
            {graph.nodes.length} nodes, {graph.edges.length} edges
          </span>
        </div>
      </div>

      {validation && !validation.is_valid && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-sm text-red-400">
          <strong>Validation errors:</strong>
          <ul className="mt-1 list-inside list-disc">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error display */}
      {(addNode.isError || updateNode.isError || deleteNode.isError ||
        addEdge.isError || updateEdge.isError || deleteEdge.isError) && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-sm text-red-400">
          <strong>Error:</strong>{" "}
          {addNode.error?.message ??
            updateNode.error?.message ??
            deleteNode.error?.message ??
            addEdge.error?.message ??
            updateEdge.error?.message ??
            deleteEdge.error?.message}
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "graph" ? (
        <div className="flex-1 rounded border border-gray-700 bg-gray-800/50" style={{ minHeight: "400px" }}>
          <GraphVisualization graph={graph} simulationResults={simulationResults} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Nodes Table */}
            <div className="flex flex-col rounded border border-gray-700 bg-gray-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-300">
                  Nodes ({graph.nodes.length})
                </h3>
                <button
                  onClick={() => setShowAddNode(true)}
                  disabled={isMutating}
                  className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Add Node</span>
                </button>
              </div>

              {/* Add Node Form */}
              {showAddNode && (
                <NodeForm
                  isLoading={addNode.isPending}
                  onSave={handleAddNode}
                  onCancel={() => setShowAddNode(false)}
                />
              )}

              {/* Edit Node Form */}
              {editingNode && (
                <NodeForm
                  node={editingNode}
                  isLoading={updateNode.isPending}
                  onSave={(data) => handleUpdateNode(editingNode.id, data)}
                  onCancel={() => setEditingNode(null)}
                />
              )}

              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="text-left text-gray-400">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Base Value</th>
                      <th className="pb-2 text-right">Simulated</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graph.nodes.map((node) => {
                      const simResult = simulationMap.get(node.id);
                      let deltaDisplay = null;

                      if (simResult && typeof simResult.original === "number" && typeof simResult.simulated === "number") {
                        const delta = simResult.simulated - simResult.original;
                        if (Math.abs(delta) > 0.0001) {
                          const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
                          const deltaColor = delta > 0 ? "text-green-400" : "text-red-400";
                          deltaDisplay = (
                            <span className={`ml-2 text-xs ${deltaColor}`}>
                              ({deltaStr})
                            </span>
                          );
                        }
                      }

                      return (
                        <tr key={node.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                          <td className="py-2" title={node.id}>
                            {node.name}
                          </td>
                          <td className="py-2 text-gray-500">{node.node_type}</td>
                          <td className="py-2 text-right text-gray-400">
                            {typeof node.base_value === "number"
                              ? node.base_value.toFixed(2)
                              : node.base_value}
                          </td>
                          <td className="py-2 text-right">
                            {simResult ? (
                              <span className={simResult && typeof simResult.original === "number" && typeof simResult.simulated === "number" && Math.abs(simResult.simulated - simResult.original) > 0.0001
                                ? (simResult.simulated - simResult.original > 0 ? "text-green-400" : "text-red-400")
                                : "text-gray-400"
                              }>
                                {typeof simResult.simulated === "number"
                                  ? simResult.simulated.toFixed(2)
                                  : simResult.simulated}
                                {deltaDisplay}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => setEditingNode(node)}
                              disabled={isMutating}
                              className="mr-2 rounded p-1.5 text-blue-400 hover:bg-blue-400/20 hover:text-blue-300 disabled:opacity-50"
                              title="Edit node"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              disabled={isMutating}
                              className="rounded p-1.5 text-red-400 hover:bg-red-400/20 hover:text-red-300 disabled:opacity-50"
                              title="Delete node"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edges Table */}
            <div className="flex flex-col rounded border border-gray-700 bg-gray-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-300">
                  Edges ({graph.edges.length})
                </h3>
                <button
                  onClick={() => setShowAddEdge(true)}
                  disabled={isMutating}
                  className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Add Edge</span>
                </button>
              </div>

              {/* Add Edge Form */}
              {showAddEdge && (
                <EdgeForm
                  nodes={graph.nodes}
                  isLoading={addEdge.isPending}
                  onSave={handleAddEdge}
                  onCancel={() => setShowAddEdge(false)}
                />
              )}

              {/* Edit Edge Form */}
              {editingEdge && (
                <EdgeForm
                  nodes={graph.nodes}
                  edge={editingEdge.edge}
                  isLoading={updateEdge.isPending}
                  onSave={(data) => handleUpdateEdge(editingEdge.index, data)}
                  onCancel={() => setEditingEdge(null)}
                />
              )}

              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="text-left text-gray-400">
                      <th className="pb-2">Source</th>
                      <th className="pb-2">Target</th>
                      <th className="pb-2 text-right">Weight</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graph.edges.map((edge, i) => (
                      <tr key={i} className="border-t border-gray-700 hover:bg-gray-700/50">
                        <td className="py-2">
                          <span className="text-blue-400">{getNodeName(edge.source_id)}</span>
                        </td>
                        <td className="py-2">
                          <span className="text-green-400">{getNodeName(edge.target_id)}</span>
                        </td>
                        <td className="py-2 text-right text-gray-400">
                          {edge.weight.toFixed(4)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => setEditingEdge({ edge, index: i })}
                            disabled={isMutating}
                            className="mr-2 rounded p-1.5 text-blue-400 hover:bg-blue-400/20 hover:text-blue-300 disabled:opacity-50"
                            title="Edit edge"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEdge(i)}
                            disabled={isMutating}
                            className="rounded p-1.5 text-red-400 hover:bg-red-400/20 hover:text-red-300 disabled:opacity-50"
                            title="Delete edge"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Node Form Component
interface NodeFormProps {
  node?: Node;
  isLoading?: boolean;
  onSave: (data: CreateNodeRequest) => void;
  onCancel: () => void;
}

function NodeForm({ node, isLoading, onSave, onCancel }: NodeFormProps) {
  const [name, setName] = useState(node?.name ?? "");
  const [nodeType, setNodeType] = useState<Node["node_type"]>(node?.node_type ?? "continuous");
  const [baseValue, setBaseValue] = useState(
    node?.base_value !== undefined ? String(node.base_value) : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseFloat(baseValue);
    onSave({
      name,
      node_type: nodeType,
      base_value: isNaN(parsedValue) ? baseValue : parsedValue,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded bg-gray-700 p-3 space-y-2">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {node ? "Edit Node" : "Add New Node"}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Node name"
        className="w-full rounded bg-gray-800 p-2 text-sm"
        required
        disabled={isLoading}
      />
      <select
        value={nodeType}
        onChange={(e) => setNodeType(e.target.value as Node["node_type"])}
        className="w-full rounded bg-gray-800 p-2 text-sm"
        disabled={isLoading}
      >
        <option value="continuous">Continuous</option>
        <option value="categorical">Categorical</option>
        <option value="binary">Binary</option>
      </select>
      <input
        type="text"
        value={baseValue}
        onChange={(e) => setBaseValue(e.target.value)}
        placeholder="Base value"
        className="w-full rounded bg-gray-800 p-2 text-sm"
        required
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-green-600 py-1.5 text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {isLoading ? "Saving..." : node ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-gray-600 py-1.5 text-sm hover:bg-gray-500 disabled:opacity-50"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );
}

// Edge Form Component
interface EdgeFormProps {
  nodes: Node[];
  edge?: Edge;
  isLoading?: boolean;
  onSave: (data: CreateEdgeRequest) => void;
  onCancel: () => void;
}

function EdgeForm({ nodes, edge, isLoading, onSave, onCancel }: EdgeFormProps) {
  const [sourceId, setSourceId] = useState(edge?.source_id ?? "");
  const [targetId, setTargetId] = useState(edge?.target_id ?? "");
  const [weight, setWeight] = useState(edge?.weight !== undefined ? String(edge.weight) : "1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight)) return;

    onSave({
      source_id: sourceId,
      target_id: targetId,
      weight: parsedWeight,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded bg-gray-700 p-3 space-y-2">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {edge ? "Edit Edge" : "Add New Edge"}
      </div>
      <select
        value={sourceId}
        onChange={(e) => setSourceId(e.target.value)}
        className="w-full rounded bg-gray-800 p-2 text-sm"
        required
        disabled={isLoading}
      >
        <option value="">Select source node...</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="w-full rounded bg-gray-800 p-2 text-sm"
        required
        disabled={isLoading}
      >
        <option value="">Select target node...</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="any"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Weight"
        className="w-full rounded bg-gray-800 p-2 text-sm"
        required
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!sourceId || !targetId || sourceId === targetId || isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-green-600 py-1.5 text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {isLoading ? "Saving..." : edge ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-gray-600 py-1.5 text-sm hover:bg-gray-500 disabled:opacity-50"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );
}

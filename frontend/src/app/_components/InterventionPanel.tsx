"use client";

import { useEffect, useState, useRef } from "react";
import { useGraph, useSimulation } from "~/hooks/useGraphApi";
import { createIntervention } from "~/lib/intervention";
import type { Intervention, SimulationResponse } from "~/lib/types";

interface InterventionPanelProps {
  graphId: string | null;
  onSimulationComplete: (results: SimulationResponse) => void;
  onClearSimulation: () => void;
}

export function InterventionPanel({
  graphId,
  onSimulationComplete,
  onClearSimulation,
}: InterventionPanelProps) {
  const { data: graph } = useGraph(graphId);
  const simulation = useSimulation(graphId);

  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [forcedValue, setForcedValue] = useState<string>("");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const forcedValueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInterventions([]);
    setSelectedNodeId("");
    setForcedValue("");
  }, [graphId]);


  const handleAddIntervention = () => {
    const newIntervention = createIntervention(selectedNodeId, forcedValue);
    if (!newIntervention) return;

    // Check if this node already has an intervention
    if (interventions.some((i) => i.node_id === selectedNodeId)) {
      // Update existing intervention
      setInterventions(
        interventions.map((i) =>
          i.node_id === selectedNodeId ? newIntervention : i
        )
      );
    } else {
      // Add new intervention
      setInterventions([...interventions, newIntervention]);
    }

    setSelectedNodeId("");
    setForcedValue("");
  };

  const handleRemoveIntervention = (nodeId: string) => {
    const remaining = interventions.filter((i) => i.node_id !== nodeId);
    setInterventions(remaining);
    if (remaining.length === 0) {
      onClearSimulation();
    }
  };

  const handleClearAll = () => {
    setInterventions([]);
    onClearSimulation();
  };

  const handleRunSimulation = async () => {
    if (interventions.length === 0 || !graphId) return;

    try {
      const result = await simulation.mutateAsync({ graphId, interventions });
      onSimulationComplete(result);
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  if (!graphId || !graph) {
    return (
      <div className="text-gray-500">
        Select a graph to configure interventions
      </div>
    );
  }

  // Get node name for display
  const getNodeName = (nodeId: string) => {
    const node = graph.nodes.find((n) => n.id === nodeId);
    return node?.name ?? nodeId;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">What-If Interventions</h3>

      {/* Add intervention form */}
      <div className="space-y-2">
        <select
          value={selectedNodeId}
          onChange={(e) => {
            setSelectedNodeId(e.target.value);
            // Auto-focus the value input when a node is selected
            if (e.target.value) {
              setTimeout(() => forcedValueInputRef.current?.focus(), 0);
            }
          }}
          className="w-full rounded bg-gray-800 p-2 text-sm"
        >
          <option value="">Select a node...</option>
          {graph.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>

        <input
          ref={forcedValueInputRef}
          type="text"
          value={forcedValue}
          onChange={(e) => setForcedValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && selectedNodeId && forcedValue) {
              e.preventDefault();
              handleAddIntervention();
            }
          }}
          placeholder="Forced value (press Enter to add)"
          className="w-full rounded bg-gray-800 p-2 text-sm"
          step="any"
        />

        <button
          onClick={handleAddIntervention}
          disabled={!selectedNodeId || !forcedValue}
          className="w-full rounded bg-blue-600 py-2 text-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Intervention
        </button>
      </div>

      {/* Current interventions list */}
      {interventions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {interventions.length} intervention
              {interventions.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-1 rounded bg-gray-800 p-2">
            {interventions.map((intervention) => (
              <li
                key={intervention.node_id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  <span className="text-blue-400">
                    {getNodeName(intervention.node_id)}
                  </span>
                  <span className="mx-2 text-gray-500">=</span>
                  <span className="text-green-400">
                    {typeof intervention.forced_value === "number"
                      ? intervention.forced_value.toFixed(2)
                      : intervention.forced_value}
                  </span>
                </span>
                <button
                  onClick={() =>
                    handleRemoveIntervention(intervention.node_id)
                  }
                  className="text-gray-500 hover:text-red-400"
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Run simulation button */}
      <button
        onClick={handleRunSimulation}
        disabled={interventions.length === 0 || simulation.isPending}
        className="w-full rounded bg-green-600 py-2 font-medium hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {simulation.isPending ? "Running Simulation..." : "Run Simulation"}
      </button>

      {simulation.isError && (
        <div className="rounded bg-red-900/20 p-2 text-sm text-red-400">
          Error: {simulation.error.message}
        </div>
      )}
    </div>
  );
}

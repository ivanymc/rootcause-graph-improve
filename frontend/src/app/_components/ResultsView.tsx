"use client";

import type { SimulationResponse } from "~/lib/types";
import { useGraph } from "~/hooks/useGraphApi";

interface ResultsViewProps {
  results: SimulationResponse | null;
  graphId: string | null;
}

export function ResultsView({ results, graphId }: ResultsViewProps) {
  const { data: graph } = useGraph(graphId);

  if (!results) {
    return null;
  }

  // Get node name for display
  const getNodeName = (nodeId: string) => {
    if (!graph) return nodeId;
    const node = graph.nodes.find((n) => n.id === nodeId);
    return node?.name ?? nodeId;
  };

  // Calculate changes and sort by magnitude
  const sortedResults = [...results.results]
    .map((r) => {
      const original =
        typeof r.original_value === "number" ? r.original_value : 0;
      const simulated =
        typeof r.simulated_value === "number" ? r.simulated_value : 0;
      const change = simulated - original;
      const percentChange =
        original !== 0 ? ((change / Math.abs(original)) * 100) : 0;
      return { ...r, change, percentChange };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Only show results that changed
  const changedResults = sortedResults.filter(
    (r) => Math.abs(r.change) > 0.0001
  );

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Simulation Results</h3>
        <span className="text-sm text-gray-400">
          {results.computation_time_ms.toFixed(2)} ms
        </span>
      </div>

      {changedResults.length === 0 ? (
        <div className="rounded bg-gray-800 p-3 text-sm text-gray-400">
          No values changed from the intervention.
        </div>
      ) : (
        <div className="max-h-64 overflow-auto rounded bg-gray-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-left text-gray-400">
                <th className="p-2">Node</th>
                <th className="p-2 text-right">Original</th>
                <th className="p-2 text-right">New</th>
                <th className="p-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {changedResults.slice(0, 100).map((r) => {
                const changeClass =
                  r.change > 0
                    ? "text-green-400"
                    : r.change < 0
                    ? "text-red-400"
                    : "text-gray-500";

                return (
                  <tr
                    key={r.node_id}
                    className="border-t border-gray-700"
                  >
                    <td className="p-2" title={r.node_id}>
                      {getNodeName(r.node_id)}
                    </td>
                    <td className="p-2 text-right text-gray-400">
                      {typeof r.original_value === "number"
                        ? r.original_value.toFixed(2)
                        : r.original_value}
                    </td>
                    <td className="p-2 text-right">
                      {typeof r.simulated_value === "number"
                        ? r.simulated_value.toFixed(2)
                        : r.simulated_value}
                    </td>
                    <td className={`p-2 text-right ${changeClass}`}>
                      {r.change > 0 ? "+" : ""}
                      {r.change.toFixed(2)}
                      {r.percentChange !== 0 && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({r.percentChange > 0 ? "+" : ""}
                          {r.percentChange.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {changedResults.length > 100 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-2 text-center text-gray-500"
                  >
                    ... and {changedResults.length - 100} more changes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Showing {Math.min(changedResults.length, 100)} of{" "}
        {changedResults.length} changed nodes (
        {results.results.length} total)
      </div>
    </div>
  );
}

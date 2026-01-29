"use client";

import type { CausalGraph } from "~/lib/types";

interface GraphListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  graphs?: CausalGraph[];
  isLoading?: boolean;
  error?: { message: string } | null;
}

export function GraphList({ selectedId, onSelect, graphs, isLoading, error }: GraphListProps) {
  if (error) {
    return (
      <div className="text-red-400">
        Error loading graphs: {error.message}
      </div>
    );
  }

  if (isLoading && (!graphs || graphs.length === 0)) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded bg-gray-800/70 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!graphs || graphs.length === 0) {
    return <div className="text-gray-400">No graphs available</div>;
  }

  return (
    <ul className="space-y-2">
      {graphs.map((graph) => (
        <li key={graph.id}>
          <button
            onClick={() => onSelect(graph.id)}
            className={`w-full rounded px-3 py-2 text-left transition ${
              selectedId === graph.id
                ? "bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            <div className="font-medium">{graph.name}</div>
            <div className="text-sm text-gray-400">
              {graph.nodes.length} nodes, {graph.edges.length} edges
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

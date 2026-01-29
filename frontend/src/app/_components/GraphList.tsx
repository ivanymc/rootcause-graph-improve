"use client";

import { Loader2 } from "lucide-react";
import { useGraphs } from "~/hooks/useGraphApi";

interface GraphListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function GraphList({ selectedId, onSelect }: GraphListProps) {
  const { data: graphs, isLoading, error } = useGraphs();

  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (error) {
    return (
      <div className="text-red-400">
        Error loading graphs: {error.message}
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

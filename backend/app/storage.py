import json
from pathlib import Path
from typing import Optional

from app.models import CausalGraph, Node, Edge, NodeType


class GraphStorage:
    def __init__(self):
        self._graphs: dict[str, CausalGraph] = {}
        self._default_graphs: dict[str, dict] = {}
        self._load_sample_graphs()

    def _load_sample_graphs(self):
        """Load sample graphs from JSON files on startup"""
        sample_dir = Path(__file__).parent / "sample_graphs"
        if sample_dir.exists():
            for json_file in sample_dir.glob("*.json"):
                try:
                    with open(json_file, "r") as f:
                        data = json.load(f)
                    graph = self._parse_graph(data)
                    self._graphs[graph.id] = graph
                    self._default_graphs[graph.id] = data
                    print(f"Loaded graph: {graph.name} ({len(graph.nodes)} nodes)")
                except Exception as e:
                    print(f"Failed to load {json_file}: {e}")

    def _parse_graph(self, data: dict) -> CausalGraph:
        nodes = [
            Node(
                id=n["id"],
                name=n["name"],
                node_type=NodeType(n["node_type"]),
                base_value=n["base_value"],
                possible_values=n.get("possible_values"),
            )
            for n in data["nodes"]
        ]
        edges = [
            Edge(
                source_id=e["source_id"],
                target_id=e["target_id"],
                weight=e["weight"],
            )
            for e in data["edges"]
        ]
        return CausalGraph(
            id=data["id"],
            name=data["name"],
            nodes=nodes,
            edges=edges,
        )

    def list_graphs(self) -> list[CausalGraph]:
        return sorted(self._graphs.values(), key=lambda g: len(g.nodes))


    def get_graph(self, graph_id: str) -> Optional[CausalGraph]:
        return self._graphs.get(graph_id)

    def create_graph(self, graph: CausalGraph) -> CausalGraph:
        self._graphs[graph.id] = graph
        return graph

    def delete_graph(self, graph_id: str) -> bool:
        if graph_id in self._graphs:
            del self._graphs[graph_id]
            return True
        return False

    def update_graph(self, graph: CausalGraph) -> CausalGraph:
        """Update an existing graph in storage."""
        self._graphs[graph.id] = graph
        return graph

    def reset_all_graphs(self) -> list[CausalGraph]:
        """Reset all graphs to their original sample definitions."""
        self._graphs = {}
        for graph_id, data in self._default_graphs.items():
            graph = self._parse_graph(data)
            self._graphs[graph_id] = graph
        return list(self._graphs.values())

    def reset_graph(self, graph_id: str) -> Optional[CausalGraph]:
        """Reset a single graph to its original sample definition."""
        data = self._default_graphs.get(graph_id)
        if not data:
            return None
        graph = self._parse_graph(data)
        self._graphs[graph_id] = graph
        return graph

    # Node CRUD operations
    def add_node(self, graph_id: str, node: Node) -> Optional[CausalGraph]:
        """Add a node to a graph."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        # Check for duplicate node ID
        if any(n.id == node.id for n in graph.nodes):
            return None
        graph.nodes.append(node)
        return graph

    def update_node(self, graph_id: str, node_id: str, updates: dict) -> Optional[CausalGraph]:
        """Update a node in a graph."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        for i, node in enumerate(graph.nodes):
            if node.id == node_id:
                # Apply updates
                node_dict = node.model_dump()
                for key, value in updates.items():
                    if value is not None:
                        node_dict[key] = value
                graph.nodes[i] = Node(**node_dict)
                return graph
        return None

    def delete_node(self, graph_id: str, node_id: str) -> Optional[CausalGraph]:
        """Delete a node from a graph (also removes connected edges)."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        # Remove the node
        original_count = len(graph.nodes)
        graph.nodes = [n for n in graph.nodes if n.id != node_id]
        if len(graph.nodes) == original_count:
            return None  # Node not found
        # Remove edges connected to this node
        graph.edges = [e for e in graph.edges if e.source_id != node_id and e.target_id != node_id]
        return graph

    # Edge CRUD operations
    def add_edge(self, graph_id: str, edge: Edge) -> Optional[CausalGraph]:
        """Add an edge to a graph."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        # Validate that source and target nodes exist
        node_ids = {n.id for n in graph.nodes}
        if edge.source_id not in node_ids or edge.target_id not in node_ids:
            return None
        # Check for duplicate edge
        if any(e.source_id == edge.source_id and e.target_id == edge.target_id for e in graph.edges):
            return None
        graph.edges.append(edge)
        return graph

    def update_edge(self, graph_id: str, edge_index: int, updates: dict) -> Optional[CausalGraph]:
        """Update an edge in a graph by index."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        if edge_index < 0 or edge_index >= len(graph.edges):
            return None
        edge = graph.edges[edge_index]
        edge_dict = edge.model_dump()
        for key, value in updates.items():
            if value is not None:
                edge_dict[key] = value
        # Validate that source and target nodes exist if they're being updated
        node_ids = {n.id for n in graph.nodes}
        if edge_dict["source_id"] not in node_ids or edge_dict["target_id"] not in node_ids:
            return None
        graph.edges[edge_index] = Edge(**edge_dict)
        return graph

    def delete_edge(self, graph_id: str, edge_index: int) -> Optional[CausalGraph]:
        """Delete an edge from a graph by index."""
        graph = self.get_graph(graph_id)
        if not graph:
            return None
        if edge_index < 0 or edge_index >= len(graph.edges):
            return None
        graph.edges.pop(edge_index)
        return graph


# Singleton instance
storage = GraphStorage()

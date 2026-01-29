from app.models import CausalGraph, ValidationResult


def validate_graph(graph: CausalGraph) -> ValidationResult:
    errors: list[str] = []
    node_ids = {node.id for node in graph.nodes}

    # Check 1: All edge references point to existing nodes
    for edge in graph.edges:
        if edge.source_id not in node_ids:
            errors.append(f"Edge source '{edge.source_id}' not found in nodes")
        if edge.target_id not in node_ids:
            errors.append(f"Edge target '{edge.target_id}' not found in nodes")

    # Check 2: No self-loops
    for edge in graph.edges:
        if edge.source_id == edge.target_id:
            errors.append(f"Self-loop detected on node '{edge.source_id}'")

    # Check 3: Cycle detection using DFS
    cycle_errors = _detect_cycles(graph, node_ids)
    errors.extend(cycle_errors)

    return ValidationResult(is_valid=len(errors) == 0, errors=errors)


def _detect_cycles(graph: CausalGraph, node_ids: set[str]) -> list[str]:
    # Build adjacency list: source -> [targets]
    adjacency: dict[str, list[str]] = {nid: [] for nid in node_ids}
    for edge in graph.edges:
        if edge.source_id in adjacency:
            adjacency[edge.source_id].append(edge.target_id)

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {nid: WHITE for nid in node_ids}
    errors: list[str] = []

    def dfs(node: str, path: list[str]) -> bool:
        """Returns True if a cycle is found starting from this node."""
        color[node] = GRAY
        path.append(node)

        for neighbor in adjacency.get(node, []):
            if color.get(neighbor) == GRAY:
                # Found a back edge - this is a cycle
                cycle_start = path.index(neighbor)
                cycle_path = path[cycle_start:] + [neighbor]
                errors.append(f"Cycle detected: {' -> '.join(cycle_path)}")
                return True
            elif color.get(neighbor) == WHITE:
                if dfs(neighbor, path):
                    return True

        path.pop()
        color[node] = BLACK
        return False

    # Run DFS from all unvisited nodes
    for node in node_ids:
        if color[node] == WHITE:
            dfs(node, [])

    return errors

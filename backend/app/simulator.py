import time
from typing import Union

from app.models import CausalGraph, Intervention, SimulationResult, SimulationResponse


def simulate(graph: CausalGraph, interventions: list[Intervention]) -> SimulationResponse:
    start_time = time.time()

    # Initialize all nodes with base values
    current_values: dict[str, Union[float, str]] = {}
    original_values: dict[str, Union[float, str]] = {}

    for node in graph.nodes:
        current_values[node.id] = node.base_value
        original_values[node.id] = node.base_value

    # Apply interventions (force values)
    intervention_map = {i.node_id: i.forced_value for i in interventions}
    for node_id, value in intervention_map.items():
        current_values[node_id] = value

    max_iterations = 1000
    epsilon = 0.0001

    # Build adjacency list once (not inside loop)
    adjacency = _build_adjacency(graph)

    for iteration in range(max_iterations):
        prev_values = current_values.copy()
        changed = False

        for node in graph.nodes:
            if node.id in intervention_map:
                continue

            if node.node_type != "continuous":
                continue

            # Get incoming edges for this node
            incoming = adjacency.get(node.id, [])
            if not incoming:
                continue

            # Calculate influence based on DELTA from original values
            # This correctly propagates changes through the causal graph
            total_influence = 0.0
            for source_id, weight in incoming:
                parent_value = current_values[source_id]
                parent_original = original_values[source_id]
                if isinstance(parent_value, (int, float)) and isinstance(parent_original, (int, float)):
                    parent_delta = parent_value - parent_original
                    total_influence = total_influence + (parent_delta * weight)

            new_value = node.base_value + total_influence

            # Check if value changed significantly
            if isinstance(prev_values[node.id], (int, float)):
                if abs(new_value - prev_values[node.id]) > epsilon:
                    changed = True

            current_values[node.id] = new_value

        # If nothing changed, we've converged
        if not changed:
            break

    # Build response
    end_time = time.time()
    computation_time_ms = (end_time - start_time) * 1000

    results = []
    for node in graph.nodes:
        results.append(
            SimulationResult(
                node_id=node.id,
                original_value=original_values[node.id],
                simulated_value=current_values[node.id],
            )
        )

    return SimulationResponse(results=results, computation_time_ms=computation_time_ms)


def _build_adjacency(graph: CausalGraph) -> dict[str, list[tuple[str, float]]]:
    adjacency: dict[str, list[tuple[str, float]]] = {}
    for edge in graph.edges:
        if edge.target_id not in adjacency:
            adjacency[edge.target_id] = []
        adjacency[edge.target_id].append((edge.source_id, edge.weight))
    return adjacency

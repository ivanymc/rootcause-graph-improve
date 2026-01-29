"""
Script to generate a large causal graph for performance testing.
Generates 2000 nodes with ~5000 edges.
"""

import json
import random
from pathlib import Path

random.seed(42)  # For reproducibility

NUM_NODES = 2000
NUM_EDGES = 5000
MAX_DEPTH = 15

def generate_large_graph():
    nodes = []
    edges = []

    # Create nodes in layers to ensure DAG structure
    # Layer 0: Root causes (no incoming edges)
    # Subsequent layers depend on previous layers

    layer_sizes = []
    remaining = NUM_NODES
    layer = 0

    # Distribute nodes across layers (pyramid shape)
    while remaining > 0:
        if layer < 5:
            size = min(50 + layer * 30, remaining)
        elif layer < 10:
            size = min(200 + (layer - 5) * 50, remaining)
        else:
            size = min(300, remaining)

        layer_sizes.append(size)
        remaining -= size
        layer += 1

        if layer > MAX_DEPTH:
            layer_sizes[-1] += remaining
            break

    # Generate nodes by layer
    node_layers = []
    node_idx = 0

    for layer_num, size in enumerate(layer_sizes):
        layer_nodes = []
        for i in range(size):
            node_id = f"node_{node_idx:04d}"

            # Vary the node names by layer
            if layer_num == 0:
                name = f"Root Cause {i + 1}"
            elif layer_num < 3:
                name = f"Input Factor {node_idx}"
            elif layer_num < 6:
                name = f"Intermediate {node_idx}"
            elif layer_num < 10:
                name = f"Processing {node_idx}"
            else:
                name = f"Output {node_idx}"

            nodes.append({
                "id": node_id,
                "name": name,
                "node_type": "continuous",
                "base_value": round(random.uniform(1, 1000), 2)
            })

            layer_nodes.append(node_id)
            node_idx += 1

        node_layers.append(layer_nodes)

    # Generate edges (only from earlier layers to later layers - ensures DAG)
    edges_created = 0

    for target_layer in range(1, len(node_layers)):
        target_nodes = node_layers[target_layer]

        # Each node can have edges from any previous layer
        for target_id in target_nodes:
            # Determine how many incoming edges (1-5 typically)
            num_incoming = random.randint(1, min(5, edges_created < NUM_EDGES))

            # Pick source layers (prefer closer layers)
            for _ in range(num_incoming):
                if edges_created >= NUM_EDGES:
                    break

                # Weighted selection: prefer closer layers
                source_layer = random.choices(
                    range(target_layer),
                    weights=[2 ** (target_layer - l) for l in range(target_layer)]
                )[0]

                source_id = random.choice(node_layers[source_layer])

                # Random weight between -1 and 1
                weight = round(random.uniform(-0.5, 0.5), 4)
                if weight == 0:
                    weight = 0.1

                edges.append({
                    "source_id": source_id,
                    "target_id": target_id,
                    "weight": weight
                })
                edges_created += 1

    # Add more edges if needed to reach target
    while edges_created < NUM_EDGES:
        target_layer = random.randint(1, len(node_layers) - 1)
        source_layer = random.randint(0, target_layer - 1)

        source_id = random.choice(node_layers[source_layer])
        target_id = random.choice(node_layers[target_layer])

        weight = round(random.uniform(-0.5, 0.5), 4)
        if weight == 0:
            weight = 0.1

        edges.append({
            "source_id": source_id,
            "target_id": target_id,
            "weight": weight
        })
        edges_created += 1

    graph = {
        "id": "large-performance-test",
        "name": "Large Performance Test Graph",
        "nodes": nodes,
        "edges": edges
    }

    return graph


if __name__ == "__main__":
    graph = generate_large_graph()

    output_path = Path(__file__).parent / "large.json"
    with open(output_path, "w") as f:
        json.dump(graph, f)

    print(f"Generated graph with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")
    print(f"Saved to {output_path}")

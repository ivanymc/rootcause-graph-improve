import os
import uuid

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    CausalGraph,
    CreateGraphRequest,
    SimulationRequest,
    SimulationResponse,
    ValidationResult,
    Node,
    Edge,
    CreateNodeRequest,
    UpdateNodeRequest,
    CreateEdgeRequest,
    UpdateEdgeRequest,
)
from app.storage import storage
from app.simulator import simulate
from app.graph import validate_graph


app = FastAPI(
    title="CausalSim API",
    description="A simple causal graph simulator for what-if analysis",
    version="1.0.0",
)

# CORS middleware for frontend
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "CausalSim API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/graphs", response_model=list[CausalGraph])
async def list_graphs():
    """List all available causal graphs."""
    return storage.list_graphs()


@app.get("/graphs/{graph_id}", response_model=CausalGraph)
async def get_graph(graph_id: str):
    """Get a specific graph by ID."""
    graph = storage.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
    return graph


@app.post("/graphs", response_model=CausalGraph)
async def create_graph(request: CreateGraphRequest):
    """Create a new causal graph."""
    graph = CausalGraph(
        id=str(uuid.uuid4()),
        name=request.name,
        nodes=request.nodes,
        edges=request.edges,
    )
    return storage.create_graph(graph)


@app.delete("/graphs/{graph_id}")
async def delete_graph(graph_id: str):
    """Delete a graph by ID."""
    if not storage.delete_graph(graph_id):
        raise HTTPException(status_code=404, detail="Graph not found")
    return {"deleted": True}


@app.post("/graphs/{graph_id}/simulate", response_model=SimulationResponse)
async def run_simulation(graph_id: str, request: SimulationRequest):
    graph = storage.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")

    # Validate that intervention node IDs exist in the graph
    node_ids = {node.id for node in graph.nodes}
    for intervention in request.interventions:
        if intervention.node_id not in node_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Intervention node '{intervention.node_id}' not found in graph",
            )

    return simulate(graph, request.interventions)


@app.post("/graphs/reset", response_model=list[CausalGraph])
async def reset_all_graphs():
    """Reset all graphs to their default sample data."""
    return storage.reset_all_graphs()


@app.post("/graphs/{graph_id}/reset", response_model=CausalGraph)
async def reset_graph(graph_id: str):
    """Reset a specific graph to its default sample data."""
    graph = storage.reset_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found or not resettable")
    return graph


@app.get("/graphs/{graph_id}/validate", response_model=ValidationResult)
async def validate_graph_endpoint(graph_id: str):
    graph = storage.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
    return validate_graph(graph)


# ============ Node CRUD Endpoints ============

@app.post("/graphs/{graph_id}/nodes", response_model=CausalGraph)
async def add_node(graph_id: str, request: CreateNodeRequest):
    """Add a new node to a graph."""
    # Generate a unique ID for the node
    node_id = f"node_{uuid.uuid4().hex[:8]}"
    node = Node(
        id=node_id,
        name=request.name,
        node_type=request.node_type,
        base_value=request.base_value,
        possible_values=request.possible_values,
    )
    result = storage.add_node(graph_id, node)
    if not result:
        raise HTTPException(status_code=404, detail="Graph not found or node ID already exists")
    return result


@app.put("/graphs/{graph_id}/nodes/{node_id}", response_model=CausalGraph)
async def update_node(graph_id: str, node_id: str, request: UpdateNodeRequest):
    """Update an existing node in a graph."""
    updates = request.model_dump(exclude_unset=True)
    result = storage.update_node(graph_id, node_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Graph or node not found")
    return result


@app.delete("/graphs/{graph_id}/nodes/{node_id}", response_model=CausalGraph)
async def delete_node(graph_id: str, node_id: str):
    """Delete a node from a graph (also removes connected edges)."""
    result = storage.delete_node(graph_id, node_id)
    if not result:
        raise HTTPException(status_code=404, detail="Graph or node not found")
    return result


# ============ Edge CRUD Endpoints ============

@app.post("/graphs/{graph_id}/edges", response_model=CausalGraph)
async def add_edge(graph_id: str, request: CreateEdgeRequest):
    """Add a new edge to a graph."""
    edge = Edge(
        source_id=request.source_id,
        target_id=request.target_id,
        weight=request.weight,
    )
    result = storage.add_edge(graph_id, edge)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Graph not found, invalid node IDs, or duplicate edge"
        )
    return result


@app.put("/graphs/{graph_id}/edges/{edge_index}", response_model=CausalGraph)
async def update_edge(graph_id: str, edge_index: int, request: UpdateEdgeRequest):
    """Update an existing edge in a graph by index."""
    updates = request.model_dump(exclude_unset=True)
    result = storage.update_edge(graph_id, edge_index, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Graph or edge not found, or invalid node IDs")
    return result


@app.delete("/graphs/{graph_id}/edges/{edge_index}", response_model=CausalGraph)
async def delete_edge(graph_id: str, edge_index: int):
    """Delete an edge from a graph by index."""
    result = storage.delete_edge(graph_id, edge_index)
    if not result:
        raise HTTPException(status_code=404, detail="Graph or edge not found")
    return result


def dev():
    uvicorn.run("app.main:app", reload=True)

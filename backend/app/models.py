from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel


class NodeType(str, Enum):
    CONTINUOUS = "continuous"
    CATEGORICAL = "categorical"
    BINARY = "binary"


class Node(BaseModel):
    id: str
    name: str
    node_type: NodeType
    base_value: Union[float, str]
    possible_values: Optional[list[str]] = None  # Only for categorical


class Edge(BaseModel):
    source_id: str
    target_id: str
    weight: float


class CausalGraph(BaseModel):
    id: str
    name: str
    nodes: list[Node]
    edges: list[Edge]


class CreateGraphRequest(BaseModel):
    name: str
    nodes: list[Node]
    edges: list[Edge]


class Intervention(BaseModel):
    node_id: str
    forced_value: Union[float, str]


class SimulationRequest(BaseModel):
    interventions: list[Intervention]


class SimulationResult(BaseModel):
    node_id: str
    original_value: Union[float, str]
    simulated_value: Union[float, str]


class SimulationResponse(BaseModel):
    results: list[SimulationResult]
    computation_time_ms: float


class ValidationResult(BaseModel):
    is_valid: bool
    errors: list[str]


# Request models for CRUD operations
class CreateNodeRequest(BaseModel):
    name: str
    node_type: NodeType
    base_value: Union[float, str]
    possible_values: Optional[list[str]] = None


class UpdateNodeRequest(BaseModel):
    name: Optional[str] = None
    node_type: Optional[NodeType] = None
    base_value: Optional[Union[float, str]] = None
    possible_values: Optional[list[str]] = None


class CreateEdgeRequest(BaseModel):
    source_id: str
    target_id: str
    weight: float


class UpdateEdgeRequest(BaseModel):
    source_id: Optional[str] = None
    target_id: Optional[str] = None
    weight: Optional[float] = None

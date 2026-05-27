from pydantic import BaseModel, Field
from typing import Optional

class Node(BaseModel):
    id: str
    label: str
    x: float
    y: float
    vx: float
    vy: float
    color: str
    size: int
    content: str
    category: str
    isHub: bool
    seed: float
    createdStep: int

class Link(BaseModel):
    source: str
    target: str
    strength: float

class Category(BaseModel):
    id: str
    name: str
    color: str
    icon: str

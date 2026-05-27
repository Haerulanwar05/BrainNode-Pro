from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from models import Node, Link, Category
from typing import List, Dict, Any
from mock_data import MOCK_NODES, MOCK_LINKS, MOCK_CATEGORIES
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="BrainNode Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_db()

# In-memory mutable state for mock mode
in_memory_nodes = [n.copy() for n in MOCK_NODES]
in_memory_links = [l.copy() for l in MOCK_LINKS]
in_memory_categories = [c.copy() for c in MOCK_CATEGORIES]

@app.get("/")
def read_root():
    return {"message": "Welcome to BrainNode Pro Backend", "db_status": "connected" if db else "mock"}

@app.get("/nodes", response_model=List[Node])
def get_nodes():
    if not db:
        return [Node(**data) for data in in_memory_nodes]
    try:
        docs = db.collection('nodes').stream()
        return [Node(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Node(**data) for data in in_memory_nodes]

@app.post("/nodes")
def create_node(node: Node):
    if not db:
        in_memory_nodes.append(node.dict())
        return {"status": "success", "mode": "mock"}
    try:
        db.collection('nodes').document(node.id).set(node.dict())
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        in_memory_nodes.append(node.dict())
        return {"status": "success", "mode": "mock"}

@app.delete("/nodes/{node_id}")
def delete_node(node_id: str):
    if not db:
        global in_memory_nodes, in_memory_links
        in_memory_nodes = [n for n in in_memory_nodes if n["id"] != node_id]
        in_memory_links = [l for l in in_memory_links if l["source"] != node_id and l["target"] != node_id]
        return {"status": "success", "mode": "mock"}
    try:
        db.collection('nodes').document(node_id).delete()
        # Also delete associated links
        links_ref = db.collection('links')
        for doc in links_ref.where('source', '==', node_id).stream():
            doc.reference.delete()
        for doc in links_ref.where('target', '==', node_id).stream():
            doc.reference.delete()
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"status": "error", "message": str(e)}

@app.put("/nodes/{node_id}")
def update_node(node_id: str, updates: Dict[str, Any]):
    if not db:
        for n in in_memory_nodes:
            if n["id"] == node_id:
                n.update(updates)
        return {"status": "success", "mode": "mock"}
    try:
        db.collection('nodes').document(node_id).update(updates)
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/links", response_model=List[Link])
def get_links():
    if not db:
        return [Link(**data) for data in in_memory_links]
    try:
        docs = db.collection('links').stream()
        return [Link(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Link(**data) for data in in_memory_links]

@app.post("/links")
def create_link(link: Link):
    if not db:
        in_memory_links.append(link.dict())
        return {"status": "success", "mode": "mock"}
    try:
        link_id = f"{link.source}_{link.target}"
        db.collection('links').document(link_id).set(link.dict())
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        in_memory_links.append(link.dict())
        return {"status": "success", "mode": "mock"}
@app.get("/categories", response_model=List[Category])
def get_categories():
    if not db:
        return [Category(**data) for data in in_memory_categories]
    try:
        docs = db.collection('categories').stream()
        return [Category(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Category(**data) for data in in_memory_categories]

@app.post("/categories")
def create_category(category: Category):
    if not db:
        # Prevent duplicates if it already exists, unless it was deleted
        existing = next((c for c in in_memory_categories if c["id"] == category.id), None)
        if not existing:
            in_memory_categories.append(category.dict())
        return {"status": "success", "mode": "mock"}
    try:
        db.collection('categories').document(category.id).set(category.dict())
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        existing = next((c for c in in_memory_categories if c["id"] == category.id), None)
        if not existing:
            in_memory_categories.append(category.dict())
        return {"status": "success", "mode": "mock"}

@app.delete("/categories/{category_id}")
def delete_category(category_id: str):
    if not db:
        global in_memory_categories
        in_memory_categories = [c for c in in_memory_categories if c["id"] != category_id]
        return {"status": "success", "mode": "mock"}
    try:
        db.collection('categories').document(category_id).delete()
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"status": "error", "message": str(e)}
@app.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    from ai_service import process_file_with_gemini
    import json
    try:
        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        
        # pass in_memory_categories so Gemini knows the valid targets
        categories = in_memory_categories
        
        # Send to Gemini AI Service
        result_text = process_file_with_gemini(content, mime_type, file.filename, categories)
        
        parsed_result = json.loads(result_text)
        return {"status": "success", "data": parsed_result}
    except Exception as e:
        logger.error(f"Error processing file with AI: {e}")
        return {"status": "error", "message": str(e)}

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    from ai_service import chat_with_gemini
    try:
        msgs = [{"role": m.role, "text": m.text} for m in req.messages]
        reply = chat_with_gemini(msgs)
        return {"status": "success", "reply": reply}
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return {"status": "error", "message": str(e)}

from fastapi import FastAPI, HTTPException, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from models import Node, Link, Category
from typing import List, Dict, Any
from mock_data import MOCK_NODES, MOCK_LINKS, MOCK_CATEGORIES
from pydantic import BaseModel
import logging
import json

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

mock_state = {
    "default": {
        "nodes": [n.copy() for n in MOCK_NODES],
        "links": [l.copy() for l in MOCK_LINKS],
        "categories": [c.copy() for c in MOCK_CATEGORIES]
    }
}

def get_mock(layout_id: str):
    if layout_id not in mock_state:
        mock_state[layout_id] = {"nodes": [], "links": [], "categories": []}
    return mock_state[layout_id]

@app.get("/")
def read_root():
    return {"message": "Welcome to BrainNode Pro Backend", "db_status": "connected" if db else "mock"}

@app.get("/layouts")
def get_layouts():
    if not db:
        return {"status": "success", "layouts": list(mock_state.keys())}
    try:
        docs = db.collection('layouts_meta').stream()
        layouts = [doc.id for doc in docs]
        if "default" not in layouts:
            layouts.append("default")
        layouts = list(set(layouts))
        return {"status": "success", "layouts": layouts}
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"status": "success", "layouts": list(mock_state.keys())}

@app.post("/layouts/{layout_id}")
def create_layout(layout_id: str):
    if not db:
        get_mock(layout_id)
        return {"status": "success"}
    try:
        db.collection('layouts_meta').document(layout_id).set({"created": True})
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        get_mock(layout_id)
        return {"status": "success", "mode": "mock_fallback"}

@app.delete("/layouts/{layout_id}")
def delete_layout(layout_id: str):
    if layout_id == "default":
        return {"status": "error", "message": "Cannot delete default layout"}
    
    if not db:
        if layout_id in mock_state:
            del mock_state[layout_id]
        return {"status": "success"}
    try:
        # Delete metadata
        db.collection('layouts_meta').document(layout_id).delete()
        
        # Delete all nodes
        nodes_ref = db.collection(f'layouts/{layout_id}/nodes')
        for doc in nodes_ref.stream():
            doc.reference.delete()
            
        # Delete all links
        links_ref = db.collection(f'layouts/{layout_id}/links')
        for doc in links_ref.stream():
            doc.reference.delete()
            
        # Delete all categories
        cats_ref = db.collection(f'layouts/{layout_id}/categories')
        for doc in cats_ref.stream():
            doc.reference.delete()
            
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        if layout_id in mock_state:
            del mock_state[layout_id]
        return {"status": "success", "mode": "mock_fallback"}

@app.get("/nodes", response_model=List[Node])
def get_nodes(layout_id: str = "default"):
    if not db:
        return [Node(**data) for data in get_mock(layout_id)["nodes"]]
    try:
        docs = db.collection(f'layouts/{layout_id}/nodes').stream()
        return [Node(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Node(**data) for data in get_mock(layout_id)["nodes"]]

@app.post("/nodes")
def create_node(node: Node, layout_id: str = "default"):
    if not db:
        get_mock(layout_id)["nodes"].append(node.dict())
        return {"status": "success", "mode": "mock"}
    try:
        db.collection(f'layouts/{layout_id}/nodes').document(node.id).set(node.dict())
        db.collection('layouts_meta').document(layout_id).set({"created": True})
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        get_mock(layout_id)["nodes"].append(node.dict())
        return {"status": "success", "mode": "mock"}

@app.delete("/nodes/{node_id}")
def delete_node(node_id: str, layout_id: str = "default"):
    if not db:
        state = get_mock(layout_id)
        state["nodes"] = [n for n in state["nodes"] if n["id"] != node_id]
        state["links"] = [l for l in state["links"] if l["source"] != node_id and l["target"] != node_id]
        return {"status": "success", "mode": "mock"}
    try:
        db.collection(f'layouts/{layout_id}/nodes').document(node_id).delete()
        links_ref = db.collection(f'layouts/{layout_id}/links')
        for doc in links_ref.where('source', '==', node_id).stream():
            doc.reference.delete()
        for doc in links_ref.where('target', '==', node_id).stream():
            doc.reference.delete()
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        state = get_mock(layout_id)
        state["nodes"] = [n for n in state["nodes"] if n["id"] != node_id]
        state["links"] = [l for l in state["links"] if l["source"] != node_id and l["target"] != node_id]
        return {"status": "success", "mode": "mock_fallback"}

@app.put("/nodes/{node_id}")
def update_node(node_id: str, updates: Dict[str, Any], layout_id: str = "default"):
    if not db:
        for n in get_mock(layout_id)["nodes"]:
            if n["id"] == node_id:
                n.update(updates)
        return {"status": "success", "mode": "mock"}
    try:
        db.collection(f'layouts/{layout_id}/nodes').document(node_id).update(updates)
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        for n in get_mock(layout_id)["nodes"]:
            if n["id"] == node_id:
                n.update(updates)
        return {"status": "success", "mode": "mock_fallback"}

@app.get("/links", response_model=List[Link])
def get_links(layout_id: str = "default"):
    if not db:
        return [Link(**data) for data in get_mock(layout_id)["links"]]
    try:
        docs = db.collection(f'layouts/{layout_id}/links').stream()
        return [Link(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Link(**data) for data in get_mock(layout_id)["links"]]

@app.post("/links")
def create_link(link: Link, layout_id: str = "default"):
    if not db:
        get_mock(layout_id)["links"].append(link.dict())
        return {"status": "success", "mode": "mock"}
    try:
        link_id = f"{link.source}_{link.target}"
        db.collection(f'layouts/{layout_id}/links').document(link_id).set(link.dict())
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        get_mock(layout_id)["links"].append(link.dict())
        return {"status": "success", "mode": "mock_fallback"}

@app.get("/categories", response_model=List[Category])
def get_categories(layout_id: str = "default"):
    if not db:
        return [Category(**data) for data in get_mock(layout_id)["categories"]]
    try:
        docs = db.collection(f'layouts/{layout_id}/categories').stream()
        return [Category(**doc.to_dict()) for doc in docs]
    except Exception as e:
        logger.error(f"Error: {e}")
        return [Category(**data) for data in get_mock(layout_id)["categories"]]

@app.post("/categories")
def create_category(category: Category, layout_id: str = "default"):
    if not db:
        state = get_mock(layout_id)
        existing = next((c for c in state["categories"] if c["id"] == category.id), None)
        if not existing:
            state["categories"].append(category.dict())
        return {"status": "success", "mode": "mock"}
    try:
        db.collection(f'layouts/{layout_id}/categories').document(category.id).set(category.dict())
        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        state = get_mock(layout_id)
        existing = next((c for c in state["categories"] if c["id"] == category.id), None)
        if not existing:
            state["categories"].append(category.dict())
        return {"status": "success", "mode": "mock_fallback"}

@app.delete("/categories/{category_id}")
def delete_category(category_id: str, layout_id: str = "default"):
    if not db:
        state = get_mock(layout_id)
        state["categories"] = [c for c in state["categories"] if c["id"] != category_id]
        nodes_to_delete = [n["id"] for n in state["nodes"] if n.get("category") == category_id]
        state["nodes"] = [n for n in state["nodes"] if n.get("category") != category_id]
        state["links"] = [l for l in state["links"] if l["source"] not in nodes_to_delete and l["target"] not in nodes_to_delete]
        return {"status": "success", "mode": "mock"}
    try:
        db.collection(f'layouts/{layout_id}/categories').document(category_id).delete()
        nodes_ref = db.collection(f'layouts/{layout_id}/nodes')
        links_ref = db.collection(f'layouts/{layout_id}/links')
        
        nodes_to_delete = []
        for doc in nodes_ref.where('category', '==', category_id).stream():
            nodes_to_delete.append(doc.id)
            doc.reference.delete()
            
        for nid in nodes_to_delete:
            for doc in links_ref.where('source', '==', nid).stream():
                doc.reference.delete()
            for doc in links_ref.where('target', '==', nid).stream():
                doc.reference.delete()

        return {"status": "success", "mode": "firestore"}
    except Exception as e:
        logger.error(f"Error: {e}")
        state = get_mock(layout_id)
        state["categories"] = [c for c in state["categories"] if c["id"] != category_id]
        nodes_to_delete = [n["id"] for n in state["nodes"] if n.get("category") == category_id]
        state["nodes"] = [n for n in state["nodes"] if n.get("category") != category_id]
        state["links"] = [l for l in state["links"] if l["source"] not in nodes_to_delete and l["target"] not in nodes_to_delete]
        return {"status": "success", "mode": "mock_fallback"}

@app.post("/ingest")
async def ingest_file(layout_id: str = Query("default"), file: UploadFile = File(...)):
    from ai_service import process_file_with_gemini
    try:
        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        
        if not db:
            categories = get_mock(layout_id)["categories"]
        else:
            categories = []
            try:
                docs = db.collection(f'layouts/{layout_id}/categories').stream()
                categories = [doc.to_dict() for doc in docs]
            except:
                pass
                
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

import os
import google.generativeai as genai
from dotenv import load_dotenv
import tempfile
import json
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# We configure the API key from the .env securely
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    try:
        print("🚀 Memulai Backend AI...")
        available_models = [m.name for m in genai.list_models()]
        if any('gemini-3.5-flash' in m for m in available_models):
            print("✅ Berhasil: Model Gemini 3.5 Flash tersedia dan terhubung!")
        else:
            print("⚠️ Peringatan: Gemini 3.5 Flash tidak ditemukan di akun ini. Akan menggunakan fallback.")
    except Exception as e:
        print(f"⚠️ Peringatan saat memverifikasi model: {e}")

generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 1024,
    "response_mime_type": "application/json",
}

def process_file_with_gemini(file_bytes: bytes, mime_type: str, file_name: str, available_categories: list):
    """
    Uploads a file to Gemini, analyzes it, and returns a structured JSON summary.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment.")

    cat_names = ", ".join([c['name'] for c in available_categories])
    prompt = f"""You are an advanced Knowledge Graph AI Analyst.
    Analyze the attached file and provide a structured summary to be ingested as a node in a graph network.
    Identify key concepts and their relations.
    Output a JSON object exactly like this:
    {{
       "title": "A short 3-5 word concise title representing the core subject",
       "summary": "A comprehensive 1-2 paragraph summary of the file's contents, focusing on key insights.",
       "suggested_cluster": "One of these exact categories: [{cat_names}]. If none fit perfectly, pick the closest one."
    }}"""

    # Gemini handles files (PDF, Audio, Images) efficiently via its File API
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file_name}") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
        
    try:
        # Uploading to Gemini servers for analysis
        uploaded_file = genai.upload_file(tmp_path, mime_type=mime_type)
        
        try:
            model = genai.GenerativeModel(
                model_name="gemini-3.5-flash",
                generation_config=generation_config,
            )
            response = model.generate_content([uploaded_file, prompt])
        except Exception as e:
            logger.warning(f"Failed with gemini-3.5-flash, trying gemini-3.5-pro. Error: {e}")
            print(f"🔄 Fallback ke gemini-3.5-pro karena: {e}")
            
            fallback_config = {
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 64,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            }
            model_fallback = genai.GenerativeModel(
                model_name="gemini-3.5-pro",
                generation_config=fallback_config,
            )
            response = model_fallback.generate_content([prompt, uploaded_file])
        
        # Cleanup from Gemini storage
        try:
            genai.delete_file(uploaded_file.name)
        except Exception as e:
            logger.warning(f"Failed to delete file from Gemini storage: {e}")
            
        return response.text
    finally:
        # Cleanup local tmp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def chat_with_gemini(messages_history: list):
    """
    messages_history is a list of dicts: [{"role": "user", "text": "Hello"}, {"role": "ai", "text": "Hi"}]
    """
    print("--- [DEBUG] chat_with_gemini dipanggil ---")
    
    # Re-validate API Key
    current_key = os.getenv("GEMINI_API_KEY")
    if not current_key:
        print("❌ [DEBUG] GEMINI_API_KEY kosong!")
        raise ValueError("GEMINI_API_KEY is not set.")
    genai.configure(api_key=current_key)

    history = []
    for msg in messages_history[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": msg["text"]})
        
    last_message = messages_history[-1]["text"]

    try:
        print(f"--- [DEBUG] Memanggil Gemini 3.5 Flash dengan pesan: {last_message} ---")
        model = genai.GenerativeModel("gemini-3.5-flash")
        chat = model.start_chat(history=history)
        response = chat.send_message(last_message)
        print("--- [DEBUG] Respon Gemini 3.5 Flash diterima ---")
        return response.text
    except Exception as e:
        logger.error(f"Chat error with gemini-3.5-flash: {e}")
        print(f"--- [DEBUG] Error di Gemini 3.5 Flash: {e} ---")
        try:
            print("--- [DEBUG] Mencoba fallback ke Gemini 3.5 Pro ---")
            model_fallback = genai.GenerativeModel("gemini-3.5-pro")
            chat_fallback = model_fallback.start_chat(history=history)
            response = chat_fallback.send_message(last_message)
            print("--- [DEBUG] Respon Fallback diterima ---")
            return response.text
        except Exception as fallback_e:
            print(f"--- [DEBUG] Error total AI: {fallback_e} ---")
            raise Exception(f"AI gagal memproses: {fallback_e}")

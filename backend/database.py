import os
from google.cloud import firestore

def get_db():
    # To run locally, ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable
    # is set to the path of your Google Cloud service account JSON key file.
    # e.g., os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/key.json"
    
    try:
        db = firestore.Client()
        return db
    except Exception as e:
        print(f"Error initializing Firestore: {e}")
        # Return None or raise exception depending on strictness
        return None

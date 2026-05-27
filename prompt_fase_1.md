# 🚀 PROJECT BLUEPRINT: BRAINNODE PRO (PHASE 1)

**Role:** Expert Full-Stack Cloud Architect & AI Engineer
**Codename:** AntiGravity
**Objective:** Transform `testing.html` into a scalable, production-ready Monorepo application for Google Cloud deployment.

---

## 🏗️ 1. ARCHITECTURE OVERVIEW

The project must be structured as a **Monorepo** to ensure independent scaling of the frontend and backend while maintaining a unified development workflow.

- **Root Directory:** `BrainNode-Production/`
- **Backend Directory:** `/backend` (FastAPI + Python 3.10)
- **Frontend Directory:** `/frontend` (React + Vite + Tailwind CSS)
- **Reference File:** `testing.html` (Primary source for Visuals, Physics, and Logic)

---

## 🛠️ 2. BACKEND SPECIFICATIONS (FastAPI)

Initialize a robust API in the `/backend` folder with the following requirements:

- **Framework:** FastAPI using Python 3.10.
- **Data Persistence:** Integrate `google-cloud-firestore` for node and link storage.
- **Scalability:** - Implement Pydantic models for `Node` and `Link` structures.
  - Modularize the code to allow future integration of **NumPy** and **Pandas** for advanced data analysis.
  - Ensure the architecture supports future **Machine Learning** pipelines (Vertex AI).
- **Security:** Configure CORS to allow secure communication with the React frontend.

---

## 🎨 3. FRONTEND SPECIFICATIONS (React + Vite)

Build a high-fidelity user interface in the `/frontend` folder:

- **Framework:** React.js powered by Vite.
- **Styling:** Tailwind CSS (Strictly follow the `Zinc-950` theme and `Indigo/Violet` gradients from `testing.html`).
- **The Physics Engine (CRITICAL):** - Port the **HTML5 Canvas physics** (repulsion, orbital breathing, and cluster gravity) directly from `testing.html` into a reusable React component named `GalaxyCanvas.jsx`.
  - Ensure 100% visual fidelity. The "floaty" movement and inter-cluster gravity must feel identical to the prototype.
- **State Management:** Implement React hooks (`useState`, `useEffect`) to fetch and synchronize graph data from the FastAPI endpoints.

---

## 📊 4. DATA INITIALIZATION

- Create a `seed_data.py` script in the backend to populate Firestore with the initial clusters: **Trading**, **Fisika**, and **Informatika**.
- Mirror the content and connectivity patterns established in the original `testing.html` data array.

---

## 📝 5. EXECUTION INSTRUCTIONS

1. **Analyze:** Deconstruct the script and styles in `testing.html`.
2. **Scaffold:** Generate the boilerplate for both FastAPI and React/Vite.
3. **Connect:** Link the frontend to the backend `/nodes` and `/links` endpoints.
4. **Report:** Confirm once the directory structure is generated and the basic "Galaxy" rendering is functional in React.

**AntiGravity, begin the initialization of Phase 1 now.**

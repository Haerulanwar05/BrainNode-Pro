# 🌌 BrainNode Pro
**AI-Powered Knowledge Graph & Intelligent Chat Assistant**

BrainNode Pro adalah aplikasi *Full-Stack* mutakhir yang memadukan kekuatan **Google Gemini 1.5 Pro** dengan visualisasi data interaktif. Proyek ini dirancang untuk membantu pengguna membangun "Second Brain" melalui graf pengetahuan (*Knowledge Graph*) yang dinamis dalam bentuk galaksi node.

---

## 🚀 Live Demo
Aplikasi ini sudah di-deploy secara global dan dapat diakses langsung melalui tautan di bawah ini:

👉 **[Buka BrainNode Pro Web App](https://brainnode-frontend-291742583447.asia-southeast2.run.app)**

---

## ✨ Fitur Utama
* **Interactive Knowledge Graph:** Visualisasi hubungan antar konsep dan catatan dalam bentuk galaksi node yang dinamis menggunakan *force-directed graph*.
* **AI Chat Assistant:** Terintegrasi langsung dengan API Gemini untuk menjawab pertanyaan teknis, analisis data, hingga strategi trading secara cerdas.
* **Monorepo Architecture:** Struktur proyek yang rapi memisahkan antara *Backend* (FastAPI) dan *Frontend* (React).
* **Cloud-Native Deployment:** Dikelola sepenuhnya menggunakan Docker dan Google Cloud Run untuk performa yang stabil, aman, dan skalabel.

---

## 🛠️ Tech Stack
| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, React Force Graph |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Artificial Intelligence** | Google Gemini API (Generative AI) |
| **Infrastructure** | Docker, Google Cloud Run, GitHub |

---

## 🏗️ Struktur Proyek
```text
BrainNode-Production/
├── backend/                  # Python FastAPI Server
│   ├── .env                  
│   ├── ai_service.py         
│   ├── database.py           
│   ├── Dockerfile            
│   ├── main.py               
│   ├── mock_data.py          
│   ├── models.py             
│   ├── requirements.txt      
│   └── seed_data.py          
├── frontend/                 # React Application
│   ├── src/                  
│   │   ├── components/       
│   │   ├── App.jsx           
│   │   ├── index.css         
│   │   └── main.jsx          
│   ├── Dockerfile            
│   ├── index.html            
│   ├── package-lock.json     
│   ├── package.json          
│   ├── postcss.config.js     
│   ├── tailwind.config.js    
│   └── vite.config.js        
├── .gitignore                
└── README.md                 # Dokumentasi proyek
```

## 👤 Author
**Muhammad Haerul Anwar**

Mahasiswa Teknik Informatika, Universitas Trilogi.

Divisi Riset & Sains, HIMATIKA Trilogi.

Bidang Minat: Machine Learning Engineer & Quantitative Trading.

## 📄 Lisensi
Proyek ini dikembangkan sebagai bagian dari portofolio akademik.

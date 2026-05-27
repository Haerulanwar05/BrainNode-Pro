MOCK_NODES = [
    { "id": "hub_trading", "label": "📈 KLASTER TRADING", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#10b981", "size": 15, "content": "Rumpun utama penyimpan data analisis teknikal pasar keuangan, Smart Money Concepts (SMC), dan Inner Circle Trader (ICT).", "category": "Trading", "isHub": True, "seed": 1.1, "createdStep": 1 },
    { "id": "t1", "label": "Order Block (OB)", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#059669", "size": 9, "content": "Area harga krusial yang menampung tumpukan order institusi besar. Kerap menjadi katalis pantulan harga.", "category": "Trading", "isHub": False, "seed": 2.3, "createdStep": 1 },
    { "id": "t2", "label": "Fair Value Gap (FVG)", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#059669", "size": 9, "content": "Inefisiensi struktural pergerakan harga akibat impulsivitas pasar, terbentuk dari formasi 3 candlestick.", "category": "Trading", "isHub": False, "seed": 3.5, "createdStep": 2 },
    { "id": "t3", "label": "Liquidity Sweep", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#059669", "size": 9, "content": "Manuver manipulasi harga pasar untuk membersihkan order stop-loss ritel sebelum harga bergerak berbalik arah.", "category": "Trading", "isHub": False, "seed": 1.8, "createdStep": 3 },
    { "id": "hub_fisika", "label": "⚛️ KLASTER FISIKA", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#06b6d4", "size": 15, "content": "Rumpun utama pengumpul teori fisika klasik, relativitas umum, mekanika kuantum, dan hukum pergerakan benda.", "category": "Fisika", "isHub": True, "seed": 4.8, "createdStep": 1 },
    { "id": "f1", "label": "Hukum Newton", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#0891b2", "size": 9, "content": "Formulasi matematis yang mengatur gerak kinetik suatu benda akibat pengaruh interaksi gaya eksternal.", "category": "Fisika", "isHub": False, "seed": 5.2, "createdStep": 1 },
    { "id": "f2", "label": "Teori Relativitas", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#0891b2", "size": 9, "content": "Gagasan Albert Einstein tentang kelengkungan jalinan ruang dan waktu akibat tarikan gravitasi massa masif.", "category": "Fisika", "isHub": False, "seed": 6.7, "createdStep": 2 },
    { "id": "f3", "label": "Mekanika Kuantum", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#0891b2", "size": 9, "content": "Cabang ilmu fisika yang mempelajari perilaku partikel sub-atomik yang memecah logika batasan fisika klasik.", "category": "Fisika", "isHub": False, "seed": 3.1, "createdStep": 3 },
    { "id": "hub_ml", "label": "🤖 KLASTER INFORMATIKA", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#8b5cf6", "size": 15, "content": "Rumpun utama riset machine learning, algoritma pencarian semantik, NLP, dan implementasi basis data vektor.", "category": "Informatika", "isHub": True, "seed": 7.1, "createdStep": 1 },
    { "id": "m1", "label": "Vector Embeddings", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#7c3aed", "size": 9, "content": "Transformasi teks kontekstual ke dalam untaian koordinat multidimensi agar dapat dihitung kedekatan artinya secara matematis.", "category": "Informatika", "isHub": False, "seed": 8.4, "createdStep": 1 },
    { "id": "m2", "label": "Deep Learning Network", "x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "color": "#7c3aed", "size": 9, "content": "Arsitektur jaringan saraf tiruan berlapis (neural networks) yang meniru cara kerja jaringan otak untuk melatih model pintar.", "category": "Informatika", "isHub": False, "seed": 9.2, "createdStep": 3 }
]

MOCK_LINKS = [
    { "source": "hub_trading", "target": "t1", "strength": 3.0 },
    { "source": "hub_trading", "target": "t2", "strength": 2.0 },
    { "source": "hub_trading", "target": "t3", "strength": 2.5 },
    { "source": "hub_fisika", "target": "f1", "strength": 3.0 },
    { "source": "hub_fisika", "target": "f2", "strength": 2.5 },
    { "source": "hub_fisika", "target": "f3", "strength": 2.0 },
    { "source": "hub_ml", "target": "m1", "strength": 3.0 },
    { "source": "hub_ml", "target": "m2", "strength": 2.2 },
    { "source": "t1", "target": "m1", "strength": 1.2 },
    { "source": "f3", "target": "m2", "strength": 1.1 }
]

MOCK_CATEGORIES = [
    { "id": "Trading", "name": "Trading", "color": "#10b981", "icon": "📈" },
    { "id": "Fisika", "name": "Fisika", "color": "#06b6d4", "icon": "⚛️" },
    { "id": "Informatika", "name": "Informatika", "color": "#8b5cf6", "icon": "🤖" }
]

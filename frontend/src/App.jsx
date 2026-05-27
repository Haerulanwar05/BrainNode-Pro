import React, { useState, useEffect, useRef } from 'react';
import GalaxyCanvas from './components/GalaxyCanvas';

const INITIAL_CATEGORIES = [
  { id: "Trading", name: "Trading", color: "#10b981", icon: "📈" },
  { id: "Fisika", name: "Fisika", color: "#06b6d4", icon: "⚛️" },
  { id: "Informatika", name: "Informatika", color: "#8b5cf6", icon: "🤖" }
];

function App() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [canvasMode, setCanvasMode] = useState('galaxy');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState("All");
  const [currentTimelineStep, setCurrentTimelineStep] = useState(4);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusedCluster, setFocusedCluster] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isReaderEditing, setIsReaderEditing] = useState(false);
  const [activeCategories, setActiveCategories] = useState(INITIAL_CATEGORIES);
  const [toastMessage, setToastMessage] = useState(null);

  const [readerOpen, setReaderOpen] = useState(false);
  const [synthesisModalOpen, setSynthesisModalOpen] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(false);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestBody, setIngestBody] = useState("");
  const [ingestCategory, setIngestCategory] = useState("Trading");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#8b5cf6");

  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const [showHint, setShowHint] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "Halo! Saya asisten AI BrainNode Anda. Anda dapat bertanya tentang konsep dalam graf ini, atau meminta saya menganalisis tautan baru." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const newMsg = { role: "user", text: chatInput };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, text: m.text })) }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.status === 'success') {
        setChatMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: "ai", text: "Maaf, terjadi kesalahan di AI: " + data.message }]);
      }
    } catch(err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setChatMessages(prev => [...prev, { role: "ai", text: "Maaf, AI sedang sangat sibuk dan request timeout (15 detik). Silakan coba lagi." }]);
      } else {
        setChatMessages(prev => [...prev, { role: "ai", text: "Maaf, koneksi terputus: " + err.message }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchGraphData = async () => {
    try {
      const resNodes = await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes').catch(()=>null);
      const resLinks = await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/links').catch(()=>null);
      const resCats = await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/categories').catch(()=>null);

      if (resNodes && resNodes.ok && resLinks && resLinks.ok) {
        const nData = await resNodes.json();
        const lData = await resLinks.json();
        
        if (resCats && resCats.ok) {
          const cData = await resCats.json();
          if (cData && cData.length > 0) setActiveCategories(cData);
        }
        
        nData.forEach(n => {
          if (n.x === 0 && n.y === 0) {
            n.x = window.innerWidth/2 + (Math.random() - 0.5) * 400;
            n.y = window.innerHeight/2 + (Math.random() - 0.5) * 400;
            n.vx = (Math.random() - 0.5) * 2;
            n.vy = (Math.random() - 0.5) * 2;
          }
        });
        setNodes(nData);
        setLinks(lData);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const handleSimulateUpload = (type) => {
    showToast("⚙️ Mengekstrak konten file...");
    setTimeout(() => {
      if (type === 'pdf') {
        setIngestTitle("Modul SMC Mentorship.pdf");
        setIngestBody("Hasil Analisis AI: Catatan keuangan mendetail mengenai identifikasi [[Order Block (OB)]] dan zona likuiditas institusi pasar modal.");
      } else if (type === 'mp3') {
        setIngestTitle("Memo_Suara_Ide.wav");
        setIngestBody("Hasil Transkripsi Whisper: 'Sangat disarankan untuk mengintegrasikan [[Vector Embeddings]] pada modul pencarian semantik agar AI bisa beroperasi maksimal.'");
      } else {
        setIngestTitle("Screenshot_Fisika.png");
        setIngestBody("Hasil Vision OCR: Terbaca corat-coret rumus kinetika [[Hukum Newton]] dan pengaruh gesekan kinetik pada permukaan miring.");
      }
      showToast("✨ Berkas Terbaca Secara Multimodal");
    }, 1000);
  };

  const handleIngest = async () => {
    if (!ingestTitle || !ingestBody) {
      showToast("❌ Judul dan Teks Isi tidak boleh kosong!");
      return;
    }
    const catConfig = activeCategories.find(c => c.id === ingestCategory);
    let color = catConfig ? catConfig.color : "#10b981";
    let hubId = `hub_${ingestCategory.toLowerCase()}`;
    if (ingestCategory === "Informatika") hubId = "hub_ml";

    const newId = `user_node_${Date.now()}`;
    const newNode = {
      id: newId,
      label: ingestTitle,
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 50,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: color,
      size: 9,
      content: ingestBody,
      category: ingestCategory,
      isHub: false,
      createdStep: currentTimelineStep,
      seed: Math.random() * 5
    };

    const wikiRegex = /\[\[(.*?)\]\]/g;
    let match;
    let newLinks = [{ source: hubId, target: newId, strength: 2.5 }];
    let foundLinksCount = 0;

    while ((match = wikiRegex.exec(ingestBody)) !== null) {
      let targetLabel = match[1].trim();
      let targetNode = nodes.find(n => n.label.toLowerCase() === targetLabel.toLowerCase());
      if (targetNode) {
        newLinks.push({ source: newId, target: targetNode.id, strength: 1.5 });
        foundLinksCount++;
      }
    }

    try {
      await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });
      for(let l of newLinks) {
        await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(l)
        });
      }
      setNodes(prev => [...prev, newNode]);
      setLinks(prev => [...prev, ...newLinks]);
      setSelectedNode(newNode);
      setIngestTitle("");
      setIngestBody("");
      
      if (foundLinksCount > 0) showToast(`✅ "${ingestTitle}" Terhubung ke ${foundLinksCount} Tautan Wiki`);
      else showToast(`✅ "${ingestTitle}" Tersambung`);
    } catch(err) {
      console.error(err);
      showToast("❌ Gagal menyimpan node.");
    }
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return showToast("❌ Nama kategori tidak boleh kosong!");
    if (activeCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return showToast("❌ Kategori sudah ada!");
    }
    const catId = name.replace(/\s+/g, '_');
    const newCat = { id: catId, name: name, color: newCatColor, icon: "📁" };
    
    // Sync to backend
    fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    }).catch(e => console.error(e));
    
    const hubId = `hub_${catId.toLowerCase()}`;
    const newHubNode = {
      id: hubId,
      label: `📁 KLASTER ${name.toUpperCase()}`,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: 0, vy: 0,
      color: newCatColor,
      size: 15,
      content: `Rumpun utama penyimpan data untuk klaster ${name}.`,
      category: catId,
      isHub: true,
      createdStep: currentTimelineStep,
      seed: Math.random() * 8
    };

    fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHubNode)
    }).then(() => {
      setActiveCategories(prev => [...prev, newCat]);
      setNodes(prev => [...prev, newHubNode]);
      setIngestCategory(catId);
      setNewCatName("");
      showToast(`✨ Klaster "${name}" Berhasil Dibuat!`);
    });
  };

  const handleDeleteNode = async (nodeId) => {
    if (!nodeId) return;
    const deletingNode = nodes.find(n => n.id === nodeId);
    const label = deletingNode ? deletingNode.label : "Catatan";

    await fetch(`https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes/${nodeId}`, { method: 'DELETE' });
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    
    // Sync Category Deletion
    if (deletingNode && deletingNode.isHub) {
      await fetch(`https://brainnode-pro-291742583447.asia-southeast2.run.app/categories/${deletingNode.category}`, { method: 'DELETE' }).catch(() => null);
      setActiveCategories(prev => prev.filter(c => c.id !== deletingNode.category));
      if (currentCategoryFilter === deletingNode.category) setCurrentCategoryFilter("All");
      if (ingestCategory === deletingNode.category) setIngestCategory("Trading");
    }
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    setReaderOpen(false);
    showToast(`🗑️ "${label}" Berhasil Dihapus`);
  };

  const synthesize = () => {
    if(selectedNodes.length === 0) return;
    setSynthesisModalOpen(true);
    setSynthesisResult(false);
    setTimeout(() => {
      setSynthesisResult(true);
    }, 1800);
  };

  const saveEdit = async () => {
    if(!editTitle || !editBody) return showToast("❌ Judul dan isi tidak boleh kosong!");
    try {
      await fetch(`https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes/${selectedNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editTitle, content: editBody })
      });
      
      const updatedNode = { ...selectedNode, label: editTitle, content: editBody };
      setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
      setSelectedNode(updatedNode);
      setIsReaderEditing(false);
      showToast("✨ Catatan Berhasil Diperbarui");
    } catch(err) {
      showToast("❌ Gagal memperbarui.");
    }
  };

  const openReader = (node) => {
    setSelectedNode(node);
    setIsReaderEditing(false);
    setReaderOpen(true);
  };

  const addNewTextCard = () => {
    const newCard = {
      id: `card_node_${Date.now()}`,
      label: "🗒️ Coretan Ide",
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 50,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 50,
      vx: 0, vy: 0,
      color: "#cbd5e1",
      size: 11,
      content: "Ketikkan sebuah ide acak di sini. Dalam mode whiteboard, Anda dapat menyatukan kartu bebas ini ke node utama lainnya.",
      category: "Whiteboard",
      isHub: false,
      createdStep: currentTimelineStep,
      seed: Math.random() * 5
    };
    fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCard)
    }).then(() => {
      setNodes(prev => [...prev, newCard]);
      setSelectedNode(newCard);
      showToast("✨ Kartu Teks Baru Dibuat di Atas Whiteboard");
    });
  };

  const scramble = () => {
    setNodes(prev => prev.map(n => ({
      ...n,
      x: (0.3 + Math.random() * 0.4) * window.innerWidth,
      y: (0.3 + Math.random() * 0.4) * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1
    })));
    showToast("🌀 Koordinat Grafik Diacak");
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full text-zinc-100 font-sans select-none overflow-hidden bg-zinc-950">
      
      {/* HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '18px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              BrainNode <span className="text-[9px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">Pro Engine</span>
            </h1>
            <p className="text-[9px] text-zinc-500 tracking-wider font-semibold uppercase">Decentralized Multi-Cluster Graph</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 flex">
            <button onClick={() => { setCanvasMode('galaxy'); showToast("🌌 Mengaktifkan Fisika Galaksi Berputar..."); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 ${canvasMode === 'galaxy' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              🌌 Galaksi Auto
            </button>
            <button onClick={() => { setCanvasMode('whiteboard'); showToast("📋 Beralih ke Whiteboard Kanvas Bebas..."); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 ${canvasMode === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              📋 Whiteboard Bebas
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-row overflow-hidden">
        
        {/* SIDEBAR */}
        <section className="w-80 flex-shrink-0 border-r border-zinc-900 bg-zinc-950/40 flex flex-col justify-between overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Universal Input</h2>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Letakkan dokumen, rekam ide, atau buat kartu coretan whiteboard kustom di sini.</p>
            </div>

            <div className="border border-dashed border-zinc-800 bg-zinc-900/10 hover:border-violet-500/50 hover:bg-violet-500/5 rounded-2xl p-4 text-center transition duration-300 relative group">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                const file = e.target.files[0];
                if(file) {
                  showToast(`⚙️ AI (Gemini) sedang menganalisis: ${file.name}`);
                  
                  const formData = new FormData();
                  formData.append("file", file);
                  
                  try {
                    const res = await fetch('https://brainnode-pro-291742583447.asia-southeast2.run.app/ingest', {
                      method: 'POST',
                      body: formData
                    });
                    
                    const result = await res.json();
                    
                    if (result.status === 'success' && result.data) {
                      setIngestTitle(result.data.title || "Judul dari AI");
                      setIngestBody(result.data.summary || "");
                      
                      const suggestedCat = result.data.suggested_cluster;
                      const matchedCat = activeCategories.find(c => c.name.toLowerCase() === suggestedCat?.toLowerCase());
                      
                      if (matchedCat) {
                        setIngestCategory(matchedCat.id);
                        showToast(`✅ Selesai! AI merekomendasikan klaster: ${matchedCat.name}`);
                      } else {
                        showToast("✅ Selesai! Silakan cek hasil ringkasan.");
                      }
                    } else {
                      showToast(`❌ Gagal: ${result.message || "Kesalahan pada server AI"}`);
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("❌ Gagal terhubung ke backend AI.");
                  }
                }
              }} />
              <div className="space-y-2 pointer-events-none">
                <span className="text-2xl block group-hover:scale-110 transition duration-300">📥</span>
                <p className="text-xs text-zinc-400 font-medium">Seret dokumen / file kemari</p>
                <p className="text-[9px] text-zinc-500">Otomatis deteksi PDF, Word, MP3, atau Gambar</p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900/60 flex flex-wrap gap-1.5 justify-center pointer-events-auto">
                <span className="text-[8px] text-zinc-500 font-bold uppercase w-full mb-1">Simulasi Unggahan Berkas:</span>
                <button onClick={() => handleSimulateUpload('pdf')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-[10px] text-zinc-400 rounded-lg border border-zinc-800 transition">📄 PDF</button>
                <button onClick={() => handleSimulateUpload('mp3')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-[10px] text-zinc-400 rounded-lg border border-zinc-800 transition">🎙️ MP3</button>
                <button onClick={() => handleSimulateUpload('image')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-[10px] text-zinc-400 rounded-lg border border-zinc-800 transition">🖼️ PNG</button>
              </div>
            </div>

            {canvasMode === 'whiteboard' && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Peralatan Whiteboard</span>
                  <span className="text-[8px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300 font-semibold">Active</span>
                </div>
                <button onClick={addNewTextCard} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl transition flex items-center justify-center space-x-1">
                  <span>➕ Tambah Kartu Teks Baru</span>
                </button>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Judul Catatan</label>
                <input value={ingestTitle} onChange={e => setIngestTitle(e.target.value)} type="text" placeholder="Masukkan judul..." className="w-full mt-1 px-3 py-2 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-600 transition" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Isi / Transkripsi Dokumen</label>
                  <span className="text-[8px] text-violet-400 font-semibold uppercase tracking-wider cursor-pointer" onClick={() => setIngestBody(prev => prev + " [[Nama Node]]")}>+ Tautan Wiki</span>
                </div>
                <textarea value={ingestBody} onChange={e => setIngestBody(e.target.value)} rows={4} placeholder="Ketik ide... Gunakan [[Nama Node]] untuk membuat tautan dua arah otomatis lintas klaster!" className="w-full mt-1 px-3 py-2 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-600 transition resize-none"></textarea>
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Klaster Utama (Kategori)</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {activeCategories.map(cat => {
                    const isActive = ingestCategory === cat.id;
                    return (
                      <button key={cat.id} type="button" onClick={() => setIngestCategory(cat.id)}
                        style={{ borderColor: isActive ? cat.color : '#18181b', backgroundColor: isActive ? `${cat.color}10` : 'rgba(24, 24, 27, 0.4)', boxShadow: isActive ? `0 0 12px ${cat.color}25` : 'none' }}
                        className="flex items-center space-x-2 px-2.5 py-2.5 border rounded-xl text-left transition-all duration-300 hover:border-zinc-800 group">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}` }}></span>
                        <span className={`text-[10px] font-bold truncate ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{cat.icon} {cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="pt-3 border-t border-zinc-900/60 space-y-2">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Buat Klaster Baru</label>
                <div className="flex gap-2">
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} type="text" placeholder="Nama Kategori..." className="flex-1 px-3 py-1.5 bg-zinc-900/50 border border-zinc-900 rounded-xl text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-600 transition" />
                  <input value={newCatColor} onChange={e => setNewCatColor(e.target.value)} type="color" className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 m-0" />
                  <button onClick={handleAddCategory} className="px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs text-zinc-300 hover:text-white transition font-bold" title="Tambah Klaster">+</button>
                </div>
              </div>
              <button onClick={handleIngest} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-1.5">
                <span>Ingest & Hubungkan Pintar</span>
              </button>
            </div>
          </div>

          {/* INSPECT PANEL */}
          <div className="p-5 border-t border-zinc-900 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Inspektur Catatan</span>
              <span className="text-[8px] px-2 py-0.5 border rounded-full font-bold uppercase" style={{
                backgroundColor: selectedNode ? `${selectedNode.color}15` : '#18181b',
                borderColor: selectedNode ? `${selectedNode.color}30` : '#27272a',
                color: selectedNode ? selectedNode.color : '#a1a1aa'
              }}>
                {selectedNode ? selectedNode.category : 'Pilih Node'}
              </span>
            </div>

            {!selectedNode ? (
              <div className="text-xs text-zinc-500 italic text-center py-4 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-900/60">
                Klik satu node pada grafik untuk membaca detail relasi.
              </div>
            ) : (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-white" style={{color: selectedNode.color}}>{selectedNode.label}</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-h-28 overflow-y-auto bg-zinc-900/10 p-2.5 rounded-xl border border-zinc-900 select-text cursor-text">
                  {selectedNode.content}
                </p>
                <button onClick={() => handleDeleteNode(selectedNode.id)} className="w-full py-1.5 bg-red-950/40 hover:bg-red-900/80 text-red-400 hover:text-white border border-red-900/50 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1">
                  <span>🗑️ Hapus Catatan Ini</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CANVAS WORKSPACE */}
        <section className="flex-1 relative flex flex-col bg-zinc-950 overflow-hidden">
          
          {focusedCluster && (
            <div className="absolute top-16 left-4 z-10 bg-indigo-600 border border-indigo-500/30 px-3.5 py-2 rounded-2xl flex items-center space-x-3 text-xs shadow-2xl animate-bounce">
              <span className="text-md">👁️</span>
              <div>
                <p className="font-bold text-white text-[11px]">Mode Fokus Aktif: {focusedCluster}</p>
                <p className="text-[9px] text-indigo-200">Klik dua kali pada area kosong mana saja untuk keluar.</p>
              </div>
            </div>
          )}

          {selectedNodes.length > 0 && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 bg-zinc-900/95 border border-violet-500/50 p-2 rounded-2xl flex items-center space-x-4 shadow-2xl backdrop-blur">
              <div className="flex items-center space-x-2 pl-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-zinc-300">{selectedNodes.length} Node Terpilih</span>
              </div>
              <button onClick={synthesize} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold transition">
                🤖 Sintesis AI Lintas Catatan
              </button>
              <button onClick={() => setSelectedNodes([])} className="text-zinc-500 hover:text-white pr-2 text-xs font-bold">×</button>
            </div>
          )}

          <div className="absolute top-4 left-4 z-10 flex bg-zinc-900/80 border border-zinc-850 p-1 rounded-xl space-x-1 backdrop-blur shadow-2xl">
            <button onClick={() => { setCurrentCategoryFilter('All'); showToast("📂 Kategori: Semua Rumpun"); }} className={`px-2.5 py-1 text-[9px] font-bold rounded-lg ${currentCategoryFilter === 'All' ? 'bg-zinc-850 text-white' : 'text-zinc-400 hover:text-white'} transition`}>Semua</button>
            {activeCategories.map(cat => (
              <button key={cat.id} onClick={() => { setCurrentCategoryFilter(cat.id); showToast(`📂 Kategori: ${cat.id}`); }} className={`px-2.5 py-1 text-[9px] font-bold rounded-lg ${currentCategoryFilter === cat.id ? 'bg-zinc-850 text-white' : 'text-zinc-400 hover:text-white'} transition`}>{cat.icon} {cat.name}</button>
            ))}
          </div>

          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 items-end">
            <div className="relative max-w-xs w-48 shadow-xl">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-600">🔍</span>
              <input onChange={e => setSearchKeyword(e.target.value.toLowerCase())} type="text" placeholder="Pencarian makna..."
                className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-850 hover:border-zinc-800 rounded-xl py-1.5 pl-9 pr-4 text-[10px] font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-600 transition" />
            </div>
            <button onClick={scramble} className="px-3 py-1.5 bg-zinc-900/80 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold backdrop-blur transition hover:scale-105 shadow-xl">
              🔄 Guncang Layout
            </button>
          </div>

          {!loading && (
            <GalaxyCanvas 
              nodes={nodes} setNodes={setNodes}
              links={links} 
              canvasMode={canvasMode}
              searchKeyword={searchKeyword}
              currentCategoryFilter={currentCategoryFilter}
              currentTimelineStep={currentTimelineStep}
              selectedNode={selectedNode} setSelectedNode={setSelectedNode}
              hoveredNode={hoveredNode} setHoveredNode={setHoveredNode}
              focusedCluster={focusedCluster} setFocusedCluster={setFocusedCluster}
              selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes}
              openReader={openReader}
              showToast={showToast}
            />
          )}

          {/* TIMELINE BAR */}
          <div className="absolute bottom-16 left-4 right-4 bg-zinc-900/90 border border-zinc-850 backdrop-blur p-4 rounded-2xl max-w-2xl mx-auto shadow-2xl space-y-2 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs">🕒</span>
                <span className="text-xs font-bold text-white tracking-wide">Time-Travel Timeline</span>
              </div>
              <span className="text-[10px] text-violet-400 font-bold bg-violet-400/10 px-2 py-0.5 rounded-md border border-violet-400/20">
                {currentTimelineStep === 1 ? '1 Bulan Lalu (Fase Inisiasi)' : currentTimelineStep === 2 ? '2 Minggu Lalu (Fase Ekspansi)' : currentTimelineStep === 3 ? '1 Minggu Lalu (Fase Integrasi)' : 'Sekarang (Semua Node Aktif)'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase">Lalu</span>
              <input type="range" min="1" max="4" value={currentTimelineStep} step="1" onChange={(e) => {
                setCurrentTimelineStep(parseInt(e.target.value));
                showToast(`🕒 Menjelajah Waktu ke Tahap ${e.target.value}`);
              }} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600" />
              <span className="text-[10px] text-zinc-500 font-semibold uppercase">Sekarang</span>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-600 font-bold px-1 pt-0.5 uppercase tracking-wider">
              <span>1 Bulan Lalu</span><span>2 Minggu Lalu</span><span>1 Minggu Lalu</span><span>Sekarang</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20">
            <div 
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
              className="w-8 h-8 rounded-full bg-zinc-900/60 border border-zinc-800 backdrop-blur-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-help shadow-lg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
          </div>

          <div className={`absolute bottom-4 left-4 right-16 bg-zinc-900/40 border border-zinc-900/30 backdrop-blur py-2.5 rounded-2xl max-w-lg mx-auto text-center px-4 pointer-events-none z-10 transition-all duration-500 transform ${showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-[10px] text-zinc-300">
              🧠 <b>Interaksi Pintar:</b> Tahan <b className="text-violet-400">SHIFT + Klik</b> untuk memilih banyak *node*. <b className="text-violet-400">Double-Click</b> pada Hub Rumpun untuk fokus.
            </p>
          </div>

          {/* AI CHAT DRAWER */}
          <div className={`absolute top-0 right-0 h-full w-96 bg-zinc-950/80 backdrop-blur-xl border-l border-zinc-800 z-40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-900">
              <h3 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                <span>🤖</span> BrainNode AI
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'bg-violet-600/20 border-violet-500/30 self-end ml-auto' : 'bg-zinc-900/60 border-zinc-800/50 self-start'} p-3 rounded-xl border w-[85%]`}>
                  <p className="text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isChatLoading && (
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/50 self-start w-[85%]">
                  <p className="text-[10px] text-zinc-500 animate-pulse">Mengetik...</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                  disabled={isChatLoading}
                  placeholder="Tanya sesuatu... (Enter untuk kirim)" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-3 pr-10 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-violet-600 transition disabled:opacity-50" 
                />
                <button onClick={handleSendChat} disabled={isChatLoading} className="absolute right-2 top-1.5 text-zinc-500 hover:text-violet-400 disabled:opacity-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* CHAT TOGGLE FAB */}
          <button 
            onClick={() => setIsChatOpen(prev => !prev)}
            className={`absolute top-1/2 right-0 -translate-y-1/2 z-30 bg-zinc-900/90 backdrop-blur border border-zinc-800 border-r-0 py-3 px-1.5 rounded-l-xl text-zinc-500 hover:text-white hover:bg-violet-600/20 transition shadow-2xl transform duration-300 ${isChatOpen ? 'translate-x-full' : 'translate-x-0'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </section>
      </main>

      {/* TOAST */}
      <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition duration-300 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-zinc-900 border border-indigo-500/20 px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold shadow-2xl backdrop-blur text-indigo-400">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      </div>

      {/* SYNTHESIS MODAL */}
      {synthesisModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <header className="border-b border-zinc-900 bg-zinc-950 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤖</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hasil Sintesis Lintas Catatan AI</h2>
              </div>
              <button onClick={() => setSynthesisModalOpen(false)} className="text-zinc-500 hover:text-white text-xl font-semibold">&times;</button>
            </header>
            <main className="p-6 overflow-y-auto space-y-4">
              {!synthesisResult ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-400 animate-pulse">Mengumpulkan embeddings, menghitung kesamaan makna, & merangkum...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-violet-950/10 border border-violet-900/30 p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-violet-400 mb-2 uppercase">Ide-ide yang Dikorelasikan:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNodes.map(id => {
                        const n = nodes.find(node => node.id === id);
                        return n ? (
                          <span key={id} className="text-[9px] px-2 py-0.5 rounded font-bold uppercase border" style={{backgroundColor: `${n.color}15`, borderColor: `${n.color}30`, color: n.color}}>
                            {n.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-3">
                    <p className="font-light">
                      <b>Hasil Analisis Semantik AI:</b> Setelah mengkomparasikan kaitan antara konsep, sistem mendeteksi adanya benang merah konseptual yang sangat kuat. Hubungan ini memicu integrasi multidisiplin yang mempermudah asimilasi konsep.
                    </p>
                    <p className="font-light border-t border-zinc-900 pt-3">
                      Sintesis Lintas Catatan: Penggabungan konsep-konsep ini menyiratkan bahwa setiap data yang Anda miliki tidak terisolasi. Melalui metadata kontekstual yang diolah AI, klasterisasi otomatis memberikan jembatan kognitif yang mempercepat penarikan kesimpulan strategis sebesar 75% dibandingkan penelusuran folder manual.
                    </p>
                  </div>
                </div>
              )}
            </main>
            <footer className="border-t border-zinc-900 bg-zinc-950/40 px-6 py-3.5 flex justify-end">
              <button onClick={() => {setSynthesisModalOpen(false); setSelectedNodes([]);}} className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl border border-zinc-800 text-zinc-300 transition">Selesai</button>
            </footer>
          </div>
        </div>
      )}

      {/* FULLSCREEN READER */}
      {readerOpen && selectedNode && (
        <div className="fixed inset-0 bg-zinc-950/98 backdrop-blur-xl z-50 flex flex-col select-text">
          <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <button onClick={() => setReaderOpen(false)} className="flex items-center space-x-2.5 text-xs text-zinc-400 hover:text-white transition font-semibold group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 px-4 py-2 rounded-xl">
              <span className="transform group-hover:-translate-x-1 transition duration-200">←</span>
              <span>Kembali ke Galaksi Graf</span>
            </button>
            <div className="flex items-center space-x-3">
              {!isReaderEditing ? (
                <button onClick={() => { setIsReaderEditing(true); setEditTitle(selectedNode.label); setEditBody(selectedNode.content); }} className="px-3.5 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/80 border border-indigo-900/50 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition">
                  ✏️ Edit Catatan
                </button>
              ) : (
                <>
                  <button onClick={saveEdit} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
                    💾 Simpan
                  </button>
                  <button onClick={() => setIsReaderEditing(false)} className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition">
                    Batal
                  </button>
                </>
              )}
              {!isReaderEditing && (
                <button onClick={() => handleDeleteNode(selectedNode.id)} className="px-3.5 py-1.5 bg-red-950/30 hover:bg-red-900/80 border border-red-900/35 hover:border-red-800 text-red-400 hover:text-white rounded-xl text-xs font-bold transition">
                  🗑️ Hapus Catatan Ini
                </button>
              )}
              <span className="text-[9px] px-3 py-1 border rounded-full font-bold uppercase tracking-wider" style={{color: selectedNode.color, borderColor: `${selectedNode.color}35`, backgroundColor: `${selectedNode.color}12`}}>
                {selectedNode.category}
              </span>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-20 space-y-8 overflow-y-auto border-r border-zinc-900/65">
              <div className="space-y-4">
                {!isReaderEditing ? (
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{color: selectedNode.color}}>{selectedNode.label}</h1>
                ) : (
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} type="text" className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight bg-transparent border-b border-zinc-800 focus:border-indigo-500 focus:outline-none w-full pb-2" />
                )}
                <div className="flex items-center space-x-4 text-[11px] text-zinc-500 font-medium tracking-wide">
                  <span>🕒 Est. Membaca: {Math.max(1, Math.ceil((selectedNode.content.split(/\s+/).filter(Boolean).length)/180))} menit</span>
                  <span>•</span><span>Diperbarui Baru Saja</span>
                </div>
              </div>
              <div className="border-t border-zinc-900 pt-8">
                {!isReaderEditing ? (
                  <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                    {selectedNode.content}
                  </p>
                ) : (
                  <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={14} className="text-zinc-300 text-sm md:text-base leading-relaxed font-light bg-transparent border border-zinc-800 focus:border-indigo-500 focus:outline-none w-full rounded-xl p-4 resize-none"></textarea>
                )}
              </div>
            </main>

            <aside className="w-80 md:w-96 bg-zinc-950 border-l border-zinc-900 flex flex-col justify-between overflow-hidden">
              <div className="p-5 border-b border-zinc-900 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🤖</span>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Contextual Sidecar AI</h2>
                </div>
                <p className="text-[9px] text-zinc-500">Mendeteksi kesamaan konsep berdasarkan embeddings waktu nyata.</p>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Rekomendasi Hubungan Terkait:</span>
                <div className="space-y-3">
                  {nodes.filter(n => n.id !== selectedNode.id && n.createdStep <= currentTimelineStep && (n.category === selectedNode.category || Math.random() > 0.4)).slice(0, 3).map(item => (
                    <div key={item.id} onClick={() => openReader(item)} className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-900 hover:border-zinc-800 rounded-xl cursor-pointer transition space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-white">{item.label}</h4>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase" style={{color: item.color, backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25`}}>{item.category}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

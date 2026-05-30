import React, { useState, useEffect, useRef } from 'react';
import GalaxyCanvas from './components/GalaxyCanvas';
import TipTapEditor from './components/TipTapEditor';

const API_URL = import.meta.env.VITE_API_URL || "https://brainnode-pro-291742583447.asia-southeast2.run.app";
const INITIAL_CATEGORIES = [];

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
  const [showTimeline, setShowTimeline] = useState(false);
  const [layouts, setLayouts] = useState(["default"]);
  const [activeLayout, setActiveLayout] = useState("default");
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);

  const [readerOpen, setReaderOpen] = useState(false);
  const [synthesisModalOpen, setSynthesisModalOpen] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(false);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestBody, setIngestBody] = useState("");
  const [ingestCategory, setIngestCategory] = useState("");
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
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [nodeUpdates, setNodeUpdates] = useState({});

  const getRelativeTimeString = () => {
    if (isReaderEditing) return "Sedang Diedit...";
    const updateTime = selectedNode ? nodeUpdates[selectedNode.id] : null;
    if (!updateTime) return "Belum Diubah Sesi Ini";

    const diffSecs = Math.floor((currentTime - updateTime) / 1000);
    if (diffSecs < 10) return "Diperbarui Baru Saja";
    if (diffSecs < 60) return `Diperbarui ${diffSecs} detik lalu`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `Diperbarui ${diffMins} menit lalu`;
    
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `Diperbarui ${hours} jam lalu`;
    return `Diperbarui ${Math.floor(hours / 24)} hari lalu`;
  };

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
      const res = await fetch(`${API_URL}/chat`, {
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
    
    const clockTimer = setInterval(() => setCurrentTime(Date.now()), 5000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(clockTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchGraphData = async (layoutId = activeLayout) => {
    try {
      const resNodes = await fetch(`${API_URL}/nodes?layout_id=${layoutId}`).catch(()=>null);
      const resLinks = await fetch(`${API_URL}/links?layout_id=${layoutId}`).catch(()=>null);
      const resCats = await fetch(`${API_URL}/categories?layout_id=${layoutId}`).catch(()=>null);
      
      setNodes([]); setLinks([]); setActiveCategories([]);

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
    fetch(`${API_URL}/layouts`)
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setLayouts(d.layouts); })
      .catch(()=>null);
  }, []);

  useEffect(() => {
    fetchGraphData(activeLayout);
  }, [activeLayout]);

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
    if (!ingestCategory) {
      showToast("❌ Silakan buat atau pilih klaster terlebih dahulu!");
      return;
    }
    const catConfig = activeCategories.find(c => c.id === ingestCategory);
    let color = catConfig ? catConfig.color : "#10b981";
    let hubId = `hub_${ingestCategory.toLowerCase()}`;

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
      await fetch(`${API_URL}/nodes?layout_id=${activeLayout}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });
      for(let l of newLinks) {
        await fetch(`${API_URL}/links?layout_id=${activeLayout}`, {
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
    fetch(`${API_URL}/categories?layout_id=${activeLayout}`, {
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

    fetch(`${API_URL}/nodes?layout_id=${activeLayout}`, {
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

    await fetch(`${API_URL}/nodes/${nodeId}?layout_id=${activeLayout}`, { method: 'DELETE' });
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    
    // Sync Category Deletion
    if (deletingNode && deletingNode.isHub) {
      await fetch(`${API_URL}/categories/${deletingNode.category}?layout_id=${activeLayout}`, { method: 'DELETE' }).catch(() => null);
      setActiveCategories(prev => prev.filter(c => c.id !== deletingNode.category));
      setNodes(prev => prev.filter(n => n.category !== deletingNode.category));
      setLinks(prev => prev.filter(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        return sourceNode?.category !== deletingNode.category && targetNode?.category !== deletingNode.category;
      }));
      if (currentCategoryFilter === deletingNode.category) setCurrentCategoryFilter("All");
      if (ingestCategory === deletingNode.category) setIngestCategory("");
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
      await fetch(`${API_URL}/nodes/${selectedNode.id}?layout_id=${activeLayout}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editTitle, content: editBody })
      });
      
      const updatedNode = { ...selectedNode, label: editTitle, content: editBody };
      setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
      setSelectedNode(updatedNode);
      setNodeUpdates(prev => ({ ...prev, [selectedNode.id]: Date.now() }));
      setCurrentTime(Date.now());
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
    fetch(`${API_URL}/nodes?layout_id=${activeLayout}`, {
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

  const renderRichText = (text) => {
    if (!text) return null;
    
    // Split by code blocks first (Supports standard ``` or custom [kode=lang]...[tutup])
    const parts = text.split(/(```[\s\S]*?(?:```|$)|\[kode(?:=[a-zA-Z0-9]+)?\][\s\S]*?(?:\[tutup\]|$))/gi);
    
    return parts.map((part, index) => {
      const isMarkdownCode = part.startsWith('```');
      const isEasyCode = part.toLowerCase().startsWith('[kode');
      
      if (isMarkdownCode || isEasyCode) {
        let block = part;
        let lang = '';
        let code = '';
        
        if (isMarkdownCode) {
          block = block.slice(3);
          if (block.endsWith('```')) block = block.slice(0, -3);
          const lines = block.split('\n');
          lang = lines[0].trim();
          code = lines.slice(1).join('\n').trim();
        } else {
          const firstBracketEnd = block.indexOf(']');
          const tag = block.substring(0, firstBracketEnd + 1);
          if (tag.includes('=')) {
            lang = tag.split('=')[1].replace(']', '').trim();
          }
          block = block.substring(firstBracketEnd + 1);
          if (block.toLowerCase().endsWith('[tutup]')) block = block.slice(0, -7);
          code = block.trim();
        }
        
        const highlightCode = (str) => {
          if (!str) return '';
          let h = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          
          const kw = ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'class', 'function', 'const', 'let', 'var', 'await', 'async', 'try', 'catch', 'True', 'False', 'None', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS'];
          const regex = new RegExp(`(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?'|\\/\\/.*|#.*|\\b(?:${kw.join('|')})\\b|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\()|\\b\\d+\\b)`, 'g');
          
          return h.replace(regex, (match) => {
            if (match.startsWith('"') || match.startsWith("'") || match.startsWith('&quot;') || match.startsWith('&#39;')) {
              return `<span class="text-green-400">${match}</span>`;
            }
            if (match.startsWith('//') || match.startsWith('#')) {
              return `<span class="text-zinc-500 italic">${match}</span>`;
            }
            if (/^\d+$/.test(match)) {
              return `<span class="text-orange-400">${match}</span>`;
            }
            if (kw.includes(match)) {
              return `<span class="text-pink-500 font-bold">${match}</span>`;
            }
            return `<span class="text-blue-400">${match}</span>`;
          });
        };
        
        return (
          <div key={index} className="my-6 rounded-xl overflow-hidden border border-zinc-800 bg-[#1e1e1e] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{lang || 'CODE'}</span>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-zinc-300 leading-relaxed bg-[#1e1e1e] select-text">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }}></code>
            </pre>
          </div>
        );
      }
      
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIndex) => {
            let html = line
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-zinc-400 italic">$1</em>')
              .replace(/\[\[(.*?)\]\]/g, '<span class="text-violet-400 font-bold bg-violet-400/10 px-1 py-0.5 rounded cursor-pointer hover:bg-violet-400/20 transition">#$1</span>');
              
            return (
              <React.Fragment key={lIndex}>
                <span dangerouslySetInnerHTML={{ __html: html }} />
                {lIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full text-zinc-100 font-sans overflow-hidden bg-zinc-950">
      
      {/* HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '18px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              BrainNode
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
              className="flex items-center space-x-2 bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition shadow-sm"
            >
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Layout:</span>
              <span className="text-xs font-bold text-violet-400 truncate max-w-[100px]">{activeLayout}</span>
              <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${layoutMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {layoutMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden backdrop-blur-xl">
                {layouts.map(l => (
                  <button
                    key={l}
                    onClick={() => { setActiveLayout(l); setLayoutMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-zinc-800 flex items-center justify-between ${activeLayout === l ? 'text-violet-400 bg-violet-400/5' : 'text-zinc-300'}`}
                  >
                    <span>{l}</span>
                    {activeLayout === l && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>}
                  </button>
                ))}
                <div className="h-px bg-zinc-800 my-1"></div>
                <button
                  onClick={() => {
                    setLayoutMenuOpen(false);
                    const name = prompt("Nama layout baru (tanpa spasi):");
                    if (name && name.trim() !== "") {
                       fetch(`${API_URL}/layouts/${name.trim()}`, { method: 'POST' }).then(() => {
                          setLayouts(prev => { if(!prev.includes(name.trim())) return [...prev, name.trim()]; return prev; });
                          setActiveLayout(name.trim());
                       });
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-400/10 hover:text-indigo-300 transition flex items-center space-x-1.5"
                >
                  <span className="text-lg leading-none">+</span>
                  <span>Buat Layout Baru</span>
                </button>
                {activeLayout !== "default" && (
                  <button
                    onClick={() => {
                      setLayoutMenuOpen(false);
                      if (window.confirm(`Yakin ingin menghapus layout "${activeLayout}" beserta seluruh isinya?`)) {
                        fetch(`${API_URL}/layouts/${activeLayout}`, { method: 'DELETE' }).then(res => res.json()).then(data => {
                          if (data.status === 'success') {
                            setLayouts(prev => prev.filter(l => l !== activeLayout));
                            setActiveLayout("default");
                            showToast(`🗑️ Layout "${activeLayout}" telah dihapus.`);
                          } else {
                            showToast("❌ Gagal menghapus layout.");
                          }
                        });
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 hover:text-red-300 transition flex items-center space-x-2"
                  >
                    <span className="text-[10px]">🗑️</span>
                    <span>Hapus Layout Ini</span>
                  </button>
                )}
              </div>
            )}
          </div>
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
                    const res = await fetch(`${API_URL}/ingest?layout_id=${activeLayout}`, {
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
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Isi / Transkripsi Dokumen</label>
                <button 
                  onClick={() => setIsTypingModalOpen(true)}
                  className="w-full text-left px-3 py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 hover:border-violet-500/50 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate">{ingestBody ? ingestBody.substring(0, 30) + '...' : 'Tulis isi catatan di sini...'}</span>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
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
                  <input value={newCatColor} onChange={e => setNewCatColor(e.target.value)} type="color" className="w-8 h-8 rounded-full overflow-hidden border-0 bg-transparent cursor-pointer p-0 m-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full" />
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

          <div className="absolute top-4 right-4 z-10 flex items-center space-x-3">
            <button 
              onClick={scramble} 
              title="Guncang Layout (Scramble)"
              className="p-2 bg-zinc-900/60 hover:bg-zinc-800/80 backdrop-blur-md border border-zinc-800/50 hover:border-zinc-700/50 text-zinc-400 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] shadow-lg flex items-center justify-center group"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <div className="relative group shadow-lg">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-3.5 h-3.5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                onChange={e => setSearchKeyword(e.target.value.toLowerCase())} 
                type="text" 
                placeholder="Pencarian makna..."
                className="w-56 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-900/90 focus:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300" 
              />
            </div>
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

          {/* TIMELINE TOGGLE BUTTON */}
          <button 
            onClick={() => setShowTimeline(!showTimeline)}
            className="absolute bottom-4 left-4 z-20 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 backdrop-blur shadow-xl hover:bg-zinc-800 transition"
          >
            <span>🕒</span>
            <span>{showTimeline ? 'Tutup Timeline' : 'Time-Travel'}</span>
          </button>

          {/* TIMELINE BAR */}
          <div className={`absolute bottom-16 left-4 right-4 bg-zinc-900/90 border border-zinc-850 backdrop-blur p-4 rounded-2xl max-w-2xl mx-auto shadow-2xl space-y-2 z-10 transition-all duration-300 transform ${showTimeline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
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

          <div className={`absolute bottom-4 left-40 right-16 bg-zinc-900/40 border border-zinc-900/30 backdrop-blur py-2.5 rounded-2xl max-w-lg mx-auto text-center px-4 pointer-events-none z-10 transition-all duration-500 transform ${showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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

      {/* TYPING MODAL */}
      {isTypingModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/98 backdrop-blur-xl z-50 flex flex-col select-text transition-all duration-300">
          <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-lg">
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <span className="text-xl">📝</span>
              <span>Mode Fokus Editor</span>
            </h2>
            <div className="flex items-center space-x-3">
              <button onClick={() => setIngestBody(prev => prev + " [[Nama Node]]")} className="px-3.5 py-1.5 bg-violet-950/40 hover:bg-violet-900/80 border border-violet-900/50 text-violet-400 hover:text-white rounded-xl text-xs font-bold transition">
                + Tautan Wiki
              </button>
              <button onClick={() => setIsTypingModalOpen(false)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20">
                💾 Simpan & Tutup
              </button>
              <button onClick={() => { setIngestBody(""); setIsTypingModalOpen(false); }} className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-bold transition">
                🗑️ Batal & Hapus
              </button>
            </div>
          </header>
          
          <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col tiptap-app-wrapper">
            <TipTapEditor content={ingestBody} onChange={setIngestBody} />
          </main>
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
                  <span>🕒 Est. Membaca: {Math.max(1, Math.ceil(((isReaderEditing ? editBody : selectedNode.content).replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length)/180))} menit</span>
                  <span>•</span><span>{getRelativeTimeString()}</span>
                </div>
              </div>
              <div className="border-t border-zinc-900 pt-8">
                {!isReaderEditing ? (
                  <div className="text-zinc-300 text-sm md:text-base leading-relaxed font-light">
                    {renderRichText(selectedNode.content)}
                  </div>
                ) : (
                  <TipTapEditor content={editBody} onChange={setEditBody} />
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

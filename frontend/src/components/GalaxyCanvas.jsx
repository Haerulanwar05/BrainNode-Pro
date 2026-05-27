import React, { useEffect, useRef } from 'react';

const GalaxyCanvas = ({
  nodes, setNodes,
  links,
  canvasMode,
  searchKeyword,
  currentCategoryFilter,
  currentTimelineStep,
  selectedNode, setSelectedNode,
  hoveredNode, setHoveredNode,
  focusedCluster, setFocusedCluster,
  selectedNodes, setSelectedNodes,
  openReader,
  showToast
}) => {
  const canvasRef = useRef(null);

  // Use refs for mutable interaction state so we don't trigger re-renders
  const dragState = useRef({
    node: null,
    isDragging: false,
    startPos: { x: 0, y: 0 }
  });

  const physicsTime = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let resizeObserver;
    if (canvas.parentElement) {
      let dpr = window.devicePixelRatio || 1;
      
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (entry.target === canvas.parentElement) {
            const width = entry.contentRect.width;
            const height = entry.contentRect.height;
            
            // Set physical buffer size
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            
            // Set CSS size
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            
            // Scale context to match CSS coordinates
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset first
            ctx.scale(dpr, dpr);
          }
        }
      });
      resizeObserver.observe(canvas.parentElement);
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- PHYSICS ---
      if (canvasMode === 'galaxy') {
        physicsTime.current += 0.0003;
        const friction = 0.94;
        const repulsionDist = 120;
        const gravityCluster = 0.003;
        const centerX = canvas.clientWidth / 2;
        const centerY = canvas.clientHeight / 2;
        const gravityCenter = 0.005;

        // 1. Centering force
        nodes.forEach(n => {
          if (n === dragState.current.node || n.createdStep > currentTimelineStep) return;
          const pull = n.isHub ? gravityCenter * 1.5 : gravityCenter * 0.7;
          n.vx += (centerX - n.x) * pull;
          n.vy += (centerY - n.y) * pull;
        });

        // 2. Hub attraction
        nodes.forEach(n => {
          if (n.isHub || n === dragState.current.node || n.createdStep > currentTimelineStep) return;
          let hub = nodes.find(h => h.isHub && h.category === n.category);
          if (hub) {
            n.vx += (hub.x - n.x) * gravityCluster;
            n.vy += (hub.y - n.y) * gravityCluster;
          }
        });

        // 3. Repulsion
        for (let i = 0; i < nodes.length; i++) {
          let n1 = nodes[i];
          if (n1.createdStep > currentTimelineStep) continue;
          for (let j = i + 1; j < nodes.length; j++) {
            let n2 = nodes[j];
            if (n2.createdStep > currentTimelineStep) continue;
            let dx = n2.x - n1.x;
            let dy = n2.y - n1.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < repulsionDist) {
              let force = (repulsionDist - dist) * 0.003;
              let fx = (dx / dist) * force;
              let fy = (dy / dist) * force;
              if (n1 !== dragState.current.node) { n1.vx -= fx; n1.vy -= fy; }
              if (n2 !== dragState.current.node) { n2.vx += fx; n2.vy += fy; }
            }
          }
        }

        // 4. Link spring physics
        links.forEach(l => {
          let n1 = nodes.find(n => n.id === l.source);
          let n2 = nodes.find(n => n.id === l.target);
          if (!n1 || !n2 || n1.createdStep > currentTimelineStep || n2.createdStep > currentTimelineStep) return;
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let restLen = n1.isHub || n2.isHub ? 80 : 130;
          let force = (dist - restLen) * 0.001;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          if (n1 !== dragState.current.node) { n1.vx += fx; n1.vy += fy; }
          if (n2 !== dragState.current.node) { n2.vx -= fx; n2.vy -= fy; }
        });

        // 5. Breathing and Friction
        nodes.forEach(n => {
          if (n === dragState.current.node || n.createdStep > currentTimelineStep) return;
          n.vx += Math.sin(physicsTime.current + n.seed) * 0.0002;
          n.vy += Math.cos(physicsTime.current + n.seed) * 0.0002;
          n.vx *= friction;
          n.vy *= friction;
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      // Safety bounds
      nodes.forEach(n => {
        const b = 45;
        if (isNaN(n.x) || isNaN(n.y)) { n.x = canvas.clientWidth / 2; n.y = canvas.clientHeight / 2; }
        if (isNaN(n.vx) || isNaN(n.vy)) { n.vx = 0; n.vy = 0; }
        if (n.x < b) { n.x = b; n.vx = 0; }
        if (n.x > canvas.clientWidth - b) { n.x = canvas.clientWidth - b; n.vx = 0; }
        if (n.y < b) { n.y = b; n.vy = 0; }
        if (n.y > canvas.clientHeight - b) { n.y = canvas.clientHeight - b; n.vy = 0; }
      });

      // --- RENDER ---
      
      // Draw Explicit Links
      links.forEach(l => {
        let n1 = nodes.find(n => n.id === l.source);
        let n2 = nodes.find(n => n.id === l.target);
        if (!n1 || !n2 || n1.createdStep > currentTimelineStep || n2.createdStep > currentTimelineStep) return;

        let isInCategoryFilter = currentCategoryFilter === "All" || (n1.category === currentCategoryFilter && n2.category === currentCategoryFilter) || (n1.category === "Core" || n2.category === "Core");
        let isFocusedLink = focusedCluster === null || (n1.category === focusedCluster && n2.category === focusedCluster);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);

        if (!isFocusedLink || !isInCategoryFilter) {
          ctx.strokeStyle = "rgba(39, 39, 42, 0.05)";
        } else if (selectedNode && (n1.id === selectedNode.id || n2.id === selectedNode.id)) {
          ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
        } else {
          ctx.strokeStyle = "rgba(161, 161, 170, 0.25)";
        }
        ctx.lineWidth = l.strength || 1.5;
        ctx.stroke();
      });

      // Draw Auto-Links for nodes without explicit connections
      nodes.forEach(n => {
        if (n.isHub || n.createdStep > currentTimelineStep || n.category === "Whiteboard") return;
        
        let hub = nodes.find(h => h.isHub && h.category === n.category);
        if (hub && hub.createdStep <= currentTimelineStep) {
          // Hanya skip auto-link jika node ini SUDAH memiliki link eksplisit spesifik ke Hub-nya
          let hasHubLink = links.some(l => 
            (l.source === n.id && l.target === hub.id) || 
            (l.target === n.id && l.source === hub.id)
          );

          if (!hasHubLink) {
            let isInCategoryFilter = currentCategoryFilter === "All" || (n.category === currentCategoryFilter && hub.category === currentCategoryFilter);
            let isFocusedLink = focusedCluster === null || (n.category === focusedCluster && hub.category === focusedCluster);
            
            ctx.beginPath();
            ctx.moveTo(hub.x, hub.y);
            ctx.lineTo(n.x, n.y);
            
            if (!isFocusedLink || !isInCategoryFilter) {
              ctx.strokeStyle = "rgba(39, 39, 42, 0.05)";
            } else if (selectedNode && (n.id === selectedNode.id || hub.id === selectedNode.id)) {
              ctx.strokeStyle = "rgba(139, 92, 246, 0.6)"; // Match explicit link opacity perfectly
            } else {
              ctx.strokeStyle = "rgba(161, 161, 170, 0.25)"; // Match explicit link opacity perfectly
            }
            ctx.lineWidth = 1.5; // Match explicit line width
            ctx.stroke();
          }
        }
      });

      // Draw Nodes
      nodes.forEach(n => {
        if (n.createdStep > currentTimelineStep) return;

        let isFocusedNode = focusedCluster === null || n.category === focusedCluster;
        let isInCategoryFilter = currentCategoryFilter === "All" || n.category === currentCategoryFilter || n.category === "Core";
        let isMatched = searchKeyword === "" || n.label.toLowerCase().includes(searchKeyword) || n.content.toLowerCase().includes(searchKeyword);

        const isSelected = selectedNode && n.id === selectedNode.id;
        const isHovered = hoveredNode && n.id === hoveredNode.id;
        const isMultiSelected = selectedNodes.includes(n.id);

        ctx.save();
        if (!isFocusedNode || !isInCategoryFilter) {
          ctx.globalAlpha = 0.04;
        } else if (!isMatched) {
          ctx.globalAlpha = 0.2;
        }

        ctx.shadowColor = n.color;
        ctx.shadowBlur = isSelected || isMultiSelected ? 22 : (isHovered || (searchKeyword !== "" && isMatched) ? 14 : 4);

        if (isSelected || isMultiSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size + (isMultiSelected ? 6 : 4), 0, Math.PI * 2);
          ctx.fillStyle = isMultiSelected ? "rgba(139, 92, 246, 0.15)" : `${n.color}15`;
          ctx.fill();
          ctx.strokeStyle = isMultiSelected ? "rgba(139, 92, 246, 0.6)" : `${n.color}35`;
          ctx.lineWidth = isMultiSelected ? 2 : 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "#09090b";
        ctx.fill();

        ctx.restore();

        // Label
        ctx.save();
        if (!isFocusedNode || !isInCategoryFilter) {
          ctx.globalAlpha = 0.05;
        } else if (!isMatched) {
          ctx.globalAlpha = 0.2;
        }
        ctx.font = isSelected ? "bold 10px Inter" : "500 9px Inter";
        ctx.fillStyle = isSelected ? "#ffffff" : (isMatched && searchKeyword !== "" ? "#f59e0b" : "#a1a1aa");
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + n.size + 13);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, links, canvasMode, searchKeyword, currentCategoryFilter, currentTimelineStep, selectedNode, hoveredNode, focusedCluster, selectedNodes]);


  // --- EVENT LISTENERS ---

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const onPointerDown = (e) => {
    const pos = getPos(e);
    dragState.current.startPos = { ...pos };
    dragState.current.isDragging = false;

    let target = nodes.find(n => {
      if (n.createdStep > currentTimelineStep) return false;
      let dx = n.x - pos.x;
      let dy = n.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < n.size + 10;
    });

    if (target) {
      if (e.shiftKey) {
        if (selectedNodes.includes(target.id)) {
          setSelectedNodes(prev => prev.filter(id => id !== target.id));
        } else {
          setSelectedNodes(prev => [...prev, target.id]);
        }
        return;
      }

      if (focusedCluster !== null && target.category !== focusedCluster) return;
      if (currentCategoryFilter !== "All" && target.category !== currentCategoryFilter) return;

      dragState.current.node = target;
      setSelectedNode(target);
    }
  };

  const onPointerMove = (e) => {
    const pos = getPos(e);
    let target = nodes.find(n => {
      if (n.createdStep > currentTimelineStep) return false;
      let dx = n.x - pos.x;
      let dy = n.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < n.size + 10;
    });
    setHoveredNode(target || null);

    const ds = dragState.current;
    if (ds.node) {
      const dx = pos.x - ds.startPos.x;
      const dy = pos.y - ds.startPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 6) {
        ds.isDragging = true;
      }
      ds.node.x = pos.x;
      ds.node.y = pos.y;
    }
  };

  const onPointerUp = () => {
    const ds = dragState.current;
    if (ds.node && !ds.isDragging) {
      openReader(ds.node);
    }
    ds.node = null;
  };

  const onDoubleClick = (e) => {
    const pos = getPos(e);
    let targetHub = nodes.find(n => {
      if (n.createdStep > currentTimelineStep) return false;
      let dx = n.x - pos.x;
      let dy = n.y - pos.y;
      return n.isHub && Math.sqrt(dx * dx + dy * dy) < n.size + 10;
    });

    if (targetHub) {
      setFocusedCluster(targetHub.category);
      showToast(`🎯 Fokus Rumpun: ${targetHub.category}`);
    } else {
      if (focusedCluster !== null) {
        setFocusedCluster(null);
        showToast(`🌍 Menampilkan Semua Rumpun`);
      }
    }
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onDoubleClick={onDoubleClick}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    />
  );
};

export default GalaxyCanvas;

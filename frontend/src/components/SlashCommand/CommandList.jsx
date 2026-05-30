import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = index => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl overflow-hidden flex flex-col p-1.5 w-64 backdrop-blur-xl">
      <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 mb-1">
        Basic Blocks
      </div>
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
              index === selectedIndex ? 'bg-violet-900/40 text-violet-300' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${index === selectedIndex ? 'bg-violet-800 text-white shadow-violet-900/50' : 'bg-zinc-800 text-zinc-400'}`}>
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{item.title}</span>
              {item.description && <span className="text-[10px] text-zinc-500">{item.description}</span>}
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-4 text-xs text-center text-zinc-500">Tidak ada perintah ditemukan</div>
      )}
    </div>
  );
});

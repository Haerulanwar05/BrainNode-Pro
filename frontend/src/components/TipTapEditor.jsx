import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';

// 1. FORMATTING & STYLES
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

// 2. ADVANCED NODES
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';

// 3. UI/UX SMART INTERACTION
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';

// 4. SLASH COMMANDS
import { SlashCommand } from './SlashCommand/extension';
import suggestion from './SlashCommand/suggestion';

// SYNTAX HIGHLIGHTING (Lowlight)
import { all, createLowlight } from 'lowlight';
const lowlight = createLowlight(all);

export default function TipTapEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, 
        heading: { levels: [1, 2, 3] },
      }),
      
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Apa judul yang tepat?';
          return 'Ketik "/" untuk perintah atau mulai menulis ide...';
        },
      }),
      CharacterCount,
      
      SlashCommand.configure({
        suggestion,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external state changes (e.g. clicking wiki link button) back into the editor
  useEffect(() => {
    if (!editor) return;
    const currentEditorHtml = editor.getHTML();
    // If parent's content differs from what TipTap internally holds,
    // force TipTap to parse the parent's content, then immediately tell
    // the parent what the cleanly parsed HTML looks like to avoid infinite loops.
    if (content !== currentEditorHtml) {
      editor.commands.setContent(content || '', false);
      const newlyParsedHtml = editor.getHTML();
      if (content !== newlyParsedHtml) {
        onChange(newlyParsedHtml);
      }
    }
  }, [content, editor, onChange]);

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper w-full flex flex-col space-y-2 relative tiptap-container">
      
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl flex overflow-hidden backdrop-blur-xl">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-2 text-xs font-bold transition hover:bg-zinc-800 ${editor.isActive('bold') ? 'text-violet-400 bg-violet-900/20' : 'text-zinc-300'}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-2 text-xs font-italic transition hover:bg-zinc-800 ${editor.isActive('italic') ? 'text-violet-400 bg-violet-900/20' : 'text-zinc-300'}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-3 py-2 text-xs line-through transition hover:bg-zinc-800 ${editor.isActive('strike') ? 'text-violet-400 bg-violet-900/20' : 'text-zinc-300'}`}>S</button>
          <div className="w-px bg-zinc-700 my-1 mx-1"></div>
          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`px-3 py-2 text-xs font-bold transition hover:bg-zinc-800 ${editor.isActive('highlight') ? 'text-yellow-400 bg-yellow-900/20' : 'text-zinc-300'}`}>Highlighter</button>
        </BubbleMenu>
      )}

      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, placement: 'bottom' }} 
          shouldShow={({ editor }) => editor.isActive('table')}
          className="bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl flex overflow-hidden backdrop-blur-xl divide-x divide-zinc-800"
        >
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-3 py-2 text-[10px] font-bold transition hover:bg-zinc-800 text-zinc-300">
            + Baris Bawah
          </button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-3 py-2 text-[10px] font-bold transition hover:bg-zinc-800 text-zinc-300">
            + Kolom Kanan
          </button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-3 py-2 text-[10px] font-bold transition hover:bg-zinc-800 text-orange-400">
            - Hapus Baris
          </button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-3 py-2 text-[10px] font-bold transition hover:bg-zinc-800 text-orange-400">
            - Hapus Kolom
          </button>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-3 py-2 text-[10px] font-bold transition hover:bg-red-900/40 bg-red-950/20 text-red-400">
            🗑 Hapus Tabel
          </button>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100, placement: 'right' }} className="flex space-x-1 bg-zinc-950/90 p-1 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-md">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition">H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition">H2</button>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition">☑</button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition">&lt;/&gt;</button>
        </FloatingMenu>
      )}

      <EditorContent 
        editor={editor} 
        className="prose prose-invert prose-violet max-w-none min-h-[300px] outline-none flex-1"
      />

      <div className="flex items-center justify-end space-x-4 text-[10px] text-zinc-500 uppercase tracking-widest pt-4 border-t border-zinc-900/50 mt-4">
        <span>{editor.storage.characterCount.words()} Kata</span>
        <span>•</span>
        <span>{editor.storage.characterCount.characters()} Karakter</span>
      </div>
    </div>
  );
}

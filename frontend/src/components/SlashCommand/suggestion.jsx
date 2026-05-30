import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandList from './CommandList';

export default {
  items: ({ query }) => {
    return [
      {
        title: 'Teks Biasa',
        description: 'Mulai menulis dengan teks biasa',
        icon: 'T',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setNode('paragraph').run();
        },
      },
      {
        title: 'Heading 1',
        description: 'Judul utama yang besar',
        icon: 'H1',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        description: 'Sub-judul tingkat medium',
        icon: 'H2',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        description: 'Sub-judul tingkat kecil',
        icon: 'H3',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
        },
      },
      {
        title: 'Daftar Tugas',
        description: 'Checklist interaktif',
        icon: '☑',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: 'Bullet List',
        description: 'Daftar dengan bullet simpel',
        icon: '•',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Blok Kode',
        description: 'Tulis cuplikan kode pemrograman',
        icon: '</>',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: 'Tabel Data',
        description: 'Sisipkan tabel 3 baris 3 kolom',
        icon: '📊',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
  },

  render: () => {
    let component;
    let popup;

    return {
      onStart: props => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

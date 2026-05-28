import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Link2, Heading1, Heading2, Heading3,
  Undo, Redo, Eraser, Palette, Sparkles,
  Maximize2, Minimize2, CheckSquare, Type, Highlighter, X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// ── Color palettes ──────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { name: 'White',        value: '#ffffff' },
  { name: 'Slate',        value: '#cbd5e1' },
  { name: 'Ash',          value: '#94a3b8' },
  { name: 'Midnight',     value: '#475569' },

  { name: 'Neon Cyan',    value: '#00daf3' },
  { name: 'Sky Blue',     value: '#38bdf8' },
  { name: 'Indigo',       value: '#818cf8' },
  { name: 'Violet',       value: '#a78bfa' },

  { name: 'Fuchsia',      value: '#e879f9' },
  { name: 'Rose',         value: '#fb7185' },
  { name: 'Coral',        value: '#f97316' },
  { name: 'Amber',        value: '#fbbf24' },

  { name: 'Lime',         value: '#a3e635' },
  { name: 'Emerald',      value: '#34d399' },
  { name: 'Teal',         value: '#2dd4bf' },
  { name: 'Neon Green',   value: '#4ade80' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Cyber Blue',   value: 'rgba(0,218,243,0.25)' },
  { name: 'Purple Glow',  value: 'rgba(139,92,246,0.30)' },
  { name: 'Hot Pink',     value: 'rgba(236,72,153,0.25)' },
  { name: 'Sunset',       value: 'rgba(249,115,22,0.25)' },
  { name: 'Gold',         value: 'rgba(251,191,36,0.30)' },
  { name: 'Matrix',       value: 'rgba(52,211,153,0.25)' },
  { name: 'Frost',        value: 'rgba(148,163,184,0.20)' },
  { name: 'Void',         value: 'rgba(0,0,0,0.50)' },
];

// ── Font size options ────────────────────────────────────────────────────────
const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];

// ── Font families ────────────────────────────────────────────────────────────
const FONTS = [
  { label: 'Default',       value: 'inherit' },
  { label: 'Inter',         value: 'Inter, sans-serif' },
  { label: 'Roboto',        value: 'Roboto, sans-serif' },
  { label: 'Georgia',       value: 'Georgia, serif' },
  { label: 'Courier New',   value: '"Courier New", monospace' },
  { label: 'Playfair',      value: '"Playfair Display", serif' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [wordCount, setWordCount]       = useState(0);
  const [charCount, setCharCount]       = useState(0);
  const [showColors, setShowColors]     = useState(false);
  const [colorTab, setColorTab]         = useState<'text' | 'highlight'>('text');
  const [customColor, setCustomColor]   = useState('#00daf3');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTable, setShowTable]       = useState(false);
  const [tableHover, setTableHover]     = useState({ r: 0, c: 0 });
  const [fontSize, setFontSize]         = useState('16');
  const [fontFamily, setFontFamily]     = useState('inherit');

  // ── Mount: set initial HTML ───────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<p><br></p>';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Word / char count ─────────────────────────────────────────────────────
  useEffect(() => {
    const text = editorRef.current?.innerText || '';
    const cleaned = text.trim();
    setWordCount(cleaned === '' ? 0 : cleaned.split(/\s+/).length);
    setCharCount(text.length);
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  // ── Save & restore selection ──────────────────────────────────────────────
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // ── Generic execCommand ───────────────────────────────────────────────────
  const exec = (cmd: string, arg = '') => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg || undefined);
    handleInput();
  };

  // ── Font size ─────────────────────────────────────────────────────────────
  const applyFontSize = (size: string) => {
    setFontSize(size);
    editorRef.current?.focus();
    // Use a span wrapper for pixel-accurate sizes
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand('fontSize', false, '7'); // placeholder
      const spans = editorRef.current?.querySelectorAll('font[size="7"]');
      spans?.forEach(s => {
        const el = document.createElement('span');
        el.style.fontSize = `${size}px`;
        el.innerHTML = s.innerHTML;
        s.replaceWith(el);
      });
    } else {
      document.execCommand('fontSize', false, '7');
      const spans = editorRef.current?.querySelectorAll('font[size="7"]');
      spans?.forEach(s => {
        const el = document.createElement('span');
        el.style.fontSize = `${size}px`;
        el.innerHTML = s.innerHTML;
        s.replaceWith(el);
      });
    }
    handleInput();
  };

  // ── Font family ───────────────────────────────────────────────────────────
  const applyFontFamily = (family: string) => {
    setFontFamily(family);
    editorRef.current?.focus();
    document.execCommand('fontName', false, family);
    handleInput();
  };

  // ── Text / Highlight color ────────────────────────────────────────────────
  const applyTextColor = (color: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color);
    handleInput();
    setShowColors(false);
  };

  const applyHighlight = (color: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('hiliteColor', false, color);
    handleInput();
    setShowColors(false);
  };

  // ── Insert Table (direct DOM, avoids execCommand sanitization) ────────────
  const insertTable = (rows: number, cols: number) => {
    setShowTable(false);
    editorRef.current?.focus();

    // Build table element
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;margin:16px 0;';
    table.setAttribute('data-diary-table', '1');

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const cell = r === 0 ? document.createElement('th') : document.createElement('td');
        cell.style.cssText = r === 0
          ? 'border:1px solid rgba(0,218,243,0.3);padding:10px 14px;background:rgba(0,218,243,0.08);color:#00daf3;font-weight:600;text-align:left;'
          : 'border:1px solid rgba(255,255,255,0.1);padding:10px 14px;text-align:left;';
        cell.innerHTML = r === 0 ? `Header ${c + 1}` : '&nbsp;';
        cell.setAttribute('contenteditable', 'true');
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    }

    const br = document.createElement('p');
    br.innerHTML = '<br>';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(br);
      range.insertNode(table);
      range.setStartAfter(br);
      range.setEndAfter(br);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.appendChild(table);
      editorRef.current?.appendChild(br);
    }

    handleInput();
  };

  // ── Insert Link ───────────────────────────────────────────────────────────
  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  };

  // ── Insert Code Block ─────────────────────────────────────────────────────
  const handleInsertCode = () => {
    const pre = document.createElement('pre');
    pre.style.cssText = 'background:rgba(0,0,0,0.45);border-left:4px solid #8b5cf6;padding:16px;font-family:monospace;border-radius:8px;color:#a5b4fc;overflow-x:auto;margin:12px 0;';
    pre.innerHTML = '<code>Code snippet here</code>';
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(p);
      range.insertNode(pre);
    } else {
      editorRef.current?.appendChild(pre);
      editorRef.current?.appendChild(p);
    }
    handleInput();
  };

  // ── Insert Checkbox ───────────────────────────────────────────────────────
  const handleInsertCheckbox = () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:10px;margin:6px 0;';
    wrap.innerHTML = `<input type="checkbox" style="accent-color:#00daf3;width:16px;height:16px;" /><span contenteditable="true" style="color:#e2e8f0;">Task item</span>`;
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(p);
      range.insertNode(wrap);
    } else {
      editorRef.current?.appendChild(wrap);
      editorRef.current?.appendChild(p);
    }
    handleInput();
  };

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-color-picker]')) setShowColors(false);
      if (!target.closest('[data-table-picker]')) setShowTable(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Table hover grid (8×8) ────────────────────────────────────────────────
  const TABLE_GRID = 8;

  // ── Toolbar button style ──────────────────────────────────────────────────
  const btn = 'p-2 text-slate-400 hover:bg-white/8 hover:text-cyan-300 rounded-xl transition-all active:scale-90 select-none';

  return (
    <div className={`flex flex-col rounded-3xl border border-white/10 overflow-hidden transition-all duration-300 ${
      isFullScreen
        ? 'fixed inset-3 z-[999] bg-[#07070f] shadow-[0_0_60px_rgba(0,218,243,0.15)]'
        : 'relative'
    }`} style={{ background: 'rgba(8,8,20,0.85)', backdropFilter: 'blur(24px)' }}>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-2 select-none"
           style={{ background: 'rgba(15,15,30,0.70)' }}>

        {/* Font family */}
        <select
          value={fontFamily}
          onChange={e => applyFontFamily(e.target.value)}
          className="h-7 px-2 text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          style={{ maxWidth: 110 }}
        >
          {FONTS.map(f => <option key={f.value} value={f.value} style={{ background: '#0f0f1e' }}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <select
          value={fontSize}
          onChange={e => applyFontSize(e.target.value)}
          className="h-7 px-2 text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          style={{ width: 58 }}
        >
          {FONT_SIZES.map(s => <option key={s} value={s} style={{ background: '#0f0f1e' }}>{s}pt</option>)}
        </select>

        <Sep />

        {/* Undo / Redo */}
        <button type="button" onClick={() => exec('undo')} className={btn} title="Undo (Ctrl+Z)"><Undo size={15}/></button>
        <button type="button" onClick={() => exec('redo')} className={btn} title="Redo"><Redo size={15}/></button>

        <Sep />

        {/* Headings */}
        <button type="button" onClick={() => exec('formatBlock', '<h1>')} className={btn} title="Heading 1"><Heading1 size={15}/></button>
        <button type="button" onClick={() => exec('formatBlock', '<h2>')} className={btn} title="Heading 2"><Heading2 size={15}/></button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className={btn} title="Heading 3"><Heading3 size={15}/></button>

        <Sep />

        {/* Character formatting */}
        <button type="button" onClick={() => exec('bold')}          className={btn} title="Bold (Ctrl+B)"><Bold size={15}/></button>
        <button type="button" onClick={() => exec('italic')}        className={btn} title="Italic (Ctrl+I)"><Italic size={15}/></button>
        <button type="button" onClick={() => exec('underline')}     className={btn} title="Underline (Ctrl+U)"><Underline size={15}/></button>
        <button type="button" onClick={() => exec('strikeThrough')} className={btn} title="Strikethrough"><Strikethrough size={15}/></button>

        <Sep />

        {/* Alignment */}
        <button type="button" onClick={() => exec('justifyLeft')}   className={btn} title="Align Left"><AlignLeft size={15}/></button>
        <button type="button" onClick={() => exec('justifyCenter')} className={btn} title="Center"><AlignCenter size={15}/></button>
        <button type="button" onClick={() => exec('justifyRight')}  className={btn} title="Align Right"><AlignRight size={15}/></button>
        <button type="button" onClick={() => exec('justifyFull')}   className={btn} title="Justify"><AlignJustify size={15}/></button>

        <Sep />

        {/* Lists */}
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btn} title="Bullet List"><List size={15}/></button>
        <button type="button" onClick={() => exec('insertOrderedList')}   className={btn} title="Numbered List"><ListOrdered size={15}/></button>

        <Sep />

        {/* ── TABLE PICKER ── */}
        <div className="relative" data-table-picker>
          <button
            type="button"
            onClick={() => { saveSelection(); setShowTable(s => !s); }}
            className={btn}
            title="Insert Table"
          >
            <Table size={15}/>
          </button>

          {showTable && (
            <div className="absolute left-0 top-full mt-2 z-50 p-3 rounded-2xl border border-cyan-500/20 shadow-2xl"
                 style={{ background: 'rgba(7,7,20,0.97)', backdropFilter: 'blur(20px)', minWidth: 220 }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
                {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c} Table` : 'Select table size'}
              </p>
              <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${TABLE_GRID}, 1fr)` }}>
                {Array.from({ length: TABLE_GRID * TABLE_GRID }).map((_, i) => {
                  const row = Math.floor(i / TABLE_GRID) + 1;
                  const col = (i % TABLE_GRID) + 1;
                  const active = row <= tableHover.r && col <= tableHover.c;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setTableHover({ r: row, c: col })}
                      onClick={() => insertTable(tableHover.r, tableHover.c)}
                      className="w-5 h-5 rounded cursor-pointer border transition-all"
                      style={{
                        borderColor: active ? 'rgba(0,218,243,0.7)' : 'rgba(255,255,255,0.1)',
                        background: active ? 'rgba(0,218,243,0.18)' : 'rgba(255,255,255,0.03)',
                      }}
                    />
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  const r = parseInt(window.prompt('Rows:', '3') || '0');
                  const c = parseInt(window.prompt('Columns:', '3') || '0');
                  if (r > 0 && c > 0) insertTable(r, c);
                }}
                className="mt-2 w-full text-[10px] text-slate-400 hover:text-cyan-300 transition-colors py-1"
              >
                Custom size…
              </button>
            </div>
          )}
        </div>

        {/* Link */}
        <button type="button" onClick={handleInsertLink} className={btn} title="Insert Link"><Link2 size={15}/></button>

        {/* Code block */}
        <button
          type="button"
          onClick={handleInsertCode}
          className={`${btn} font-mono text-[11px] font-bold`}
          title="Code Block"
        >&lt;/&gt;</button>

        {/* Checkbox */}
        <button type="button" onClick={handleInsertCheckbox} className={btn} title="Checklist Item"><CheckSquare size={15}/></button>

        <Sep />

        {/* ── COLOR PICKER ── */}
        <div className="relative" data-color-picker>
          <button
            type="button"
            onClick={() => { saveSelection(); setShowColors(s => !s); }}
            className={`${btn} flex items-center gap-1`}
            title="Text / Highlight Color"
          >
            <Palette size={15}/>
          </button>

          {showColors && (
            <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                 style={{ background: 'rgba(7,7,20,0.97)', backdropFilter: 'blur(20px)', width: 260 }}>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {(['text', 'highlight'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setColorTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all ${
                      colorTab === tab
                        ? 'text-cyan-300 border-b-2 border-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab === 'text' ? <Type size={12}/> : <Highlighter size={12}/>}
                    {tab === 'text' ? 'Text Color' : 'Highlight'}
                  </button>
                ))}
              </div>

              <div className="p-3">
                {colorTab === 'text' ? (
                  <>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-2">Preset Colors</p>
                    <div className="grid grid-cols-8 gap-1.5 mb-3">
                      {TEXT_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => applyTextColor(c.value)}
                          title={c.name}
                          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/40 transition-all hover:scale-110 active:scale-90"
                          style={{ backgroundColor: c.value, boxShadow: `0 0 8px ${c.value}55` }}
                        />
                      ))}
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">Custom</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                        style={{ padding: '2px' }}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="flex-1 h-8 px-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => applyTextColor(customColor)}
                        className="h-8 px-3 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#00daf3,#8b5cf6)' }}
                      >Apply</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-2">Highlight Colors</p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => applyHighlight(c.value)}
                          title={c.name}
                          className="h-9 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:scale-105 active:scale-95 text-[9px] font-bold text-white/70"
                          style={{ background: c.value }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyHighlight('transparent')}
                      className="w-full py-2 rounded-xl border border-white/10 text-[10px] text-slate-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-1"
                    >
                      <X size={11}/> Remove Highlight
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear formatting */}
        <button type="button" onClick={() => exec('removeFormat')} className={btn} title="Clear Formatting"><Eraser size={15}/></button>

        <div className="flex-grow"/>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={() => setIsFullScreen(s => !s)}
          className={btn}
          title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullScreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
        </button>
      </div>

      {/* ── EDITOR ── */}
      <div className={`flex-grow overflow-y-auto px-6 md:px-10 py-6 ${isFullScreen ? 'max-h-[calc(100vh-120px)]' : 'min-h-[440px] max-h-[620px]'}`}
           style={{ scrollbarWidth: 'none' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className="w-full min-h-[400px] outline-none border-none focus:ring-0 rich-editor-content"
          style={{ caretColor: '#00daf3', fontSize: `${fontSize}px`, fontFamily }}
        />
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center justify-between border-t border-white/8 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none"
           style={{ background: 'rgba(10,10,25,0.60)' }}>
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-cyan-400">{wordCount}</strong></span>
          <span>Chars: <strong className="text-cyan-400">{charCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-500/60">
          <Sparkles size={10} className="animate-pulse"/>
          <span>Encrypted</span>
        </div>
      </div>
    </div>
  );
}

/** Thin vertical divider */
function Sep() {
  return <div className="h-5 w-px mx-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}/>;
}

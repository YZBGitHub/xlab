import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRightLeft, MousePointer2, Redo, Trash2, Undo, X } from 'lucide-react';

type Endpoint = { node: string; port: string };
type Connection = { id: string; source: Endpoint; target: Endpoint };
type Point = { x: number; y: number };
const colors: Record<string, string> = { red: '#ef4444', black: '#374151', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' };
const labels: Record<string, string> = { red: '电源 +', black: '电源 −', blue: '信号 A', green: '信号 B', yellow: '辅助信号' };
const shortLabels: Record<string, string> = { red: 'VS', black: 'GND', blue: 'RS485A', green: 'RS485B', yellow: 'IO' };
const keyOf = (endpoint: Endpoint) => `${endpoint.node}:${endpoint.port}`;
const colorOf = (endpoint: Endpoint) => endpoint.port.split('-')[1];
const initialConnections = (): Connection[] => [
  ['ha', 'pwr', 'red'], ['pwr', 'keypad', 'red'],
  ['ha', 'pwr', 'black'], ['pwr', 'keypad', 'black'],
  ['ha', 'keypad', 'blue'], ['keypad', 'adam', 'blue'],
  ['ha', 'keypad', 'green'], ['keypad', 'adam', 'green'],
].map(([source, target, color], index) => ({
  id: `initial-${index}`,
  source: { node: source, port: `bottom-${color}` },
  target: { node: target, port: `${target === 'adam' ? 'top' : 'bottom'}-${color}` },
}));

function useConnectionState(imported: boolean, connections?: Connection[]) {
  const [history, setHistory] = useState<{ past: Connection[][]; present: Connection[]; future: Connection[][] }>(() => ({ past: [], present: imported ? [] : connections ?? initialConnections(), future: [] }));
  const [pending, setPending] = useState<Endpoint | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'connect'>('select');
  const [message, setMessage] = useState('拖动端口接线，或依次点击两个同色端口');
  const ports = useRef(new Map<string, HTMLButtonElement>());
  const commit = (update: (connections: Connection[]) => Connection[]) => {
    setHistory(previous => ({ past: [...previous.past, previous.present].slice(-50), present: update(previous.present), future: [] }));
  };
  const cancel = () => { setPending(null); setMessage('已取消接线'); };
  const connect = (target: Endpoint) => {
    if (!pending) { setPending(target); setSelected(null); setMessage('选择同色端口完成连接 · Esc 取消'); return; }
    if (keyOf(pending) === keyOf(target)) { cancel(); return; }
    if (pending.node === target.node) { setMessage('不能连接同一设备，请选择其他设备的端口'); return; }
    if (colorOf(pending) !== colorOf(target)) { setMessage('端口类型不匹配，请选择同色端口'); return; }
    if (history.present.some(connection =>
      (keyOf(connection.source) === keyOf(pending) && keyOf(connection.target) === keyOf(target)) ||
      (keyOf(connection.target) === keyOf(pending) && keyOf(connection.source) === keyOf(target)))) {
      setMessage('这两个端口已经连接，请选择其他端口'); return;
    }
    commit(connections => [...connections, { id: crypto.randomUUID(), source: pending, target }]);
    setPending(null);
    setMessage('连接已创建 · 点击连线可选中并删除');
  };
  const removeSelected = () => {
    if (!selected) return;
    commit(connections => connections.filter(connection => connection.id !== selected));
    setSelected(null);
    setMessage('连线已删除，可撤销恢复');
  };
  const connectNodes = (sourceNode: string, targetNode: string) => {
    if (sourceNode === targetNode) return;
    const registered = [...ports.current.keys()];
    const additions = Object.keys(colors).flatMap(color => {
      const sourceKey = registered.find(key => key.startsWith(`${sourceNode}:`) && key.endsWith(`-${color}`));
      const targetKey = registered.find(key => key.startsWith(`${targetNode}:`) && key.endsWith(`-${color}`));
      if (!sourceKey || !targetKey) return [];
      return [{ id: crypto.randomUUID(), source: { node: sourceNode, port: sourceKey.slice(sourceNode.length + 1) }, target: { node: targetNode, port: targetKey.slice(targetNode.length + 1) } }];
    });
    setHistory(previous => {
      const missing = additions.filter(candidate => !previous.present.some(connection =>
        (keyOf(connection.source) === keyOf(candidate.source) && keyOf(connection.target) === keyOf(candidate.target)) ||
        (keyOf(connection.source) === keyOf(candidate.target) && keyOf(connection.target) === keyOf(candidate.source))));
      if (!missing.length) return previous;
      return { past: [...previous.past, previous.present].slice(-50), present: [...previous.present, ...missing], future: [] };
    });
  };
  const undo = () => {
    setHistory(previous => previous.past.length ? { past: previous.past.slice(0, -1), present: previous.past[previous.past.length - 1], future: [previous.present, ...previous.future] } : previous);
    setPending(null); setSelected(null);
    setMessage('已撤销连线操作');
  };
  const redo = () => {
    setHistory(previous => previous.future.length ? { past: [...previous.past, previous.present], present: previous.future[0], future: previous.future.slice(1) } : previous);
    setPending(null); setSelected(null);
    setMessage('已重做连线操作');
  };
  const removeNode = (node: string) => {
    const filter = (connections: Connection[]) => connections.filter(connection => connection.source.node !== node && connection.target.node !== node);
    setHistory(previous => ({ past: previous.past.map(filter), present: filter(previous.present), future: previous.future.map(filter) }));
    if (pending?.node === node) setPending(null);
    setSelected(null);
  };
  return { history, pending, setPending, selected, setSelected, mode, setMode, message, setMessage, ports, connect, connectNodes, cancel, removeSelected, undo, redo, removeNode };
}

const ConnectionContext = createContext<ReturnType<typeof useConnectionState> | null>(null);
export const useConnections = () => useContext(ConnectionContext)!;

export function ConnectionProvider({ imported, connections, children }: { imported: boolean; connections?: Connection[]; children?: React.ReactNode; key?: string }) {
  const state = useConnectionState(imported, connections);
  return <ConnectionContext.Provider value={state}>{children}</ConnectionContext.Provider>;
}

export function ConnectionTools() {
  const editor = useConnections();
  const actions = [
    { label: '选择', icon: MousePointer2, active: editor.mode === 'select', action: () => { editor.setMode('select'); editor.setPending(null); } },
    { label: '连线', icon: ArrowRightLeft, active: editor.mode === 'connect', action: () => { editor.setMode('connect'); editor.setMessage('点击或拖动端口开始接线 · Esc 取消'); } },
    { label: '撤销连线操作', icon: Undo, disabled: !editor.history.past.length, action: editor.undo },
    { label: '重做连线操作', icon: Redo, disabled: !editor.history.future.length, action: editor.redo },
    { label: '删除选中连线', icon: Trash2, disabled: !editor.selected, action: editor.removeSelected },
  ];
  return <div className="flex items-center gap-1">{actions.map(action => <button key={action.label} type="button" title={action.label} aria-label={action.label} aria-pressed={action.active} disabled={action.disabled} onClick={action.action} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${action.active ? 'bg-[#eaf8ff] text-[#00a8e8] border border-[#9bd9f3]' : 'text-[#526e81] hover:bg-[#eff6fa]'}`}><action.icon size={17} /></button>)}</div>;
}

export function ConnectionPort({ node, port }: { node: string; port: string; key?: string }) {
  const editor = useConnections();
  const element = useRef<HTMLButtonElement>(null);
  const endpoint = { node, port };
  const key = keyOf(endpoint);
  const color = colorOf(endpoint);
  const active = editor.pending && keyOf(editor.pending) === key;
  const compatible = editor.pending && editor.pending.node !== node && colorOf(editor.pending) === color;
  const connected = editor.history.present.some(connection => keyOf(connection.source) === key || keyOf(connection.target) === key);
  useLayoutEffect(() => {
    editor.ports.current.set(key, element.current!);
    return () => { editor.ports.current.delete(key); };
  }, [key, editor.ports]);
  return <button ref={element} type="button" data-port-node={node} data-port-id={port} aria-label={`${node} ${labels[color] || color}`} aria-pressed={!!active} title={`${labels[color] || color}${connected ? ' · 已连接，可继续接线' : ' · 点击或拖动接线'}`} onMouseDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); if (event.detail === 0) editor.connect(endpoint); }} className={`relative w-11 h-9 flex flex-col items-center justify-start gap-0.5 rounded cursor-crosshair touch-none focus-visible:outline-2 focus-visible:outline-blue-500 ${active ? 'bg-blue-50 ring-2 ring-blue-400' : compatible ? 'bg-emerald-50 ring-2 ring-emerald-400' : 'hover:bg-[#edf7fb]'} ${editor.pending && !active && !compatible ? 'opacity-35' : ''}`}>
    <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: colors[color], boxShadow: connected ? `0 0 0 1px ${colors[color]}` : undefined }} />
    <span className="text-[8px] leading-none whitespace-nowrap text-[#5e7586] font-medium">{shortLabels[color] || color}</span>
  </button>;
}

type ConnectionCanvasProps = React.HTMLAttributes<HTMLDivElement> & {
  nodeIds: string[];
  selectedNodeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDeleteNodes: (ids: string[]) => void;
};

export function ConnectionCanvas({ children, nodeIds, selectedNodeIds, onSelectionChange, onDeleteNodes, ...props }: ConnectionCanvasProps) {
  const editor = useConnections();
  const surface = useRef<HTMLDivElement>(null);
  const wireLayer = useRef<SVGSVGElement>(null);
  const gesture = useRef<{ endpoint: Endpoint; x: number; y: number; existing: boolean } | null>(null);
  const [points, setPoints] = useState<Record<string, Point>>({});
  const [cursor, setCursor] = useState<Point | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const selectionGesture = useRef<{ start: Point; initial: string[] } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const canvas = surface.current!;
    let frame = 0;
    const measure = () => {
      const matrix = wireLayer.current?.getScreenCTM()?.inverse();
      if (!matrix) return;
      const next: Record<string, Point> = {};
      editor.ports.current.forEach((element, key) => {
        const rect = element.getBoundingClientRect();
        const anchor = new DOMPoint(rect.left + rect.width / 2, rect.top + rect.height / 2).matrixTransform(matrix);
        next[key] = { x: anchor.x, y: anchor.y };
      });
      setPoints(next);
      setSize({ width: Math.max(canvas.clientWidth, ...Object.values(next).map(point => point.x + 120)), height: Math.max(canvas.clientHeight, ...Object.values(next).map(point => point.y + 100)) });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new MutationObserver(schedule);
    observer.observe(canvas, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    const resize = new ResizeObserver(schedule);
    resize.observe(canvas);
    canvas.addEventListener('load', schedule, true);
    measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); canvas.removeEventListener('load', schedule, true); };
  }, [editor.ports]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable], [role="dialog"]') || document.querySelector('[aria-modal="true"]')) return;
      if (!surface.current?.contains(target) && target !== document.body) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault(); editor.setSelected(null); onSelectionChange(nodeIds); return;
      }
      if (event.key === 'Escape') { editor.cancel(); editor.setSelected(null); onSelectionChange([]); selectionGesture.current = null; setSelectionBox(null); }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length) {
        event.preventDefault();
        selectedNodeIds.forEach(id => editor.removeNode(id));
        onDeleteNodes(selectedNodeIds);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && editor.selected) { event.preventDefault(); editor.removeSelected(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? editor.redo() : editor.undo(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [editor, nodeIds, selectedNodeIds, onSelectionChange, onDeleteNodes]);
  const findPort = (target: Element | null): Endpoint | null => {
    const port = target?.closest<HTMLButtonElement>('[data-port-node]');
    return port && surface.current?.contains(port) ? { node: port.dataset.portNode!, port: port.dataset.portId! } : null;
  };
  const pointAt = (event: React.PointerEvent) => {
    const matrix = wireLayer.current!.getScreenCTM()!.inverse();
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  };
  const path = (start: Point, end: Point, index: number) => {
    const spacing = 28 + index % 5 * 10;
    const bend = Math.max(start.y, end.y) + spacing;
    return `M ${start.x} ${start.y} V ${bend} H ${end.x} V ${end.y}`;
  };
  const start = editor.pending && points[keyOf(editor.pending)];
  const selectionPoint = (event: React.PointerEvent) => {
    const canvas = surface.current!;
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left + canvas.scrollLeft, y: event.clientY - bounds.top + canvas.scrollTop };
  };
  const updateSelection = (event: React.PointerEvent) => {
    const current = selectionGesture.current;
    if (!current) return;
    const point = selectionPoint(event);
    const box = { left: Math.min(current.start.x, point.x), top: Math.min(current.start.y, point.y), width: Math.abs(point.x - current.start.x), height: Math.abs(point.y - current.start.y) };
    if (box.width < 4 && box.height < 4) return;
    setSelectionBox(box);
    const canvas = surface.current!;
    const bounds = canvas.getBoundingClientRect();
    const nodes = Array.from(canvas.querySelectorAll('[data-device-id]') as NodeListOf<HTMLElement>);
    const hits = nodes.filter(node => {
      const rect = node.getBoundingClientRect();
      const left = rect.left - bounds.left + canvas.scrollLeft;
      const top = rect.top - bounds.top + canvas.scrollTop;
      return left <= box.left + box.width && left + rect.width >= box.left && top <= box.top + box.height && top + rect.height >= box.top;
    }).map(node => node.dataset.deviceId!);
    onSelectionChange([...new Set([...current.initial, ...hits])]);
  };
  return <div {...props} ref={surface} tabIndex={0} aria-label="仿真设备连线画布" onContextMenu={event => { if (editor.pending) { event.preventDefault(); editor.cancel(); } }} onPointerDown={event => {
    if (event.button !== 0) return;
    const endpoint = findPort(event.target as Element);
    if (endpoint) {
      onSelectionChange([]);
      event.preventDefault();
      gesture.current = { endpoint, x: event.clientX, y: event.clientY, existing: !!editor.pending };
      if (!editor.pending) editor.connect(endpoint);
      setCursor(pointAt(event));
      event.currentTarget.setPointerCapture(event.pointerId);
    } else if (!(event.target as Element).closest('[data-device-id], button, input, select, textarea, [role="button"], .design-floating')) {
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      editor.setSelected(null);
      const additive = event.ctrlKey || event.metaKey || event.shiftKey;
      if (!additive) onSelectionChange([]);
      if (editor.pending) editor.cancel();
      if (editor.mode === 'select') {
        selectionGesture.current = { start: selectionPoint(event), initial: additive ? selectedNodeIds : [] };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  }} onPointerMove={event => { updateSelection(event); if (editor.pending) setCursor(pointAt(event)); }} onPointerUp={event => {
    if (selectionGesture.current) {
      updateSelection(event);
      selectionGesture.current = null;
      setSelectionBox(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const target = findPort(document.elementFromPoint(event.clientX, event.clientY));
    const dragged = Math.hypot(event.clientX - current.x, event.clientY - current.y) > 5;
    if (target && (current.existing || keyOf(target) !== keyOf(current.endpoint))) editor.connect(target);
    else if (dragged) editor.cancel();
  }} onPointerCancel={() => { gesture.current = null; selectionGesture.current = null; setSelectionBox(null); editor.cancel(); }}>
    <svg ref={wireLayer} width={size.width} height={size.height} className="absolute left-0 top-0 pointer-events-none z-0" aria-label="设备连线">
      {editor.history.present.map((connection, index) => {
        const source = points[keyOf(connection.source)];
        const target = points[keyOf(connection.target)];
        if (!source || !target) return null;
        const selected = connection.id === editor.selected;
        const route = path(source, target, index);
        return <g key={connection.id}>
          {selected && <path d={route} stroke="#bfdbfe" strokeWidth={8} fill="none" strokeLinejoin="round" />}
          <path d={route} stroke={colors[colorOf(connection.source)]} strokeWidth={selected ? 3 : 2} fill="none" strokeLinejoin="round" />
          <path d={route} stroke="transparent" strokeWidth={16} fill="none" className="pointer-events-auto cursor-pointer" role="button" tabIndex={0} aria-label={`选择连线 ${connection.source.node} 到 ${connection.target.node} ${labels[colorOf(connection.source)]}`} onClick={() => { onSelectionChange([]); surface.current?.focus({ preventScroll: true }); editor.setSelected(connection.id); editor.setPending(null); editor.setMessage('已选中连线 · 按 Delete 删除，或使用工具栏'); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectionChange([]); editor.setSelected(connection.id); editor.setPending(null); } }} />
        </g>;
      })}
      {start && cursor && <path d={path(start, cursor, 0)} stroke={colors[colorOf(editor.pending!)]} strokeWidth={2} strokeDasharray="6 4" fill="none" />}
    </svg>
    {children}
    {selectionBox && <div aria-label="设备框选区域" className="device-selection-box absolute pointer-events-none z-40" style={selectionBox} />}
    {editor.pending && <div className="sticky top-3 left-3 w-fit max-w-[90%] z-20 flex items-center gap-3 rounded-lg border border-[#a9daf0] bg-white/95 px-3 py-2 text-xs text-[#587184] shadow-sm" onMouseDown={event => event.stopPropagation()}>
      <span role="status" aria-live="polite">{editor.message}</span>
      <button type="button" aria-label="取消接线" onClick={editor.cancel}><X size={14} /></button>
    </div>}
  </div>;
}

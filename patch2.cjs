const fs = require('fs');

let useDraggableCode = fs.readFileSync('src/hooks/useDraggable.ts', 'utf8');
useDraggableCode = useDraggableCode.replace(
  'export function useDraggable(initialPosition = { x: 0, y: 0 }) {',
  'export function useDraggable(initialPosition = { x: 0, y: 0 }, onDrag?: (pos: {x: number, y: number}) => void) {'
);
useDraggableCode = useDraggableCode.replace(
  /setPosition\(\{[\s\S]*?y: e.clientY - dragStartPos.current.y[\s\S]*?\}\);/,
  `const newPos = { x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y };\n      setPosition(newPos);\n      if (onDrag) onDrag(newPos);`
);

fs.writeFileSync('src/hooks/useDraggable.ts', useDraggableCode);

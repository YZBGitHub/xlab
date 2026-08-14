const fs = require('fs');

let code = fs.readFileSync('src/pages/DesignPage.tsx', 'utf8');

// The `DraggableNode` component definition needs to accept `onDrag` and `id` and pass to `DraggableContainer`
code = code.replace(
  /function DraggableNode\(\{ title, subtitle, icon, style, ports, headerClass="bg-gray-100" \}: any\) \{/,
  'function DraggableNode({ id, title, subtitle, icon, style, ports, headerClass="bg-gray-100", onDrag }: any) {'
);

code = code.replace(
  /<DraggableContainer className="absolute border border-gray-300 shadow-md bg-white rounded flex flex-col items-center cursor-move hover:shadow-xl transition-shadow z-10 group"\s+style=\{style\}\s+>/,
  '<DraggableContainer className="absolute border border-gray-300 shadow-md bg-white rounded flex flex-col items-center cursor-move hover:shadow-xl transition-shadow z-10 group"\n      style={style}\n      onDrag={onDrag}\n      id={id}\n    >'
);

// DraggableContainer needs to accept id and onDrag
code = code.replace(
  /function DraggableContainer\(\{ children, className, style \}: any\) \{/,
  'function DraggableContainer({ children, className, style, id, onDrag }: any) {'
);

// Pass onDrag to useDraggable
code = code.replace(
  /const \{ position, handleMouseDown \} = useDraggable\(\{ x: 0, y: 0 \}\);/,
  'const { position, handleMouseDown } = useDraggable({ x: 0, y: 0 }, onDrag);'
);

fs.writeFileSync('src/pages/DesignPage.tsx', code);

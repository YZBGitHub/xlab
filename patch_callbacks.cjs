const fs = require('fs');

let code = fs.readFileSync('src/pages/DesignPage.tsx', 'utf8');

const onDragCallback = `const handleNodeDrag = (id: string) => (pos: {x: number, y: number}) => {
    setNodeOffsets(prev => ({...prev, [id]: pos}));
  };`;

// Insert the callback generator
code = code.replace(
  /const allDevices = useMemo/,
  `${onDragCallback}\n  const allDevices = useMemo`
);

// HA Node
code = code.replace(
  /<DraggableNode\s+title="温湿度HA_61"/,
  '<DraggableNode id="ha" onDrag={handleNodeDrag("ha")} title="温湿度HA_61"'
);

// Power Supply Node
code = code.replace(
  /<DraggableNode\s+title="5V Power Supply"/,
  '<DraggableNode id="pwr" onDrag={handleNodeDrag("pwr")} title="5V Power Supply"'
);

// ADAM Node
code = code.replace(
  /<DraggableNode\s+title="ADAM-4055"/,
  '<DraggableNode id="adam" onDrag={handleNodeDrag("adam")} title="ADAM-4055"'
);

// Keypad (DraggableContainer)
code = code.replace(
  /<DraggableContainer className="absolute top-\[60px\] left-\[550px\] w-28 border border-gray-300 shadow-xl bg-white rounded flex flex-col items-center p-2 z-10 cursor-move hover:shadow-2xl transition-shadow group">/,
  '<DraggableContainer id="keypad" onDrag={handleNodeDrag("keypad")} className="absolute top-[60px] left-[550px] w-28 border border-gray-300 shadow-xl bg-white rounded flex flex-col items-center p-2 z-10 cursor-move hover:shadow-2xl transition-shadow group">'
);

fs.writeFileSync('src/pages/DesignPage.tsx', code);

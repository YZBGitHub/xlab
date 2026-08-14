const fs = require('fs');

let code = fs.readFileSync('src/pages/DesignPage.tsx', 'utf8');

const wireComponents = `
const Wire = ({ start, end, color, dasharray, offset = 30 }: any) => {
  const midY = Math.max(start.y, end.y) + offset;
  return (
    <path 
      d={\`M \${start.x} \${start.y} L \${start.x} \${midY} L \${end.x} \${midY} L \${end.x} \${end.y}\`}
      stroke={color} 
      strokeWidth="2" 
      fill="none" 
      strokeDasharray={dasharray}
      className="drop-shadow-sm transition-all duration-75" 
    />
  );
};

function WireRenderer({ nodeOffsets }: any) {
  const getPos = (baseX: number, baseY: number, nodeId: string) => {
    const offset = nodeOffsets[nodeId] || { x: 0, y: 0 };
    return { x: baseX + offset.x, y: baseY + offset.y };
  };

  const haRed = getPos(140, 170, 'ha');
  const haBlack = getPos(160, 170, 'ha');
  const haBlue = getPos(180, 170, 'ha');
  const haGreen = getPos(200, 170, 'ha');

  const pwrRed = getPos(345, 170, 'pwr');
  const pwrBlack = getPos(370, 170, 'pwr');

  const keypadRed = getPos(570, 240, 'keypad');
  const keypadBlack = getPos(595, 240, 'keypad');
  const keypadBlue = getPos(620, 240, 'keypad');
  const keypadGreen = getPos(645, 240, 'keypad');

  const adamBlue = getPos(380, 320, 'adam');
  const adamGreen = getPos(410, 320, 'adam');

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Wire start={haRed} end={pwrRed} color="#ef4444" offset={50} />
      <Wire start={pwrRed} end={keypadRed} color="#ef4444" offset={10} />
      
      <Wire start={haBlack} end={pwrBlack} color="#1f2937" offset={60} />
      <Wire start={pwrBlack} end={keypadBlack} color="#1f2937" offset={20} />

      <Wire start={haBlue} end={keypadBlue} color="#3b82f6" offset={70} />
      <Wire start={keypadBlue} end={adamBlue} color="#3b82f6" offset={30} dasharray="4 2" />

      <Wire start={haGreen} end={keypadGreen} color="#22c55e" offset={80} />
      <Wire start={keypadGreen} end={adamGreen} color="#22c55e" offset={40} dasharray="4 2" />
    </svg>
  );
}
`;

code = code.replace(/function DraggableContainer/, wireComponents + '\nfunction DraggableContainer');

// Add nodeOffsets state
code = code.replace(/const \[addedNodes, setAddedNodes\] = useState<any\[\]>\(\[\]\);/, 'const [addedNodes, setAddedNodes] = useState<any[]>([]);\n  const [nodeOffsets, setNodeOffsets] = useState<Record<string, {x: number, y: number}>>({});');

fs.writeFileSync('src/pages/DesignPage.tsx', code);

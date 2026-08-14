const fs = require('fs');
let code = fs.readFileSync('src/pages/DesignPage.tsx', 'utf8');

// Replace framer-motion import
code = code.replace(/import \{ motion \} from 'framer-motion';/g, '');

// Create DraggableContainer component definition
const draggableContainerCode = `
function DraggableContainer({ children, className, style }: any) {
  const { position, handleMouseDown } = useDraggable({ x: 0, y: 0 });
  
  return (
    <div 
      className={className} 
      style={{
        ...style,
        transform: \`translate(\${position.x}px, \${position.y}px)\`
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}
`;

if (!code.includes('function DraggableContainer')) {
  code = code.replace(/function DraggableNode/, draggableContainerCode + '\nfunction DraggableNode');
}

// Replace motion.div usages
code = code.replace(/<motion\.div\s+drag\s+dragMomentum=\{false\}\s+/g, '<DraggableContainer ');
code = code.replace(/<motion\.div\s+drag\n\s+dragMomentum=\{false\}\n\s+/g, '<DraggableContainer ');
code = code.replace(/<\/motion\.div>/g, '</DraggableContainer>');

fs.writeFileSync('src/pages/DesignPage.tsx', code);

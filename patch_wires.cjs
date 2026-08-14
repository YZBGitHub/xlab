const fs = require('fs');

let code = fs.readFileSync('src/pages/DesignPage.tsx', 'utf8');

// Replace Wires SVG with dynamic wires
code = code.replace(
  /\{\/\* Wires \(SVG\) \*\/\}[\s\S]*?<\/svg>/,
  `{/* Wires (SVG) */}
            <WireRenderer nodeOffsets={nodeOffsets} />`
);

fs.writeFileSync('src/pages/DesignPage.tsx', code);

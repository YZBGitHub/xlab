const fs = require('fs');
const mapping = JSON.parse(fs.readFileSync('mapping.json', 'utf8'));
const currentTs = fs.readFileSync('src/data/deviceImageMap.ts', 'utf8');

let tsContent = 'export const deviceImageMap: Record<string, string> = {\n';
// Keep existing ones that we might miss, but mostly rely on the mapping
for (const [key, value] of Object.entries(mapping)) {
  tsContent += `  "${key}": "/device/${value}",\n`;
}
tsContent += '};\n';
fs.writeFileSync('src/data/deviceImageMap.ts', tsContent);

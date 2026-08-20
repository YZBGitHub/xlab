import fs from 'fs';

const mapping = JSON.parse(fs.readFileSync('mapping.json', 'utf8'));
let tsContent = 'export const deviceImageMap: Record<string, string> = {\n';
for (const [key, value] of Object.entries(mapping)) {
  tsContent += `  "${key}": "/device/${value}",\n`;
}
tsContent += '};\n';
fs.writeFileSync('src/data/deviceImageMap.ts', tsContent);


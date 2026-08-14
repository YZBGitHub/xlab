const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `        {/* Actuator Specific */}`;
const replaceStr = `        )}

        {/* Actuator Specific */}`;

// Only replace the FIRST occurrence in the bottom half of the file
const parts = content.split(targetStr);
if (parts.length > 1) {
  content = parts[0] + replaceStr + parts.slice(1).join(targetStr);
}

fs.writeFileSync(path, content);

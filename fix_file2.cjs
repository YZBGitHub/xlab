const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

let idx = lines.findIndex(l => l.includes("function StepConfirm"));
if (idx > -1) {
    if (lines[idx+4] && lines[idx+4].includes('isSensor')) {
        lines.splice(idx+4, 2);
    }
}

fs.writeFileSync(path, lines.join('\n'));

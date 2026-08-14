const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1. Remove duplicate lines 54-55
lines.splice(53, 2);

// 2. We need to find where "{/* Gateway Specific */}" is and remove those blocks.
// They are around lines 135-175.
let newLines = [];
let skip = false;
let foundGateways = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Gateway Specific */}')) {
    skip = true;
    foundGateways++;
  }
  if (skip) {
    if (lines[i].includes(')}')) {
      // check if it's the end of the block
      if (lines[i-1] && lines[i-1].includes('</div>')) {
        skip = false;
        continue;
      }
    }
    continue;
  }
  newLines.push(lines[i]);
}
lines = newLines;

// 3. Remove duplicate lines in StepConfirm
let stepConfirmIdx = lines.findIndex(l => l.includes('function StepConfirm'));
if (stepConfirmIdx > -1) {
    if (lines[stepConfirmIdx+3].includes('isSensor')) {
        lines.splice(stepConfirmIdx+3, 2);
    }
}

// 4. Insert Gateway Specific to the end of StepConfirm
let endOfConfirm = lines.lastIndexOf('  );');
if (endOfConfirm > -1) {
    // go back one line which is `    </div>` and another which is `      </div>`
    const insertGatewayStr = `
        {/* Gateway Specific */}
        {isGateway && (
          <div className="p-5">
            <div className="text-xs font-bold text-gray-400 uppercase mb-4">网关配置</div>
            <div className="space-y-4">
              <div><span className="text-gray-500 text-sm">网关类型：</span> <span className="text-gray-800 font-medium text-sm">{data.gatewayType}</span></div>
              <div>
                <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                <div className="flex gap-2">
                  {data.gatewayType === '云平台网关' ? (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="network" /><Tag label="power" /></>
                  ) : (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="vs" /><Tag label="gnd" /></>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}`;
    lines.splice(endOfConfirm - 2, 0, insertGatewayStr);
}

fs.writeFileSync(path, lines.join('\n'));

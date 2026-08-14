const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            )}
          </div>
        </div>
        {/* Actuator Specific */}`;
const replacement = `            )}
          </div>
        </div>
        )}
        {/* Actuator Specific */}`;

// Let's use a regex to be safe with whitespace
content = content.replace(/\s*}\)\s*<\/div>\s*<\/div>\s*{\/\* Actuator Specific \*\//, `\n            )}\n          </div>\n        </div>\n        )}\n        {/* Actuator Specific */}`);

fs.writeFileSync(path, content);

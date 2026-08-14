const fs = require('fs');

function patchPage(filename, isProjects) {
  let code = fs.readFileSync(filename, 'utf8');

  // Update navigation block
  const navBlockRegex = /<nav className="flex items-center gap-12 absolute left-1\/2 -translate-x-1\/2 h-full">[\s\S]*?<\/nav>/;
  const newNavBlock = `<nav className="flex items-center gap-12 absolute left-1/2 -translate-x-1/2 h-full">
          <Link
            to="/"
            className={\`text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] \${
              ${!isProjects}
                ? 'text-[#00a0e9] border-[#00a0e9]' 
                : 'text-gray-600 border-transparent hover:text-[#00a0e9]'
            }\`}
          >
            仿真设备
          </Link>
          <Link
            to="/projects"
            className={\`text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] \${
              ${isProjects}
                ? 'text-[#00a0e9] border-[#00a0e9]' 
                : 'text-gray-600 border-transparent hover:text-[#00a0e9]'
            }\`}
          >
            仿真项目
          </Link>
          <Link
            to="/console"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
          >
            控制台
          </Link>
        </nav>`;
  
  code = code.replace(navBlockRegex, newNavBlock);

  if (isProjects) {
    const startIdx = code.indexOf(`{activePrimaryNav === '仿真设备' && (`);
    const endIdx = code.indexOf(`{activePrimaryNav === '仿真项目' && (`);
    if (startIdx !== -1 && endIdx !== -1) {
      code = code.slice(0, startIdx) + code.slice(endIdx);
    }
    
    // Now remove `{activePrimaryNav === '仿真项目' && (` and its matching closing brace at the end
    code = code.replace(/\{activePrimaryNav === '仿真项目' && \(/, '');
    
    // The closing brace for '仿真项目' is right before `{/* Copy Project Modal */}`
    code = code.replace(/\n\s*\)\}\n\s*\{\/\* Copy Project Modal \*\/\}/, '\n        {/* Copy Project Modal */}');

    // Rename component
    code = code.replace(/export default function HomePage\(\) \{/, 'export default function ProjectsPage() {');
  } else {
    // Remove "仿真项目" content block
    const startIdx = code.indexOf(`{activePrimaryNav === '仿真项目' && (`);
    if (startIdx !== -1) {
      // Find the closing brace for 仿真项目 before Copy Project Modal
      const endIdx = code.indexOf(`{/* Copy Project Modal */}`, startIdx);
      if(endIdx !== -1) {
          code = code.slice(0, startIdx) + code.slice(endIdx);
      }
    }
    code = code.replace(/\{activePrimaryNav === '仿真设备' && \(/, '');
    code = code.replace(/\n\s*\)\}\n\s*\{\/\* Copy Project Modal \*\/\}/, '\n        {/* Copy Project Modal */}');
  }

  // Also remove unused activePrimaryNav state
  code = code.replace(/const \[activePrimaryNav, setActivePrimaryNav\] = useState[^\n]*\n/, '');
  code = code.replace(/\/\/ If navigated from Console with state, update the active tab[\s\S]*?\}, \[location\.state\]\);\n/, '');
  code = code.replace(/const location = useLocation\(\);\n/, '');

  fs.writeFileSync(filename, code);
}

// We need the original HomePage.tsx to generate both correctly
let originalCode = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');
fs.writeFileSync('src/pages/HomePage.tsx', originalCode);
fs.writeFileSync('src/pages/ProjectsPage.tsx', originalCode);

patchPage('src/pages/HomePage.tsx', false);
patchPage('src/pages/ProjectsPage.tsx', true);

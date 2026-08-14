const fs = require('fs');

function fix(filename, activeTab) {
  let code = fs.readFileSync(filename, 'utf8');
  
  // Replace the entire block with cleaner hardcoded classes
  const navBlockRegex = /<nav className="flex items-center gap-12 absolute left-1\/2 -translate-x-1\/2 h-full">[\s\S]*?<\/nav>/;
  
  const devClasses = activeTab === 'dev' 
    ? "text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-[#00a0e9] border-[#00a0e9]"
    : "text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]";
    
  const projClasses = activeTab === 'proj'
    ? "text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-[#00a0e9] border-[#00a0e9]"
    : "text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]";

  const newNavBlock = `<nav className="flex items-center gap-12 absolute left-1/2 -translate-x-1/2 h-full">
          <Link
            to="/"
            className="${devClasses}"
          >
            仿真设备
          </Link>
          <Link
            to="/projects"
            className="${projClasses}"
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
  fs.writeFileSync(filename, code);
}

fix('src/pages/HomePage.tsx', 'dev');
fix('src/pages/ProjectsPage.tsx', 'proj');

const fs = require('fs');
const path = require('path');

const routesDir = './src/routes';
const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip auth.js as it's already fixed
  if (file === 'auth.js') {
    console.log(`Skipping ${file} - already fixed`);
    return;
  }
  
  // Remove top-level database imports
  content = content.replace(
    /const\s*{\s*[^}]*(?:getQuery|getOneQuery|runQuery)[^}]*}\s*=\s*require\(['"][^'"]*database\/init['"][)];\s*/g,
    '// Database functions will be lazy-loaded to avoid circular dependencies\n'
  );
  
  // Add lazy loading to route handlers that use database functions
  const routeHandlerRegex = /router\.(get|post|put|delete|patch)\([^,]+,\s*(?:[^,]+,\s*)*asyncHandler\(async\s*\([^)]*\)\s*=>\s*{\s*/g;
  
  content = content.replace(routeHandlerRegex, (match) => {
    // Check if this route handler uses database functions
    const afterMatch = content.substring(content.indexOf(match) + match.length);
    const nextRouteIndex = afterMatch.search(/router\.(get|post|put|delete|patch)\(/);
    const routeContent = nextRouteIndex === -1 ? afterMatch : afterMatch.substring(0, nextRouteIndex);
    
    if (routeContent.includes('getQuery') || routeContent.includes('getOneQuery') || routeContent.includes('runQuery')) {
      return match + '  // Lazy-load database functions\n  const { getQuery, getOneQuery, runQuery } = require(\'../database/init\');\n  \n';
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All route files have been fixed!');
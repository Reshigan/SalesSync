const fs = require('fs');
const path = require('path');

// Function to fix missing imports in a file
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const lines = content.split('\n');

  // Check if useState is used but not imported
  const usesUseState = content.includes('useState(') && !content.includes('import { useState') && !content.includes('import React');
  const usesUseEffect = content.includes('useEffect(') && !content.includes('import { useEffect') && !content.includes('import React');
  
  if (usesUseState || usesUseEffect) {
    let insertIndex = -1;
    let reactImportIndex = -1;
    
    // Find existing React import or where to insert
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("from 'react'") && lines[i].includes('import')) {
        reactImportIndex = i;
        break;
      }
      if (lines[i].includes("'use client'") && insertIndex === -1) {
        insertIndex = i + 1;
      }
      if (lines[i].includes('import ') && insertIndex === -1) {
        insertIndex = i;
      }
    }
    
    if (reactImportIndex !== -1) {
      // Extend existing React import
      let imports = [];
      if (usesUseState && !lines[reactImportIndex].includes('useState')) {
        imports.push('useState');
      }
      if (usesUseEffect && !lines[reactImportIndex].includes('useEffect')) {
        imports.push('useEffect');
      }
      
      if (imports.length > 0) {
        // Add to existing import
        lines[reactImportIndex] = lines[reactImportIndex].replace('import {', `import { ${imports.join(', ')},`);
        modified = true;
      }
    } else if (insertIndex !== -1) {
      // Add new React import
      let imports = [];
      if (usesUseState) imports.push('useState');
      if (usesUseEffect) imports.push('useEffect');
      
      if (imports.length > 0) {
        lines.splice(insertIndex, 0, `import { ${imports.join(', ')} } from 'react';`);
        modified = true;
      }
    }
    
    if (modified) {
      console.log(`Fixed React imports in ${filePath}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }
}

// Function to recursively find all .tsx files
function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const tsxFiles = findTsxFiles(srcDir);

console.log(`Found ${tsxFiles.length} .tsx files`);

for (const file of tsxFiles) {
  try {
    fixImports(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log('Import fixing complete!');
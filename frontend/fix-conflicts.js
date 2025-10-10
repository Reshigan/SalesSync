const fs = require('fs');
const path = require('path');

// Function to fix variable conflicts in a file
function fixConflicts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix error conflicts from useToast
  if (content.includes('const { success, error } = useToast()') && content.includes('const [error, setError] = useState')) {
    content = content.replace('const { success, error } = useToast()', 'const { success, error: toastError } = useToast()');
    modified = true;
    console.log(`Fixed error conflict in ${filePath}`);
  }

  // Fix isLoading conflicts
  if (content.includes('const [isLoading, setIsLoading] = useState') && content.includes('const { login, isLoading } = useAuthStore()')) {
    content = content.replace('const [isLoading, setIsLoading] = useState', 'const [localLoading, setLocalLoading] = useState');
    modified = true;
    console.log(`Fixed isLoading conflict in ${filePath}`);
  }

  // Fix duplicate LoadingSpinner imports
  const loadingSpinnerMatches = content.match(/import.*LoadingSpinner.*from/g);
  if (loadingSpinnerMatches && loadingSpinnerMatches.length > 1) {
    // Keep only the ui/loading import
    content = content.replace(/import { LoadingSpinner[^}]*} from '@\/components\/LoadingSpinner'/g, 'import { SkeletonTable } from \'@/components/LoadingSpinner\'');
    modified = true;
    console.log(`Fixed LoadingSpinner duplicate import in ${filePath}`);
  }

  // Fix duplicate service imports
  const serviceMatches = content.match(/import.*Service.*from.*service/g);
  if (serviceMatches && serviceMatches.length > 1) {
    // Remove named imports if default import exists
    const lines = content.split('\n');
    const importLines = lines.filter(line => line.includes('Service') && line.includes('from') && line.includes('service'));
    if (importLines.length > 1) {
      // Keep only the default import
      content = content.replace(/import { [^}]*Service[^}]*} from '[^']*service'/g, '');
      modified = true;
      console.log(`Fixed service duplicate import in ${filePath}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
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
    fixConflicts(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log('Conflict fixing complete!');
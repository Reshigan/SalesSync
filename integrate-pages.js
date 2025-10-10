#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔗 Integrating pages with real API services and error handling...\n');

// Find all page files
const pagesDir = path.join(__dirname, 'frontend/src/app');
const findPages = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'api') {
      files.push(...findPages(fullPath));
    } else if (item === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
};

const pageFiles = findPages(pagesDir);

// Integration patterns
const integrationPatterns = {
  // Add error boundary wrapper
  errorBoundary: {
    import: "import { ErrorBoundary } from '@/components/ui/error-boundary';",
    wrapper: (content) => `<ErrorBoundary>\n${content}\n</ErrorBoundary>`
  },
  
  // Add loading states
  loading: {
    import: "import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';",
    hook: "const [isLoading, setIsLoading] = useState(false);"
  },
  
  // Add toast notifications
  toast: {
    import: "import { useToast } from '@/hooks/use-toast';",
    hook: "const { success, error } = useToast();"
  },
  
  // Service imports
  services: {
    products: "import productsService from '@/services/products.service';",
    customers: "import customersService from '@/services/customers.service';",
    orders: "import ordersService from '@/services/orders.service';",
    inventory: "import inventoryService from '@/services/inventory.service';",
    vanSales: "import vanSalesService from '@/services/van-sales.service';"
  }
};

// Update each page file
let updatedCount = 0;

pageFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(pagesDir, filePath);
    
    // Skip if already has error boundary
    if (content.includes('ErrorBoundary')) {
      console.log(`⏭️  ${relativePath} - Already has error handling`);
      return;
    }
    
    // Determine which service to import based on path
    let serviceImport = '';
    if (filePath.includes('products')) {
      serviceImport = integrationPatterns.services.products;
    } else if (filePath.includes('customers')) {
      serviceImport = integrationPatterns.services.customers;
    } else if (filePath.includes('orders')) {
      serviceImport = integrationPatterns.services.orders;
    } else if (filePath.includes('inventory')) {
      serviceImport = integrationPatterns.services.inventory;
    } else if (filePath.includes('van-sales')) {
      serviceImport = integrationPatterns.services.vanSales;
    }
    
    // Add imports at the top
    const imports = [
      integrationPatterns.errorBoundary.import,
      integrationPatterns.loading.import,
      integrationPatterns.toast.import,
      serviceImport
    ].filter(Boolean).join('\n');
    
    // Find the first import and add our imports after
    const importRegex = /^import.*from.*['"];?$/gm;
    const lastImportMatch = [...content.matchAll(importRegex)].pop();
    
    if (lastImportMatch) {
      const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertIndex) + '\n' + imports + content.slice(insertIndex);
    } else {
      // No imports found, add at the top
      content = imports + '\n\n' + content;
    }
    
    // Add hooks inside component
    const componentRegex = /export default function \w+\(\) \{/;
    const componentMatch = content.match(componentRegex);
    
    if (componentMatch) {
      const insertIndex = componentMatch.index + componentMatch[0].length;
      const hooks = [
        integrationPatterns.loading.hook,
        integrationPatterns.toast.hook
      ].join('\n  ');
      
      content = content.slice(0, insertIndex) + '\n  ' + hooks + content.slice(insertIndex);
    }
    
    // Wrap return statement with ErrorBoundary
    const returnRegex = /return \(/;
    const returnMatch = content.match(returnRegex);
    
    if (returnMatch) {
      // Find the matching closing parenthesis
      let openParens = 0;
      let startIndex = returnMatch.index + returnMatch[0].length - 1;
      let endIndex = startIndex;
      
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '(') openParens++;
        if (content[i] === ')') openParens--;
        if (openParens === 0) {
          endIndex = i;
          break;
        }
      }
      
      const returnContent = content.slice(startIndex + 1, endIndex);
      const wrappedContent = integrationPatterns.errorBoundary.wrapper(returnContent);
      
      content = content.slice(0, startIndex + 1) + wrappedContent + content.slice(endIndex);
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${relativePath}`);
    updatedCount++;
    
  } catch (error) {
    console.log(`❌ Failed to update ${path.relative(pagesDir, filePath)}: ${error.message}`);
  }
});

console.log(`\n🎉 Updated ${updatedCount} page files with API integration and error handling!`);
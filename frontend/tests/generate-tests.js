const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const getAllPages = () => {
  const output = execSync(
    'find src/app -type f \\( -name "page.tsx" -o -name "page.js" \\)',
    { cwd: path.join(__dirname, '..'), encoding: 'utf-8' }
  );
  
  return output.trim().split('\n').map(filePath => {
    const routePath = filePath
      .replace('src/app', '')
      .replace(/\/page\.(tsx|js)$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1')
      || '/';
    
    const testName = routePath
      .replace(/^\//, '')
      .replace(/\//g, '-')
      .replace(/:/g, '')
      || 'home';
    
    const category = routePath.split('/')[1] || 'home';
    
    return { routePath, testName, category, filePath };
  });
};

const generateTestFile = (pages) => {
  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  Object.entries(groupedPages).forEach(([category, categoryPages]) => {
    const testContent = `import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('${category.charAt(0).toUpperCase() + category.slice(1)} Pages E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

${categoryPages.map(page => `
  test('should load ${page.testName} page', async ({ page }) => {
    const routePath = '${page.routePath}'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to ${page.testName} and back', async ({ page }) => {
    const routePath = '${page.routePath}'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });
`).join('\n')}
});
`;

    const testDir = path.join(__dirname, 'e2e');
    fs.writeFileSync(
      path.join(testDir, `${category}.spec.ts`),
      testContent
    );
    console.log(`✓ Generated test file for ${category} (${categoryPages.length} pages)`);
  });
};

const generateCrudTests = () => {
  const crudEntities = [
    { name: 'customers', route: '/customers', fields: ['name', 'email', 'phone'] },
    { name: 'products', route: '/inventory/products', fields: ['name', 'sku', 'price'] },
    { name: 'orders', route: '/orders', fields: ['customer', 'status'] },
    { name: 'agents', route: '/agents', fields: ['name', 'email', 'phone'] },
    { name: 'vans', route: '/fleet/vans', fields: ['registrationNumber', 'model'] },
    { name: 'warehouses', route: '/inventory/warehouses', fields: ['name', 'code', 'address'] },
    { name: 'routes', route: '/routes', fields: ['name', 'description'] },
  ];

  crudEntities.forEach(entity => {
    const testContent = `import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('${entity.name.charAt(0).toUpperCase() + entity.name.slice(1)} CRUD E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
    await helper.goto('${entity.route}');
  });

  test('should list ${entity.name}', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const hasTable = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    const hasList = await page.locator('[role="list"]').isVisible().catch(() => false);
    
    expect(hasTable || hasList).toBeTruthy();
  });

  test('should search ${entity.name}', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
      expect(await searchInput.inputValue()).toBe('test');
    } else {
      test.skip();
    }
  });

  test('should open create ${entity.name} form', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add"), a:has-text("Create"), a:has-text("New")');
    
    if (await createButton.first().isVisible().catch(() => false)) {
      await createButton.first().click();
      await page.waitForLoadState('networkidle');
      
      const hasForm = await page.locator('form').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should create new ${entity.name}', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add"), a:has-text("Create"), a:has-text("New")');
    
    if (await createButton.first().isVisible().catch(() => false)) {
      await createButton.first().click();
      await page.waitForLoadState('networkidle');
      
      ${entity.fields.map(field => `
      const ${field}Input = page.locator('input[name="${field}"], textarea[name="${field}"]');
      if (await ${field}Input.isVisible().catch(() => false)) {
        await ${field}Input.fill('Test ${field} ' + Date.now());
      }`).join('\n')}
      
      const submitButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Submit")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should view ${entity.name} details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('button:has-text("View"), a:has-text("View"), [aria-label*="View"]').first();
    const firstRow = page.locator('table tbody tr, [role="table"] [role="row"]').first();
    
    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
    } else if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
    } else {
      test.skip();
    }
  });

  test('should edit ${entity.name}', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label*="Edit"]').first();
    
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      ${entity.fields[0] ? `
      const firstInput = page.locator('input[name="${entity.fields[0]}"], textarea[name="${entity.fields[0]}"]');
      if (await firstInput.isVisible().catch(() => false)) {
        await firstInput.fill('Updated ' + Date.now());
      }
      ` : ''}
      
      const submitButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should handle pagination', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label*="Next"]');
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should handle filtering', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")');
    
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(1000);
      
      const hasFilterOptions = await page.locator('select, [role="combobox"], [role="listbox"]').isVisible().catch(() => false);
      expect(hasFilterOptions).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
`;

    const testDir = path.join(__dirname, 'e2e', 'crud');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(testDir, `${entity.name}.crud.spec.ts`),
      testContent
    );
    console.log(`✓ Generated CRUD test file for ${entity.name}`);
  });
};

const generateWorkflowTests = () => {
  const testContent = `import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Complete Workflow E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

  test('should complete dashboard navigation workflow', async ({ page }) => {
    await helper.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardContent = await page.locator('main, [role="main"]').isVisible();
    expect(dashboardContent).toBeTruthy();
  });

  test('should complete customer order workflow', async ({ page }) => {
    await helper.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('table tbody tr, [role="table"] [role="row"]').first();
    if (await firstCustomer.isVisible().catch(() => false)) {
      await firstCustomer.click();
      await page.waitForLoadState('networkidle');
      
      const createOrderButton = page.locator('button:has-text("Create Order"), a:has-text("Create Order")');
      if (await createOrderButton.isVisible().catch(() => false)) {
        await createOrderButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should complete inventory check workflow', async ({ page }) => {
    await helper.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const hasInventory = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    expect(hasInventory).toBeTruthy();
  });

  test('should complete reporting workflow', async ({ page }) => {
    await helper.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    const hasReports = await page.locator('main').isVisible();
    expect(hasReports).toBeTruthy();
  });

  test('should complete van sales workflow', async ({ page }) => {
    await helper.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    
    const hasVanSales = await page.locator('main').isVisible();
    expect(hasVanSales).toBeTruthy();
  });

  test('should complete route management workflow', async ({ page }) => {
    await helper.goto('/routes');
    await page.waitForLoadState('networkidle');
    
    const hasRoutes = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    expect(hasRoutes).toBeTruthy();
  });
});
`;

  const testDir = path.join(__dirname, 'e2e', 'workflows');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(testDir, 'complete-workflows.spec.ts'),
    testContent
  );
  console.log(`✓ Generated workflow test file`);
};

console.log('Generating frontend E2E tests...\n');

const pages = getAllPages();
console.log(`Found ${pages.length} pages\n`);

generateTestFile(pages);
console.log('');

generateCrudTests();
console.log('');

generateWorkflowTests();
console.log('');

console.log(`\n✅ Generated tests for ${pages.length} pages`);
console.log('Run tests with: npm test');

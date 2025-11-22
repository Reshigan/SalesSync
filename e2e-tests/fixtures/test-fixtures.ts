import { test as base } from '@playwright/test';

type TestFixtures = {
  uniqueName: (prefix: string) => string;
};

export const test = base.extend<TestFixtures>({
  uniqueName: async ({}, use) => {
    await use((prefix: string) => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `${prefix}-E2E-${timestamp}-${random}`;
    });
  },
});

export { expect } from '@playwright/test';

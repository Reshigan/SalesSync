import { Page } from '@playwright/test'

/**
 * Disable animations and transitions for E2E tests
 * This reduces flakiness from timing issues with CSS animations
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
  
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

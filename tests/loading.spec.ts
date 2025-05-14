import { test, expect } from '@playwright/test';
import { 
  testCircularProgressLoading, 
  testLoadingWithError
} from './helpers/loading-test-helper';
import { 
  pageLoadingConfigs, 
  componentLoadingConfigs,
  viewportConfigs
} from './config/loading-tests-config';

test.describe('Loading States', () => {
  const pagesToTest = pageLoadingConfigs.slice(0, 31); 
  
  for (const config of pagesToTest) {
    test(`should show and hide loading indicator on ${config.name} page`, async ({ page }) => {
      await testCircularProgressLoading(page, config);
    });
  }
});
import { expect, type Locator } from '@playwright/test';

import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
  pressEnter,
  type,
  waitNextFrame,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';
import { initDatabaseColumn } from './actions.js';

test('database sort with multiple rules', async ({ page }) => {
  // Initialize database
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  // Add test columns: Name (text) and Age (number)
  await initDatabaseColumn(page, 'Name');
  await initDatabaseColumn(page, 'Age');

  // Add test data
  const testData = [
    { name: 'Alice', age: '25' },
    { name: 'Bob', age: '30' },
    { name: 'Alice', age: '20' },
    { name: 'Charlie', age: '25' },
  ];

  for (const data of testData) {
    // Click first cell of new row to start editing
    const rows = page.locator('affine-database-row');
    const lastRow = rows.last();
    const firstCell = lastRow.locator('.cell').first();
    await firstCell.click();

    // Enter name
    await type(page, data.name);
    await pressEnter(page);

    // Enter age
    await type(page, data.age);
    await pressEnter(page);
  }

  // Open sort menu
  const sortButton = page.locator('data-view-header-tools-sort');
  await sortButton.click();

  // Add first sort rule: Name ascending
  await page.getByText('Name').click();
  await waitNextFrame(page);

  // Add second sort rule: Age ascending
  await sortButton.click();
  await page.getByText('Age').click();
  await waitNextFrame(page);

  // Get all rows after sorting
  const rows = await page.locator('affine-database-row').all();
  const getCellText = async (row: Locator, index: number) => {
    const cell = row.locator('.cell').nth(index);
    return cell.innerText();
  };

  // Verify sorting results
  // Should be sorted by Name first, then by Age
  const expectedOrder = [
    { name: 'Alice', age: '20' },
    { name: 'Alice', age: '25' },
    { name: 'Bob', age: '30' },
    { name: 'Charlie', age: '25' },
  ];

  for (let i = 0; i < rows.length; i++) {
    const name = await getCellText(rows[i], 0);
    const age = await getCellText(rows[i], 1);
    expect(name).toBe(expectedOrder[i].name);
    expect(age).toBe(expectedOrder[i].age);
  }

  // Change sort order of Name to descending
  await page.locator('.sort-item').first().getByText('Ascending').click();
  await page.getByText('Descending').click();
  await waitNextFrame(page);

  // Verify new sorting results
  const expectedOrderDesc = [
    { name: 'Charlie', age: '25' },
    { name: 'Bob', age: '30' },
    { name: 'Alice', age: '20' },
    { name: 'Alice', age: '25' },
  ];

  const rowsAfterDesc = await page.locator('affine-database-row').all();
  for (let i = 0; i < rowsAfterDesc.length; i++) {
    const name = await getCellText(rowsAfterDesc[i], 0);
    const age = await getCellText(rowsAfterDesc[i], 1);
    expect(name).toBe(expectedOrderDesc[i].name);
    expect(age).toBe(expectedOrderDesc[i].age);
  }

  // Remove first sort rule
  await page.locator('.sort-item').first().getByRole('img').last().click();
  await waitNextFrame(page);

  // Verify sorting now only by Age
  const expectedOrderAgeOnly = [
    { name: 'Alice', age: '20' },
    { name: 'Alice', age: '25' },
    { name: 'Charlie', age: '25' },
    { name: 'Bob', age: '30' },
  ];

  const rowsAfterRemove = await page.locator('affine-database-row').all();
  for (let i = 0; i < rowsAfterRemove.length; i++) {
    const name = await getCellText(rowsAfterRemove[i], 0);
    const age = await getCellText(rowsAfterRemove[i], 1);
    expect(name).toBe(expectedOrderAgeOnly[i].name);
    expect(age).toBe(expectedOrderAgeOnly[i].age);
  }
});

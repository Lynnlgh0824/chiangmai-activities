#!/usr/bin/env node

/**
 * Delete activity #002 from Excel file
 * Then export updated data to backend
 */

import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCEL_FILE = './清迈活动数据.xlsx';
const BACKUP_FILE = './清迈活动数据.backup.xlsx';
const ACTIVITY_NUMBER = '#002';

console.log('Starting deletion process for activity #002...\n');

// Step 1: Backup the Excel file
if (fs.existsSync(EXCEL_FILE)) {
    fs.copyFileSync(EXCEL_FILE, BACKUP_FILE);
    console.log('OK - File backed up to: ' + BACKUP_FILE);
} else {
    console.error('ERROR - Excel file not found: ' + EXCEL_FILE);
    process.exit(1);
}

// Step 2: Read the Excel file
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Step 3: Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log('\nTotal records before deletion: ' + data.length);

// Step 4: Find the activity to delete
const activityToDelete = data.find(row => {
    const activityNumber = row['活动编号'] || row.activityNumber || '';
    // Check both formats: "0002" and "#002"
    return activityNumber === '0002' || activityNumber === '#002' || activityNumber === ACTIVITY_NUMBER;
});

if (!activityToDelete) {
    console.log('\nWARNING - Activity ' + ACTIVITY_NUMBER + ' not found');
    console.log('Available activity numbers:');
    data.forEach(row => {
        const num = row['活动编号'] || row.activityNumber || 'N/A';
        const title = row['活动标题*'] || row.title || 'Untitled';
        console.log('  - ' + num + ': ' + title);
    });
    process.exit(0);
}

console.log('\nFound activity to delete:');
console.log('  Number: ' + ACTIVITY_NUMBER);
console.log('  Title: ' + (activityToDelete['活动标题*'] || activityToDelete.title));

// Step 5: Delete the record
const updatedData = data.filter(row => {
    const activityNumber = row['活动编号'] || row.activityNumber || '';
    // Filter out both formats: "0002" and "#002"
    return activityNumber !== '0002' && activityNumber !== '#002' && activityNumber !== ACTIVITY_NUMBER;
});

console.log('\nTotal records after deletion: ' + updatedData.length);
console.log('Deleted: ' + (data.length - updatedData.length) + ' record(s)');

// Step 6: Write back to Excel
const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
workbook.Sheets[sheetName] = newWorksheet;
XLSX.writeFile(workbook, EXCEL_FILE);

console.log('\nOK - Excel file updated: ' + EXCEL_FILE);

// Step 7: Export to JSON automatically
console.log('\nExporting updated data to backend...');

// Change to the correct directory and run the export script
const { exec } = await import('child_process');

exec('npm run export-data', { cwd: __dirname + '/..' }, (error, stdout, stderr) => {
    if (error) {
        console.error('ERROR - Export failed:', error.message);
        return;
    }
    if (stderr) {
        console.error('STDERR:', stderr);
    }
    console.log('Export output:\n', stdout);
    console.log('\nDONE - Activity #002 deleted and backend updated!');
});

import { importDraws, initDatabase, getDraws } from './database';
import { app } from 'electron';

// Mock electron app for testing
(app as any).getPath = (name: string) => `C:\\Users\\filip\\AppData\\Local\\ColunaMix_Test`;

initDatabase();

const testData = `02,04,07,08,10,11,12,13,16,19,20,21,22,23,25
01,04,05,06,10,11,13,14,16,18,19,20,21,23,24`;

console.log('--- Testing 15-number format ---');
const res = importDraws(testData);
console.log('Result:', res);
const importedDraws = getDraws('range', 0, 1, 99999) as { contest: number; numbers: number[] }[];
console.log('Imported draws:', importedDraws.map(d => `Contest ${d.contest}: ${d.numbers.join(',')}`));

const testDataWithContest = `3300,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15`;
console.log('\n--- Testing 16-element format (with contest) ---');
const res2 = importDraws(testDataWithContest);
console.log('Result:', res2);
console.log('New draw:', (getDraws('range', 0, 3300, 3300) as { contest: number; numbers: number[] }[])[0]);

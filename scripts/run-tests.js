import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDirectory = path.join(root, 'test');
const testFiles = readdirSync(testDirectory)
  .filter(file => file.endsWith('.test.js'))
  .sort();
const failures = [];

for (const file of testFiles) {
  console.log(`\n=== ${file} ===\n`);
  const result = spawnSync(process.execPath, [path.join(testDirectory, file)], {
    cwd: root,
    stdio: 'inherit'
  });

  if (result.status !== 0) failures.push(file);
}

if (failures.length > 0) {
  console.error(`\nFailed test files: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\nAll ${testFiles.length} JavaScript test files passed.`);

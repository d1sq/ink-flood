/**
 * Creates a release zip for FoundryVTT module installation.
 * Output: ink-flood-v{version}.zip containing the correct structure.
 *
 * Usage: node scripts/release.mjs
 */
import { execSync } from 'child_process';
import { readFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const rootDir = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(rootDir, 'module.json'), 'utf-8'));
const version = manifest.version;
const zipName = `ink-flood-v${version}.zip`;

// Build first
console.log('Building...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// Prepare staging directory
const stageDir = join(rootDir, '.release', 'ink-flood');
if (existsSync(join(rootDir, '.release'))) {
  rmSync(join(rootDir, '.release'), { recursive: true });
}
mkdirSync(stageDir, { recursive: true });

// Copy files to staging
cpSync(join(rootDir, 'dist'), join(stageDir, 'dist'), { recursive: true });
cpSync(join(rootDir, 'lang'), join(stageDir, 'lang'), { recursive: true });
cpSync(join(rootDir, 'module.json'), join(stageDir, 'module.json'));

// Create zip
console.log(`Creating ${zipName}...`);
execSync(`tar -caf "../${zipName}" ink-flood`, {
  cwd: join(rootDir, '.release'),
  stdio: 'inherit',
});

// Cleanup
rmSync(join(rootDir, '.release'), { recursive: true });

console.log(`\nRelease ready: ${zipName}`);
console.log(`\nNext steps:`);
console.log(`1. git tag v${version}`);
console.log(`2. git push --tags`);
console.log(`3. Create GitHub release v${version}`);
console.log(`4. Upload ${zipName} and module.json as release assets`);

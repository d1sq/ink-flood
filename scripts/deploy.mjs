/**
 * Deploy script: copies dist/ and static files to the Foundry modules folder.
 * Configure FOUNDRY_MODULES_PATH in .env
 */
import { cpSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

// Read .env manually (no dotenv dependency needed)
const envPath = resolve(import.meta.dirname, '..', '.env');
if (!existsSync(envPath)) {
  console.error('ERROR: .env file not found. Copy .env.example to .env and set FOUNDRY_MODULES_PATH.');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const match = envContent.match(/^FOUNDRY_MODULES_PATH=(.+)$/m);
if (!match || !match[1].trim()) {
  console.error('ERROR: FOUNDRY_MODULES_PATH is not set in .env');
  process.exit(1);
}

const targetDir = match[1].trim();
const rootDir = resolve(import.meta.dirname, '..');

if (!existsSync(targetDir)) {
  console.error(`ERROR: Target directory does not exist: ${targetDir}`);
  console.error('Make sure the network share is accessible.');
  process.exit(1);
}

// Copy dist/
console.log(`Copying dist/ -> ${join(targetDir, 'dist')}`);
cpSync(join(rootDir, 'dist'), join(targetDir, 'dist'), { recursive: true });

// Copy module.json
console.log(`Copying module.json -> ${targetDir}`);
cpSync(join(rootDir, 'module.json'), join(targetDir, 'module.json'));

// Copy lang/
console.log(`Copying lang/ -> ${join(targetDir, 'lang')}`);
cpSync(join(rootDir, 'lang'), join(targetDir, 'lang'), { recursive: true });

console.log('Deploy complete!');

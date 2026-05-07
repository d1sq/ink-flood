// Build LevelDB compendium packs from JSON sources.
//
// Sources live in data/compendium/<pack-name>/*.json — one document per file.
// Output goes to packs/<pack-name>/ (LevelDB).
//
// foundryvtt-cli requires every document and every embedded item/effect to have
// a `_key` field (format: `!actors!<id>` for top-level, `!actors.items!<actorId>.<itemId>`
// for embedded). We inject these automatically so source JSON stays clean.
//
// Legacy hand-built packs without sources (e.g. packs/actors/) are left untouched.

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcesRoot = path.join(root, 'data/compendium');
const packsRoot = path.join(root, 'packs');

if (!fs.existsSync(sourcesRoot)) {
  console.log('No data/compendium/ directory — nothing to build.');
  process.exit(0);
}

const packDirs = fs
  .readdirSync(sourcesRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (packDirs.length === 0) {
  console.log('No pack source folders under data/compendium/ — nothing to build.');
  process.exit(0);
}

// Map pack folder name → top-level FVTT collection name.
// We assume one collection per pack; this matches module.json declarations.
function inferCollection(packName) {
  // ink-flood module currently only uses Actor packs.
  return 'actors';
}

function injectKeys(doc, collection) {
  doc._key = `!${collection}!${doc._id}`;

  if (Array.isArray(doc.items)) {
    for (const item of doc.items) {
      item._key = `!${collection}.items!${doc._id}.${item._id}`;
    }
  }

  if (Array.isArray(doc.effects)) {
    for (const effect of doc.effects) {
      effect._key = `!${collection}.effects!${doc._id}.${effect._id}`;
    }
  }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-flood-pack-'));

try {
  for (const packName of packDirs) {
    const inputDir = path.join(sourcesRoot, packName);
    const outputDir = path.join(packsRoot, packName);
    const tmpDir = path.join(tmpRoot, packName);

    fs.mkdirSync(tmpDir, { recursive: true });

    const collection = inferCollection(packName);
    const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.json'));

    if (files.length === 0) {
      console.log(`Skipping ${packName}: no JSON sources.`);
      continue;
    }

    for (const file of files) {
      const src = path.join(inputDir, file);
      const dest = path.join(tmpDir, file);
      const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
      injectKeys(doc, collection);
      fs.writeFileSync(dest, JSON.stringify(doc, null, 2), 'utf8');
    }

    // Wipe destination so stale entries from prior builds are cleared.
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Packing ${packName} (${files.length} docs): ${inputDir} → ${outputDir}`);

    const cmd = [
      'npx',
      'fvtt',
      'package',
      'pack',
      packName,
      '--id',
      'ink-flood',
      '--type',
      'Module',
      '--in',
      `"${tmpDir}"`,
      '--out',
      `"${packsRoot}"`,
    ].join(' ');

    execSync(cmd, { stdio: 'inherit' });
  }

  console.log('\nAll packs built.');
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

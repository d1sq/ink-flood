import { execSync } from 'child_process';
import fs from 'fs';

function exec(cmd, options = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    ...options,
  });
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function git(cmd) {
  return exec(`git ${cmd}`).trim();
}

function getGitHubRepoSlug() {
  const remote = git('remote get-url origin');

  let match = remote.match(/^git@github\.com:(.+?)(?:\.git)?$/);
  if (match) return match[1];

  match = remote.match(/^https:\/\/github\.com\/(.+?)(?:\.git)?$/);
  if (match) return match[1];

  fail(`Unable to determine GitHub repository from origin: ${remote}`);
}

const bump = process.argv[2] || 'patch';
const allowedBumps = new Set(['patch', 'minor', 'major']);

if (!allowedBumps.has(bump)) {
  fail(`Invalid version bump: "${bump}". Use patch, minor, or major.`);
}

let committed = false;

try {
  const status = git('status --porcelain');
  if (status) fail('Working directory is not clean.');

  const branch = git('rev-parse --abbrev-ref HEAD');
  if (!branch || branch === 'HEAD') {
    fail('Unable to determine current branch.');
  }

  console.log(`Branch: ${branch}`);
  console.log(`Release type: ${bump}`);

  run(`npm version ${bump} --no-git-tag-version`);

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  const tag = `v${version}`;

  if (git(`tag -l ${tag}`) === tag) {
    fail(`Tag ${tag} already exists.`);
  }

  const repo = getGitHubRepoSlug();
  const downloadUrl = `https://github.com/${repo}/releases/download/${tag}/ink-flood-${tag}.zip`;

  const modulePath = 'module.json';
  const moduleJson = JSON.parse(fs.readFileSync(modulePath, 'utf8'));

  let changed = false;

  if (moduleJson.version !== version) {
    moduleJson.version = version;
    changed = true;
  }

  if (moduleJson.download !== downloadUrl) {
    moduleJson.download = downloadUrl;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(modulePath, JSON.stringify(moduleJson, null, 2) + '\n');
    console.log(`Updated module.json → ${version}`);
    console.log(`Updated download → ${downloadUrl}`);
  } else {
    console.log('module.json already up to date');
  }

  const files = ['package.json', 'module.json'];
  if (fs.existsSync('package-lock.json')) {
    files.push('package-lock.json');
  }

  run(`git add ${files.join(' ')}`);
  run(`git commit -m "chore: release ${tag}"`);
  committed = true;

  run(`git tag ${tag}`);
  run(`git push origin ${branch}`);
  run(`git push origin ${tag}`);

  console.log(`\nRelease ${tag} created`);
} catch (error) {
  console.error('\nRelease failed');

  if (!committed) {
    try {
      const files = ['package.json', 'module.json'];
      if (fs.existsSync('package-lock.json')) {
        files.push('package-lock.json');
      }

      run(`git restore ${files.join(' ')}`);
      console.log('Changes reverted');
    } catch {
      console.error('Failed to restore files');
    }
  }

  console.error(error.message || String(error));
  process.exit(1);
}
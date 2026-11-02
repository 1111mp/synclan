import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:net';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const binaryName = process.platform === 'win32' ? 'synclan.exe' : 'synclan';
const bundleName = 'SyncLan E2E.app';
const binary =
  process.platform === 'darwin'
    ? join(root, 'target/e2e', bundleName, 'Contents/MacOS', binaryName)
    : join(root, 'target/e2e', binaryName);

async function run(args, env = {}) {
  const child = spawn('pnpm', args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
  if (code !== 0) process.exit(code);
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function createWorkspace() {
  const parent = join(root, 'test-results/workspaces');
  await mkdir(parent, { recursive: true });
  const dataDir = await mkdtemp(join(parent, 'synclan-'));
  // JSON is valid YAML. Keep fixture values independent of the OS locale and user settings.
  await writeFile(
    join(dataDir, 'synclan.yaml'),
    JSON.stringify({
      locale: 'en',
      theme: 'light',
      enable_auto_launch: false,
      enable_silent_start: false,
      auto_check_update: false,
      enable_encryption: false,
      enable_authorized_access: false,
      http_server_port: await availablePort(),
      file_upload_dir: join(dataDir, 'uploads'),
      auto_file_clean: 0,
      auto_log_clean: 0,
    }),
  );
  return dataDir;
}

if (process.argv[2] === 'build') {
  await run(
    [
      'exec',
      'tauri',
      'build',
      '--debug',
      ...(process.platform === 'darwin'
        ? ['--bundles', 'app']
        : ['--no-bundle']),
      '--features',
      'e2e',
      '--config',
      'src-tauri/tauri.e2e.conf.json',
    ],
    { CARGO_TARGET_DIR: join(root, 'target') },
  );
  await mkdir(join(root, 'target/e2e'), { recursive: true });
  if (process.platform === 'darwin') {
    // NSBundle resource lookup requires the .app layout on macOS.
    await cp(
      join(root, 'target/debug/bundle/macos', bundleName),
      join(root, 'target/e2e', bundleName),
      { recursive: true },
    );
  } else {
    await copyFile(join(root, 'target/debug', binaryName), binary);
    for (const resource of ['resources', 'icons']) {
      await cp(
        join(root, 'target/debug', resource),
        join(root, 'target/e2e', resource),
        { recursive: true },
      );
    }
  }
} else {
  await access(binary).catch(() => {
    throw new Error(
      'Build the isolated test application first: pnpm test:e2e:build',
    );
  });
  const args = process.argv.slice(2);
  const patterns = [];
  const forwarded = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--spec') {
      if (!args[index + 1]) throw new Error('--spec requires a file or glob');
      patterns.push(args[++index]);
    } else if (arg.startsWith('--spec=')) {
      patterns.push(arg.slice('--spec='.length));
    } else {
      forwarded.push(arg);
    }
  }
  const specs = [
    ...new Set(
      globSync(patterns.length ? patterns : ['test/e2e/**/*.spec.ts'], {
        cwd: root,
      }),
    ),
  ].sort((left, right) => left.localeCompare(right));
  if (!specs.length) throw new Error('No E2E specs matched');
  for (const spec of specs) {
    const dataDir = await createWorkspace();
    console.log(`E2E data and backend logs (${spec}): ${dataDir}`);
    const env = {
      SYNCLAN_E2E_DATA_DIR: dataDir,
      SYNCLAN_E2E_BINARY: binary,
      SYNCLAN_E2E_RESTORE: '',
    };
    const command = [
      'exec',
      'wdio',
      'run',
      'wdio.conf.ts',
      ...forwarded,
      '--spec',
      spec,
    ];
    await run(command, env);
    if (basename(spec) === 'desktop.spec.ts') {
      await access(join(dataDir, 'expected-device.json'));
      // Relaunch the native process with the same files to verify persistence beyond a WebView reload.
      await run(command, { ...env, SYNCLAN_E2E_RESTORE: '1' });
    }
  }
}

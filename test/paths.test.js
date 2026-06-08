import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveAntigravityPaths } from '../src/paths.js';

describe('Antigravity path resolution', () => {
  it('resolves a Windows-style install directory that contains resources/app', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-paths-'));
    const installDir = path.join(root, 'Antigravity');
    fs.mkdirSync(path.join(installDir, 'resources', 'app', 'out'), { recursive: true });

    const paths = resolveAntigravityPaths({ installDir });

    assert.equal(paths.appRoot, path.join(installDir, 'resources', 'app'));
    assert.equal(paths.nlsKeysPath, path.join(paths.appRoot, 'out', 'nls.keys.json'));
    assert.deepEqual(paths.uiBundlePaths, [
      path.join(paths.appRoot, 'out', 'main.js'),
      path.join(paths.appRoot, 'out', 'jetskiAgent', 'main.js'),
      path.join(paths.appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    ]);
  });

  it('resolves a macOS .app install directory through Contents/Resources/app', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-paths-'));
    const installDir = path.join(root, 'Antigravity.app');
    fs.mkdirSync(path.join(installDir, 'Contents', 'Resources', 'app', 'out'), { recursive: true });

    const paths = resolveAntigravityPaths({ installDir });

    assert.equal(paths.appRoot, path.join(installDir, 'Contents', 'Resources', 'app'));
    assert.equal(paths.packageJsonPath, path.join(paths.appRoot, 'package.json'));
  });
});

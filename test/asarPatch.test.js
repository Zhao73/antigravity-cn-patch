import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';
import { patchAsarUiBundles } from '../src/asarPatch.js';
import { UI_PATCH_START } from '../src/uiPatch.js';

describe('ASAR UI bundle patching', () => {
  it('patches bundles inside app.asar idempotently', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-asar-'));
    const appRoot = path.join(root, 'app');
    const appAsarPath = path.join(root, 'app.asar');
    fs.mkdirSync(path.join(appRoot, 'out', 'vs', 'workbench'), { recursive: true });
    fs.writeFileSync(path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'console.log("workbench");\n');
    await asar.createPackage(appRoot, appAsarPath);

    const first = await patchAsarUiBundles({
      appAsarPath,
      relativeBundlePaths: ['out/vs/workbench/workbench.desktop.main.js'],
      translations: { 'New Conversation': '新建对话' },
      tempRoot: root
    });

    assert.equal(first.changed, true);

    const extractDir = path.join(root, 'extracted');
    await asar.extractAll(appAsarPath, extractDir);
    const patched = fs.readFileSync(path.join(extractDir, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8');
    assert.match(patched, new RegExp(UI_PATCH_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(patched, /新建对话/);

    const second = await patchAsarUiBundles({
      appAsarPath,
      relativeBundlePaths: ['out/vs/workbench/workbench.desktop.main.js'],
      translations: { 'New Conversation': '新的对话' },
      tempRoot: root
    });

    assert.equal(second.changed, true);

    const extractDir2 = path.join(root, 'extracted-2');
    await asar.extractAll(appAsarPath, extractDir2);
    const repatched = fs.readFileSync(path.join(extractDir2, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8');
    assert.equal(repatched.split(UI_PATCH_START).length - 1, 1);
    assert.match(repatched, /新的对话/);
    assert.doesNotMatch(repatched, /新建对话/);
  });
});

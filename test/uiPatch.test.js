import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyUiPatch, UI_PATCH_START } from '../src/uiPatch.js';

describe('Antigravity UI bundle patching', () => {
  it('injects a runtime Chinese translator and updates it idempotently', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-ui-'));
    const bundlePath = path.join(root, 'workbench.desktop.main.js');
    fs.writeFileSync(bundlePath, 'console.log("Antigravity bundle");\n');

    const first = applyUiPatch({
      bundlePaths: [bundlePath, path.join(root, 'missing.js')],
      translations: {
        'New Conversation': '新建对话',
        'Ask anything': '输入问题'
      }
    });

    assert.equal(first.patchedFiles.length, 1);
    assert.equal(first.skippedFiles.length, 1);
    assert.equal(first.patchedFiles[0].changed, true);

    const afterFirst = fs.readFileSync(bundlePath, 'utf8');
    assert.match(afterFirst, /antigravity-cn-patch:runtime-start/);
    assert.match(afterFirst, /New Conversation/);
    assert.match(afterFirst, /新建对话/);

    applyUiPatch({
      bundlePaths: [bundlePath],
      translations: {
        'New Conversation': '新的对话'
      }
    });

    const afterSecond = fs.readFileSync(bundlePath, 'utf8');
    assert.equal(afterSecond.split(UI_PATCH_START).length - 1, 1);
    assert.match(afterSecond, /新的对话/);
    assert.doesNotMatch(afterSecond, /新建对话/);
  });
});

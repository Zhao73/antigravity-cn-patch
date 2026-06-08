import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { patchMenuSource, MENU_PATCH_HELPER_START } from '../src/mainProcessPatch.js';

describe('main process menu patching', () => {
  it('injects an idempotent application menu localizer', () => {
    const source = [
      'function setupApplicationMenu(url) {',
      '    const menu = electron_1.Menu.getApplicationMenu();',
      '    electron_1.Menu.setApplicationMenu(menu);',
      '}'
    ].join('\n');

    const first = patchMenuSource(source);
    const second = patchMenuSource(first.content);

    assert.equal(first.changed, true);
    assert.equal(second.changed, false);
    assert.match(first.content, /localizeApplicationMenu\(menu\)/);
    assert.match(first.content, /"File":"文件"/);
    assert.equal(first.content.split(MENU_PATCH_HELPER_START).length - 1, 1);
  });
});

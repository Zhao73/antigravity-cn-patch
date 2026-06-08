import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { zipExtractCommands } from '../src/upstream.js';

describe('upstream language pack extraction', () => {
  it('uses platform-appropriate ZIP extraction commands', () => {
    const windows = zipExtractCommands({
      platform: 'win32',
      zipPath: 'C:/tmp/language.vsix.zip',
      extractDir: 'C:/tmp/language'
    });
    const linux = zipExtractCommands({
      platform: 'linux',
      zipPath: '/tmp/language.vsix.zip',
      extractDir: '/tmp/language'
    });

    assert.equal(windows.some(command => command.command === 'powershell'), true);
    assert.equal(linux.some(command => command.command === 'unzip'), true);
    assert.equal(linux.some(command => command.command === 'tar'), true);
  });
});

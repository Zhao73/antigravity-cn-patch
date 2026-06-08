import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { backupFiles, clearRuntimeCaches, writeLocaleJson, writeLanguagePacksJson, restoreBackup } from '../src/install.js';

describe('installer file writes', () => {
  it('backs up and restores Antigravity user data files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-'));
    const appData = path.join(root, 'Antigravity');
    const userDir = path.join(appData, 'User');
    fs.mkdirSync(userDir, { recursive: true });
    const languagePacksPath = path.join(appData, 'languagepacks.json');
    const localePath = path.join(userDir, 'locale.json');
    fs.writeFileSync(languagePacksPath, '{"en":{"label":"English"}}\n');
    fs.writeFileSync(localePath, '{"locale":"en"}\n');

    const backup = backupFiles({ appDataDir: appData, stamp: '20260608T120000Z' });
    writeLanguagePacksJson({
      languagePacksPath,
      locale: 'zh-cn',
      extensionId: 'codex.antigravity-cn-patch',
      version: '0.1.0',
      translations: { vscode: 'C:/fake/main.i18n.json' },
      label: '中文(简体)'
    });
    writeLocaleJson({ localePath, locale: 'zh-cn' });

    assert.equal(JSON.parse(fs.readFileSync(languagePacksPath, 'utf8'))['zh-cn'].translations.vscode, 'C:/fake/main.i18n.json');
    assert.equal(JSON.parse(fs.readFileSync(localePath, 'utf8')).locale, 'zh-cn');

    restoreBackup(backup);

    assert.equal(fs.readFileSync(languagePacksPath, 'utf8'), '{"en":{"label":"English"}}\n');
    assert.equal(fs.readFileSync(localePath, 'utf8'), '{"locale":"en"}\n');
  });

  it('moves runtime cache directories aside', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-cache-'));
    const appData = path.join(root, 'Antigravity');
    fs.mkdirSync(path.join(appData, 'Code Cache'), { recursive: true });
    fs.mkdirSync(path.join(appData, 'CachedData'), { recursive: true });
    fs.writeFileSync(path.join(appData, 'Code Cache', 'old.bin'), 'cache');

    const result = clearRuntimeCaches({ appDataDir: appData, stamp: '20260608T121500Z' });

    assert.equal(fs.existsSync(path.join(appData, 'Code Cache')), false);
    assert.equal(fs.existsSync(path.join(result.backupDir, 'Code Cache', 'old.bin')), true);
    assert.equal(result.results.filter(item => item.changed).length, 2);
  });
});

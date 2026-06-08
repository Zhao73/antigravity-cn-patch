import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';
import { applyPatch } from '../src/apply.js';
import { resolveAntigravityPaths } from '../src/paths.js';
import { UI_PATCH_START } from '../src/uiPatch.js';

describe('apply patch workflow', () => {
  it('does not write generated extension files during dry-run', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-apply-'));
    const installDir = path.join(root, 'Program');
    const appDataDir = path.join(root, 'AppData');
    const extensionsDir = path.join(root, 'extensions');
    const upstreamRoot = path.join(root, 'upstream');
    fs.mkdirSync(path.join(installDir, 'resources', 'app', 'out'), { recursive: true });
    fs.mkdirSync(path.join(upstreamRoot, 'translations', 'extensions'), { recursive: true });

    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'nls.keys.json'), JSON.stringify([
      ['sample/module', ['hello']]
    ]));
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'nls.messages.json'), JSON.stringify([
      'Hello'
    ]));
    fs.writeFileSync(path.join(upstreamRoot, 'package.json'), JSON.stringify({
      engines: { vscode: '^1.104.0' },
      contributes: {
        localizations: [
          {
            languageId: 'zh-cn',
            translations: [
              { id: 'vscode', path: './translations/main.i18n.json' },
              { id: 'vscode.sample', path: './translations/extensions/vscode.sample.i18n.json' }
            ]
          }
        ]
      }
    }));
    fs.writeFileSync(path.join(upstreamRoot, 'translations', 'main.i18n.json'), JSON.stringify({
      version: '1.0.0',
      contents: { 'sample/module': { hello: '你好' } }
    }));
    fs.writeFileSync(path.join(upstreamRoot, 'translations', 'extensions', 'vscode.sample.i18n.json'), '{}');

    const paths = resolveAntigravityPaths({ installDir, appDataDir, extensionsDir });
    const result = await applyPatch({
      paths,
      upstreamRoot,
      overrides: {},
      dryRun: true
    });

    assert.equal(result.stats.upstreamKeys, 1);
    assert.equal(fs.existsSync(result.extensionRoot), false);
    assert.equal(fs.existsSync(paths.languagePacksPath), false);
    assert.equal(fs.existsSync(paths.localePath), false);
  });

  it('patches and backs up Antigravity UI bundles during apply', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-cn-apply-'));
    const installDir = path.join(root, 'Program');
    const appDataDir = path.join(root, 'AppData');
    const extensionsDir = path.join(root, 'extensions');
    const upstreamRoot = path.join(root, 'upstream');
    fs.mkdirSync(path.join(installDir, 'resources', 'app', 'out', 'vs', 'workbench'), { recursive: true });
    fs.mkdirSync(path.join(installDir, 'resources', 'app', 'out', 'jetskiAgent'), { recursive: true });
    fs.mkdirSync(path.join(upstreamRoot, 'translations'), { recursive: true });

    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'nls.keys.json'), JSON.stringify([
      ['sample/module', ['hello']]
    ]));
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'nls.messages.json'), JSON.stringify([
      'Hello'
    ]));
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'main.js'), 'console.log("main");\n');
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'jetskiAgent', 'main.js'), 'console.log("agent");\n');
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'console.log("workbench");\n');
    fs.mkdirSync(path.join(installDir, 'resources', 'app', 'dist'), { recursive: true });
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'dist', 'preload.js'), 'console.log("preload");\n');
    fs.writeFileSync(path.join(installDir, 'resources', 'app', 'dist', 'menu.js'), [
      'function setupApplicationMenu(url) {',
      '    const menu = electron_1.Menu.getApplicationMenu();',
      '    electron_1.Menu.setApplicationMenu(menu);',
      '}'
    ].join('\n'));
    await asar.createPackage(path.join(installDir, 'resources', 'app'), path.join(installDir, 'resources', 'app.asar'));
    fs.writeFileSync(path.join(upstreamRoot, 'package.json'), JSON.stringify({
      engines: { vscode: '^1.104.0' },
      contributes: {
        localizations: [
          {
            languageId: 'zh-cn',
            translations: [
              { id: 'vscode', path: './translations/main.i18n.json' }
            ]
          }
        ]
      }
    }));
    fs.writeFileSync(path.join(upstreamRoot, 'translations', 'main.i18n.json'), JSON.stringify({
      version: '1.0.0',
      contents: { 'sample/module': { hello: '你好' } }
    }));

    const paths = resolveAntigravityPaths({ installDir, appDataDir, extensionsDir });
    const result = await applyPatch({
      paths,
      upstreamRoot,
      overrides: {},
      uiTranslations: {
        'New Conversation': '新建对话'
      }
    });

    assert.match(fs.readFileSync(paths.uiBundlePaths[2], 'utf8'), new RegExp(UI_PATCH_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(result.uiPatch.patchedFiles.length, 3);
    assert.equal(result.asarPatch.changed, true);
    assert.equal(result.mainProcessPatch.changed, true);
    assert.equal(result.backup.entries.some(entry => entry.target === paths.uiBundlePaths[2] && entry.existed), true);
    assert.equal(result.backup.entries.some(entry => entry.target === paths.appAsarPath && entry.existed), true);
  });
});

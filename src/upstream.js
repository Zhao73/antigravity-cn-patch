import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEFAULT_LANGUAGE_PACK_VERSION, languagePackRoot } from './paths.js';

export function loadUpstreamLanguagePack(rootPath) {
  const root = languagePackRoot(rootPath);
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const main = JSON.parse(fs.readFileSync(path.join(root, 'translations', 'main.i18n.json'), 'utf8'));
  const localization = packageJson.contributes?.localizations?.find(item => item.languageId === 'zh-cn');
  const translations = localization?.translations ?? [{ id: 'vscode', path: './translations/main.i18n.json' }];
  return { root, packageJson, main, translations };
}

export async function downloadMarketplaceLanguagePack({
  version = DEFAULT_LANGUAGE_PACK_VERSION,
  cacheDir
}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const extractDir = path.join(cacheDir, `vscode-language-pack-zh-hans-${version}`);
  const extensionDir = path.join(extractDir, 'extension');
  if (fs.existsSync(path.join(extensionDir, 'translations', 'main.i18n.json'))) {
    return extensionDir;
  }

  const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/MS-CEINTL/vsextensions/vscode-language-pack-zh-hans/${version}/vspackage`;
  const vsixPath = path.join(cacheDir, `MS-CEINTL.vscode-language-pack-zh-hans-${version}.vsix`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download language pack ${version}: ${response.status} ${response.statusText}`);
  }
  fs.writeFileSync(vsixPath, Buffer.from(await response.arrayBuffer()));

  const zipPath = `${vsixPath}.zip`;
  fs.copyFileSync(vsixPath, zipPath);
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    `Expand-Archive -LiteralPath ${quotePowerShell(zipPath)} -DestinationPath ${quotePowerShell(extractDir)} -Force`
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`Failed to extract VSIX with PowerShell: ${result.stderr || result.stdout}`);
  }

  return extensionDir;
}

export function copyExtensionTranslations({ upstreamRoot, outputRoot, translationEntries }) {
  const outputTranslations = {};

  for (const entry of translationEntries) {
    const source = path.resolve(upstreamRoot, entry.path);
    if (!fs.existsSync(source)) {
      continue;
    }
    const relative = entry.id === 'vscode'
      ? path.join('translations', 'main.i18n.json')
      : path.join('translations', 'extensions', `${entry.id}.i18n.json`);
    const target = path.join(outputRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (entry.id !== 'vscode') {
      fs.copyFileSync(source, target);
    }
    outputTranslations[entry.id] = target;
  }

  return outputTranslations;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

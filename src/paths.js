import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_LANGUAGE_PACK_VERSION = '1.104.2025082016';
export const EXTENSION_ID = 'codex.antigravity-cn-patch';
export const EXTENSION_VERSION = '0.1.0';
export const LOCALE = 'zh-cn';

export function defaultInstallDir() {
  return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity');
}

export function defaultAppDataDir() {
  return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'Antigravity');
}

export function defaultExtensionsDir() {
  return path.join(os.homedir(), '.antigravity', 'extensions');
}

export function resolveAntigravityPaths(options = {}) {
  const installDir = path.resolve(options.installDir ?? defaultInstallDir());
  const appDataDir = path.resolve(options.appDataDir ?? defaultAppDataDir());
  const extensionsDir = path.resolve(options.extensionsDir ?? defaultExtensionsDir());
  return {
    installDir,
    appDataDir,
    extensionsDir,
    nlsKeysPath: path.join(installDir, 'resources', 'app', 'out', 'nls.keys.json'),
    nlsMessagesPath: path.join(installDir, 'resources', 'app', 'out', 'nls.messages.json'),
    packageJsonPath: path.join(installDir, 'resources', 'app', 'package.json'),
    languagePacksPath: path.join(appDataDir, 'languagepacks.json'),
    localePath: path.join(appDataDir, 'User', 'locale.json')
  };
}

export function findLocalVsCodeLanguagePack() {
  const root = path.join(os.homedir(), '.vscode', 'extensions');
  if (!fs.existsSync(root)) {
    return null;
  }

  const candidates = fs.readdirSync(root)
    .filter(name => /^ms-ceintl\.vscode-language-pack-zh-hans-/i.test(name))
    .map(name => path.join(root, name))
    .filter(dir => fs.existsSync(path.join(dir, 'translations', 'main.i18n.json')))
    .sort(compareLanguagePackPaths);

  return candidates.at(-1) ?? null;
}

export function languagePackRoot(inputPath) {
  const resolved = path.resolve(inputPath);
  if (fs.existsSync(path.join(resolved, 'extension', 'translations', 'main.i18n.json'))) {
    return path.join(resolved, 'extension');
  }
  if (fs.existsSync(path.join(resolved, 'translations', 'main.i18n.json'))) {
    return resolved;
  }
  throw new Error(`Cannot find translations/main.i18n.json under ${resolved}`);
}

function compareLanguagePackPaths(a, b) {
  return versionFromPath(a).localeCompare(versionFromPath(b), undefined, { numeric: true });
}

function versionFromPath(dir) {
  return path.basename(dir).replace(/^ms-ceintl\.vscode-language-pack-zh-hans-/i, '');
}

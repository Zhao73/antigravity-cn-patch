import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_LANGUAGE_PACK_VERSION = '1.104.2025082016';
export const EXTENSION_ID = 'codex.antigravity-cn-patch';
export const EXTENSION_VERSION = '0.1.0';
export const LOCALE = 'zh-cn';

export function defaultInstallDir() {
  if (process.platform === 'darwin') {
    return '/Applications/Antigravity.app';
  }

  if (process.platform === 'linux') {
    for (const candidate of ['/usr/share/antigravity', '/opt/Antigravity', '/opt/antigravity']) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return '/usr/share/antigravity';
  }

  return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'Antigravity');
}

export function defaultAppDataDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity');
  }

  if (process.platform === 'linux') {
    return path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'), 'Antigravity');
  }

  return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'Antigravity');
}

export function defaultExtensionsDir() {
  return path.join(os.homedir(), '.antigravity', 'extensions');
}

export function resolveAntigravityPaths(options = {}) {
  const installDir = path.resolve(options.installDir ?? defaultInstallDir());
  const appRoot = resolveAppRoot(installDir);
  const appAsarPath = resolveAppAsarPath({ installDir, appRoot });
  const appDataDir = path.resolve(options.appDataDir ?? defaultAppDataDir());
  const extensionsDir = path.resolve(options.extensionsDir ?? defaultExtensionsDir());
  const uiBundleRelativePaths = [
    'out/main.js',
    'out/jetskiAgent/main.js',
    'out/vs/workbench/workbench.desktop.main.js'
  ];
  const asarBundleRelativePaths = [
    'dist/preload.js'
  ];
  return {
    installDir,
    appRoot,
    appAsarPath,
    appDataDir,
    extensionsDir,
    nlsKeysPath: path.join(appRoot, 'out', 'nls.keys.json'),
    nlsMessagesPath: path.join(appRoot, 'out', 'nls.messages.json'),
    packageJsonPath: path.join(appRoot, 'package.json'),
    uiBundleRelativePaths,
    asarBundleRelativePaths,
    uiBundlePaths: uiBundleRelativePaths.map(relativePath => path.join(appRoot, ...relativePath.split('/'))),
    languagePacksPath: path.join(appDataDir, 'languagepacks.json'),
    localePath: path.join(appDataDir, 'User', 'locale.json')
  };
}

export function resolveAppRoot(installDir) {
  const candidates = [
    path.join(installDir, 'resources', 'app'),
    path.join(installDir, 'Contents', 'Resources', 'app'),
    installDir
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'out'))) {
      return candidate;
    }
  }

  return candidates[0];
}

export function resolveAppAsarPath({ installDir, appRoot }) {
  const candidates = [
    path.join(installDir, 'resources', 'app.asar'),
    path.join(installDir, 'Contents', 'Resources', 'app.asar'),
    path.join(path.dirname(appRoot), 'app.asar')
  ];

  return candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[0];
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

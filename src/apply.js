import fs from 'node:fs';
import path from 'node:path';
import { buildMainTranslation, countCoverage } from './translation.js';
import { backupFiles, writeLanguagePacksJson, writeLocaleJson } from './install.js';
import { EXTENSION_ID, EXTENSION_VERSION, LOCALE, resolveAntigravityPaths } from './paths.js';
import { copyExtensionTranslations, loadUpstreamLanguagePack } from './upstream.js';
import { applyUiPatch, loadUiTranslations } from './uiPatch.js';

export function applyPatch({
  paths,
  upstreamRoot,
  overrides,
  uiTranslations = loadUiTranslations(),
  allowFallback = true,
  dryRun = false
}) {
  const resolvedPaths = paths ?? resolveAntigravityPaths();
  assertAntigravityFiles(resolvedPaths);

  const keys = JSON.parse(fs.readFileSync(resolvedPaths.nlsKeysPath, 'utf8'));
  const messages = JSON.parse(fs.readFileSync(resolvedPaths.nlsMessagesPath, 'utf8'));
  const upstream = loadUpstreamLanguagePack(upstreamRoot);
  const coverage = countCoverage({ keys, upstream: upstream.main });
  const built = buildMainTranslation({
    keys,
    messages,
    upstream: upstream.main,
    overrides,
    allowFallback
  });

  const extensionRoot = path.join(resolvedPaths.extensionsDir, `${EXTENSION_ID}-${EXTENSION_VERSION}`);
  const translations = dryRun
    ? plannedExtensionTranslations({
        extensionRoot,
        translationEntries: upstream.translations
      })
    : copyExtensionTranslations({
        upstreamRoot: upstream.root,
        outputRoot: extensionRoot,
        translationEntries: upstream.translations
      });
  translations.vscode = path.join(extensionRoot, 'translations', 'main.i18n.json');

  if (!dryRun) {
    fs.mkdirSync(path.dirname(translations.vscode), { recursive: true });
    fs.writeFileSync(translations.vscode, `${JSON.stringify(built.translation)}\n`);
    writeGeneratedPackageJson({ extensionRoot, upstreamPackage: upstream.packageJson });
    const backup = backupFiles({
      appDataDir: resolvedPaths.appDataDir,
      extraFiles: resolvedPaths.uiBundlePaths
    });
    writeLanguagePacksJson({
      languagePacksPath: resolvedPaths.languagePacksPath,
      locale: LOCALE,
      extensionId: EXTENSION_ID,
      version: EXTENSION_VERSION,
      translations,
      label: '中文(简体)'
    });
    writeLocaleJson({ localePath: resolvedPaths.localePath, locale: LOCALE });
    const uiPatch = applyUiPatch({
      bundlePaths: resolvedPaths.uiBundlePaths,
      translations: uiTranslations
    });
    return { coverage, ...built, extensionRoot, translations, backup, uiPatch };
  }

  const uiPatch = applyUiPatch({
    bundlePaths: resolvedPaths.uiBundlePaths,
    translations: uiTranslations,
    dryRun: true
  });
  return { coverage, ...built, extensionRoot, translations, backup: null, uiPatch };
}

function assertAntigravityFiles(paths) {
  for (const filePath of [paths.nlsKeysPath, paths.nlsMessagesPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Cannot find required Antigravity NLS file: ${filePath}`);
    }
  }
}

function writeGeneratedPackageJson({ extensionRoot, upstreamPackage }) {
  const pkg = {
    name: 'antigravity-cn-patch',
    displayName: 'Antigravity 中文补丁',
    description: 'Generated Simplified Chinese language pack for Google Antigravity.',
    version: EXTENSION_VERSION,
    publisher: 'codex',
    license: 'MIT',
    engines: { vscode: upstreamPackage.engines?.vscode ?? '*' },
    categories: ['Language Packs'],
    contributes: {
      localizations: [
        {
          languageId: LOCALE,
          languageName: 'Chinese Simplified',
          localizedLanguageName: '中文(简体)',
          translations: [
            { id: 'vscode', path: './translations/main.i18n.json' }
          ]
        }
      ]
    }
  };
  fs.mkdirSync(extensionRoot, { recursive: true });
  fs.writeFileSync(path.join(extensionRoot, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
}

function plannedExtensionTranslations({ extensionRoot, translationEntries }) {
  const translations = {};
  for (const entry of translationEntries) {
    translations[entry.id] = entry.id === 'vscode'
      ? path.join(extensionRoot, 'translations', 'main.i18n.json')
      : path.join(extensionRoot, 'translations', 'extensions', `${entry.id}.i18n.json`);
  }
  return translations;
}

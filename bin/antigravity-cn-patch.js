#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPatch } from '../src/apply.js';
import { latestBackup, restoreBackup } from '../src/install.js';
import { DEFAULT_LANGUAGE_PACK_VERSION, findLocalVsCodeLanguagePack, resolveAntigravityPaths } from '../src/paths.js';
import { downloadMarketplaceLanguagePack, loadUpstreamLanguagePack } from '../src/upstream.js';
import { countCoverage } from '../src/translation.js';
import { UI_PATCH_START } from '../src/uiPatch.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help || !command) {
    printHelp();
    return;
  }

  if (command === 'apply') {
    await runApply(options);
    return;
  }

  if (command === 'status') {
    await runStatus(options);
    return;
  }

  if (command === 'restore') {
    runRestore(options);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function runApply(options) {
  const paths = resolveAntigravityPaths(options);
  const upstreamRoot = await resolveUpstreamRoot(options);
  const overrides = readOverrides(options.overrides);
  const uiTranslations = options.uiTranslations
    ? JSON.parse(fs.readFileSync(path.resolve(options.uiTranslations), 'utf8'))
    : undefined;
  const result = applyPatch({
    paths,
    upstreamRoot,
    overrides,
    uiTranslations,
    allowFallback: !options.strict,
    dryRun: options.dryRun
  });

  console.log(`Antigravity: ${paths.installDir}`);
  console.log(`Language pack: ${upstreamRoot}`);
  console.log(`Upstream coverage: ${result.coverage.matchedKeys}/${result.coverage.totalKeys} (${result.coverage.coveragePercent}%)`);
  console.log(`Project overrides: ${result.stats.overrideKeys}`);
  console.log(`Generated fallbacks: ${result.stats.fallbackKeys}`);
  console.log(`Generated extension: ${result.extensionRoot}`);
  printUiPatchSummary(result.uiPatch);
  if (options.dryRun) {
    console.log('Dry run only; no files were changed.');
  } else {
    console.log(`Backup: ${result.backup.backupDir}`);
    console.log('Locale set to zh-cn. Restart Antigravity to load the patch.');
  }
}

async function runStatus(options) {
  const paths = resolveAntigravityPaths(options);
  const upstreamRoot = await resolveUpstreamRoot({ ...options, noDownload: true });
  const upstream = loadUpstreamLanguagePack(upstreamRoot);
  const keys = JSON.parse(fs.readFileSync(paths.nlsKeysPath, 'utf8'));
  const coverage = countCoverage({ keys, upstream: upstream.main });
  const languagePacks = fs.existsSync(paths.languagePacksPath)
    ? JSON.parse(fs.readFileSync(paths.languagePacksPath, 'utf8'))
    : {};
  const locale = fs.existsSync(paths.localePath)
    ? JSON.parse(fs.readFileSync(paths.localePath, 'utf8'))
    : {};

  console.log(`Antigravity: ${paths.installDir}`);
  console.log(`Language pack: ${upstreamRoot}`);
  console.log(`Upstream coverage: ${coverage.matchedKeys}/${coverage.totalKeys} (${coverage.coveragePercent}%)`);
  console.log(`Registered zh-cn: ${Boolean(languagePacks['zh-cn'])}`);
  console.log(`Current locale: ${locale.locale ?? '(unset)'}`);
  const existingBundles = paths.uiBundlePaths.filter(filePath => fs.existsSync(filePath));
  const patchedBundles = existingBundles.filter(filePath => fs.readFileSync(filePath, 'utf8').includes(UI_PATCH_START));
  console.log(`UI bundle patch: ${patchedBundles.length}/${existingBundles.length} bundle(s) patched`);
}

function runRestore(options) {
  const paths = resolveAntigravityPaths(options);
  const backupDir = options.backup ?? latestBackup(paths.appDataDir);
  if (!backupDir) {
    throw new Error('No antigravity-cn-patch backup found.');
  }
  restoreBackup(backupDir);
  console.log(`Restored backup: ${backupDir}`);
  console.log('Restart Antigravity to load the restored locale state.');
}

function printUiPatchSummary(uiPatch) {
  const changed = uiPatch.patchedFiles.filter(file => file.changed).length;
  const existing = uiPatch.patchedFiles.length;
  console.log(`UI bundles patched: ${changed}/${existing}`);
  if (uiPatch.skippedFiles.length > 0) {
    console.log(`UI bundles skipped: ${uiPatch.skippedFiles.length}`);
  }
}

async function resolveUpstreamRoot(options) {
  if (options.sourceLanguagePack) {
    return options.sourceLanguagePack;
  }

  const local = findLocalVsCodeLanguagePack();
  if (local && options.noDownload) {
    return local;
  }

  if (local && !options.preferDownload) {
    return local;
  }

  if (options.noDownload) {
    throw new Error('No local VS Code Simplified Chinese language pack was found.');
  }

  const cacheDir = path.join(rootDir, '.tmp', 'language-packs');
  return downloadMarketplaceLanguagePack({
    version: options.languagePackVersion ?? DEFAULT_LANGUAGE_PACK_VERSION,
    cacheDir
  });
}

function readOverrides(overridesPath) {
  const filePath = path.resolve(overridesPath ?? path.join(rootDir, 'data', 'overrides.zh-cn.json'));
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (['help', 'strict', 'dry-run', 'prefer-download', 'no-download'].includes(name)) {
      options[toCamel(name)] = true;
      continue;
    }
    const value = argv[++index];
    if (!value) {
      throw new Error(`Missing value for --${name}`);
    }
    options[toCamel(name)] = value;
  }
  return { command: positionals[0], options };
}

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function printHelp() {
  console.log(`Usage:
  antigravity-cn-patch apply [options]
  antigravity-cn-patch status [options]
  antigravity-cn-patch restore [options]

Options:
  --install-dir <path>           Antigravity install directory
  --app-data-dir <path>          Antigravity user data directory
  --extensions-dir <path>        Antigravity extensions directory
  --source-language-pack <path>  Extracted VS Code zh-hans language-pack directory
  --prefer-download              Download matching VS Code 1.104 zh-hans VSIX
  --language-pack-version <ver>  Marketplace language-pack version (default ${DEFAULT_LANGUAGE_PACK_VERSION})
  --no-download                  Use local language pack only
  --overrides <path>             Project override JSON path
  --ui-translations <path>       Runtime UI string translation JSON path
  --strict                       Fail if any Antigravity keys are not translated by upstream/overrides
  --dry-run                      Build and report without writing files
  --backup <path>                Backup directory for restore
`);
}

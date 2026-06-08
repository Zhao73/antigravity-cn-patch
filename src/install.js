import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function backupFiles({ appDataDir, stamp = timestamp(), extraFiles = [] }) {
  const backupDir = path.join(appDataDir, 'antigravity-cn-patch-backups', stamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const entries = [
    {
      name: 'languagepacks.json',
      target: path.join(appDataDir, 'languagepacks.json'),
      backup: path.join(backupDir, 'languagepacks.json')
    },
    {
      name: 'locale.json',
      target: path.join(appDataDir, 'User', 'locale.json'),
      backup: path.join(backupDir, 'locale.json')
    }
  ].concat(extraFiles.map((filePath, index) => ({
    name: `program-file-${index}`,
    target: filePath,
    backup: path.join(backupDir, 'program-files', `${index}-${path.basename(filePath)}`)
  }))).map(entry => {
    const existed = fs.existsSync(entry.target);
    if (existed) {
      fs.mkdirSync(path.dirname(entry.backup), { recursive: true });
      fs.copyFileSync(entry.target, entry.backup);
    }
    return { ...entry, existed };
  });

  const manifest = { backupDir, createdAt: stamp, entries };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

export function restoreBackup(backupOrPath) {
  const backup = typeof backupOrPath === 'string'
    ? JSON.parse(fs.readFileSync(path.join(backupOrPath, 'manifest.json'), 'utf8'))
    : backupOrPath;

  for (const entry of backup.entries) {
    fs.mkdirSync(path.dirname(entry.target), { recursive: true });
    if (entry.existed) {
      fs.copyFileSync(entry.backup, entry.target);
    } else if (fs.existsSync(entry.target)) {
      fs.rmSync(entry.target);
    }
  }
}

export function writeLanguagePacksJson({
  languagePacksPath,
  locale,
  extensionId,
  version,
  translations,
  label
}) {
  fs.mkdirSync(path.dirname(languagePacksPath), { recursive: true });
  const data = readJsonIfExists(languagePacksPath, {});
  data[locale] = {
    hash: hashTranslations({ extensionId, version, translations }),
    extensions: [
      {
        extensionIdentifier: { id: extensionId },
        version
      }
    ],
    translations,
    label
  };
  fs.writeFileSync(languagePacksPath, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeLocaleJson({ localePath, locale }) {
  fs.mkdirSync(path.dirname(localePath), { recursive: true });
  fs.writeFileSync(localePath, `${JSON.stringify({ locale }, null, 2)}\n`);
}

export function latestBackup(appDataDir) {
  const backupsRoot = path.join(appDataDir, 'antigravity-cn-patch-backups');
  if (!fs.existsSync(backupsRoot)) {
    return null;
  }

  const dirs = fs.readdirSync(backupsRoot)
    .map(name => path.join(backupsRoot, name))
    .filter(dir => fs.existsSync(path.join(dir, 'manifest.json')))
    .sort();

  return dirs.at(-1) ?? null;
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashTranslations(value) {
  return crypto.createHash('md5').update(JSON.stringify(value)).digest('hex');
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

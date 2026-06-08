import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';
import { applyUiPatch } from './uiPatch.js';

export async function patchAsarUiBundles({
  appAsarPath,
  relativeBundlePaths,
  translations,
  dryRun = false,
  tempRoot = os.tmpdir()
}) {
  if (!fs.existsSync(appAsarPath)) {
    return {
      appAsarPath,
      changed: false,
      patchedFiles: [],
      skippedFiles: relativeBundlePaths.map(filePath => ({ filePath, reason: 'missing-app-asar' }))
    };
  }

  const workDir = fs.mkdtempSync(path.join(tempRoot, 'ag-cn-asar-'));
  const extractDir = path.join(workDir, 'app');
  const nextAsarPath = path.join(workDir, 'app.asar');

  try {
    await asar.extractAll(appAsarPath, extractDir);
    const bundlePaths = relativeBundlePaths.map(relativePath => path.join(extractDir, ...relativePath.split('/')));
    const uiPatch = applyUiPatch({
      bundlePaths,
      translations,
      dryRun
    });
    const changed = uiPatch.patchedFiles.some(file => file.changed);

    if (changed && !dryRun) {
      await asar.createPackage(extractDir, nextAsarPath);
      fs.copyFileSync(nextAsarPath, appAsarPath);
      asar.uncache?.(appAsarPath);
    }

    return {
      appAsarPath,
      changed,
      patchedFiles: uiPatch.patchedFiles.map(file => ({
        ...file,
        filePath: toRelativeBundlePath(file.filePath, extractDir)
      })),
      skippedFiles: uiPatch.skippedFiles.map(file => ({
        ...file,
        filePath: toRelativeBundlePath(file.filePath, extractDir)
      }))
    };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export function countPatchedAsarBundles({
  appAsarPath,
  relativeBundlePaths,
  marker
}) {
  if (!fs.existsSync(appAsarPath)) {
    return { total: 0, patched: 0, missing: relativeBundlePaths.length };
  }

  let patched = 0;
  let missing = 0;
  for (const relativePath of relativeBundlePaths) {
    try {
      const content = asar.extractFile(appAsarPath, relativePath).toString('utf8');
      if (content.includes(marker)) {
        patched += 1;
      }
    } catch {
      missing += 1;
    }
  }

  return { total: relativeBundlePaths.length, patched, missing };
}

function toRelativeBundlePath(filePath, extractDir) {
  return path.relative(extractDir, filePath).replace(/\\/g, '/');
}

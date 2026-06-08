import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';

export const MENU_PATCH_CALL_START = '/* antigravity-cn-patch:menu-call-start */';
export const MENU_PATCH_CALL_END = '/* antigravity-cn-patch:menu-call-end */';
export const MENU_PATCH_HELPER_START = '/* antigravity-cn-patch:menu-helper-start */';
export const MENU_PATCH_HELPER_END = '/* antigravity-cn-patch:menu-helper-end */';

const MENU_LABELS = {
  'About Antigravity': '关于 Antigravity',
  'Check for Updates': '检查更新',
  'Close': '关闭',
  'Copy': '复制',
  'Cut': '剪切',
  'Docs': '文档',
  'Edit': '编辑',
  'File': '文件',
  'Help': '帮助',
  'Hide Antigravity': '隐藏 Antigravity',
  'Hide Others': '隐藏其他',
  'Minimize': '最小化',
  'New Window': '新建窗口',
  'Open Antigravity': '打开 Antigravity',
  'Paste': '粘贴',
  'Quit': '退出',
  'Redo': '重做',
  'Reload': '重新加载',
  'Select All': '全选',
  'Services': '服务',
  'Toggle Developer Tools': '切换开发者工具',
  'Undo': '撤销',
  'View': '查看',
  'Window': '窗口',
  'Zoom': '缩放'
};

export async function patchMainProcessAsar({
  appAsarPath,
  dryRun = false,
  tempRoot = os.tmpdir()
}) {
  if (!fs.existsSync(appAsarPath)) {
    return { appAsarPath, changed: false, skipped: true };
  }

  const workDir = fs.mkdtempSync(path.join(tempRoot, 'ag-cn-main-'));
  const extractDir = path.join(workDir, 'app');
  const nextAsarPath = path.join(workDir, 'app.asar');

  try {
    await asar.extractAll(appAsarPath, extractDir);
    const menuPath = path.join(extractDir, 'dist', 'menu.js');
    if (!fs.existsSync(menuPath)) {
      return { appAsarPath, changed: false, skipped: true };
    }

    const patched = patchMenuSource(fs.readFileSync(menuPath, 'utf8'));
    if (patched.changed && !dryRun) {
      fs.writeFileSync(menuPath, patched.content);
      await asar.createPackage(extractDir, nextAsarPath);
      fs.copyFileSync(nextAsarPath, appAsarPath);
      asar.uncache?.(appAsarPath);
    }

    return { appAsarPath, changed: patched.changed, skipped: false };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export function patchMenuSource(source) {
  const stripped = removeMarkedBlock(
    removeMarkedBlock(source, MENU_PATCH_CALL_START, MENU_PATCH_CALL_END),
    MENU_PATCH_HELPER_START,
    MENU_PATCH_HELPER_END
  );
  const setMenuCall = '    electron_1.Menu.setApplicationMenu(menu);';
  if (!stripped.includes(setMenuCall)) {
    return { changed: false, content: source };
  }

  const call = [
    `    ${MENU_PATCH_CALL_START}`,
    '    localizeApplicationMenu(menu);',
    `    ${MENU_PATCH_CALL_END}`
  ].join('\n');
  const helper = buildMenuHelper();
  const content = `${stripped.replace(setMenuCall, `${call}\n${setMenuCall}`).trimEnd()}\n${helper}`;

  return { changed: content !== source, content };
}

function buildMenuHelper() {
  return `${MENU_PATCH_HELPER_START}
function localizeApplicationMenu(menu) {
    const labels = ${JSON.stringify(MENU_LABELS)};
    const visit = (items) => {
        for (const item of items || []) {
            if (labels[item.label]) {
                item.label = labels[item.label];
            }
            if (item.submenu) {
                visit(item.submenu.items);
            }
        }
    };
    visit(menu?.items);
}
${MENU_PATCH_HELPER_END}
`;
}

function removeMarkedBlock(source, startMarker, endMarker) {
  const pattern = new RegExp(`\\n?\\s*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\s*\\n?`, 'g');
  return source.replace(pattern, '\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

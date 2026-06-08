import fs from 'node:fs';

export const UI_PATCH_START = '/* antigravity-cn-patch:runtime-start */';
export const UI_PATCH_END = '/* antigravity-cn-patch:runtime-end */';
export const DEFAULT_UI_TRANSLATIONS_URL = new URL('../data/ui-strings.zh-cn.json', import.meta.url);

const ATTRIBUTES = [
  'aria-label',
  'data-title',
  'data-tooltip',
  'data-tooltip-content',
  'placeholder',
  'title'
];

export function applyUiPatch({
  bundlePaths,
  translations,
  dryRun = false
}) {
  const runtime = buildRuntimeTranslator(translations);
  const patchedFiles = [];
  const skippedFiles = [];

  for (const bundlePath of bundlePaths) {
    if (!fs.existsSync(bundlePath)) {
      skippedFiles.push({ filePath: bundlePath, reason: 'missing' });
      continue;
    }

    const original = fs.readFileSync(bundlePath, 'utf8');
    const stripped = removeExistingRuntimeTranslator(original);
    const updated = `${stripped.trimEnd()}\n${runtime}`;
    const changed = updated !== original;

    if (changed && !dryRun) {
      fs.writeFileSync(bundlePath, updated);
    }

    patchedFiles.push({
      filePath: bundlePath,
      changed,
      hadExistingPatch: stripped !== original
    });
  }

  return { patchedFiles, skippedFiles };
}

export function loadUiTranslations(filePath = DEFAULT_UI_TRANSLATIONS_URL) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function buildRuntimeTranslator(translations) {
  const safeTranslations = Object.fromEntries(
    Object.entries(translations)
      .filter(([source, target]) => source && target && source !== target)
      .sort(([a], [b]) => a.localeCompare(b))
  );
  const payload = JSON.stringify(safeTranslations);

  return `${UI_PATCH_START}
;(() => {
  if (globalThis.__ANTIGRAVITY_CN_PATCH__ || typeof document === 'undefined') {
    return;
  }
  globalThis.__ANTIGRAVITY_CN_PATCH__ = true;

  const translations = ${payload};
  const entries = Object.entries(translations);
  const attributes = ${JSON.stringify(ATTRIBUTES)};
  const thinkingLevels = { High: '高', Medium: '中等', Low: '低' };
  const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA']);

  function normalize(value) {
    return String(value).replace(/\\s+/g, ' ').trim();
  }

  function translate(value) {
    if (!value || !value.trim()) {
      return value;
    }

    const exact = translations[value];
    if (exact) {
      return exact;
    }

    const trimmed = value.trim();
    const trimmedExact = translations[trimmed];
    if (trimmedExact) {
      return value.replace(trimmed, trimmedExact);
    }

    const compact = normalize(value);
    const compactExact = translations[compact];
    if (compactExact) {
      return value.replace(trimmed, compactExact);
    }

    let output = value;
    for (const [source, target] of entries) {
      if (output.includes(source)) {
        output = output.split(source).join(target);
      }
    }
    return translateDynamic(output);
  }

  function translateDynamic(value) {
    return value
      .replace(/\\((High|Medium|Low)\\)/g, (_, level) => \`（\${thinkingLevels[level]}）\`)
      .replace(/\\b(\\d+)mo\\b/g, (_, count) => \`\${count}个月\`);
  }

  function shouldSkip(node) {
    for (let element = node.parentElement; element; element = element.parentElement) {
      if (skipTags.has(element.tagName) || element.closest?.('.monaco-editor, .xterm, [contenteditable="true"]')) {
        return true;
      }
    }
    return false;
  }

  function translateTextNode(node) {
    if (shouldSkip(node)) {
      return;
    }
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) {
      node.nodeValue = next;
    }
  }

  function translateElement(element) {
    for (const attribute of attributes) {
      if (!element.hasAttribute?.(attribute)) {
        continue;
      }
      const value = element.getAttribute(attribute);
      const next = translate(value);
      if (next !== value) {
        element.setAttribute(attribute, next);
      }
    }
  }

  function walk(root) {
    if (!root) {
      return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
      return;
    }

    const elementRoot = root.nodeType === Node.ELEMENT_NODE ? root : root.documentElement;
    if (elementRoot) {
      translateElement(elementRoot);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      translateTextNode(node);
    }

    if (root.querySelectorAll) {
      const selector = attributes.map(attribute => \`[\${attribute}]\`).join(',');
      for (const element of root.querySelectorAll(selector)) {
        translateElement(element);
      }
    }
  }

  function boot() {
    walk(document.documentElement);
    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateTextNode(mutation.target);
          continue;
        }
        if (mutation.type === 'attributes') {
          translateElement(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) {
          walk(node);
        }
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: attributes,
      characterData: true,
      childList: true,
      subtree: true
    });
    window.setInterval(() => walk(document.documentElement), 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
${UI_PATCH_END}
`;
}

function removeExistingRuntimeTranslator(content) {
  const start = content.indexOf(UI_PATCH_START);
  if (start === -1) {
    return content;
  }

  const end = content.indexOf(UI_PATCH_END, start);
  if (end === -1) {
    return content;
  }

  return `${content.slice(0, start)}${content.slice(end + UI_PATCH_END.length)}`;
}

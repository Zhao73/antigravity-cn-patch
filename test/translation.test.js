import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMainTranslation, countCoverage } from '../src/translation.js';

const antigravityKeys = [
  ['vs/base/common/constants/appMetadata', ['app.name', 'app.description']],
  ['vs/workbench/contrib/antigravityOnboarding/browser/antigravityOnboarding.contribution', ['openAgentManager', 'openSettings']]
];

const antigravityMessages = [
  'Antigravity',
  'Google Antigravity - Experience liftoff',
  'Open Agent Manager',
  'Open Settings'
];

const upstream = {
  version: '1.0.0',
  contents: {
    'vs/base/common/constants/appMetadata': {
      'app.name': 'Antigravity'
    }
  }
};

describe('translation merging', () => {
  it('merges upstream translations, overrides, and Chinese fallbacks', () => {
    const result = buildMainTranslation({
      keys: antigravityKeys,
      messages: antigravityMessages,
      upstream,
      overrides: {
        'vs/base/common/constants/appMetadata': {
          'app.description': 'Google Antigravity - 体验起飞'
        },
        'vs/workbench/contrib/antigravityOnboarding/browser/antigravityOnboarding.contribution': {
          openAgentManager: '打开 Agent 管理器'
        }
      },
      allowFallback: true
    });

    assert.equal(result.translation.contents['vs/base/common/constants/appMetadata']['app.name'], 'Antigravity');
    assert.equal(result.translation.contents['vs/base/common/constants/appMetadata']['app.description'], 'Google Antigravity - 体验起飞');
    assert.equal(result.translation.contents['vs/workbench/contrib/antigravityOnboarding/browser/antigravityOnboarding.contribution'].openAgentManager, '打开 Agent 管理器');
    assert.equal(result.translation.contents['vs/workbench/contrib/antigravityOnboarding/browser/antigravityOnboarding.contribution'].openSettings, '打开设置');
    assert.equal(result.stats.totalKeys, 4);
    assert.equal(result.stats.upstreamKeys, 1);
    assert.equal(result.stats.overrideKeys, 2);
    assert.equal(result.stats.fallbackKeys, 1);
  });

  it('reports missing translations in strict mode', () => {
    assert.throws(() => buildMainTranslation({
      keys: antigravityKeys,
      messages: antigravityMessages,
      upstream,
      overrides: {},
      allowFallback: false
    }), /Missing 3 translations/);
  });

  it('uses Chinese-only placeholders for unknown fallback strings', () => {
    const result = buildMainTranslation({
      keys: [['sample/module', ['someEnglishKey']]],
      messages: ['Some untranslated English text'],
      upstream: { version: '1.0.0', contents: {} },
      overrides: {},
      allowFallback: true
    });

    const value = result.translation.contents['sample/module'].someEnglishKey;
    assert.match(value, /^待补译项 [a-z0-9]{7}$/);
    assert.equal(value.includes('English'), false);
    assert.equal(value.includes('someEnglishKey'), false);
  });

  it('counts upstream coverage without mutating inputs', () => {
    const coverage = countCoverage({ keys: antigravityKeys, upstream });

    assert.equal(coverage.totalKeys, 4);
    assert.equal(coverage.matchedKeys, 1);
    assert.equal(coverage.missingKeys, 3);
    assert.equal(upstream.contents['vs/base/common/constants/appMetadata']['app.name'], 'Antigravity');
  });
});

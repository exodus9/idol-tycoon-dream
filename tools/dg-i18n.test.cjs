const test = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../dg-i18n.js');

test('all four meta UI packs expose identical keys', () => {
  assert.equal(i18n.assertKeyParity(), true);
  assert.deepEqual(i18n.getKeyParity(), {
    ko: { missing: [], extra: [] }, en: { missing: [], extra: [] },
    ja: { missing: [], extra: [] }, id: { missing: [], extra: [] }
  });
});

test('normalizes supported locale variants and falls back to English', () => {
  assert.equal(i18n.normalizeLocale('en-US'), 'en');
  assert.equal(i18n.normalizeLocale('ja_JP'), 'ja');
  assert.equal(i18n.normalizeLocale('id-ID'), 'id');
  assert.equal(i18n.normalizeLocale('in'), 'id');
  assert.equal(i18n.normalizeLocale('fr-FR'), 'en');
  assert.equal(i18n.normalizeLocale(), 'en');
});

test('formats variables and preserves missing placeholders', () => {
  assert.equal(i18n.t('en-US', 'entry.resume', { name: 'Mina' }), 'Continue Mina\'s RUN');
  assert.equal(i18n.t('ja', 'run.turn', { current: 3, total: 12 }), 'ターン 3 / 12');
  assert.equal(i18n.format('Hello {name} / {missing}', { name: 'Ari' }), 'Hello Ari / {missing}');
});

test('uses Korean, then the key itself, for missing entries', () => {
  assert.equal(i18n.t('en', 'daily.title'), 'Today\'s Fandom Project');
  const saved = i18n.packs.en['daily.title'];
  delete i18n.packs.en['daily.title'];
  assert.equal(i18n.t('en', 'daily.title'), '오늘의 팬덤 프로젝트');
  i18n.packs.en['daily.title'] = saved;
  assert.equal(i18n.t('en', 'not.a.real.key'), 'not.a.real.key');
});

test('is available through a browser-style global UMD export', () => {
  assert.equal(globalThis.DGI18n, i18n);
  assert.equal(i18n.createTranslator('id-ID')('common.confirm'), 'Konfirmasi');
});

test('critical achievement and support-card surfaces are translated in every release locale', () => {
  const keys = [
    'achievement.unlocked', 'achievement.rewardReady', 'achievement.claim',
    'support.detail.effect', 'support.detail.special', 'support.detail.origin',
    'support.detail.owned', 'support.detail.new', 'support.origin.n', 'support.origin.ssr'
  ];
  for (const locale of ['en', 'ja', 'id']) {
    for (const key of keys) {
      assert.notEqual(i18n.t(locale, key), i18n.t('ko', key), `${locale}.${key} fell back to Korean`);
      assert.notEqual(i18n.t(locale, key), key, `${locale}.${key} is missing`);
    }
  }
});

test('generic season-edition copy does not duplicate the word edition', () => {
  for (const locale of ['en', 'ja', 'id']) {
    const rendered = i18n.t(locale, 'result.editionCollectedCopy', {
      name: i18n.t(locale, 'card.seasonEdition')
    });
    assert.equal(/Edition Edition|エディションエディション|Edisi Edisi/i.test(rendered), false, `${locale}: ${rendered}`);
  }
});

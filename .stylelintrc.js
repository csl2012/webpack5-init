module.exports = {
  overrides: [
    {
      files: ['*.vue', '**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
  extends: ['stylelint-config-standard', 'stylelint-config-standard-scss'],
  rules: {
    // 兼容移动端 dpr 媒体查询
    'media-feature-name-no-unknown': [
      true,
      { ignoreMediaFeatureNames: ['min-device-pixel-ratio'] },
    ],
    // 关闭所有你报错的规则
    'media-feature-name-no-unknown': null,
    'scss/operator-no-unspaced': null,
    'declaration-block-single-line-max-declarations': null,
    'font-family-no-duplicate-names': null,

    // 关闭烦人的校验
    'no-empty-source': null,
    'block-no-empty': null,
    'property-no-unknown': null,
    'selector-type-no-unknown': null,
  },
};

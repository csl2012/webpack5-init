// commitlint 配置文件
// 遵循 conventional commits 规范
// 提交信息格式: <type>(<scope>): <subject>
// 例如: feat(auth): add login functionality
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 1. 强制必须写  scope（故事号），不写就报错
  // 'scope-empty': [2, 'never'],

  // 2. 允许任何格式的故事号：数字、S-123、故事-456 都可以
  // 'scope-case': [0],
  // 自定义提交类型
  rules: {
    'type-enum': [
      2, // 错误级别: 2 表示错误，1 表示警告，0 表示忽略
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档更新
        'style', // 代码样式调整
        'refactor', // 代码重构
        'test', // 测试相关
        'chore', // 构建或依赖更新
        'revert', // 回滚提交
        'perf', // 性能优化
        'ci', // CI/CD 配置
      ],
    ],
    // 提交信息长度限制
    'subject-max-length': [1, 'always', 100],
    // // 关闭长度限制
    // 'header-max-length': [0],
    // 'subject-max-length': [0],
  },
};

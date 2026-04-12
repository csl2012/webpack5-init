/**
 * 错误处理工具 - 实现 await-to-js 的功能
 * 用法: const [err, data] = await to(apiFn())
 * @param {Promise} promise - 要处理的 Promise
 * @returns {Promise<Array>} - 返回 [error, data] 数组
 */
export default function to(promise) {
  return promise.then((data) => [null, data]).catch((err) => [err, null]);
}

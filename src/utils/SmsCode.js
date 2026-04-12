// utils/SmsCode.js
export class SmsCode {
  /**
   * @param {Object} options
   * @param {number} options.cooldown 倒计时秒数，默认60
   * @param {Function} options.onChange 状态变化回调(loading, count, disabled)
   */
  constructor(options = {}) {
    this.cooldown = options.cooldown || 60;
    this.onChange = options.onChange || null;

    // 内部状态（完全封闭，不对外暴露）
    this.loading = false;
    this.count = 0;
    this.timer = null;
  }

  // 获取当前状态（只读）
  getState() {
    return {
      loading: this.loading,
      count: this.count,
      disabled: this.loading || this.count > 0,
      text: this.loading
        ? '发送中...'
        : this.count > 0
          ? `${this.count}s后重试`
          : '获取验证码',
    };
  }

  // 发送验证码（核心方法）
  async send(apiFn, params = {}) {
    if (typeof apiFn !== 'function') {
      throw new Error('apiFn 必须是一个函数，用于发送验证码请求');
    }
    // 防重复
    if (this.loading || this.count > 0) return;

    this.loading = true;
    this.#emitChange();

    try {
      // 执行你传入的接口 Promise
      await apiFn(params);
      // 成功才倒计时
      this.#startCountdown();
    } catch (error) {
      // 可以在这里添加错误处理逻辑
      console.error('发送验证码失败:', error);
      // 可以选择是否向上抛出错误
      throw error;
    } finally {
      this.loading = false;
      this.#emitChange();
    }
  }

  #startCountdown() {
    this.count = this.cooldown;
    this.#clearTimer();

    // 记录开始时间，用于时间补偿
    this.startTime = Date.now();
    // 目标结束时间
    this.endTime = this.startTime + this.count * 1000;

    const tick = () => {
      // 计算剩余时间（自动补偿，不会漂移）
      const remain = Math.ceil((this.endTime - Date.now()) / 1000);
      this.count = remain < 0 ? 0 : remain;

      this.#emitChange();

      if (this.count > 0) {
        // 下一帧
        this.timer = setTimeout(tick, 1000);
      } else {
        this.#clearTimer();
      }
    };

    // 第一次执行
    tick();
  }

  #clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // 清理时间记录
    this.startTime = null;
    this.endTime = null;
  }

  // 手动重置（退出页面/重置表单用）
  reset() {
    this.count = 0;
    this.loading = false;
    this.#clearTimer();
    this.#emitChange();
  }

  // 销毁（页面卸载必须调用）
  destroy() {
    this.reset();
    this.onChange = null;
  }

  // 触发外部状态更新
  #emitChange() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.getState());
    }
  }
}

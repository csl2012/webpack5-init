import { ref, onUnmounted } from 'vue';

/**
 * @param minShowTime 最小展示时间，防止闪屏
 * 用途：全局 / 区块 / 按钮 通用
 */
export function useLoading(minShowTime = 300) {
  // 计数器：解决多并发、串行接口
  const count = ref(0);
  // 最终展示状态
  const isLoading = ref(false);

  let timer: number | null = null;
  let startTime = 0;

  // 清理定时器（核心！）
  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  // 开启loading
  const start = () => {
    count.value++;
    startTime = Date.now();

    // 防抖：过快接口不转圈
    if (!timer) {
      clearTimer(); // 先清旧定时器
      timer = window.setTimeout(() => {
        isLoading.value = count.value > 0;
        timer = null;
      }, minShowTime);
    }
  };

  // 关闭loading
  const finish = () => {
    count.value--;
    const diff = Date.now() - startTime;

    // 保证最小展示时长，避免一闪而过
    const close = () => {
      if (count.value <= 0 && !timer) {
        isLoading.value = false;
      }
    };

    if (diff >= minShowTime) {
      close();
    } else {
      clearTimer(); // 清旧定时器
      timer = window.setTimeout(close, minShowTime - diff);
    }
  };

  // 组件卸载时清空定时器（防内存泄漏）
  onUnmounted(() => {
    clearTimer();
  });

  return {
    isLoading,
    start,
    finish,
  };
}

// 全局唯一 页面Loading单例
export const globalLoading = useLoading(300);

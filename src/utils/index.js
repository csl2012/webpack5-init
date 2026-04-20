import { actionSheet } from './actionSheet';
import { apiClient, apiUtils, apiConfig } from './apiClient';
import { loading, loadingClose } from './loading';
import { modal } from './modal';
import { SmsCode } from './SmsCode';
import { getTheme } from './theme';
import { to } from './to';
import { toast } from './toast';

// 辅助函数：获取 CSS 变量值
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

export {
  actionSheet,
  apiClient,
  apiUtils,
  apiConfig,
  loading,
  loadingClose,
  modal,
  SmsCode,
  getTheme,
  toast,
  to,
  getCSSVar,
};

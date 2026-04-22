// src/utils/request.ts - 整合后的HTTP请求封装
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import querystring from "querystring";
import { ElMessage } from 'element-plus';

// 响应数据类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

// 错误处理函数
const errorHandler = (status: number, info: any) => {
  let errorMessage = '';
  
  switch (status) {
    case 400:
      errorMessage = info?.message || "请求参数错误";
      console.log("语义有误");
      break;
    case 401:
      errorMessage = "未授权，请重新登录";
      console.log("未授权，请登录");
      // 清除token并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 如果有路由实例，跳转到登录页
      if (window.location.pathname !== '/login') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      break;
    case 403:
      errorMessage = "权限不足";
      console.log("拒绝访问");
      break;
    case 404:
      errorMessage = "请求的资源不存在";
      console.log("请求错误,未找到该资源");
      break;
    case 405:
      errorMessage = "请求方法不允许";
      console.log("请求方法未允许");
      break;
    case 408:
      errorMessage = "请求超时";
      console.log("请求超时");
      break;
    case 500:
      errorMessage = "服务器内部错误";
      console.log("服务器端出错");
      break;
    case 501:
      errorMessage = "网络未实现";
      console.log("网络未实现");
      break;
    case 502:
      errorMessage = "网络错误";
      console.log("网络错误");
      break;
    case 503:
      errorMessage = "服务不可用";
      console.log("服务不可用");
      break;
    case 504:
      errorMessage = "网络超时";
      console.log("网络超时");
      break;
    default:
      errorMessage = info?.message || `请求失败 (${status})`;
      console.log(info);
  }

  // 显示错误提示（如果Element Plus可用）
  if (typeof ElMessage !== 'undefined') {
    ElMessage.error(errorMessage);
  }
  
  return errorMessage;
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 5000,
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 处理请求数据格式
    if (config.method === "post" || config.method === "put") {
      if (config.headers && config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        config.data = querystring.stringify(config.data);
      } else if (config.headers && config.headers["Content-Type"] === "application/json") {
        config.data = JSON.stringify(config.data);
      }
      // 如果没有指定Content-Type，默认使用JSON
      else if (!config.headers || !config.headers["Content-Type"]) {
        if (config.headers) {
          config.headers["Content-Type"] = "application/json";
        }
      }
    }

    // 添加请求日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('请求发送:', {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params
      });
    }

    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 添加响应日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('响应接收:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }

    // 兼容原有的简单成功判断
    if (response.status === 200) {
      // 如果响应数据有标准的code字段，进行业务逻辑判断
      if (response.data && typeof response.data === 'object' && 'code' in response.data) {
        const { data } = response;
        if (data.code === 200) {
          return Promise.resolve(response);
        } else {
          // 业务错误处理
          const errorMessage = data.message || '请求失败';
          if (typeof ElMessage !== 'undefined') {
            ElMessage.error(errorMessage);
          }
          return Promise.reject(new Error(errorMessage));
        }
      }
      // 没有code字段或不是对象，直接返回（兼容原有逻辑）
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  (error) => {
    const { response } = error;
    if (response) {
      const errorMessage = errorHandler(response.status, response.data);
      return Promise.reject(new Error(errorMessage));
    } else {
      console.error("Network error:", error);
      const networkError = "网络连接失败，请检查网络设置";
      if (typeof ElMessage !== 'undefined') {
        ElMessage.error(networkError);
      }
      return Promise.reject(new Error(networkError));
    }
  }
);

// 扩展的请求方法类（保持向后兼容）
export class HttpRequest {
  /**
   * GET请求
   */
  static get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return service.get(url, { params, ...config });
  }

  /**
   * POST请求
   */
  static post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return service.post(url, data, config);
  }

  /**
   * PUT请求
   */
  static put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return service.put(url, data, config);
  }

  /**
   * DELETE请求
   */
  static delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return service.delete(url, config);
  }

  /**
   * 上传文件
   */
  static upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    });
  }

  /**
   * 下载文件
   */
  static download(url: string, params?: any, filename?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      service.get(url, {
        params,
        responseType: 'blob'
      }).then((response) => {
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // 从响应头获取文件名
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition && !filename) {
          const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (matches && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
            filename = decodeURIComponent(filename);
          }
        }
        
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

// 导出常用方法（新增功能）
export const { get, post, put, delete: del, upload, download } = HttpRequest;

// 格式化时间函数（辅助函数）
export const formatDateTime = (date: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 响应格式化函数（辅助函数）
export const createResponse = (success: boolean, data: any = null, message: string = '', code: number = 200) => {
  return {
    code: success ? 200 : (code || 500),
    message: message || (success ? '操作成功' : '操作失败'),
    data: data,
    timestamp: new Date().toISOString()
  };
};

// 成功响应
export const successResponse = (data: any = null, message: string = '操作成功') => 
  createResponse(true, data, message, 200);

// 错误响应
export const errorResponse = (message: string = '操作失败', code: number = 500, data: any = null) => 
  createResponse(false, data, message, code);

// 默认导出service实例（保持向后兼容）
export default service;
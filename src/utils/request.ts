import axios from "axios";
import querystring from "querystring";


const errorHandler=(status:number,info:any) => {
  switch(status) {
    case 400:
      console.log("语义有误");
      break;
    case 401:
      console.log("未授权，请登录");
      break;
    case 403:
      console.log("拒绝访问");
      break;
    case 404:
      console.log("请求错误,未找到该资源");
      break;
    case 405:
      console.log("请求方法未允许");
      break;
    case 408:
      console.log("请求超时");
      break;
    case 500:
      console.log("服务器端出错");
      break;
    case 501:
      console.log("网络未实现");
      break;
    case 502:
      console.log("网络错误");
      break;
    case 503:
      console.log("服务不可用");
      break;
    case 504:
      console.log("网络超时");
      break;
    default:
      console.log(info);
  }
}

const service = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 5000,
});

service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (config.method === "post" || config.method === "put") {
      if (config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        config.data = querystring.stringify(config.data);
      } else if (config.headers["Content-Type"] === "application/json") {
        config.data = JSON.stringify(config.data);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

service.interceptors.response.use(
  (response) => {
    return response.status === 200 ? Promise.resolve(response) : Promise.reject(response);
  },
  (error) => {
    const { response } = error;
    if (response) {
      errorHandler(response.status, response.data);
      return Promise.reject(new Error(response.data.message || "Error"));
    } else {
      console.error("Network error:", error);
      return Promise.reject(new Error("网络错误"));
    }
  }
)
  export default service;
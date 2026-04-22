import axios from '../utils/request';
import path from './path';


const api={
    // 登录
    login: (data: any) => {
        return axios.post("/users/login", data);
    },
    // 获取用户信息
    getUserInfo: () => {
        return axios.get("/users/info");
    },
    // 获取入库单创建选项
    getInboundCreateOptions: () => {
        return axios.get("/inbound-orders/create-options");
    },
    // 创建入库单
    createInboundOrder: (data: any) => {
        return axios.post("/inbound-orders", data);
    },
    // 获取入库单列表
    getInboundOrders: (params: any) => {
        return axios.get("/inbound-orders", { params });
    },
    // 获取入库单筛选选项
    getInboundOptions: () => {
        return axios.get("/inbound-orders/options");
    },
    // 审核入库单
    auditInboundOrders: (data: any) => {
        return axios.put("/inbound-orders/audit", data);
    },
    // 撤销入库单
    revokeInboundOrders: (data: any) => {
        return axios.put("/inbound-orders/revoke", data);
    },
    // 获取入库单详情
    getInboundOrderDetail: (id: number | string) => {
        return axios.get(`/inbound-orders/${id}`);
    },
    // 获取入库单打印数据
    getInboundOrderPrint: (id: number | string) => {
        return axios.get(`/inbound-orders/${id}/print`);
    },
    // 导出入库单
    exportInboundOrders: (params: any) => {
        return axios.get("/inbound-orders/export", { params });
    },
}

export default api;
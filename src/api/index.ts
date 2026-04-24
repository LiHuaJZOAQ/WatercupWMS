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
    // 获取出库单筛选选项
    getOutboundOptions: () => {
        return axios.get("/outbound-orders/options");
    },
    // 获取出库单列表
    getOutboundOrders: (params: any) => {
        return axios.get("/outbound-orders", { params });
    },
    // 获取出库单详情
    getOutboundOrderDetail: (id: number | string) => {
        return axios.get(`/outbound-orders/${id}`);
    },
    // 审核出库单
    auditOutboundOrder: (id: number | string, data: any) => {
        return axios.put(`/outbound-orders/${id}/audit`, data);
    },
    // 撤销出库单
    revokeOutboundOrder: (id: number | string) => {
        return axios.put(`/outbound-orders/${id}/revoke`);
    },
    // 删除出库单
    deleteOutboundOrder: (id: number | string) => {
        return axios.delete(`/outbound-orders/${id}`);
    },
    // 获取供应商列表
    getSuppliers: (params: any) => {
        return axios.get("/suppliers", { params });
    },
    // 创建供应商
    createSupplier: (data: any) => {
        return axios.post("/suppliers", data);
    },
    // 更新供应商
    updateSupplier: (id: number | string, data: any) => {
        return axios.put(`/suppliers/${id}`, data);
    },
    // 删除供应商
    deleteSupplier: (id: number | string) => {
        return axios.delete(`/suppliers/${id}`);
    },

    // 客户管理
    getCustomers: (params: any) => axios.get("/customers", { params }),
    createCustomer: (data: any) => axios.post("/customers", data),
    updateCustomer: (id: number | string, data: any) => axios.put(`/customers/${id}`, data),
    deleteCustomer: (id: number | string) => axios.delete(`/customers/${id}`),

    // 部门管理
    getDepartments: (params: any) => axios.get("/departments", { params }),
    createDepartment: (data: any) => axios.post("/departments", data),
    updateDepartment: (id: number | string, data: any) => axios.put(`/departments/${id}`, data),
    deleteDepartment: (id: number | string) => axios.delete(`/departments/${id}`),

    // 加工厂管理
    getFactories: (params: any) => axios.get("/factories", { params }),
    createFactory: (data: any) => axios.post("/factories", data),
    updateFactory: (id: number | string, data: any) => axios.put(`/factories/${id}`, data),
    deleteFactory: (id: number | string) => axios.delete(`/factories/${id}`),

    // 成品档案管理
    getFinishedProducts: (params: any) => axios.get("/finished-products", { params }),
    createFinishedProduct: (data: any) => axios.post("/finished-products", data),
    updateFinishedProduct: (id: number | string, data: any) => axios.put(`/finished-products/${id}`, data),
    deleteFinishedProduct: (id: number | string) => axios.delete(`/finished-products/${id}`),

    // 成品入库管理
    getFinishedInboundOptions: () => axios.get("/finished-inbounds/options"),
    getFinishedInbounds: (params: any) => axios.get("/finished-inbounds", { params }),
    getFinishedInboundDetail: (id: number | string) => axios.get(`/finished-inbounds/${id}`),
    auditFinishedInbound: (id: number | string, data: any) => axios.put(`/finished-inbounds/${id}/audit`, data),
    revokeFinishedInbound: (id: number | string) => axios.put(`/finished-inbounds/${id}/revoke`),
    deleteFinishedInbound: (id: number | string) => axios.delete(`/finished-inbounds/${id}`),

    // 成品出库管理
    getFinishedOutboundOptions: () => axios.get("/finished-outbounds/options"),
    getFinishedOutbounds: (params: any) => axios.get("/finished-outbounds", { params }),
    getFinishedOutboundDetail: (id: number | string) => axios.get(`/finished-outbounds/${id}`),
    auditFinishedOutbound: (id: number | string, data: any) => axios.put(`/finished-outbounds/${id}/audit`, data),
    revokeFinishedOutbound: (id: number | string) => axios.put(`/finished-outbounds/${id}/revoke`),
    deleteFinishedOutbound: (id: number | string) => axios.delete(`/finished-outbounds/${id}`),

    // 盘点管理
    getStocktakings: (params: any) => axios.get("/stocktaking", { params }),
    getStocktakingDetail: (id: number | string) => axios.get(`/stocktaking/${id}`),
    auditStocktaking: (id: number | string, data: any) => axios.put(`/stocktaking/${id}/audit`, data),
    deleteStocktaking: (id: number | string) => axios.delete(`/stocktaking/${id}`),

    // 系统设置 - 用户管理
    getUsers: (params: any) => axios.get("/users", { params }),
    createUser: (data: any) => axios.post("/users", data),
    updateUser: (id: number | string, data: any) => axios.put(`/users/${id}`, data),
    deleteUser: (id: number | string) => axios.delete(`/users/${id}`),

    // 系统设置 - 角色与权限管理
    getRoles: () => axios.get("/roles"),
    createRole: (data: any) => axios.post("/roles", data),
    updateRole: (id: number | string, data: any) => axios.put(`/roles/${id}`, data),
    deleteRole: (id: number | string) => axios.delete(`/roles/${id}`),
    getPermissions: () => axios.get("/permissions"),

    // 系统设置 - 操作日志
    getOperationLogs: (params: any) => axios.get("/operation-logs", { params }),
}

export default api;
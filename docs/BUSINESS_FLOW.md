# WMS 业务流程与泳道图 (Business Flow & Swimlane Diagram)

## 1. 核心入库业务流程 (Inbound Flow)

```mermaid
graph TD;
    A[供应商发货/采购到货] --> B(仓库收货员创建入库单);
    B --> C{是否草稿?};
    C -- 是 --> D[保存为草稿,不扣库存];
    C -- 否 --> E[提交待审核];
    E --> F[仓库主管/质检员审核];
    F -->|审核驳回| G[单据作废/修改重提];
    F -->|审核通过| H[系统自动增加库存];
    H --> I[记录 Inventory Transaction 流水];
    I --> J[更新相关库位占用状态 (Occupancy)];
    J --> K[入库完成, 可选打印入库交接单];
```

## 2. 核心出库与波次拣货泳道图 (Outbound & Wave Picking Swimlane)

```mermaid
sequenceDiagram
    participant 业务员 as 业务员/销售
    participant 仓库主管 as 仓库主管
    participant WMS系统 as WMS 系统
    participant 拣货员 as 现场拣货员 (PDA)

    业务员->>WMS系统: 创建出库单 (领料/发货)
    WMS系统-->>业务员: 生成待审核出库单
    业务员->>仓库主管: 提交审核
    仓库主管->>WMS系统: 审核出库单
    WMS系统->>WMS系统: 校验库存余额并预扣减
    WMS系统-->>仓库主管: 审核通过 (Status=approved)
    
    仓库主管->>WMS系统: 进入波次管理, 选中多个待出库单
    仓库主管->>WMS系统: 点击"智能推荐波次"或手动组建波次
    WMS系统-->>仓库主管: 生成波次单号 (WaveNo)
    
    拣货员->>WMS系统: PDA 扫码波次单号开始作业
    WMS系统-->>拣货员: 渲染 3D/2D 最优拣货路径地图
    
    loop 按照路线指引
        拣货员->>WMS系统: 到达库位, PDA 扫描库位条码
        拣货员->>WMS系统: 扫描物料条码并确认数量
    end
    
    拣货员->>WMS系统: 提交波次拣货完成
    WMS系统->>WMS系统: 更新波次明细状态为 Picked
    WMS系统->>WMS系统: 更新原出库单状态为 Completed
    WMS系统->>WMS系统: 释放库存锁定, 扣除实际库存
    WMS系统-->>拣货员: 提示作业完成
```

## 3. 库存盘点业务流程 (Stocktaking Flow)

```mermaid
graph LR;
    A(发起盘点任务) --> B[选择特定库区或物料];
    B --> C[冻结对应库存/库位];
    C --> D(打印盘点表/PDA下发);
    D --> E[实地清点录入实盘数量];
    E --> F{对比账面库存};
    F -- 无差异 --> G[盘点完成,解冻库存];
    F -- 有差异 --> H[生成盘点差异报告];
    H --> I(财务/主管审核);
    I -->|审核通过| J[自动生成盘盈/盘亏流水];
    J --> G;
    I -->|驳回| K[重新复盘];
    K --> E;
```
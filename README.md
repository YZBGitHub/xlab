# XLab 2D 物联网虚拟仿真平台

<div align="center">

![XLab Logo](/public/logo.png)

**新一代面向物联网、工控与智慧场景的 2D 虚拟仿真及可视化系统**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📖 项目简介

**XLab** 是一款现代化的 **2D 物联网虚拟仿真与拓扑设计平台**。平台集成了丰富的工业级传感器、执行器、网关与控制模块，支持通过拖拽式交互快速搭建智慧农业、智慧家居、智能交通、智慧安防等行业的 2D 虚拟仿真拓扑。平台深度集成了设备协议解析、多规格供电配置、寄存器映射向导以及 AI 智能助手，为教学实训、方案设计与工程预演提供了轻量高效的一站式解决方案。

---

## ✨ 核心特性

### 1. 🗂️ 首页与设备资产中心 (`/`)
- **多层级设备目录**：内置涵盖温湿度、光照、气体、水质、电表、PLC、LoRa/ZigBee 网关、继电器等 **220+** 款设备物料。
- **智能协议推断**：支持自动识别并分类 **Modbus RTU/TCP、Zigbee、LoRa、蓝牙、模拟量、开关量** 等常见协议。
- **设备详情与命令帧**：快速查看设备参数、通信配置、工作电压及命令解析结构。
- **多维筛选与搜索**：支持按设备类型（传感器/执行器/网关/继电器）、通信协议及关键字毫秒级检索。

### 2. 🎨 2D 仿真拓扑设计器 (`/design`)
- **自由画布**：支持画布缩放、平移、网格对齐、参考线辅助与图层管理。
- **拖拽式物料放置**：从左侧物料库自由拖拽标准设备或自定义设备至画布中。
- **拓扑连线与参数配置**：支持节点连线配置、设备状态监听、属性面板即时编辑。
- **历史记录控制**：支持撤销 (Undo)、重做 (Redo)、全屏演示与设计快照保存。

### 3. 🖥️ 控制台与应用中心 (`/console`)
- **行业应用管理**：统一管理智慧农业、智慧家居、智慧安防、隧道交通等 2D 仿真应用工程。
- **应用生命周期**：支持工程编辑、发布上线、状态监控与快捷分享。
- **自定义物料库管理**：集中管理企业和个人用户自定义扩充的硬件物料。

### 4. 🛠️ 自定义设备向导 (`AddCustomDeviceModal`)
- **全流程配置向导**：支持分步配置传感设备、执行器与网关。
- **供电与电气参数**：支持直流 (5V/12V/24V)、交流 (220V/380V) 或无源配置。
- **开关与状态贴图**：支持上传自定义设备运行态（开启/关闭/告警）贴图与动作逻辑。
- **数据帧与寄存器映射**：支持 Modbus 功能码（如 `0x03`、`0x06`）、起始地址、数据长度及换算公式定义。

### 5. 🤖 AI 智能协同助手 (`AgentWidget`)
- 基于 Google GenAI 与大语言模型，支持通过自然语言对话引导完成设备属性建模、协议配置建议与拓扑方案推荐。

---

## 🏗️ 系统架构与目录结构

```text
xlab/
├── public/                     # 静态公共资源
│   ├── device/                 # 226 款硬件设备与传感器高清缩略图 (.png)
│   └── logo.png                # 系统 Logo
├── src/
│   ├── assets/                 # 样式与静态资源
│   ├── components/             # 公共可复用 UI 组件
│   │   ├── AddCustomDeviceModal.tsx # 新增自定义设备向导弹窗
│   │   ├── AgentWidget.tsx     # AI 悬浮对话助手
│   │   └── PrototypeNav.tsx    # 原型快速导航栏
│   ├── data/                   # 核心静态数据与设备树
│   │   ├── deviceImageMap.ts   # 设备 ID 与图片路径字典
│   │   └── deviceTree.ts       # 全量设备层级分类树与属性定义
│   ├── hooks/                  # 自定义 React Hooks
│   │   └── useDraggable.ts     # 画布节点拖拽逻辑封装
│   ├── pages/                  # 核心路由页面
│   │   ├── HomePage.tsx        # 首页 / 仿真设备中心与仿真应用中心
│   │   ├── DesignPage.tsx      # 2D 仿真设计画布
│   │   ├── ProjectDetailPage.tsx # 仿真应用详情
│   │   └── ConsolePage.tsx     # 控制台 / 全部应用与自定义设备
│   ├── utils/                  # 工具函数
│   │   └── deviceImages.ts     # 设备图片路径标准化与容错解析
│   ├── App.tsx                 # 根组件与路由配置
│   ├── index.css               # 全局样式 (Tailwind CSS 4)
│   └── main.tsx                # 应用入口
├── mapping.json                # 设备 ID 与图片名称映射源数据
├── update_mapping.js           # 自动同步映射至 TypeScript 代码的维护脚本
├── vite.config.ts              # Vite 打包与开发服务配置
├── tsconfig.json               # TypeScript 编译选项配置
└── package.json                # 项目依赖与运行脚本
```

---

## 🚀 快速上手

### 环境要求
- **Node.js**: `v18.0.0` 或更高版本（推荐 `v20+` / `v24+`）
- **包管理器**: `npm`、`yarn`、`pnpm` 或 `bun`

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地开发服务
```bash
npm run dev
```
启动后在浏览器中访问：`http://localhost:3000/`

### 3. 代码检查与构建
- **TypeScript 类型检查**：
  ```bash
  npm run lint
  ```
- **生产打包构建**：
  ```bash
  npm run build
  ```
- **本地预览生产包**：
  ```bash
  npm run preview
  ```

---

## 🔧 维护与扩展

### 添加或更新设备图片
1. 将新的设备缩略图文件（如 `MySensor_Thumbnail.png`）放入 `public/device/` 目录下。
2. 在 `mapping.json` 中添加设备 ID 与文件名的键值对：
   ```json
   {
     "MySensor": "MySensor_Thumbnail.png"
   }
   ```
3. 运行更新脚本自动重新生成 TypeScript 类型映射：
   ```bash
   node update_mapping.js
   ```

---

## 🛠️ 技术选型

| 技术 / 库 | 版本 / 说明 | 用途 |
| :--- | :--- | :--- |
| **React** | `19.0.1` | 前端组件化核心框架 |
| **TypeScript** | `~5.8.2` | 静态强类型与开发代码规范 |
| **Vite** | `6.2.3` | 新一代轻量快速的前端构建工具 |
| **Tailwind CSS** | `4.1.14` | 原子化实用优先的 CSS 样式引擎 |
| **React Router** | `7.18.2` | 单页面路由控制与状态导航 |
| **Lucide React** | `0.546.0`| 现代统一的图标库 |
| **@google/genai**| `2.4.0`  | Google Gemini AI 智能助手对接支持 |

---

## 📄 开源许可证

本项目基于私有项目规范或所属团队协议开发与维护。

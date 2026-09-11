import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'path';
import { runMigrations } from './migrations';

const dbDir = path.join(process.cwd(), 'db');
fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'db.sqlite3');
const db = new Database(dbPath);

// 运行数据库迁移
runMigrations(db);

// 初始化resume数据（如果表为空）
const resumeCount = db.prepare("SELECT COUNT(*) as count FROM resume").get() as { count: number };
if (resumeCount.count === 0) {
  const defaultResumeData = {
    skills: {
      basics: [
        { name: "TypeScript", level: 92 },
        { name: "Node.js", level: 90 },
        { name: "Python", level: 78 },
      ],
      expand: [
        { name: "NestJS / 微服务", level: 90 },
        { name: "Redis / RabbitMQ", level: 86 },
        { name: "Docker / Nginx", level: 84 },
      ],
      frameworks: [
        { name: "React / Next.js", level: 88 },
        { name: "Vue 3", level: 88 },
        { name: "Spring Boot", level: 74 },
      ],
      crossPlatform: [
        { name: "Electron", level: 85 },
        { name: "React Native", level: 76 },
        { name: "Three.js / Cesium", level: 72 },
      ]
    },
    otherSkills: [
      "PostgreSQL", "MinIO", "gRPC", "Nacos",
      "Linux", "Git", "Codex", "Cursor"
    ],
    history: [
      {
        title: "容联云 · 全栈开发工程师",
        date: "2025.10 — 至今",
        description: "参与企业通信云产品的全栈研发，使用 Node.js 与 Spring Boot 交付业务服务和接口；使用 React 构建管理端，完成状态管理、组件封装、联调与版本迭代。",
        type: "work"
      },
      {
        title: "中国电子科技十所（外协）· 高级 Web / 全栈开发工程师",
        date: "2022.11 — 2025.09",
        description: "负责算法训练、实时数据与可视化场景的服务端及前端研发。以 NestJS、gRPC、RabbitMQ、Redis 构建模块化服务，处理大模型 SSE 流式响应与 WebSocket 高频数据渲染。",
        type: "work"
      },
      {
        title: "不知其鸣科技 · 前后端开发负责人",
        date: "2021.04 — 2022.11",
        description: "负责海外 ACG 内容平台及企业业务系统，推进 Node.js 服务、鉴权与资源管理、视频处理链路、Vue 3 PC/H5 页面及 Docker 化上线交付。",
        type: "work"
      },
      {
        title: "中国通行服务有限公司 · 前端开发工程师",
        date: "2020.09 — 2021.04",
        description: "参与通信基础设施共建共享与智慧交通管理平台，交付动态路由、RBAC 权限、复杂表单、GIS 场景及 ECharts 数据大屏。",
        type: "work"
      }
    ]
  };
  
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("skills", JSON.stringify(defaultResumeData.skills));
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("otherSkills", JSON.stringify(defaultResumeData.otherSkills));
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("history", JSON.stringify(defaultResumeData.history));
}

export default db;

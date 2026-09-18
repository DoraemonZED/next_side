// 全页复用的基础信息：修改一次即可同步更新所有引用位置。
export const contactEmail = "2433255732@qq.com";
export const experienceYears = "5+";
export const fullStackEngineerTitle = "NODE.JS / JAVA FULL-STACK ENGINEER";
export const name = "杨伟";
export const englishName = "Wayne Yang";

export const resumeData = {
  // 顶部导航与首屏：修改姓名、求职状态、个人简介、联系方式及首屏按钮文案。
  site: {
    brandInitials: "AW",
    brandName: "AWEI.",
    brandSuffix: "DEV",
    contactEmail,
  },
  // 大 Banner 文案与按钮。headlineLines 控制主标题的分行，emphasisLine 为高亮行。
  hero: {
    availability: "OPEN TO WORK · CHENGDU",
    overline: `${fullStackEngineerTitle} / 2026`,
    name,
    headlineLines: ["交付可靠的"],
    emphasisLine: "全栈业务系统。",
    summary: [
      "聚焦 Node.js / Java 全栈研发，具备从领域建模、服务治理与实时通信，到 Web / 桌面 / 移动端交付的完整工程能力。",
      "能够面向复杂业务独立推进架构设计、核心开发、稳定性治理与容器化上线。",
    ],
    // 右侧模拟代码窗口：按行编辑代码内容；type 用于保留原有的语法高亮样式。
    code: [
      { prefix: "const", text: " engineer = {", type: "keyword" },
      { text: `name: "${englishName}",`, indent: 1, type: "string" },
      { text: 'role: "Node.js / Java Full-Stack",', indent: 1, type: "string" },
      { text: `experience: ${experienceYears},`, indent: 1, type: "number" },
      { text: "focus: [", indent: 1 },
      { text: '"Node.js / Java", "Realtime",', indent: 2, type: "string" },
      { text: '"Distributed Systems"', indent: 2, type: "string" },
      { text: "],", indent: 1 },
      { text: 'status: "READY_TO_BUILD"', indent: 1, type: "status" },
      { text: "}" },
    ],
    // Banner 下方的四项数据卡片；可直接增删或修改数字、标题和英文说明。
    stats: [
      { label: "年全栈研发", value: `0${experienceYears}`, note: "YEARS OF BUILDING" },
      { label: "代表性项目", value: "05", note: "SELECTED WORK" },
      { label: "多端交付能力", value: "03", note: "DELIVERY PLATFORMS" },
      { label: "持续学习", value: "NOW", note: "ALWAYS EVOLVING" },
    ],
  },
  // 左侧个人信息卡；电话仅用于 tel 链接，displayPhone 为页面展示格式。
  profile: {
    role: fullStackEngineerTitle,
    name,
    englishName,
    bio: `${fullStackEngineerTitle}，擅长复杂业务建模、实时通信、AI 应用服务与跨端产品的全链路交付。`,
    phone: "18244230571",
    displayPhone: "182 4423 0571",
    location: "成都 · 可到岗",
    experience: `${experienceYears} 年研发经验`,
    status: "寻求新的技术挑战",
    statusDetail: "全栈开发 / AI Agent / 多端产品",
  },
  // “核心能力”卡片。icon 是 page.tsx 中图标映射使用的名称，避免在数据文件中混入 React 组件。
  capabilities: [
    { icon: "ServerCog", no: "01", title: "Node.js / Java 服务架构", text: "围绕领域边界组织 Node.js 与 Spring Boot 服务，结合服务发现、配置治理、RPC 通信和故障隔离，构建可演进的业务系统。", tags: ["Spring Boot", "Node.js", "Nacos", "gRPC", "Redis"] },
    { icon: "Radio", no: "02", title: "高并发与异步任务", text: "面向峰值流量设计削峰、任务编排和可靠消费链路，覆盖实时推送、幂等控制、重试补偿与背压治理。", tags: ["RabbitMQ", "Kafka", "WebSocket", "SSE"] },
    { icon: "Layers3", no: "03", title: "数据性能与可观测性", text: "从数据模型、索引与缓存策略到日志、指标和链路定位，持续优化复杂业务系统的响应与稳定性。", tags: ["MySQL", "PostgreSQL", "Tracing", "Metrics"] },
    { icon: "CloudCog", no: "04", title: "多端产品与工程底座", text: "复用领域模型和状态逻辑，将 Web、桌面与移动端纳入统一工程体系，并理解渲染、通信与打包链路。", tags: ["React", "Vue 3", "Electron", "React Native"] },
    { icon: "ShieldCheck", no: "05", title: "安全与稳定性治理", text: "将鉴权边界、权限模型、限流降级与优雅停机纳入服务设计，兼顾业务迭代速度与生产环境的可控性。", tags: ["JWT", "RBAC", "Rate Limit", "Graceful Shutdown"] },
  ],
  // 代表项目：轮播卡片和详情弹窗共用此处的数据。
  projects: [
    { code: "AGENT / 01", title: "实时数据与 AI Agent 服务平台", stack: ["NestJS", "SSE", "WebSocket", "Redis", "Python", "Vue 3"], intro: "面向算法结果与大模型输出的实时传输、Agent 交互和高频数据可视化平台。", points: ["设计 SSE 流式响应状态机，覆盖分片解析、增量 Markdown、取消与异常恢复。", "以 requestAnimationFrame 分片渲染和可视区更新控制高频数据压力。"], role: "负责 Node.js 服务编排、实时传输链路与管理端核心交互，推进从模型输出到业务工作台的端到端交付。", architecture: ["Agent 工作流与工具调用编排", "SSE / WebSocket 双通道实时推送", "Redis 会话状态与任务进度协调"], metric: "REAL-TIME", value: "< 16ms" },
    { code: "SERVICE / 02", title: "Spring Boot 智能客服聊天平台", stack: ["Spring Boot", "Node.js", "React", "Redis", "RabbitMQ"], intro: "覆盖会话、坐席、路由和服务质检的企业多租户实时聊天平台。", points: ["设计会话路由、坐席状态、消息顺序与离线补偿机制。", "以 RabbitMQ 解耦分发与质检任务，管理端提供实时监控。"], role: "负责 Java / Node.js 服务边界设计、核心会话链路和管理端协作，支撑多租户场景的持续迭代。", architecture: ["多租户会话、坐席与路由领域建模", "Redis 状态缓存与消息顺序控制", "RabbitMQ 异步分发、质检与补偿"], metric: "DELIVERY", value: "99.9%" },
    { code: "SOCKET / 03", title: "WebSocket 在线客服与消息系统", stack: ["NestJS", "WebSocket", "Redis", "RabbitMQ", "PostgreSQL"], intro: "围绕会话、坐席、消息、未读状态与连接生命周期构建实时通信服务。", points: ["实现心跳、ACK、断线重连与多实例会话映射。", "通过队列削峰、幂等消费和索引优化应对突发流量。"], role: "负责实时通信服务的服务端设计与线上稳定性治理，覆盖连接生命周期、消息可靠性和性能优化。", architecture: ["多实例连接路由与 Redis 会话映射", "ACK / 重连 / 离线补偿状态机", "队列削峰与幂等消费保障"], metric: "CONNECTION", value: "MULTI-NODE" },
    { code: "CLIENT / 04", title: "Electron 桌面端与 React Native 移动端", stack: ["Electron", "React", "React Native", "TypeScript", "WebSocket"], intro: "复用领域模型、接口层和状态逻辑，统一桌面、移动端与后端服务的交付链路。", points: ["封装 Electron 进程通信、本地能力接入及自动化打包发布。", "统一 REST / WebSocket 协议处理，降低多端维护成本。"], role: "负责跨端技术方案与公共能力沉淀，让桌面、移动端和服务端在同一领域模型下协作演进。", architecture: ["共享 TypeScript 类型与 API Client", "Electron 主进程能力封装与发布链路", "REST / WebSocket 协议统一适配"], metric: "PLATFORM", value: "3 ENDS" },
    { code: "MEDIA / 05", title: "海外 ACG 资源平台", stack: ["Node.js", "MongoDB", "JWT", "Vue 3", "HLS", "FFmpeg"], intro: "覆盖鉴权、内容管理、视频播放和 PC/H5 响应式访问的资源平台。", points: ["分层设计 API、权限模型及内容数据结构，保障安全与可维护性。", "完成视频链路、SSR / SEO 及 200 QPS 场景压测调优。"], role: "负责 Node.js 服务、内容数据模型与媒体处理链路，完成面向生产运营的产品交付与性能调优。", architecture: ["JWT 鉴权与内容权限模型", "FFmpeg 异步转码与状态追踪", "HLS 分发、缓存策略与 SEO 优化"], metric: "LOAD TEST", value: "200 QPS" },
  ],
  // 技术栈分组：每组的标题、角标、说明和技能项放在一起，调整顺序时页面会自动同步。
  skillGroups: [
    {
      label: "后端与数据服务", badge: "BACKEND", note: "服务端语言、框架与数据层能力",
      skills: [
        { name: "Java / Spring Boot", level: 90, note: "企业级服务与领域建模" },
        { name: "Go", level: 84, note: "高并发服务与工程工具" },
        { name: "Rust", level: 76, note: "性能敏感模块与系统编程" },
        { name: "Node.js / MySQL", level: 90, note: "实时 API、数据建模与索引优化" },
      ],
    },
    {
      label: "AI Agent 工程", badge: "AI AGENT", note: "Agent 编排、RAG 与模型服务落地",
      skills: [
        { name: "Python", level: 87, note: "数据处理、自动化与 AI 服务" },
        { name: "Dify", level: 88, note: "工作流编排、知识库与应用交付" },
        { name: "LangChain / LangGraph", level: 84, note: "工具调用、记忆与状态化 Agent" },
        { name: "RAG / Ollama", level: 84, note: "文档召回、上下文构建与本地推理" },
      ],
    },
    {
      label: "部署与运维", badge: "DELIVERY", note: "部署、运维与稳定性保障",
      skills: [
        { name: "Docker / Compose", level: 90, note: "镜像构建、编排与环境一致性" },
        { name: "Nginx", level: 87, note: "反向代理、缓存与流量入口治理" },
        { name: "Linux", level: 88, note: "服务排障、脚本化与运行环境管理" },
        { name: "CI/CD / 可观测性", level: 84, note: "自动发布、日志指标与故障定位" },
      ],
    },
    {
      label: "前端与跨端产品", badge: "PRODUCT", note: "Web、桌面与移动端产品工程",
      skills: [
        { name: "Vue 3", level: 90, note: "复杂业务组件与状态管理" },
        { name: "React / Next.js", level: 91, note: "SSR、性能优化与产品工程化" },
        { name: "JavaScript / TypeScript", level: 92, note: "类型建模与可维护前端架构" },
        { name: "Tailwind / Electron / RN", level: 87, note: "设计系统与多端产品交付" },
      ],
    },
  ],
  otherSkills: [
    "PostgreSQL", "MySQL", "Redis", "RabbitMQ", "Kafka", "gRPC", "Nacos", "MinIO",
    "Nginx", "CI/CD", "Kubernetes", "Linux", "Git", "WebSocket", "SSE", "Codex", "Cursor",
  ],
  history: [
    {
      title: "容联云 · Node.js / Java 全栈开发工程师",
      company: "容联云",
      role: "Node.js / Java 全栈开发工程师",
      description: "负责企业通信云产品的服务端核心模块与管理端协同交付。",
      date: "2025.10 — 至今",
      type: "work",
      stack: ["Node.js", "Spring Boot", "React", "TypeScript", "Redis", "Docker"],
      responsibilities: [
        "主导核心业务服务与开放接口的领域建模、接口规范和版本治理。",
        "设计管理端状态流与组件抽象方案，推动前后端联调、灰度验证和稳定发布。",
        "参与链路性能排查与可观测性建设，保障高频业务迭代的交付质量。",
      ],
      projects: [
        { name: "企业通信云管理平台", summary: "统一租户、资源与运营配置，沉淀可复用的业务管理能力。" },
        { name: "业务服务与接口建设", summary: "构建核心领域接口，完善鉴权、幂等、异常治理与调用规范。" },
        { name: "管理端组件体系", summary: "抽象通用表单与数据视图组件，提升多模块研发效率与一致性。" },
      ],
    },
    {
      title: "中国电子科技十所（外协）· 高级 Node.js 全栈开发工程师",
      company: "中国电子科技十所（外协）",
      role: "高级 Node.js 全栈开发工程师",
      description: "负责算法训练、实时数据与可视化场景的服务端架构及前端交付。",
      date: "2022.11 — 2025.09",
      type: "work",
      stack: ["NestJS", "gRPC", "RabbitMQ", "Redis", "WebSocket", "SSE", "Python"],
      responsibilities: [
        "负责算法训练、实时数据与可视化场景的服务拆分和端到端研发。",
        "以 gRPC、消息队列和 Redis 构建高可用模块，处理异步任务编排与流量削峰。",
        "设计大模型流式响应、断线恢复和高频数据渲染链路，优化交互实时性。",
      ],
      projects: [
        { name: "算法训练与实时数据平台", summary: "连接训练任务、结果分发与实时监控，支持多模块协同运行。" },
        { name: "大模型交互与可视化系统", summary: "实现 SSE 流式输出、增量渲染与异常恢复，提升交互稳定性。" },
        { name: "分布式任务调度服务", summary: "通过消息队列解耦异步任务，支持可靠投递、消费幂等与状态追踪。" },
      ],
    },
    {
      title: "不知其鸣科技 · 前后端开发负责人",
      company: "不知其鸣科技",
      role: "Node.js 全栈开发负责人",
      description: "负责海外内容平台及企业业务系统的技术方案、研发与上线交付。",
      date: "2021.04 — 2022.11",
      type: "work",
      stack: ["Node.js", "Vue 3", "FFmpeg", "Docker", "Nginx", "MySQL"],
      responsibilities: [
        "负责海外内容平台和企业系统的技术方案、核心模块研发与上线交付。",
        "搭建鉴权、资源管理与媒体处理链路，统筹 PC / H5 多端体验与接口协作。",
        "推进容器化部署、日志定位和发布流程标准化，提升系统可维护性。",
      ],
      projects: [
        { name: "海外 ACG 内容平台", summary: "覆盖内容发布、资源管理与多端消费场景，支撑持续内容运营。" },
        { name: "视频转码与分发链路", summary: "基于 FFmpeg 处理媒体任务，完善状态追踪与异常重试机制。" },
        { name: "企业业务管理系统", summary: "交付核心业务流程与权限模块，完成容器化部署和生产环境上线。" },
      ],
    },
    {
      title: "中国通行服务有限公司 · 前端开发工程师",
      company: "中国通行服务有限公司",
      role: "前端开发工程师",
      description: "参与通信基础设施共建共享与智慧交通管理平台研发。",
      date: "2020.09 — 2021.04",
      type: "work",
      stack: ["Vue 2", "ECharts", "GIS", "RBAC", "JavaScript"],
      responsibilities: [
        "参与通信基础设施与智慧交通产品的前端架构、业务模块及数据可视化研发。",
        "构建动态路由与 RBAC 权限体系，解决复杂表单、流程编排和多角色协作问题。",
        "负责 GIS 场景与 ECharts 大屏性能优化，保障复杂数据的清晰呈现与稳定交互。",
      ],
      projects: [
        { name: "通信基础设施共建共享平台", summary: "实现资源协同、权限控制与业务流程管理，支持多角色高效协作。" },
        { name: "智慧交通管理平台", summary: "集成地图态势、事件处置与运营数据，提升交通运营可视化能力。" },
        { name: "运营分析数据大屏", summary: "构建多维指标与实时图表展示，支持管理层快速决策与异常研判。" },
      ],
    },
    // 教育经历与工作经历使用同一数组，type 决定页面采用的展示样式。
    {
      type: "education",
      title: "山东英才学院",
      date: "2017.09 — 2020.06",
      universityEnglish: "SHANDONG YINGCAI UNIVERSITY",
      major: "计算机网络技术",
      degree: "大专",
      courses: ["计算机网络技术", "C 语言", "Python", "线性代数", "离散数学", "操作系统", "数据结构与算法", "SQL Server 数据库"],
      outcomes: ["掌握计算机网络基础架构与网络技术基础。", "具备使用 C / Python 进行基础算法开发的能力。", "熟悉数据库管理、SQL 查询与基础性能优化。"],
      projects: [
        { name: "ASP.NET 医药管理系统", summary: "实现药品库存动态管理" },
        { name: "学生数据管理系统", summary: "完成学生信息录入与管理" },
        { name: "Python 爬虫项目", summary: "采集千千音乐 TOP100 榜单数据" },
      ],
      certificate: "计算机及外部设备装配调试员 · 中级",
    },
  ],
  // 工程总结区的三张能力卡；icon 名称由页面中的图标映射表转换为实际图标。
  engineering: [
    { icon: "Cpu", no: "01", title: "架构与性能工程", text: "在领域建模、缓存策略、消息解耦与索引优化之间权衡，将高并发、实时响应和可维护性落实到系统设计。", tags: ["DOMAIN DESIGN", "PERFORMANCE"] },
    { icon: "Boxes", no: "02", title: "可靠交付与运行保障", text: "将镜像构建、环境编排、灰度发布、日志追踪与故障回滚纳入交付闭环，让上线过程可观测、可恢复、可复用。", tags: ["CI/CD", "OBSERVABILITY"] },
    { icon: "Sparkles", no: "03", title: "AI 原生研发方法", text: "将 Agent 工作流、检索增强和工具调用嵌入业务研发；结合 Codex、Cursor 与本地模型持续缩短从想法到可验证版本的路径。", tags: ["AGENT WORKFLOW", "RAG"] },
  ],
};

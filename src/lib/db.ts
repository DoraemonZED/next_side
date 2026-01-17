import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'content/db.sqlite3');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    read_time TEXT,
    author TEXT,
    summary TEXT,
    tags TEXT,
    content_path TEXT NOT NULL,
    UNIQUE(category_slug, slug),
    FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resume (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 检查并自动补充缺失的列 (简单的迁移逻辑)
const columns = db.prepare("PRAGMA table_info(posts)").all() as any[];
const hasTags = columns.some(col => col.name === 'tags');
if (!hasTags) {
  db.exec("ALTER TABLE posts ADD COLUMN tags TEXT;");
}

// 初始化resume数据（如果表为空）
const resumeCount = db.prepare("SELECT COUNT(*) as count FROM resume").get() as { count: number };
if (resumeCount.count === 0) {
  const defaultResumeData = {
    skills: {
      basics: [
        { name: "HTML", level: 77 },
        { name: "CSS", level: 70 },
        { name: "JavaScript", level: 90 },
      ],
      expand: [
        { name: "TypeScript", level: 90 },
        { name: "SCSS", level: 88 },
        { name: "NodeJS", level: 65 },
      ],
      frameworks: [
        { name: "VueJS", level: 93 },
        { name: "ReactJS", level: 80 },
        { name: "JQuery", level: 70 },
      ],
      crossPlatform: [
        { name: "Flutter", level: 80 },
        { name: "React Native", level: 60 },
        { name: "Electron", level: 90 },
      ]
    },
    otherSkills: [
      "Unreal", "Uniapp", "小程序", "Nginx", 
      "MySQL", "Linux", "MongoDB", "Webpack", "Koa"
    ],
    history: [
      {
        title: "前端组长 - 成都不知其名科技",
        date: "Apr 2021 - Dec 2021",
        description: "担任前端组长，负责组内各个项目的整合及任务分配，帮助同事一起解决项目中遇到的问题。最初开始使用JQuery和Webpack开发项目，后期项目改为Vue的服务端渲染框架NuxtJS进行重构及提升。",
        type: "work"
      },
      {
        title: "移动端跨平台开发 - 中通服",
        date: "Oct 2020 - Apr 2021",
        description: "在公司负责前端跨平台开发，平台包括iOS和Android两端的UI及原生功能统一，使用到的框架有Uniapp和Flutter。在工作期间掌握了跨平台开发，对原生Android和iOS开发有一定的了解。在中通服的时间积极和同事交流，增加技术知识，在此期间从前辈身上学习到很多好的开发习惯，工作中也积极努力独自完成整合项目搭建及开发。",
        type: "work"
      },
      {
        title: "实习 - 在校",
        date: "Nov 2019 - Sep 2020",
        description: "其中参与.NET管理系统使，用WinFrom书写Windows页面，SQL Server数据库，socket实现TCP/IP通讯。和老师同学们相处融洽，工作积极认真，帮助同学，得到老师及其同学们的好评。初次从事软件开发，了解到了行业的竞争，以及各种技术革新的速度使得我们需要不断的学习新技术，作为程序员应时刻保持对探索的兴趣，要有创新精神和探索的勇气。",
        type: "intern"
      },
      {
        title: "大学 - 山东英才学院",
        date: "Sep 2017 - Jun 2020",
        description: "在校主修计算机网络技术，期间学习包括计算机组成原理，操作系统，数据结构，计算机网络等课程。和老师及小组参与一些.NET项目并取得上线，通过C语言课程学习使用EasyX制作flappy bird小游戏。期间参与学生会宣传部，负责学校公众号，校宣传海报设计和PS教学，组织其他部门参与校内活动。",
        type: "education"
      }
    ]
  };
  
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("skills", JSON.stringify(defaultResumeData.skills));
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("otherSkills", JSON.stringify(defaultResumeData.otherSkills));
  db.prepare("INSERT INTO resume (key, value) VALUES (?, ?)").run("history", JSON.stringify(defaultResumeData.history));
}

export default db;

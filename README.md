# Prompt Case Library

个人 Prompt 资产管理器 — 收录、整理、搜索、复刻 AI 提示词。

## 功能

- 图片 / 视频 / 音频 / 纯文本 四种类型
- 紧凑卡片网格，标签 + 全文搜索
- 一键复制 Prompt，右侧详情抽屉
- 支持 Markdown 笔记
- 标签 & 模型 批量改名/删除
- 30 天回收站，误删可恢复
- 批量选择，批量打标签/删除
- 所有数据本地存储，不上传任何服务器

## 下载

前往 [Releases](../../releases) 下载最新版 exe 安装包。

## 开发

```bash
git clone https://github.com/rosyriver/promptadmin.git
cd promptadmin
npm install
npm run electron:dev
```

## 构建

```bash
npm run electron:build
```

输出在 `release/` 目录。

## 技术栈

- React + TypeScript
- Electron
- Tailwind CSS
- IndexedDB（元数据）
- 本地磁盘（媒体文件）

## License

MIT

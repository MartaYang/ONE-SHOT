# Project Page Template (LiveAvatar Style)

这是一个基于 [Nerfies](https://nerfies.github.io) 的项目主页模板。

## 目录结构

```text
.
├── index.html          # 主页面文件，修改此处内容（标题、作者、摘要等）
├── static
│   ├── css             # 样式文件 (Bulma, FontAwesome, index.css)
│   ├── js              # 脚本文件 (Bulma plugins, index.js)
│   ├── images          # 图片资源 (需自行添加)
│   └── videos          # 视频资源 (需自行添加)
```

## 如何使用

1.  **修改内容**：打开 `index.html`，搜索并替换以下内容：
    *   `LiveAvatar` -> 你的项目名称
    *   `Keunhong Park` 等作者信息 -> 你的名字
    *   `Abstract` -> 你的项目摘要
    *   `BibTeX` -> 你的引用格式
2.  **替换资源**：
    *   将你的 Teaser 视频放入 `static/videos/`，并修改 `index.html` 中的引用路径。
    *   将你的结果视频/图片放入相应目录。
3.  **部署**：
    *   将整个文件夹推送到 GitHub 仓库。
    *   在 GitHub 仓库设置中开启 `GitHub Pages`，源选择 `main` 分支（或你存放代码的分支）。

## 依赖

本项目使用的第三方库（已下载到 `static` 目录）：
*   Bulma CSS
*   Bulma Carousel & Slider
*   FontAwesome
*   jQuery (通过 CDN 引用)
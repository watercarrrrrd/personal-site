# 技术设计文档（TECH DESIGN）

> 项目名称：个人展示网站（Personal Portfolio Site）
> 文档版本：v1.0
> 编写日期：2026-10-19

---

## 1. 技术栈选型

### 1.1 整体技术方案

本项目采用**纯静态、零依赖**的技术方案：使用原生 HTML5 构建页面结构，原生 CSS3 负责样式与视觉动效，原生 JavaScript（ES6+）负责交互逻辑，Canvas 2D 实现星空粒子背景。整个项目不依赖任何前端框架、UI 库或外部 CDN，产物为可直接部署的静态文件。

### 1.2 选型明细表

| 分类 | 技术 | 选型理由 |
| --- | --- | --- |
| 结构 | HTML5 语义化标签 | 结构清晰，利于 SEO 与无障碍，无需框架即可承载内容 |
| 样式 | CSS3（CSS 变量 + Flexbox/Grid + @keyframes） | CSS 变量统一主题，Grid/Flexbox 实现响应式，@keyframes 实现动画 |
| 交互 | 原生 JavaScript（ES6+） | 零依赖实现全部交互，体积小、加载快、易维护 |
| 动效 | Canvas 2D | 适合大量粒子的实时绘制，性能优于 DOM 元素动画 |
| 响应式 | 媒体查询（Media Query） | 原生断点方案，无需额外依赖 |
| 滚动动画 | IntersectionObserver | 原生观察视口交叉，触发进度条动画与导航高亮 |
| 图标 | 内联 SVG | 零外部请求，可自由控制颜色与尺寸 |
| 部署 | 静态托管（GitHub Pages / Vercel / Netlify） | 纯静态产物，零成本、零运维 |

---

## 2. 项目目录结构

```
personal-sites/
├── index.html              # 单页面入口，包含全部区块结构
├── css/
│   └── style.css           # 全部样式：主题变量 + 基础 + 布局 + 组件 + 动画 + 响应式
├── js/
│   └── main.js             # 全部交互：星空粒子 + 导航 + 滚动动画
└── docs/                   # 项目文档
    ├── PRD.md              # 产品需求文档
    ├── TECH_DESIGN.md      # 技术设计文档（本文件）
    └── AGENTS.md           # AI 开发规范文档
```

---

## 3. 核心模块实现方案

### 3.1 星空背景模块

#### 3.1.1 Canvas 实现

使用一个全屏固定的 `<canvas>` 元素作为背景层，位于所有内容之下：

```html
<canvas id="starfield" aria-hidden="true"></canvas>
```

Canvas 通过 `position: fixed` 铺满视口，`z-index` 设为负值或置于内容层之后，并设置 `aria-hidden="true"` 避免干扰屏幕阅读器。

#### 3.1.2 粒子系统

- 每个粒子包含坐标 `(x, y)`、速度 `(vx, vy)`、半径 `r`、透明度 `alpha` 等属性。
- 粒子初始化时随机分布在整个画布内，赋予微小的位移速度与不同的透明度，形成层次感（远处粒子更小更暗）。
- 每帧更新粒子位置，超出边界时从对侧重新进入，实现无限星空流动。

```js
class Particle {
  constructor(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
    this.r = Math.random() * 1.5 + 0.3;
    this.alpha = Math.random() * 0.8 + 0.2;
  }
}
```

#### 3.1.3 性能优化

- **限制粒子数量**：根据画布面积动态计算粒子数量，设置上限（如不超过 200 个），避免低端设备过载。
- **统一渲染循环**：使用 `requestAnimationFrame` 驱动，所有粒子在同一帧内批量绘制。
- **减少状态切换**：粒子绘制统一使用白色，仅改变透明度，避免每帧切换 `fillStyle`。
- **暂停离屏动画**：监听页面可见性，页面不可见时取消 `requestAnimationFrame`，回到前台再恢复。

#### 3.1.4 鼠标交互

- 监听鼠标移动，将鼠标位置映射为「引力源」，附近粒子产生轻微偏移或连线的视觉反馈。
- 交互仅在桌面端启用（移动端无 hover 概念），并作为 Could have 功能，不影响核心星空效果。

### 3.2 导航模块

#### 3.2.1 吸顶毛玻璃

- 导航栏使用 `position: sticky` 或 `position: fixed` 固定于顶部。
- 滚动超过一定距离后，为导航栏添加背景与 `backdrop-filter: blur()` 实现毛玻璃效果。
- 提供 `-webkit-backdrop-filter` 前缀以兼容 Safari。

```css
.navbar.scrolled {
  background: rgba(10, 14, 26, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

#### 3.2.2 滚动高亮

- 使用 IntersectionObserver 监听各区块与视口的交叉，当前激活的区块对应导航项添加 `.active` 类高亮。

#### 3.2.3 平滑滚动

- 点击导航项调用目标区块的 `scrollIntoView({ behavior: "smooth" })`。
- 通过 CSS 的 `scroll-margin-top` 预留吸顶导航高度，避免目标被遮挡。

### 3.3 响应式布局

#### 3.3.1 断点设计

| 断点 | 宽度范围 | 目标设备 | 布局要点 |
| --- | --- | --- | --- |
| 移动端 | < 768px | 手机 | 单列布局，导航折叠为汉堡菜单 |
| 平板 | 768px ~ 1024px | 平板 | 技能/项目卡片两列 |
| 桌面端 | > 1024px | 桌面显示器 | 多列布局，内容容器限宽 1080px |

#### 3.3.2 实现方式

- 采用移动优先（Mobile First）的 CSS 编写策略，默认移动端样式，通过 `min-width` 媒体查询逐级增强。
- 使用 CSS Grid 布局卡片区域，通过 `grid-template-columns` 在不同断点下改变列数。

### 3.4 技能进度条

#### 3.4.1 CSS 实现

- 进度条由外层轨道（固定高度圆角容器）与内层填充条组成。
- 填充宽度通过 CSS 自定义属性或行内 `style="width: XX%"` 指定，颜色使用主题主色。

```html
<div class="skill-bar">
  <span class="skill-name">JavaScript</span>
  <div class="skill-track">
    <div class="skill-fill" style="width: 90%"></div>
  </div>
</div>
```

#### 3.4.2 滚动触发动画

- 初始状态填充条宽度为 0，进入视口时通过 IntersectionObserver 添加 `.active` 类，过渡到目标宽度。
- 使用 CSS `transition: width 1s ease` 实现平滑填充，仅触发一次避免重复动画。

---

## 4. 关键技术难点与解决方案

### 4.1 Canvas 自适应尺寸

**难点**：Canvas 默认画布尺寸与 CSS 显示尺寸可能不一致，导致粒子在高 DPI 屏幕模糊或拉伸。

**解决方案**：

- 使用 `devicePixelRatio` 将 Canvas 内部分辨率乘以 DPR，再通过 CSS 将其显示尺寸设为视口大小，保证高清屏清晰。
- 监听 `resize` 事件（配合 `ResizeObserver`）在窗口尺寸变化时重新计算画布尺寸与粒子分布。

```js
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);
}
```

### 4.2 滚动锚点偏移

**难点**：吸顶导航会遮挡锚点定位后的区块顶部，导致标题被导航栏盖住。

**解决方案**：为每个锚点目标区块设置 `scroll-margin-top`，其值等于吸顶导航高度，使滚动定位时自动预留偏移，无需额外 JS 计算。

```css
section {
  scroll-margin-top: 72px;
}
```

### 4.3 动效性能优化

**难点**：星空动画、进度条动画、滚动过渡同时运行可能引起卡顿。

**解决方案**：

- 星空动画统一使用 `requestAnimationFrame`，页面不可见时暂停。
- 进度条与过渡动画只使用 `transform` 与 `opacity`（或 `width`），避免触发重排的属性。
- 对频繁变动的元素使用 `will-change` 提示浏览器开启合成层，但避免滥用。
- 页面加载后延迟初始化非首屏动画，优先保证首屏渲染。

---

## 5. 兼容性方案

### 5.1 样式前缀

- 对 `backdrop-filter`、`user-select` 等属性补充 `-webkit-` 前缀，兼容 Safari 与旧版 Chrome。
- 对 CSS 变量、Grid/Flexbox 等特性，提供基础降级布局，保证旧浏览器内容可读。

### 5.2 API 降级

| API | 降级方案 |
| --- | --- |
| IntersectionObserver | 检测不支持时降级为 `scroll` 事件监听，手动计算元素与视口位置 |
| requestAnimationFrame | 检测不支持时降级为 `setTimeout` 定时循环 |
| `scroll-behavior: smooth` | 不支持时通过 JS `window.scrollTo({ top, behavior: "smooth" })` 替代 |
| `backdrop-filter` | 不支持时使用更高不透明度的纯色背景替代毛玻璃 |

### 5.3 响应式适配

- 所有布局均以媒体查询断点适配，保证 375px 手机到 1440px 桌面均无横向滚动。
- 图片 / Canvas / 媒体元素使用相对单位与最大宽度限制，避免溢出。

---

## 6. 性能指标表

| 指标 | 目标值 | 说明 |
| --- | --- | --- |
| 页面总体积 | ≤ 100KB | HTML + CSS + JS 总和，不含外部资源 |
| HTML 体积 | ≤ 10KB | 纯静态结构，无冗余 |
| CSS 体积 | ≤ 25KB | 主题变量 + 布局 + 动画 |
| JS 体积 | ≤ 20KB | 星空 + 导航 + 滚动动画逻辑 |
| TTFB | < 500ms | 静态托管服务响应时间 |
| DOMContentLoaded | < 1s | 结构与样式就绪 |
| 首屏渲染（4G） | < 2s | Hero 区可见 |
| 星空帧率 | ≥ 60fps | 桌面端平均帧率 |
| HTTP 请求数 | ≤ 3 | 仅 index.html + style.css + main.js |

---

> 本技术设计文档与 `PRD.md`、`AGENTS.md` 配套，共同构成项目的完整开发依据。

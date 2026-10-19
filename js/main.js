/* ==========================================================================
   个人展示网站交互脚本
   模块划分：星空粒子 / 导航交互 / 滚动动画
   命名遵循 AGENTS 规范（camelCase / PascalCase / UPPER_SNAKE_CASE）
   ========================================================================== */

/* 常量定义 */
var MAX_PARTICLES = 120;       // 桌面端最大粒子数
var MOBILE_PARTICLES = 60;     // 移动端粒子数（自动降低，保证性能）
var MOBILE_BREAKPOINT = 640;   // 移动端断点宽度（与 CSS 保持一致）
var PARALLAX_STRENGTH = 0.02;  // 鼠标视差偏移强度

/* ==========================================================================
   一、星空背景粒子系统
   ========================================================================== */

/**
 * 单个星星粒子
 * @param {number} width  画布逻辑宽度（CSS 像素）
 * @param {number} height 画布逻辑高度（CSS 像素）
 */
function Particle(width, height) {
  this.x = Math.random() * width;                 // 水平坐标
  this.y = Math.random() * height;                // 垂直坐标
  this.vx = (Math.random() - 0.5) * 0.15;         // 水平速度（缓慢漂浮）
  this.vy = (Math.random() - 0.5) * 0.15;         // 垂直速度
  this.radius = Math.random() * 1.5 + 0.3;        // 半径，形成远近层次
  this.baseAlpha = Math.random() * 0.8 + 0.2;     // 基础透明度
  this.twinkleSpeed = Math.random() * 0.02 + 0.01; // 闪烁速度
  this.twinklePhase = Math.random() * Math.PI * 2; // 闪烁相位（错开闪烁节奏）
}

/**
 * 更新粒子位置与透明度
 * @param {number} width  画布逻辑宽度
 * @param {number} height 画布逻辑高度
 * @param {number} time   当前时间戳（用于闪烁计算）
 */
Particle.prototype.update = function (width, height, time) {
  this.x += this.vx;
  this.y += this.vy;

  // 超出边界时从对侧重新进入，实现无限星空流动
  if (this.x < -2) this.x = width + 2;
  if (this.x > width + 2) this.x = -2;
  if (this.y < -2) this.y = height + 2;
  if (this.y > height + 2) this.y = -2;

  // 根据时间与相位计算当前透明度，实现闪烁
  this.alpha = this.baseAlpha * (0.6 + 0.4 * Math.sin(time * this.twinkleSpeed + this.twinklePhase));
};

/**
 * 初始化星空背景
 */
function initStarfield() {
  var canvas = document.getElementById("starfield");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var particles = [];
  var width = 0;
  var height = 0;
  var rafId = null;
  var running = true;
  var mouseX = 0;
  var mouseY = 0;

  // 根据窗口宽度决定粒子数量：移动端自动降低以节省性能
  function getParticleCount() {
    return window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_PARTICLES : MAX_PARTICLES;
  }

  // 按设备像素比设置画布实际分辨率，保证高清屏清晰
  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    // 将坐标系缩放回 CSS 像素，后续绘制使用逻辑坐标
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildParticles();
  }

  // 重建粒子数组
  function buildParticles() {
    var count = getParticleCount();
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push(new Particle(width, height));
    }
  }

  // 每一帧的绘制循环
  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    // 鼠标视差偏移：离中心越远偏移越大，产生轻微跟随效果
    var offsetX = (mouseX - width / 2) * PARALLAX_STRENGTH;
    var offsetY = (mouseY - height / 2) * PARALLAX_STRENGTH;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.update(width, height, time);
      // 半径越大的粒子（视觉上越近）偏移越明显，增强层次感
      var depth = p.radius / 1.8;
      ctx.beginPath();
      ctx.arc(p.x + offsetX * depth, p.y + offsetY * depth, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, " + p.alpha + ")";
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (!running) return;
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // 监听鼠标移动，记录位置用于视差
  window.addEventListener("mousemove", function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  // 页面隐藏时暂停动画，可见时恢复，避免后台空耗资源
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      stop();
    } else {
      running = true;
      start();
    }
  });

  // 窗口尺寸变化时重新计算画布与粒子分布（加防抖，避免频繁重建）
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 200);
  });

  resizeCanvas();
  start();
}

/* ==========================================================================
   二、导航交互：吸顶样式 / 平滑滚动 / 滚动高亮 / 汉堡菜单
   ========================================================================== */

function initNavigation() {
  var navbar = document.getElementById("navbar");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  var navLinks = document.querySelectorAll(".navbar__link");
  var sections = document.querySelectorAll("section[id]");

  if (!navbar) return;

  // 1. 滚动后为导航栏添加毛玻璃背景
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      navbar.classList.add("navbar--scrolled");
    } else {
      navbar.classList.remove("navbar--scrolled");
    }
  });

  // 2. 汉堡菜单开合
  function closeMenu() {
    navMenu.classList.remove("navbar__menu--open");
    navToggle.classList.remove("navbar__toggle--open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    var isOpen = navMenu.classList.toggle("navbar__menu--open");
    navToggle.classList.toggle("navbar__toggle--open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // 3. 导航链接平滑滚动到目标区块
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (hash && hash.charAt(0) === "#") {
        var target = document.querySelector(hash);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          closeMenu();
        }
      }
    });
  });

  // 4. 滚动高亮：当前区块对应的导航项添加激活类
  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("navbar__link--active", isActive);
    });
  }

  if ("IntersectionObserver" in window) {
    // 现代浏览器：用 IntersectionObserver 观察区块与视口中心的交叉
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

    sections.forEach(function (section) {
      spyObserver.observe(section);
    });
  } else {
    // 降级方案：滚动时手动计算当前区块
    window.addEventListener("scroll", function () {
      var currentId = "";
      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5) {
          currentId = section.id;
        }
      });
      setActiveLink(currentId);
    });
  }
}

/* ==========================================================================
   三、滚动触发动画：技能进度条填充
   ========================================================================== */

function initScrollAnimations() {
  var skillItems = document.querySelectorAll(".skill");

  // 进入视口时添加激活类，触发进度条填充，且仅触发一次
  function activateSkill(el) {
    el.classList.add("skill--active");
  }

  if ("IntersectionObserver" in window) {
    var skillObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activateSkill(entry.target);
          skillObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    skillItems.forEach(function (el) {
      skillObserver.observe(el);
    });
  } else {
    // 降级方案：滚动时手动判断元素是否进入视口
    window.addEventListener("scroll", function () {
      skillItems.forEach(function (el) {
        if (!el.classList.contains("skill--active")) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            activateSkill(el);
          }
        }
      });
    });
  }
}

/* ==========================================================================
   入口：DOM 就绪后统一初始化
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initStarfield();
  initNavigation();
  initScrollAnimations();
});

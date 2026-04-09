/**
 * 通用响应式导航栏组件
 * @description 支持PC端顶部导航、移动端底部导航+侧边栏，自动高亮当前页
 */
class Navbar {
  constructor(options = {}) {
    this.options = {
      containerId: 'app-navbar',
      activePath: window.location.pathname.split('/').pop() || 'index.html',
      ...options
    };
    this.apiBaseUrl = 'http://localhost:8000/api';

    // 导航配置
    this.mainNav = [
      { label: '规划', path: '/', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
      { label: '行程', path: '/trip', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-4-4h-4v-2h2c1.1 0 2-.89 2-2V9c0-1.11-.9-2-2-2H9v2h4v2h-2c-1.1 0-2 .89-2 2v4h6v-2z' },
      { label: '社区', path: '/community', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' },
      { label: '地图', path: '/map', icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' }
    ];

    this.secondaryNav = [
      { label: '发布管理', path: '/publish-manage', icon: 'M3 6h18v2H3V6zm2 5h14v2H5v-2zm2 5h10v2H7v-2z M15.5 3l1.4 1.4-7.9 7.9-2.1.7.7-2.1L15.5 3z' },
      { label: '系统设置', path: '/settings', icon: 'M19.14 12.94c0.04-0.3 0.06-0.61 0.06-0.94 0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14 0.23-0.41 0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39 0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4 2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24 0-0.43 0.17-0.47 0.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-0.22-0.08-0.47 0-0.59 0.22L2.74 8.87 C2.62 9.08 2.66 9.34 2.86 9.48l2.03 1.58C4.84 11.36 4.8 11.69 4.8 12s0.02 0.64 0.07 0.94l-2.03 1.58 c-0.18 0.14-0.23 0.41-0.12 0.61l1.92 3.32c0.12 0.22 0.37 0.29 0.59 0.22l2.39-0.96c0.5 0.38 1.03-0.7 1.62-0.94l0.36 2.54 c0.05 0.24 0.24 0.41 0.48 0.41h3.84c0.24 0 0.44-0.17 0.47-0.41l0.36-2.54c0.59-0.24 1.13-0.56 1.62-0.94l2.39 0.96 c0.22 0.08 0.47 0 0.59-0.22l1.92-3.32c0.12-0.22 0.07-0.47-0.12-0.61L19.14 12.94z M12 15.6c-1.98 0-3.6-1.62-3.6-3.6 s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6S13.98 15.6 12 15.6z' }
    ];

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.setActiveState();
    this.syncCurrentUserFromServer();
  }

  // 生成SVG图标
  getIcon(path) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;
  }

  // 渲染组件结构
  render() {
    // 防止重复渲染：移除已存在的导航栏容器
    const existingNavbar = document.getElementById(this.options.containerId);
    if (existingNavbar) {
        existingNavbar.remove();
    }
    
    // 移除旧的导航元素（兼容旧代码）
    const oldHeader = document.querySelector('.header');
    const oldNav = document.querySelector('.nav');
    const oldSidebar = document.querySelector('.sidebar');
    
    if (oldHeader) oldHeader.remove();
    if (oldNav) oldNav.remove();
    if (oldSidebar) oldSidebar.remove();

    // 创建新的导航容器
    const navContainer = document.createElement('div');
    navContainer.id = this.options.containerId;
    navContainer.className = 'app-navbar';

    navContainer.innerHTML = `
      <!-- 顶部导航栏 (Desktop/Mobile Header) -->
      <header class="navbar">
        <div class="navbar__container">
          <button class="navbar__toggle" aria-label="打开菜单" aria-expanded="false" aria-controls="sidebar-menu">
            ${this.getIcon('M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z')}
          </button>
          
          <a href="/" class="navbar__brand">
            <span class="navbar__logo-text">云途智游</span>
          </a>

          <!-- PC端顶部菜单 -->
          <nav class="navbar__menu navbar__menu--desktop" aria-label="主导航">
            <ul class="navbar__list">
              ${this.mainNav.map(item => `
                <li class="navbar__item">
                  <a href="${item.path}" class="navbar__link ${this.isActive(item.path) ? 'navbar__link--active' : ''}" ${this.isActive(item.path) ? 'aria-current="page"' : ''}>
                    ${item.icon ? `<span class="navbar__icon-wrapper">${this.getIcon(item.icon)}</span>` : ''}
                    ${item.label}
                  </a>
                </li>
              `).join('')}
            </ul>
          </nav>
          
          <!-- PC端右侧设置菜单 -->
          <div class="navbar__actions">
            <!-- 预留搜索或用户头像 -->
          </div>
        </div>
      </header>

      <!-- 移动端底部导航 -->
      <nav class="bottom-nav" aria-label="移动端主导航">
        ${this.mainNav.map(item => `
          <a href="${item.path}" class="bottom-nav__item ${this.isActive(item.path) ? 'bottom-nav__item--active' : ''}" ${this.isActive(item.path) ? 'aria-current="page"' : ''}>
            <span class="bottom-nav__icon">${this.getIcon(item.icon)}</span>
            <span class="bottom-nav__label">${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <!-- 侧边栏 (抽屉) -->
      <aside class="sidebar" id="sidebar-menu" aria-hidden="true">
        <div class="sidebar__header">
          <h2 class="sidebar__title">
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg"   viewBox="150 140 500 520" preserveAspectRatio="xMidYMid meet">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description dc:format="image/svg+xml" dc:Label="1" dc:ContentProducer="001191330110MACRLGPT8B00000" dc:ProduceID="392324124" dc:ReservedCode1="3Dse0yOCGVSZ5IgH2iA02GGEU/ueHaB/HCPY3xLWdWM=" dc:ContentPropagator="001191330110MACRLGPT8B00000" dc:PropagateID="392324124" dc:ReservedCode2="3Dse0yOCGVSZ5IgH2iA02GGEU/ueHaB/HCPY3xLWdWM="/>
    </rdf:RDF>
  </metadata>
  <g transform="translate(0.000000,800.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
    <path d="M5250 6395 c-192 -54 -360 -268 -360 -458 l0 -49 -69 65 c-127 120 -297 207 -470 242 -113 23 -314 16 -421 -15 -166 -47 -357 -164 -471 -287 -122 -134 -226 -338 -266 -523 -27 -127 -25 -369 5 -517 63 -314 296 -817 680 -1467 62 -104 111 -190 110 -191 -2 -2 -48 -10 -103 -19 -536 -89 -1102 -327 -1497 -628 -128 -97 -388 -362 -470 -478 -74 -104 -168 -278 -198 -364 l-19 -56 889 0 889 0 6 48 c20 164 47 255 111 387 186 379 626 668 1244 818 246 60 510 97 691 97 56 0 89 4 89 11 0 19 -64 70 -125 99 -162 78 -500 137 -803 141 -105 1 -122 3 -118 16 4 9 51 90 105 182 461 779 642 1234 641 1619 0 92 -10 185 -25 245 l-7 27 136 0 c112 0 145 -4 188 -20 79 -30 126 -26 211 16 l72 37 110 -7 c310 -19 316 -19 340 -6 83 44 32 238 -81 310 -46 28 -145 57 -163 46 -4 -3 -11 18 -15 47 -14 109 -85 204 -185 251 -35 16 -65 21 -122 20 l-77 -1 -4 77 c-7 126 -68 214 -186 267 -68 32 -184 40 -262 18z m241 -67 c105 -48 159 -133 159 -248 0 -110 -56 -208 -135 -235 -66 -22 -47 -68 21 -51 37 10 103 74 129 127 21 41 30 48 69 58 95 24 206 -25 261 -113 27 -44 30 -58 31 -130 l0 -81 66 3 c44 2 78 -2 104 -13 82 -34 137 -114 132 -193 l-3 -47 -70 1 c-38 1 -138 5 -222 9 l-152 8 -75 -36 c-85 -42 -116 -45 -177 -17 -37 16 -66 20 -184 20 -161 0 -250 12 -285 38 -14 11 -37 51 -55 98 -38 95 -73 166 -122 242 -30 46 -38 69 -41 118 -8 118 32 232 111 320 127 140 296 187 438 122z m-1181 -178 c373 -59 675 -353 782 -761 33 -124 33 -389 0 -542 -76 -354 -290 -805 -744 -1564 -130 -218 -154 -253 -175 -253 -28 0 -25 -4 -237 360 -254 436 -400 714 -523 990 -224 503 -249 874 -83 1228 178 380 584 604 980 542z m-570 -3291 c0 -15 -11 -25 -42 -37 -24 -9 -103 -45 -176 -79 -117 -54 -134 -60 -147 -46 -19 18 -12 29 28 47 18 8 91 42 162 75 142 66 175 73 175 40z m-675 -412 c-38 -34 -107 -97 -153 -141 -79 -74 -84 -78 -100 -62 -16 17 -10 24 98 128 63 61 133 124 154 140 36 26 41 27 55 13 15 -14 10 -22 -54 -78z m-753 -106 c-56 -79 -58 -88 -31 -110 l23 -18 -53 -12 c-67 -14 -91 -27 -91 -50 0 -24 28 -48 76 -64 l39 -14 -77 -36 c-43 -20 -78 -41 -78 -46 0 -32 224 -114 312 -115 27 -1 48 -3 48 -5 0 -2 -9 -19 -20 -37 -24 -39 -7 -36 -332 -60 -124 -9 -231 -13 -237 -10 -17 11 -14 30 20 117 41 107 150 270 251 376 77 80 176 158 186 148 3 -3 -14 -31 -36 -64z m365 -309 c-2 -4 -37 -78 -78 -164 -40 -87 -80 -158 -87 -158 -22 0 -24 25 -3 76 24 61 117 257 127 266 8 9 46 -10 41 -20z"/>
    <path d="M5285 6271 c-55 -14 -92 -40 -149 -102 -72 -80 -99 -148 -99 -249 0 -41 5 -86 10 -100 10 -24 11 -23 23 20 17 64 56 128 109 179 25 24 39 42 30 39 -9 -4 -22 -2 -30 3 -12 7 -12 10 1 23 54 53 223 126 292 126 37 0 29 14 -23 41 -45 23 -119 32 -164 20z"/>
    <path d="M5734 5916 c-54 -24 -47 -33 28 -35 73 -2 115 -17 156 -54 18 -17 22 -18 22 -5 0 24 -74 85 -117 97 -47 13 -51 13 -89 -3z"/>
    <path d="M5850 5810 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0 -10 -4 -10 -10z"/>
    <path d="M6092 5597 l-43 -23 49 -17 c67 -24 89 -42 113 -88 25 -50 44 -46 43 10 -1 48 -24 85 -74 119 -39 26 -35 26 -88 -1z"/>
    <path d="M3785 5952 c-113 -59 -174 -103 -251 -184 -107 -112 -172 -228 -218 -390 -23 -80 -54 -294 -44 -304 3 -2 14 31 26 74 66 248 187 436 470 732 61 63 110 116 109 117 -1 1 -43 -20 -92 -45z"/>
    <path d="M4140 5559 c-220 -38 -390 -238 -390 -458 0 -283 262 -508 538 -463 270 45 448 317 378 577 -61 229 -296 383 -526 344z m-239 -266 c-17 -96 -22 -185 -10 -178 6 4 9 -9 8 -37 -2 -48 29 -159 64 -230 13 -27 20 -48 15 -48 -19 0 -106 92 -132 141 -36 65 -46 187 -23 262 15 48 77 160 85 153 2 -2 -1 -30 -7 -63z"/>
    <path d="M4966 4855 c-16 -44 -3 -95 26 -95 17 0 19 6 16 52 -2 39 -7 54 -19 56 -9 2 -19 -4 -23 -13z"/>
    <path d="M4877 4755 c-7 -16 8 -29 23 -20 15 9 12 35 -4 35 -8 0 -16 -7 -19 -15z"/>
    <path d="M4897 4633 c-14 -13 -7 -63 8 -63 18 0 38 37 31 56 -6 15 -28 19 -39 7z"/>
    <path d="M3601 4155 c26 -62 168 -326 269 -505 121 -211 245 -399 256 -387 3 3 -14 47 -38 97 l-45 92 34 -5 c18 -3 33 -4 33 -1 0 13 -49 98 -100 174 -31 47 -60 91 -65 99 -6 11 1 12 41 7 l49 -7 -114 108 -115 108 35 5 34 5 -100 77 c-55 43 -118 92 -139 110 -22 18 -37 28 -35 23z"/>
    <path d="M2010 5356 c-6 -9 -9 -20 -5 -26 4 -7 138 -10 401 -10 l395 0 -3 23 -3 22 -386 3 c-330 2 -388 0 -399 -12z"/>
    <path d="M2170 4909 c-126 -57 -200 -174 -200 -315 l0 -53 -55 -16 c-68 -19 -127 -70 -163 -139 -22 -43 -26 -64 -27 -133 0 -77 2 -84 28 -110 l27 -28 583 -8 c320 -4 631 -6 690 -5 105 3 110 4 133 31 19 23 24 39 24 85 0 142 -115 255 -271 269 l-59 6 0 34 c0 74 -65 153 -143 174 -49 13 -124 6 -165 -15 l-30 -15 -6 34 c-26 135 -130 225 -261 225 -39 0 -76 -8 -105 -21z m199 -55 c118 -59 157 -214 81 -326 -34 -49 -37 -63 -14 -72 20 -8 61 37 86 94 28 65 54 88 112 100 83 17 156 -14 182 -75 16 -40 19 -85 4 -85 -10 0 -50 -71 -50 -90 0 -19 36 -10 58 15 65 74 288 -18 323 -134 6 -20 9 -54 7 -76 l-3 -40 -672 -3 c-662 -2 -673 -2 -693 18 -41 41 -15 169 48 240 27 31 50 45 87 55 44 12 51 11 60 -2 6 -9 19 -29 30 -46 23 -35 79 -72 95 -62 19 12 10 42 -16 53 -70 32 -93 208 -41 314 63 128 199 180 316 122z"/>
    <path d="M2218 4820 c-47 -25 -101 -81 -124 -128 -22 -45 -24 -135 -5 -180 l14 -34 13 39 c8 21 12 44 9 51 -8 22 21 77 50 96 26 17 27 20 12 31 -9 7 -17 17 -17 23 0 20 75 73 113 79 45 7 55 18 28 32 -28 15 -51 13 -93 -9z"/>
    <path d="M2139 4583 c-13 -16 -12 -17 4 -4 9 7 17 15 17 17 0 8 -8 3 -21 -13z"/>
    <path d="M3051 4306 c-15 -18 -11 -48 6 -53 7 -3 15 7 19 22 8 33 -8 52 -25 31z"/>
    <path d="M5820 4392 c-19 -9 -42 -32 -52 -50 -22 -45 -20 -44 -61 -27 -42 17 -106 19 -160 4 -65 -18 -137 -96 -137 -149 0 -16 -6 -20 -32 -20 -73 0 -163 -63 -204 -141 -20 -40 -29 -112 -15 -137 24 -45 156 -51 334 -16 72 15 83 15 155 -2 53 -12 116 -17 202 -17 504 3 487 3 512 22 68 56 -30 245 -154 296 -41 17 -46 23 -51 57 -18 134 -217 240 -337 180z m188 -64 c49 -23 89 -70 98 -115 6 -29 4 -30 -35 -37 -23 -3 -50 -15 -61 -26 -19 -19 -19 -19 -48 10 -38 38 -59 87 -43 103 16 16 14 27 -5 27 -8 0 -22 7 -31 15 -9 10 -23 13 -37 9 -31 -10 -33 -14 -13 -29 10 -7 22 -28 27 -46 14 -51 71 -131 107 -152 38 -22 70 -15 75 16 4 28 35 33 107 17 44 -10 64 -22 106 -64 56 -55 95 -139 72 -153 -7 -5 -77 -8 -157 -8 -80 0 -191 -4 -247 -9 -88 -8 -118 -6 -228 14 -124 23 -128 23 -214 7 -48 -9 -129 -17 -180 -17 -107 0 -113 5 -86 78 35 92 137 153 198 118 44 -25 61 -21 52 12 -20 76 2 122 76 160 34 18 56 22 97 19 73 -5 125 -44 170 -124 18 -35 38 -63 43 -63 31 0 17 71 -27 142 -66 104 45 161 184 96z"/>
    <path d="M6120 4019 c0 -5 5 -7 10 -4 6 3 10 8 10 11 0 2 -4 4 -10 4 -5 0 -10 -5 -10 -11z"/>
    <path d="M5705 3965 c-16 -7 -34 -11 -40 -8 -5 2 -1 -3 9 -11 12 -10 39 -16 68 -16 l48 0 -16 25 c-18 28 -26 29 -69 10z"/>
    <path d="M2474 3795 c-3 -8 -3 -19 1 -25 4 -7 178 -10 540 -10 443 0 534 2 538 14 13 34 -9 36 -545 36 -453 0 -529 -2 -534 -15z"/>
    <path d="M2475 3603 c-26 -89 -116 -163 -199 -163 -19 0 -22 -19 -3 -24 139 -39 185 -85 212 -210 8 -36 18 -25 35 36 22 83 116 167 187 168 25 0 41 18 21 24 -115 34 -173 79 -203 161 -10 28 -22 54 -26 58 -4 5 -15 -17 -24 -50z"/>
    <path d="M5394 2909 c-3 -6 -1 -16 5 -22 8 -8 11 -5 11 11 0 24 -5 28 -16 11z"/>
  </g>
</svg>
            云途智游
          </h2>
          <button class="sidebar__close" aria-label="关闭菜单">
             ${this.getIcon('M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z')}
          </button>
        </div>
        
        <div class="sidebar__content">
          <div class="sidebar__section">
            <h3 class="sidebar__subtitle">账号</h3>
            <div id="sidebarAuthPanel"></div>
          </div>
          <nav class="sidebar__nav sidebar__nav--bottom">
            <ul class="sidebar__list">
              ${this.secondaryNav.map(item => `
                <li class="sidebar__list-item">
                  <a href="${item.path}" class="sidebar__link" data-page-link="true">
                    <span class="sidebar__icon">${this.getIcon(item.icon)}</span>
                    ${item.label}
                  </a>
                </li>
              `).join('')}
            </ul>
          </nav>
        </div>
      </aside>
      
      <!-- 侧边栏遮罩 -->
      <div class="sidebar-mask" aria-hidden="true"></div>
    `;

    document.body.prepend(navContainer);
    
    this.initAuthPanel();
    this.bindPageTransitions();
  }
  
  getCurrentUser() {
    const raw = localStorage.getItem('appUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  saveCurrentUser(user) {
    localStorage.setItem('appUser', JSON.stringify(user));
  }

  async syncCurrentUserFromServer() {
    const user = this.getCurrentUser();
    if (!user || !user.user_code) return;
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/${encodeURIComponent(user.user_code)}`);
      const data = await response.json();
      if (!response.ok || !data.user) return;
      this.saveCurrentUser(data.user);
      this.renderAuthPanel();
    } catch (error) {
      return;
    }
  }

  clearCurrentUser() {
    localStorage.removeItem('appUser');
  }

  initAuthPanel() {
    this.renderAuthPanel();
  }

  renderAuthPanel() {
    const panel = document.getElementById('sidebarAuthPanel');
    if (!panel) return;

    const user = this.getCurrentUser();
    if (!user) {
      panel.innerHTML = `
        <div class="auth-tabs">
          <button class="auth-tab auth-tab--active" data-auth-tab="login" type="button">登录</button>
          <button class="auth-tab" data-auth-tab="register" type="button">注册</button>
        </div>
        <form class="auth-form auth-form--active" id="loginForm">
          <input class="auth-input" id="loginUsername" type="text" placeholder="用户名" autocomplete="username" required>
          <input class="auth-input" id="loginPassword" type="password" placeholder="密码" autocomplete="current-password" required>
          <button class="auth-submit" type="submit">登录</button>
        </form>
        <form class="auth-form" id="registerForm">
          <input class="auth-input" id="registerUsername" type="text" placeholder="用户名" autocomplete="username" required>
          <input class="auth-input" id="registerPassword" type="password" placeholder="密码（至少6位）" autocomplete="new-password" required>
          <button class="auth-submit" type="submit">注册</button>
        </form>
      `;
      const tabs = panel.querySelectorAll('[data-auth-tab]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(item => item.classList.remove('auth-tab--active'));
          tab.classList.add('auth-tab--active');
          const targetTab = tab.getAttribute('data-auth-tab');
          panel.querySelector('#loginForm').classList.toggle('auth-form--active', targetTab === 'login');
          panel.querySelector('#registerForm').classList.toggle('auth-form--active', targetTab === 'register');
        });
      });

      const loginForm = panel.querySelector('#loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          await this.handleLogin();
        });
      }

      const registerForm = panel.querySelector('#registerForm');
      if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          await this.handleRegister();
        });
      }
      return;
    }

    panel.innerHTML = `
      <div class="auth-user-card">
        <div class="auth-user-head">
          <img src="${user.avatar_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 24 24%22 fill=%22%23007aff%22%3E%3Cpath d=%22M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z%22/%3E%3C/svg%3E'}" class="auth-avatar" alt="头像">
          <div class="auth-user-meta">
            <div class="auth-user-name">${user.nickname || user.username}</div>
            <div class="auth-user-id">ID: ${user.user_code}</div>
          </div>
        </div>
        <button class="auth-submit auth-submit--ghost" type="button" id="toSettingsBtn">用户信息设置</button>
        <button class="auth-submit auth-submit--ghost" type="button" id="logoutBtn">退出登录</button>
      </div>
    `;
    const toSettingsBtn = panel.querySelector('#toSettingsBtn');
    if (toSettingsBtn) {
      toSettingsBtn.addEventListener('click', () => {
        this.navigateWithTransition('/settings');
      });
    }
    const logoutBtn = panel.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.clearCurrentUser();
        this.renderAuthPanel();
      });
    }
  }

  async handleLogin() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    if (!username || !password) {
      await this.showToast('请输入用户名和密码');
      return;
    }
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) {
      await this.showToast(data.detail || '登录失败');
      return;
    }
    this.saveCurrentUser(data.user);
    this.renderAuthPanel();
    await this.showToast('登录成功');
  }

  async handleRegister() {
    const usernameInput = document.getElementById('registerUsername');
    const passwordInput = document.getElementById('registerPassword');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    if (!username || !password) {
      await this.showToast('请输入用户名和密码');
      return;
    }
    const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) {
      await this.showToast(data.detail || '注册失败');
      return;
    }
    this.saveCurrentUser(data.user);
    this.renderAuthPanel();
    await this.showToast(`注册成功，您的ID是 ${data.user.user_code}`);
  }

  async showToast(message) {
    if (typeof window.showAlertDialog === 'function') {
      await window.showAlertDialog(message);
      return;
    }
    window.alert(message);
  }

  bindPageTransitions() {
    const links = document.querySelectorAll('a[data-page-link="true"], .bottom-nav a, .navbar__menu a');
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        this.navigateWithTransition(href);
      });
    });
  }

  navigateWithTransition(href) {
    document.body.classList.add('page-transition-out');
    window.setTimeout(() => {
      window.location.href = href;
    }, 180);
  }

  // 检查是否当前页
  isActive(path) {
    const currentPath = window.location.pathname;
    if (path === '/' && (currentPath === '/' || currentPath === '/index.html')) return true;
    return currentPath === path;
  }

  // 绑定事件
  bindEvents() {
    const toggleBtn = document.querySelector('.navbar__toggle');
    const closeBtn = document.querySelector('.sidebar__close');
    const sidebar = document.querySelector('.sidebar');
    // navbar生成的遮罩
    const mask = document.querySelector('.sidebar-mask');
    // 页面可能存在的全局遮罩
    const popupMask = document.getElementById('popupMask');

    const toggleMenu = (e) => {
      // 防止事件冒泡导致触发多次
      if(e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
      }

      if (!sidebar) return;
      const isExpanded = sidebar.classList.contains('sidebar--open');
      if (isExpanded) {
        sidebar.classList.remove('sidebar--open');
        if (mask) mask.classList.remove('sidebar-mask--visible');
        if (popupMask && popupMask.classList.contains('sidebar-mask--visible')) {
            popupMask.classList.remove('sidebar-mask--visible');
            popupMask.classList.remove('active');
        }
        sidebar.setAttribute('aria-hidden', 'true');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        sidebar.classList.add('sidebar--open');
        if (mask) mask.classList.add('sidebar-mask--visible');
        // 不再强行把 popupMask 作为侧边栏遮罩显示，避免双重遮罩
        sidebar.setAttribute('aria-hidden', 'false');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
      }
    };

    if (toggleBtn) toggleBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (mask) mask.addEventListener('click', toggleMenu);
    
    // 如果存在外部遮罩，仅当内部遮罩不存在时绑定，或者完全由内部遮罩处理
    if (popupMask && !mask) {
        popupMask.addEventListener('click', toggleMenu);
    }
    
    // 全局暴露 toggleSidebar 以便其他地方调用
    window.toggleSidebar = toggleMenu;
  }

  setActiveState() {
     // 高亮状态已在render中处理
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  new Navbar();
});

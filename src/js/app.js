(() => {
  const CART_KEY = 'seeLitCart';
  const USERS_KEY = 'seeLitUsers';
  const SESSION_KEY = 'seeLitSession';

  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }

  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function ensureCartButton() {
    const navActions = qs('.nav-actions');
    if (!navActions || qs('#cart-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'cart-toggle';
    btn.type = 'button';
    btn.className = 'btn btn-soft small cart-button';
    btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Cart <span class="cart-count" id="cart-count">0</span>';
    navActions.prepend(btn);
  }

  function ensureCartPanel() {
    if (qs('#cart-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    panel.innerHTML = `
      <div class="cart-panel-header">
        <strong>My Cart</strong>
        <button type="button" class="btn btn-ghost small" id="cart-close">Close</button>
      </div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-total"><span>Total</span><span id="cart-total-amount">LE 0</span></div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" id="cart-checkout" style="flex:1; justify-content:center;">Checkout</button>
        <button type="button" class="btn btn-ghost small" id="cart-clear">Clear</button>
      </div>
      <div class="helper">Cart is saved locally. Connect your backend to process orders.</div>
    `;
    document.body.appendChild(panel);
  }

  function renderCart() {
    const items = loadCart();
    const list = qs('#cart-items');
    const totalEl = qs('#cart-total-amount');
    const countEl = qs('#cart-count');
    if (countEl) countEl.textContent = items.length.toString();

    if (!list) return;
    list.innerHTML = '';
    let total = 0;
    items.forEach((item, idx) => {
      total += Number(item.price || 0);
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div class="helper">LE ${item.price}</div>
        </div>
        <button type="button" class="btn btn-ghost small" data-remove="${idx}"><i class="fa-solid fa-xmark"></i></button>
      `;
      list.appendChild(row);
    });
    totalEl.textContent = `LE ${total.toFixed(2)}`;
  }

  function toggleCart(open) {
    const panel = qs('#cart-panel');
    if (!panel) return;
    if (open === undefined) {
      panel.classList.toggle('open');
    } else if (open) {
      panel.classList.add('open');
    } else {
      panel.classList.remove('open');
    }
  }

  function attachCartHandlers() {
    ensureCartButton();
    ensureCartPanel();
    renderCart();

    const toggleBtn = qs('#cart-toggle');
    const closeBtn = qs('#cart-close');
    const clearBtn = qs('#cart-clear');
    const checkoutBtn = qs('#cart-checkout');
    const itemsContainer = qs('#cart-items');

    toggleBtn?.addEventListener('click', () => toggleCart());
    closeBtn?.addEventListener('click', () => toggleCart(false));
    clearBtn?.addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
    checkoutBtn?.addEventListener('click', () => {
      alert('Cart validated. Connect your checkout API to proceed.');
    });
    itemsContainer?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-remove]');
      if (!btn) return;
      const idx = Number(btn.getAttribute('data-remove'));
      const items = loadCart();
      items.splice(idx, 1);
      saveCart(items);
      renderCart();
    });

    qsa('.add-to-cart').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = btn.getAttribute('data-product') || 'SEE-LIT product';
        const price = parseFloat(btn.getAttribute('data-price') || '0');
        const image = btn.getAttribute('data-image') || '';
        const items = loadCart();
        items.push({ name, price, image });
        saveCart(items);
        renderCart();
        toggleCart(true);
      });
    });
  }

  function showStatus(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('error', 'success');
    el.classList.add(type);
  }

  function attachAuthHandlers() {
    const loginForm = qs('form.auth-card h3')?.textContent?.toLowerCase().includes('login') ? qs('form.auth-card') : null;
    const registerForm = qs('form.auth-card h3')?.textContent?.toLowerCase().includes('sign up') ? qs('form.auth-card') : null;
    const statusEl = document.createElement('div');
    statusEl.className = 'form-status';

    const targetForm = loginForm || registerForm;
    if (targetForm && !qs('.form-status', targetForm)) {
      targetForm.appendChild(statusEl);
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = qs('#login-email')?.value.trim().toLowerCase();
        const password = qs('#login-password')?.value;
        if (!email || !password) {
          showStatus(statusEl, 'Please fill all fields.', 'error');
          return;
        }
        const users = loadUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) {
          showStatus(statusEl, 'Invalid email or password.', 'error');
          return;
        }
        saveSession({ email, name: user.firstName || 'Member' });
        showStatus(statusEl, 'Login successful. Redirecting...', 'success');
        setTimeout(() => (window.location.href = 'home.html'), 800);
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const first = qs('#first-name')?.value.trim();
        const last = qs('#last-name')?.value.trim();
        const email = qs('#email')?.value.trim().toLowerCase();
        const phone = qs('#phone')?.value.trim();
        const city = qs('#city')?.value;
        const password = qs('#password')?.value;
        const confirm = qs('#confirm-password')?.value;

        if (!first || !last || !email || !password || !confirm) {
          showStatus(statusEl, 'Please complete all required fields.', 'error');
          return;
        }
        if (!email.includes('@')) {
          showStatus(statusEl, 'Enter a valid email address.', 'error');
          return;
        }
        if (password.length < 6) {
          showStatus(statusEl, 'Password must be at least 6 characters.', 'error');
          return;
        }
        if (password !== confirm) {
          showStatus(statusEl, 'Passwords do not match.', 'error');
          return;
        }
        const users = loadUsers();
        if (users.some((u) => u.email === email)) {
          showStatus(statusEl, 'An account with this email already exists.', 'error');
          return;
        }
        users.push({ firstName: first, lastName: last, email, phone, city, password });
        saveUsers(users);
        saveSession({ email, name: first });
        showStatus(statusEl, 'Account created. Redirecting...', 'success');
        setTimeout(() => (window.location.href = 'home.html'), 800);
      });
    }
  }

  function updateSessionUI() {
    const session = loadSession();
    const navActions = qs('.nav-actions');
    const navLoginLinks = qsa('.navbar .nav-links a[href="login.html"]');
    const navRegisterLinks = qsa('.navbar .nav-links a[href="register.html"]');
    if (!navActions) return;

    // Hide login/register when logged in
    const actionLoginLink = qs('a[href="login.html"]', navActions);
    const actionRegisterLink = qs('a[href="register.html"]', navActions);
    [actionLoginLink, actionRegisterLink].forEach((link) => {
      if (link) link.classList.toggle('hidden', Boolean(session));
    });
    navLoginLinks.forEach((link) => link.classList.toggle('hidden', Boolean(session)));
    navRegisterLinks.forEach((link) => link.classList.toggle('hidden', Boolean(session)));

    if (qs('#logout-btn')) qs('#logout-btn').remove();
    if (qs('#session-chip')) qs('#session-chip').remove();

    if (session) {
      const chip = document.createElement('div');
      chip.id = 'session-chip';
      chip.className = 'pill';
      chip.innerHTML = `<i class="fa-solid fa-user"></i> Hi, ${session.name || 'Member'}`;
      navActions.appendChild(chip);

      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn btn-ghost small';
      logoutBtn.textContent = 'Logout';
      logoutBtn.addEventListener('click', () => {
        clearSession();
        window.location.reload();
      });
      navActions.appendChild(logoutBtn);
    }
  }

  function setupAnimations() {
    const animated = qsa('.section, .hero, .card, .feature, .auth-card, .hero-media, .stat, .offers-hero');
    animated.forEach((el) => el.classList.add('animate'));

    const reveal = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(reveal, { threshold: 0.15 });
      animated.forEach((el) => observer.observe(el));
    } else {
      animated.forEach((el) => el.classList.add('visible'));
    }

    window.setTimeout(() => document.body.classList.add('page-ready'), 50);
  }

  function enableSmoothScroll() {
    qsa('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachCartHandlers();
    attachAuthHandlers();
    updateSessionUI();
    setupAnimations();
    enableSmoothScroll();
  });
})();

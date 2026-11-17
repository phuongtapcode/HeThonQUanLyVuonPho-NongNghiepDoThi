/* ==========================================================================
   Sprint 2 — Module dùng chung (UG):
   Nhắc lịch chăm sóc, nút "Đã chăm sóc", vòng lặp (for/while), Regex Validation,
   AOS (Animate on Scroll) offline, Dark/Light Mode, Hamburger Menu, Toast & Modal JSON.
   ========================================================================== */
(function (root) {
  'use strict';

  const DAY = 86400000;
  const HOUR = 3600000;
  const Store = root.GardenStore;

  /* Biểu thức chính quy (Regex - Tuần 11) dùng kiểm tra dữ liệu biểu mẫu */
  const REGEX = {
    plantName: /^[a-zA-ZÀ-ỹ0-9\s()\-.,]{2,60}$/,
    titleText: /^[a-zA-ZÀ-ỹ0-9\s()\-.,:;!?/]{4,120}$/,
    dateIso: /^\d{4}-\d{2}-\d{2}$/
  };

  /* Hàm ghi nhật ký debug có cấu trúc qua console.log (Tuần 8) */
  function debugLog(tag, payload) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[UrbanFlora:' + tag + ']', payload);
    }
  }

  /* Mã hóa ký tự đặc biệt chống lỗi XSS khi render chuỗi HTML */
  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad2(v) {
    return (v < 10 ? '0' : '') + v;
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function formatTime(d) {
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* Định dạng thời gian tương đối tiếng Việt cho thẻ Plant Card */
  function formatRelativeTime(isoString) {
    const t = new Date(isoString).getTime();
    if (isNaN(t)) { return 'Chưa có'; }
    const diffMs = Date.now() - t;
    const diffHours = Math.floor(diffMs / HOUR);
    const diffDays = Math.floor(diffMs / DAY);
    if (diffHours < 1) { return 'Vừa mới xong'; }
    if (diffHours < 24) { return diffHours + ' giờ trước'; }
    return diffDays + ' ngày trước';
  }

  function formatDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (m) { return m[3] + '/' + m[2] + '/' + m[1]; }
    const d = new Date(value);
    if (isNaN(d.getTime())) { return '—'; }
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function newId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* Phân loại màu Progress Bar (Tuần 5): >= 70% Xanh lá, 40-69% Vàng cam, < 40% Đỏ */
  function levelOf(v) {
    if (v < 40) { return 'low'; }
    if (v < 70) { return 'mid'; }
    return 'good';
  }

  function levelLabel(v) {
    if (v < 40) { return 'thấp (cảnh báo)'; }
    if (v < 70) { return 'trung bình'; }
    return 'tốt';
  }

  /* ---------- Hàm tái sử dụng áp dụng vòng lặp for & while (Tuần 9 - DRY) ---------- */

  /* Dùng vòng lặp for tổng hợp chỉ số khu vườn */
  function summarizeGarden(plants, now) {
    const current = now || new Date();
    let total = plants.length;
    let needCare = 0;
    let moistureSum = 0;
    let healthSum = 0;

    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      const rem = calculateCareReminder(p, current);
      if (rem.status !== 'ok') { needCare++; }
      moistureSum += Number(p.moisture) || 0;
      healthSum += Number(p.health) || 0;
    }

    return {
      total: total,
      needCare: needCare,
      avgMoisture: total ? Math.round(moistureSum / total) : 0,
      avgHealth: total ? Math.round(healthSum / total) : 0
    };
  }

  /* Dùng vòng lặp while đặt tên không trùng khi thêm nhiều chậu cùng loại */
  function dedupePlantName(existingPlants, baseName) {
    let candidate = baseName;
    let counter = 2;
    const hasName = function (name) {
      return existingPlants.some(function (p) { return p.name === name; });
    };
    while (hasName(candidate)) {
      candidate = baseName + ' ' + counter;
      counter++;
    }
    return candidate;
  }

  /* ---------- Logic tính lịch nhắc chăm sóc cây (Tuần 8 - if...else) ---------- */

  function describeTask(label, lastIso, intervalDays, now) {
    const last = new Date(lastIso).getTime();
    if (isNaN(last) || !(intervalDays > 0)) {
      return { status: 'overdue', text: label + ': chưa có ghi nhận, nên làm ngay', msLeft: -Infinity };
    }
    const due = new Date(last + intervalDays * DAY);
    const msLeft = due.getTime() - now.getTime();
    const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / DAY);

    if (msLeft < 0) {
      const late = dayDiff < 0
        ? 'quá hạn ' + (-dayDiff) + ' ngày'
        : 'quá hạn ' + Math.max(1, Math.floor(-msLeft / HOUR)) + ' giờ';
      return { status: 'overdue', text: label + ': ' + late, msLeft: msLeft };
    }
    if (dayDiff <= 0) {
      return { status: 'due-today', text: label + ': đến hạn hôm nay lúc ' + formatTime(due), msLeft: msLeft };
    }
    if (msLeft <= 6 * HOUR) {
      return { status: 'due-today', text: label + ': đến hạn lúc ' + formatTime(due) + ' ngày mai', msLeft: msLeft };
    }
    return { status: 'ok', text: label + ': còn ' + dayDiff + ' ngày', msLeft: msLeft };
  }

  const RANK = { 'overdue': 2, 'due-today': 1, 'ok': 0 };

  function calculateCareReminder(plant, now) {
    const current = now || new Date();
    const water = describeTask('Tưới nước', plant.lastWateredAt, plant.waterIntervalDays, current);
    const fert = describeTask('Bón phân', plant.lastFertilizedAt, plant.fertilizeIntervalDays, current);
    const status = RANK[water.status] >= RANK[fert.status] ? water.status : fert.status;
    const tasks = [];

    if (water.status !== 'ok') {
      tasks.push({ type: 'water', label: 'Tưới nước', status: water.status });
    }
    if (fert.status !== 'ok') {
      tasks.push({ type: 'fertilize', label: 'Bón phân', status: fert.status });
    }

    const nextAction = tasks.length
      ? tasks.map(function (t) {
          return t.label + (t.status === 'overdue' ? ' ngay' : ' hôm nay');
        }).join(' và ')
      : 'Chưa cần chăm sóc';

    return {
      status: status,
      waterText: water.text,
      fertilizeText: fert.text,
      nextAction: nextAction,
      tasks: tasks,
      water: water,
      fertilize: fert
    };
  }

  /* Cập nhật dữ liệu JSON khi người dùng bấm "Đã tưới nước", "Đã bón phân" hoặc "Đã chăm sóc" */
  function markCared(plantId, type, now) {
    const data = Store.load();
    const matched = data.gardenPlants.filter(function (item) {
      return item.id === plantId;
    });
    const plant = matched[0] || null;
    if (!plant) { return null; }

    const current = now || new Date();
    const stamp = current.toISOString();

    if (type === 'water' || type === 'both') {
      plant.lastWateredAt = stamp;
      plant.moisture = 100;
      plant.health = 100;
      const fertCheck = describeTask('Bón phân', plant.lastFertilizedAt, plant.fertilizeIntervalDays, current);
      if (fertCheck.status !== 'ok') {
        plant.lastFertilizedAt = stamp;
      }
    }

    if (type === 'fertilize' || type === 'both') {
      plant.lastFertilizedAt = stamp;
      plant.health = 100;
      plant.moisture = 100;
      const waterCheck = describeTask('Tưới nước', plant.lastWateredAt, plant.waterIntervalDays, current);
      if (waterCheck.status !== 'ok') {
        plant.lastWateredAt = stamp;
      }
    }

    if (!Store.save(data)) { return null; }
    debugLog('markCared', { id: plant.id, name: plant.name, type: type, time: stamp });
    return plant;
  }

  /* ---------- Toast Notification (Tự ẩn sau 3 giây bằng setTimeout) ---------- */
  let toastTimer = null;

  function toast(message, isError) {
    let box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.className = 'toast';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.classList.toggle('toast-error', Boolean(isError));
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      box.classList.remove('show');
    }, 3000);
  }

  /* Hiển thị lỗi đỏ trực quan ngay dưới ô nhập (Form Validation - Tuần 11) */
  function setFieldError(inputEl, errEl, message) {
    if (inputEl) {
      inputEl.classList.toggle('input-invalid', Boolean(message));
      inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (errEl) {
      errEl.textContent = message || '';
      errEl.hidden = !message;
    }
  }

  /* ---------- Hiệu ứng Progress Bar (Tuần 5: Skill Bar chạy từ 0% -> thực tế) ---------- */

  function animateProgressBars(scope) {
    const container = scope || document;
    const bars = container.querySelectorAll('.progress-fill[data-target]');
    Array.prototype.forEach.call(bars, function (bar) {
      const target = Math.max(0, Math.min(100, Number(bar.getAttribute('data-target')) || 0));
      bar.style.transition = 'none';
      bar.style.width = '0%';
      void bar.offsetWidth;
      bar.style.transition = '';
      setTimeout(function () {
        bar.style.width = target + '%';
      }, 25);
    });
  }

  /* ---------- Hệ thống AOS (Animate on Scroll) chạy mượt offline (Tuần 5) ---------- */

  function initAOS() {
    const nodes = document.querySelectorAll('[data-aos]');
    if (!nodes.length) { return; }

    Array.prototype.forEach.call(nodes, function (el) {
      const delay = el.getAttribute('data-aos-delay');
      if (delay) {
        el.style.setProperty('--aos-delay', delay + 'ms');
      }
      el.classList.add('aos-init');
    });

    function checkVisible() {
      const vh = root.innerHeight || document.documentElement.clientHeight || 800;
      Array.prototype.forEach.call(nodes, function (el) {
        if (el.classList.contains('aos-animate')) { return; }
        if (!el.getBoundingClientRect) {
          el.classList.add('aos-animate');
          return;
        }
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 0.94 && rect.bottom >= 0) {
          el.classList.add('aos-animate');
        }
      });
    }

    checkVisible();

    if ('IntersectionObserver' in root) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

      Array.prototype.forEach.call(nodes, function (el) {
        if (!el.classList.contains('aos-animate')) {
          observer.observe(el);
        }
      });
    }

    if (root.addEventListener) {
      root.addEventListener('scroll', checkVisible, { passive: true });
      root.addEventListener('resize', checkVisible, { passive: true });
    }
  }

  /* ---------- Chế độ Sáng / Tối (Dark / Light Mode lưu localStorage) ---------- */

  function applyTheme(theme) {
    const mode = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    if (document.body) {
      document.body.setAttribute('data-theme', mode);
    }
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    Array.prototype.forEach.call(buttons, function (btn) {
      const isDark = mode === 'dark';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      const iconEl = btn.querySelector('.theme-icon');
      const labelEl = btn.querySelector('.theme-label');
      if (iconEl) { iconEl.textContent = isDark ? '☀️' : '🌙'; }
      if (labelEl) { labelEl.textContent = isDark ? 'Sáng' : 'Tối'; }
    });
  }

  function initTheme() {
    const saved = Store.getTheme();
    applyTheme(saved);

    const buttons = document.querySelectorAll('[data-theme-toggle]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        Store.setTheme(next);
        const data = Store.load();
        if (data && data.settings) {
          data.settings.theme = next;
          Store.save(data);
        }
        applyTheme(next);
        toast(next === 'dark' ? 'Đã bật chế độ Tối (Dark Mode).' : 'Đã bật chế độ Sáng (Light Mode).');
      });
    });
  }

  /* ---------- Menu Hamburger trên Mobile ---------- */

  function initMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggleBtn || !nav) { return; }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Mở menu điều hướng');
    }

    toggleBtn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng');
    });

    nav.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('a') && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) { return; }
      const header = toggleBtn.closest ? toggleBtn.closest('.site-header') : null;
      if (header && !header.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggleBtn.focus();
      }
    });
  }

  /* ---------- Modal Xem / Copy / Tải file plants-updated.json ---------- */
  let dialog = null;

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'json-dialog';
    dialog.setAttribute('aria-labelledby', 'json-title');
    dialog.innerHTML =
      '<form method="dialog" class="json-form">' +
      '<h2 id="json-title">Dữ liệu JSON của hệ thống Urban Flora</h2>' +
      '<p class="muted">Dữ liệu đang lưu tại <code>localStorage</code> (khóa <code>' + esc(Store.key) + '</code>). ' +
      'Nút <strong>Copy JSON</strong> và <strong>Tải file plants-updated.json</strong> xuất toàn bộ cấu trúc để kiểm tra.</p>' +
      '<label for="json-view" class="visually-hidden">Nội dung JSON</label>' +
      '<textarea id="json-view" class="json-view" readonly spellcheck="false" rows="16"></textarea>' +
      '<div class="json-actions">' +
      '<button type="button" class="btn btn-primary" data-json="download">Tải file plants-updated.json</button>' +
      '<button type="button" class="btn btn-secondary" data-json="copy">Copy JSON</button>' +
      '<button type="button" class="btn btn-secondary" data-json="refresh">Làm mới</button>' +
      '<button type="button" class="btn btn-danger" data-json="reset">Đặt lại dữ liệu mẫu</button>' +
      '<button type="submit" class="btn btn-secondary">Đóng</button>' +
      '</div></form>';
    document.body.appendChild(dialog);

    dialog.addEventListener('click', function (e) {
      const action = e.target && e.target.getAttribute ? e.target.getAttribute('data-json') : null;
      if (e.target === dialog) { closeDialog(); return; }
      if (action === 'download') { downloadJson(); }
      else if (action === 'copy') { copyJson(); }
      else if (action === 'refresh') { refreshView(); toast('Đã làm mới dữ liệu JSON.'); }
      else if (action === 'reset') {
        if (root.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
          Store.reset();
          toast('Đã khôi phục dữ liệu mẫu.');
          setTimeout(function () { root.location.reload(); }, 450);
        }
      }
    });
  }

  function closeDialog() {
    if (!dialog) { return; }
    if (typeof dialog.close === 'function') { dialog.close(); } else { dialog.removeAttribute('open'); }
  }

  function refreshView() {
    const view = document.getElementById('json-view');
    if (view) {
      view.value = Store.toJSON(Store.load(), true);
    }
  }

  function downloadJson() {
    const blob = new Blob([Store.toJSON(Store.load(), false)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plants-updated.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Đã tải xuống file plants-updated.json.');
  }

  function copyJson() {
    const text = Store.toJSON(Store.load(), false);
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? 'Đã sao chép JSON vào bộ nhớ tạm.' : 'Không sao chép được, hãy dùng nút tải file.', !ok);
    }
    if (root.navigator && navigator.clipboard && root.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Đã sao chép JSON vào bộ nhớ tạm.');
      }, fallback);
    } else {
      fallback();
    }
  }

  function openJson() {
    if (!dialog) { buildDialog(); }
    refreshView();
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) { dialog.showModal(); }
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function init() {
    const page = document.body.getAttribute('data-page');
    const links = document.querySelectorAll('.site-nav a[data-nav]');
    Array.prototype.forEach.call(links, function (link) {
      if (link.getAttribute('data-nav') === page) {
        link.setAttribute('aria-current', 'page');
      }
    });

    const jsonButtons = document.querySelectorAll('[data-open-json]');
    Array.prototype.forEach.call(jsonButtons, function (btn) {
      btn.addEventListener('click', openJson);
    });

    initTheme();
    initMobileMenu();
    initAOS();
    debugLog('init', { page: page, storageKey: Store.key });
  }

  root.UG = {
    REGEX: REGEX,
    debugLog: debugLog,
    esc: esc,
    formatDate: formatDate,
    formatRelativeTime: formatRelativeTime,
    newId: newId,
    levelOf: levelOf,
    levelLabel: levelLabel,
    summarizeGarden: summarizeGarden,
    dedupePlantName: dedupePlantName,
    calculateCareReminder: calculateCareReminder,
    markCared: markCared,
    toast: toast,
    openJson: openJson,
    setFieldError: setFieldError,
    animateProgressBars: animateProgressBars
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

/* ==========================================================================
   Sprint 2 — Trang Khu vườn của tôi (index.html — Stitch MyGarden)
   Render Plant Cards với ảnh WebP thật, Progress Bar động 2 thanh,
   xử lý "Đã tưới nước" / "Bón phân", Modal Thêm cây mới & JSON State.
   ========================================================================== */
(function () {
  'use strict';

  const UG = window.UG;
  const Store = window.GardenStore;
  const esc = UG.esc;
  let data = Store.load();
  let lastAddedPlantId = null;

  const grid = document.getElementById('plant-grid');
  const filterSelect = document.getElementById('filter-plant-type');
  const plantCountBadge = document.getElementById('plant-count-badge');
  const reminderBox = document.getElementById('care-reminder-box');
  const reminderText = document.getElementById('care-reminder-text');
  const jsonDrawer = document.getElementById('json-viewer-wrapper');
  const jsonDisplay = document.getElementById('json-display');
  const toggleJsonBtn = document.getElementById('btn-toggle-json');

  const addPlantModal = document.getElementById('add-plant-modal');
  const openAddPlantBtn = document.getElementById('btn-open-add-plant');
  const closeAddPlantBtn = document.getElementById('btn-close-add-plant');
  const cancelAddPlantBtn = document.getElementById('btn-cancel-add-plant');

  /* ---------- Tạo thanh Progress Bar (Tuần 5: chạy mượt 0% -> giá trị thật) ---------- */
  function meter(key, label, value, plantName) {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    const lv = UG.levelOf(v);
    return '<div class="meter" data-meter="' + esc(key) + '">' +
      '<div class="meter-head">' +
      '<span class="meter-label">' + esc(label) + '</span>' +
      '<strong class="meter-val val-' + lv + '" data-meter-val>' + v + '%</strong>' +
      '</div>' +
      '<div class="progress" role="progressbar" aria-label="' + esc(label + ' của ' + plantName) + '"' +
      ' aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="100"' +
      ' aria-valuetext="' + v + '%, mức ' + UG.levelLabel(v) + '">' +
      '<div class="progress-fill level-' + lv + '" data-target="' + v + '" style="width:' + v + '%"></div>' +
      '</div></div>';
  }

  const STATUS_META = {
    'overdue':   { text: 'Cần chăm sóc', cls: 'is-alert' },
    'due-today': { text: 'Đến hạn hôm nay', cls: 'is-warn' },
    'ok':        { text: 'Khỏe mạnh', cls: 'is-ok' }
  };

  /* ---------- Tạo thẻ Plant Card theo đúng cấu trúc Stitch MyGarden ---------- */
  function plantCard(p, r, idx) {
    const photo = Store.photo(p.icon);
    const imgSrc = p.image || photo.src;
    const imgFallback = Store.art(p.icon, 3);
    const imgSource = p.imageSource || photo.source;
    const st = STATUS_META[r.status] || STATUS_META.ok;
    const delay = (Math.min(idx || 0, 10) * 0.06).toFixed(2) + 's';
    const highlightClass = p.id === lastAddedPlantId ? ' card-new-highlight' : '';

    let sensorHtml = '';
    if (p.sensor) {
      sensorHtml = '<p class="section-sub" style="color:var(--moisture);font-family:var(--font-code);">' +
        'Cảm biến lúc ' + esc(new Date(p.sensor.updatedAt).toLocaleTimeString('vi-VN')) + ': ' +
        esc(p.sensor.lightLux.toLocaleString('vi-VN')) + ' lux • ' + esc(p.sensor.soilTemp) + '°C</p>';
    }

    return '<article class="plant-card' + highlightClass + '" style="--delay:' + delay + '" data-plant="' + esc(p.id) + '" aria-labelledby="t-' + esc(p.id) + '">' +
      '<figure class="card-media">' +
      '<img src="' + esc(imgSrc) + '" width="640" height="420" loading="lazy" alt="Ảnh cây ' + esc(p.name) + '"' +
      ' onerror="this.onerror=null;this.src=\'' + imgFallback + '\'">' +
      '<div class="card-media-overlay" aria-hidden="true"></div>' +
      '<div class="media-top-row">' +
      '<div class="media-left-pills">' +
      '<span class="pill-category">' + esc(p.category) + '</span>' +
      '<span class="pill-age">' + esc(p.ageDays || 30) + ' ngày tuổi</span>' +
      '</div>' +
      '<span class="status-badge ' + st.cls + '" data-card-badge>' + st.text + '</span>' +
      '</div>' +
      '<figcaption>' +
      '<h3 id="t-' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
      (p.scientificName ? '<p class="sci-sub">' + esc(p.scientificName) + '</p>' : '') +
      '</figcaption>' +
      '</figure>' +
      '<div class="card-body">' +
      '<div class="location-row">' +
      '<span class="location-left">📍 ' + esc(p.location) + '</span>' +
      '<span class="source-credit" title="' + esc(imgSource) + '">Wikimedia WebP</span>' +
      '</div>' +
      '<dl class="env-grid-2">' +
      '<div><dt>Độ ẩm &amp; Nhiệt độ lý tưởng:</dt><dd>' + esc(p.idealEnv.humidity) + ' • ' + esc(p.idealEnv.temp) + '</dd></div>' +
      '<div><dt>Nắng / Quang hợp:</dt><dd class="dd-sun">' + esc(p.idealEnv.light) + '</dd></div>' +
      '</dl>' +
      '<div class="meters-group">' +
      meter('health', 'Sức khỏe cây trồng', p.health, p.name) +
      meter('moisture', 'Độ ẩm đất cảm biến', p.moisture, p.name) +
      '</div>' +
      sensorHtml +
      '<div class="time-meta">' +
      '<div class="time-row"><span>Tưới lần cuối:</span><time data-water-time datetime="' + esc(p.lastWateredAt) + '">' + esc(UG.formatRelativeTime(p.lastWateredAt)) + '</time></div>' +
      '<div class="time-row"><span>Bón dinh dưỡng:</span><time data-fert-time datetime="' + esc(p.lastFertilizedAt) + '">' + esc(UG.formatRelativeTime(p.lastFertilizedAt)) + '</time></div>' +
      '</div>' +
      '<div class="card-footer-actions">' +
      '<button type="button" class="btn btn-sun" data-action="fertilize" data-id="' + esc(p.id) + '">Bón phân</button>' +
      '<button type="button" class="btn ' + (r.water.status !== 'ok' ? 'btn-primary' : 'btn-soft') + '" data-action="water" data-id="' + esc(p.id) + '">Đã tưới nước</button>' +
      '</div>' +
      '<div class="card-sub-links">' +
      '<a href="journal.html?plant=' + encodeURIComponent(p.id) + '">Xem nhật ký</a>' +
      '<button type="button" class="link-danger" data-action="remove" data-id="' + esc(p.id) + '">Xóa cây</button>' +
      '</div>' +
      '</div></article>';
  }

  function updateSummaryHeader() {
    const s = UG.summarizeGarden(data.gardenPlants, new Date());
    if (plantCountBadge) {
      plantCountBadge.textContent = s.total + ' Cây';
    }
    if (reminderText && reminderBox) {
      if (s.needCare > 0) {
        reminderBox.classList.remove('all-ok');
        reminderText.innerHTML = 'Có <strong>' + s.needCare + ' cây</strong> cần tưới ẩm hoặc bổ sung dinh dưỡng hôm nay';
      } else {
        reminderBox.classList.add('all-ok');
        reminderText.textContent = 'Tất cả cây trồng đều đủ ẩm và đạt chỉ số môi trường lý tưởng!';
      }
    }
  }

  function syncTelemetryWidget() {
    const t = data.telemetry || {};
    const timeEl = document.getElementById('telemetry-time');
    const lightEl = document.getElementById('tele-light');
    const airEl = document.getElementById('tele-air');
    const tempEl = document.getElementById('tele-temp');
    const tankEl = document.getElementById('tele-tank');

    if (timeEl && t.updatedAt) {
      timeEl.setAttribute('datetime', t.updatedAt);
      timeEl.textContent = 'Cập nhật: ' + new Date(t.updatedAt).toLocaleTimeString('vi-VN');
    }
    if (lightEl && t.lightLux) { lightEl.innerHTML = Number(t.lightLux).toLocaleString('vi-VN') + ' <small>Lux</small>'; }
    if (airEl && t.airHumidity) { airEl.innerHTML = esc(t.airHumidity) + '% <small>RH</small>'; }
    if (tempEl && t.ambientTemp) { tempEl.innerHTML = esc(t.ambientTemp) + ' <small>°C</small>'; }
    if (tankEl && t.tankPercent !== undefined) { tankEl.innerHTML = esc(t.tankPercent) + '% <small>(' + esc(t.tankLiters || '41/50L') + ')</small>'; }
  }

  function syncJsonDrawer() {
    if (jsonDisplay && jsonDrawer && !jsonDrawer.hidden) {
      jsonDisplay.textContent = Store.toJSON(data, true);
    }
  }

  function getPlantItems() {
    const now = new Date();
    const filterVal = filterSelect ? filterSelect.value : 'all';
    const source = filterVal === 'all'
      ? data.gardenPlants
      : data.gardenPlants.filter(function (p) { return p.category === filterVal; });

    const items = source.map(function (p) {
      return { p: p, r: UG.calculateCareReminder(p, now) };
    });
    items.sort(function (a, b) {
      if (a.p.id === lastAddedPlantId) { return -1; }
      if (b.p.id === lastAddedPlantId) { return 1; }
      const rank = { 'overdue': 0, 'due-today': 1, 'ok': 2 };
      return rank[a.r.status] - rank[b.r.status];
    });
    return items;
  }

  function render(animateBars) {
    const items = getPlantItems();
    updateSummaryHeader();
    syncTelemetryWidget();
    syncJsonDrawer();

    grid.innerHTML = items.length
      ? items.map(function (x, idx) { return plantCard(x.p, x.r, idx); }).join('')
      : '<div class="empty-state">Chưa có cây nào phù hợp bộ lọc này. Hãy đổi bộ lọc hoặc nhấn "+ Thêm cây mới vào vườn".</div>';

    if (animateBars) {
      UG.animateProgressBars(grid);
    }
    fillSelects();
    renderMarket();
  }

  /* Cập nhật mượt thanh Progress Bar ngay trên DOM khi bấm nút hoặc mô phỏng cảm biến */
  function updateMeterInCard(cardEl, meterKey, newVal) {
    const meterEl = cardEl.querySelector('[data-meter="' + meterKey + '"]');
    if (!meterEl) { return; }
    const v = Math.max(0, Math.min(100, Math.round(newVal)));
    const lv = UG.levelOf(v);

    const valEl = meterEl.querySelector('[data-meter-val]');
    if (valEl) {
      valEl.textContent = v + '%';
      valEl.className = 'meter-val val-' + lv;
    }

    const progEl = meterEl.querySelector('.progress');
    if (progEl) {
      progEl.setAttribute('aria-valuenow', String(v));
      progEl.setAttribute('aria-valuetext', v + '%, mức ' + UG.levelLabel(v));
    }

    const fillEl = meterEl.querySelector('.progress-fill');
    if (fillEl) {
      fillEl.className = 'progress-fill level-' + lv;
      fillEl.setAttribute('data-target', String(v));
      fillEl.style.width = v + '%';
    }
  }

  /* ---------- Sự kiện "Đã tưới nước" & "Bón phân" ---------- */
  const ACTION_INFO = {
    both:      { confirmText: '✓ Đã chăm sóc', toastText: 'Đã tưới nước và bón phân hoàn tất (100%)' },
    water:     { confirmText: '✓ Đã tưới nước', toastText: 'Đã ghi nhận tưới nước, độ ẩm đạt 100%' },
    fertilize: { confirmText: '✓ Đã bón phân', toastText: 'Đã bổ sung dinh dưỡng, sức khỏe đạt 100%' }
  };

  grid.addEventListener('click', function (e) {
    const btn = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!btn) { return; }
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');

    if (action === 'remove') {
      const target = data.gardenPlants.filter(function (p) { return p.id === id; })[0];
      if (target && window.confirm('Xóa "' + target.name + '" khỏi khu vườn?')) {
        data.gardenPlants = data.gardenPlants.filter(function (p) { return p.id !== id; });
        Store.save(data);
        render(false);
        UG.toast('Đã xóa ' + target.name + ' khỏi khu vườn.');
      }
      return;
    }

    const updated = UG.markCared(id, action);
    if (!updated) {
      UG.toast('Không lưu được thay đổi, vui lòng thử lại.', true);
      return;
    }
    data = Store.load();
    const reminder = UG.calculateCareReminder(updated, new Date());
    const cardEl = grid.querySelector('[data-plant="' + id + '"]');

    if (cardEl) {
      const info = ACTION_INFO[action] || ACTION_INFO.both;
      btn.classList.add('is-confirmed');
      btn.textContent = info.confirmText;

      updateMeterInCard(cardEl, 'moisture', updated.moisture);
      updateMeterInCard(cardEl, 'health', updated.health);

      const badgeEl = cardEl.querySelector('[data-card-badge]');
      if (badgeEl) {
        const st = STATUS_META[reminder.status] || STATUS_META.ok;
        badgeEl.className = 'status-badge ' + st.cls;
        badgeEl.textContent = st.text;
      }

      const wTime = cardEl.querySelector('[data-water-time]');
      const fTime = cardEl.querySelector('[data-fert-time]');
      if (wTime) {
        wTime.setAttribute('datetime', updated.lastWateredAt);
        wTime.textContent = UG.formatRelativeTime(updated.lastWateredAt);
      }
      if (fTime) {
        fTime.setAttribute('datetime', updated.lastFertilizedAt);
        fTime.textContent = UG.formatRelativeTime(updated.lastFertilizedAt);
      }
    }

    updateSummaryHeader();
    syncJsonDrawer();
    UG.toast(updated.name + ': ' + (ACTION_INFO[action] || ACTION_INFO.both).toastText + '.');
  });

  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      render(true);
    });
  }

  /* Quét lịch chăm sóc trên Header */
  const quickCheckBtn = document.getElementById('btn-quick-check');
  if (quickCheckBtn) {
    quickCheckBtn.addEventListener('click', function () {
      const needs = data.gardenPlants.filter(function (p) {
        return UG.calculateCareReminder(p, new Date()).status !== 'ok';
      });
      if (needs.length > 0) {
        UG.toast('Cảnh báo: ' + needs.map(function (n) { return n.name; }).join(', ') + ' cần chăm sóc!');
      } else {
        UG.toast('Toàn bộ vườn phố đang đạt chỉ số vi khí hậu lý tưởng!');
      }
    });
  }

  /* Ngăn xem nhanh JSON ngay dưới trang & Khôi phục mẫu */
  if (toggleJsonBtn && jsonDrawer && jsonDisplay) {
    toggleJsonBtn.addEventListener('click', function () {
      jsonDrawer.hidden = !jsonDrawer.hidden;
      toggleJsonBtn.textContent = jsonDrawer.hidden ? 'Xem Dữ Liệu JSON' : 'Ẩn Dữ Liệu JSON';
      if (!jsonDrawer.hidden) {
        jsonDisplay.textContent = Store.toJSON(data, true);
      }
    });
  }

  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu vườn ban đầu?')) {
        data = Store.reset();
        lastAddedPlantId = null;
        render(true);
        UG.toast('Đã khôi phục dữ liệu vườn ban đầu!');
      }
    });
  }

  /* ---------- Modal Thêm cây mới (Form Validation + Regex) ---------- */
  function openAddModal() {
    if (!addPlantModal) { return; }
    if (typeof addPlantModal.showModal === 'function') {
      if (!addPlantModal.open) { addPlantModal.showModal(); }
    } else {
      addPlantModal.setAttribute('open', '');
    }
  }

  function closeAddModal() {
    if (!addPlantModal) { return; }
    if (typeof addPlantModal.close === 'function') { addPlantModal.close(); } else { addPlantModal.removeAttribute('open'); }
  }

  if (openAddPlantBtn) { openAddPlantBtn.addEventListener('click', openAddModal); }
  if (closeAddPlantBtn) { closeAddPlantBtn.addEventListener('click', closeAddModal); }
  if (cancelAddPlantBtn) { cancelAddPlantBtn.addEventListener('click', closeAddModal); }
  if (addPlantModal) {
    addPlantModal.addEventListener('click', function (e) {
      if (e.target === addPlantModal) { closeAddModal(); }
    });
  }

  const addPlantForm = document.getElementById('add-plant-form');
  const apName = document.getElementById('ap-name');
  const apCategory = document.getElementById('ap-category');
  const apLocation = document.getElementById('ap-location');
  const apWater = document.getElementById('ap-water');
  const apMoisture = document.getElementById('ap-moisture');

  const apNameErr = document.getElementById('ap-name-err');
  const apCategoryErr = document.getElementById('ap-category-err');
  const apWaterErr = document.getElementById('ap-water-err');
  const apMoistureErr = document.getElementById('ap-moisture-err');

  function pickIcon(name, category) {
    const lower = String(name).toLowerCase();
    if (lower.indexOf('cà chua') !== -1) { return 'tomato'; }
    if (lower.indexOf('ớt') !== -1) { return 'chili'; }
    if (lower.indexOf('dâu') !== -1) { return 'strawberry'; }
    if (lower.indexOf('dưa') !== -1) { return 'cucumber'; }
    if (lower.indexOf('hương thảo') !== -1) { return 'rosemary'; }
    if (lower.indexOf('bạc hà') !== -1) { return 'mint'; }
    if (lower.indexOf('hành') !== -1) { return 'scallion'; }
    if (lower.indexOf('muống') !== -1) { return 'kangkong'; }
    if (category === 'Cây ăn quả') { return 'tomato'; }
    if (category === 'Gia vị & Thảo mộc') { return 'basil'; }
    return 'lettuce';
  }

  [
    [apName, apNameErr],
    [apCategory, apCategoryErr],
    [apWater, apWaterErr],
    [apMoisture, apMoistureErr]
  ].forEach(function (pair) {
    if (!pair[0]) { return; }
    pair[0].addEventListener('input', function () { UG.setFieldError(pair[0], pair[1], ''); });
    pair[0].addEventListener('change', function () { UG.setFieldError(pair[0], pair[1], ''); });
  });

  if (addPlantForm) {
    addPlantForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;

      const nameVal = apName.value.trim();
      if (!nameVal || !UG.REGEX.plantName.test(nameVal)) {
        UG.setFieldError(apName, apNameErr, 'Tên cây từ 2-60 ký tự hợp lệ (không chứa ký tự đặc biệt).');
        valid = false;
        firstInvalid = firstInvalid || apName;
      } else {
        UG.setFieldError(apName, apNameErr, '');
      }

      const catVal = apCategory.value;
      if (!catVal) {
        UG.setFieldError(apCategory, apCategoryErr, 'Vui lòng chọn nhóm cây trồng.');
        valid = false;
        firstInvalid = firstInvalid || apCategory;
      } else {
        UG.setFieldError(apCategory, apCategoryErr, '');
      }

      const waterDays = Number(apWater.value);
      if (!apWater.value || isNaN(waterDays) || waterDays < 1 || waterDays > 30) {
        UG.setFieldError(apWater, apWaterErr, 'Chu kỳ tưới phải từ 1 đến 30 ngày.');
        valid = false;
        firstInvalid = firstInvalid || apWater;
      } else {
        UG.setFieldError(apWater, apWaterErr, '');
      }

      const moistureVal = Number(apMoisture.value);
      if (apMoisture.value === '' || isNaN(moistureVal) || moistureVal < 0 || moistureVal > 100) {
        UG.setFieldError(apMoisture, apMoistureErr, 'Độ ẩm đất phải từ 0% đến 100%.');
        valid = false;
        firstInvalid = firstInvalid || apMoisture;
      } else {
        UG.setFieldError(apMoisture, apMoistureErr, '');
      }

      if (!valid) {
        if (firstInvalid) { firstInvalid.focus(); }
        return;
      }

      const iconKey = pickIcon(nameVal, catVal);
      const photo = Store.photo(iconKey);
      const nowIso = new Date().toISOString();
      const newPlant = {
        id: UG.newId('p-'),
        name: nameVal,
        scientificName: '',
        icon: iconKey,
        image: photo.src,
        imageSource: photo.source,
        category: catVal,
        location: apLocation.value || 'Ban công Đông',
        ageDays: 1,
        idealEnv: { temp: '20-30°C', light: '20,000 - 30,000 Lux', humidity: '60-75%' },
        moisture: Math.round(moistureVal),
        health: 92,
        waterIntervalDays: Math.round(waterDays),
        fertilizeIntervalDays: 14,
        lastWateredAt: nowIso,
        lastFertilizedAt: nowIso,
        sensor: null
      };

      data.gardenPlants.unshift(newPlant);
      if (!Store.save(data)) {
        data.gardenPlants.shift();
        UG.toast('Bộ nhớ trình duyệt đã đầy, không thể thêm cây.', true);
        return;
      }

      lastAddedPlantId = newPlant.id;
      if (filterSelect) { filterSelect.value = 'all'; }
      addPlantForm.reset();
      apWater.value = '2';
      apMoisture.value = '75';
      closeAddModal();
      render(true);
      UG.toast('Đã thêm "' + newPlant.name + '" vào khu vườn của bạn!');
    });
  }

  function fillSelects() {
    const opts = data.gardenPlants.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
    }).join('');
    ['pest-plant', 'market-plant'].forEach(function (sid) {
      const sel = document.getElementById(sid);
      if (!sel) { return; }
      const keep = sel.value;
      sel.innerHTML = opts || '<option value="">Chưa có cây</option>';
      if (keep) { sel.value = keep; }
    });
  }

  /* ---------- Tầm nhìn 1: Cảm biến độ ẩm & ánh sáng tự động ---------- */
  const autoBox = document.getElementById('auto-water');
  const sensorLog = document.getElementById('sensor-log');
  autoBox.checked = Boolean(data.settings && data.settings.autoWater);

  autoBox.addEventListener('change', function () {
    data.settings.autoWater = autoBox.checked;
    Store.save(data);
    UG.toast(autoBox.checked ? 'Đã bật tự động tưới khi độ ẩm dưới 40%.' : 'Đã tắt tự động tưới.');
  });

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  document.getElementById('sensor-run').addEventListener('click', function () {
    if (!data.gardenPlants.length) {
      UG.toast('Chưa có cây nào để đọc cảm biến.', true);
      return;
    }
    const now = new Date();
    const lines = [];

    data.gardenPlants.forEach(function (p) {
      p.moisture = Math.round(Math.max(12, Math.min(100, p.moisture - rand(6, 18))));
      p.sensor = {
        lightLux: Math.round(rand(8000, 52000) / 100) * 100,
        soilTemp: Math.round(rand(23, 33) * 10) / 10,
        updatedAt: now.toISOString()
      };
      let text = p.name + ': độ ẩm ' + p.moisture + '%, ánh sáng ' + p.sensor.lightLux.toLocaleString('vi-VN') + ' lux';
      if (p.moisture < 40) {
        if (autoBox.checked) {
          p.moisture = 100;
          p.lastWateredAt = now.toISOString();
          text += '. Đã tự động bơm tưới lên 100%.';
        } else {
          text += '. Độ ẩm thấp (< 40%), cần tưới.';
        }
      } else {
        text += '. Ổn định.';
      }
      lines.push('<li>' + esc(text) + '</li>');
    });

    data.telemetry = {
      stationId: '#HN-02',
      lightLux: Math.round(rand(22000, 38000) / 100) * 100,
      airHumidity: Math.round(rand(58, 76)),
      ambientTemp: Math.round(rand(24, 30) * 10) / 10,
      tankPercent: Math.max(25, (data.telemetry ? data.telemetry.tankPercent : 82) - (autoBox.checked ? 4 : 1)),
      tankLiters: '39/50L',
      updatedAt: now.toISOString()
    };

    if (!Store.save(data)) {
      UG.toast('Không lưu được dữ liệu cảm biến.', true);
      return;
    }
    sensorLog.innerHTML = lines.join('');
    syncTelemetryWidget();
    syncJsonDrawer();

    data.gardenPlants.forEach(function (p) {
      const cardEl = grid.querySelector('[data-plant="' + p.id + '"]');
      if (!cardEl) { return; }
      const rem = UG.calculateCareReminder(p, now);
      updateMeterInCard(cardEl, 'moisture', p.moisture);
      updateMeterInCard(cardEl, 'health', p.health);
      const badgeEl = cardEl.querySelector('[data-card-badge]');
      if (badgeEl) {
        const st = STATUS_META[rem.status] || STATUS_META.ok;
        badgeEl.className = 'status-badge ' + st.cls;
        badgeEl.textContent = st.text;
      }
    });

    updateSummaryHeader();
    UG.toast('Đã đồng bộ thông số Vi Môi Trường & cảm biến đất.');
  });

  /* ---------- Tầm nhìn 2: AI Nhận diện sâu bệnh qua ảnh ---------- */
  const DIAGNOSES = [
    { name: 'Lá khỏe mạnh', advice: 'Không phát hiện dấu hiệu sâu bệnh. Tiếp tục duy trì lịch chăm sóc.' },
    { name: 'Rệp muội', advice: 'Phun nước xà phòng loãng hoặc dịch tỏi ớt gừng vào sáng sớm.' },
    { name: 'Nấm phấn trắng', advice: 'Cắt lá bệnh, tăng thông thoáng và phun sữa tươi pha loãng 1:9.' },
    { name: 'Sâu ăn lá', advice: 'Bắt sâu thủ công lúc tối và phun chế phẩm Bt sinh học.' }
  ];
  const pestFile = document.getElementById('pest-file');
  const pestFileLabel = document.getElementById('pest-file-label');
  const pestPreview = document.getElementById('pest-preview');
  const pestResult = document.getElementById('pest-result');
  let previewUrl = null;

  pestFile.addEventListener('change', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    const f = pestFile.files && pestFile.files[0];
    if (f && /^image\//.test(f.type)) {
      previewUrl = URL.createObjectURL(f);
      pestPreview.src = previewUrl;
      pestPreview.hidden = false;
      if (pestFileLabel) { pestFileLabel.textContent = f.name; }
      pestResult.textContent = 'Ảnh đã sẵn sàng. Nhấn "Phân tích ảnh lá cây" để xem chẩn đoán.';
    } else {
      pestPreview.hidden = true;
      pestPreview.removeAttribute('src');
      if (pestFileLabel) { pestFileLabel.textContent = 'Chưa chọn ảnh (JPG, PNG, WebP)'; }
    }
  });

  document.getElementById('pest-run').addEventListener('click', function () {
    const f = pestFile.files && pestFile.files[0];
    if (!f || !/^image\//.test(f.type)) {
      pestResult.innerHTML = '<p class="field-error">Vui lòng chọn ảnh lá cây trước khi phân tích.</p>';
      return;
    }
    const sel = document.getElementById('pest-plant');
    const name = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'cây';
    const d = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)];
    const conf = Math.round(rand(78, 97));
    pestResult.innerHTML = '<p><strong>' + esc(d.name) + '</strong> trên ' + esc(name) + ' (' + conf + '% - mô phỏng AI): ' + esc(d.advice) + '</p>';
  });

  /* ---------- Tầm nhìn 3: Sàn trao đổi nông sản sạch ---------- */
  const marketList = document.getElementById('market-list');
  const marketForm = document.getElementById('market-form');
  const marketQty = document.getElementById('market-qty');
  const marketPrice = document.getElementById('market-price');
  const marketQtyErr = document.getElementById('market-qty-err');
  const marketPriceErr = document.getElementById('market-price-err');

  function renderMarket() {
    const list = data.marketListings;
    marketList.innerHTML = list.length ? list.map(function (m) {
      return '<li class="market-item">' +
        '<div class="market-item-info">' +
        '<strong>' + esc(m.product) + '</strong>' +
        '<span class="market-item-meta">' + esc(m.qty) + ' ' + esc(m.unit) + ' • ' + esc(m.seller) + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
        '<span class="market-price-tag">' + esc(Number(m.price).toLocaleString('vi-VN')) + ' đ/' + esc(m.unit) + '</span>' +
        (m.own ? '<button type="button" class="link-danger" data-market-remove="' + esc(m.id) + '">Gỡ</button>' : '') +
        '</div></li>';
    }).join('') : '<li class="section-sub">Chưa có tin đăng nào.</li>';
  }

  [
    [marketQty, marketQtyErr],
    [marketPrice, marketPriceErr]
  ].forEach(function (pair) {
    if (!pair[0]) { return; }
    pair[0].addEventListener('input', function () { UG.setFieldError(pair[0], pair[1], ''); });
  });

  marketForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const sel = document.getElementById('market-plant');
    const qty = parseFloat(marketQty.value);
    const price = parseInt(marketPrice.value, 10);
    let ok = true;

    if (isNaN(qty) || qty <= 0) {
      UG.setFieldError(marketQty, marketQtyErr, 'Số lượng phải > 0 kg.');
      ok = false;
    } else {
      UG.setFieldError(marketQty, marketQtyErr, '');
    }

    if (isNaN(price) || price < 1000) {
      UG.setFieldError(marketPrice, marketPriceErr, 'Giá bán tối thiểu 1.000 đ.');
      ok = false;
    } else {
      UG.setFieldError(marketPrice, marketPriceErr, '');
    }

    if (!ok || !sel.value) { return; }
    const plant = data.gardenPlants.filter(function (p) { return p.id === sel.value; })[0];
    if (!plant) { return; }

    data.marketListings.unshift({
      id: UG.newId('m-'),
      product: plant.name + ' sạch',
      qty: qty,
      unit: 'kg',
      price: price,
      seller: 'Vườn của tôi',
      own: true
    });

    if (!Store.save(data)) {
      UG.toast('Không lưu được tin đăng.', true);
      return;
    }
    renderMarket();
    syncJsonDrawer();
    UG.toast('Đã đăng bán ' + plant.name + ' sạch.');
  });

  marketList.addEventListener('click', function (e) {
    const id = e.target.getAttribute && e.target.getAttribute('data-market-remove');
    if (!id) { return; }
    data.marketListings = data.marketListings.filter(function (m) { return m.id !== id; });
    Store.save(data);
    renderMarket();
    syncJsonDrawer();
    UG.toast('Đã gỡ tin đăng nông sản.');
  });

  render(true);
})();

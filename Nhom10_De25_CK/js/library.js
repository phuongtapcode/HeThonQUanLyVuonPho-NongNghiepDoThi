/* ==========================================================================
   Sprint 2 — Trang Thư viện cây trồng (library.html — Stitch PlantLibrary)
   Tìm kiếm không dấu, lọc nhóm cây (bao gồm Thủy canh), Modal Xem kỹ thuật,
   giữ nguyên vị trí đặt cây đã chọn và thêm cây vào khu vườn (localStorage).
   ========================================================================== */
(function () {
  'use strict';

  const UG = window.UG;
  const Store = window.GardenStore;
  const esc = UG.esc;

  const grid = document.getElementById('library-grid');
  const countBox = document.getElementById('result-count');
  const searchInput = document.getElementById('search');
  const chips = document.querySelectorAll('.lib-chip');
  const guideModal = document.getElementById('guide-modal');
  const modalName = document.getElementById('modal-plant-name');
  const modalSci = document.getElementById('modal-scientific-name');
  const modalBody = document.getElementById('modal-guide-body');
  const modalAddBtn = document.getElementById('btn-modal-add');
  const closeGuideBtn = document.getElementById('btn-close-guide');

  const LOCATIONS = ['Ban công Đông', 'Sân thượng', 'Bệ cửa sổ'];
  const selectedLocations = {};
  let category = 'all';
  let activeGuideId = null;

  function fold(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  /* Tạo HTML thẻ thư viện khớp 1:1 Stitch PlantLibrary */
  function card(c, idx) {
    const photo = Store.photo(c.icon);
    const imgSrc = c.image || photo.src;
    const imgFallback = Store.art(c.icon, 3);
    const savedLoc = selectedLocations[c.id] || LOCATIONS[0];
    const locOpts = LOCATIONS.map(function (l) {
      return '<option value="' + esc(l) + '"' + (l === savedLoc ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
    const delay = (Math.min(idx || 0, 10) * 0.05).toFixed(2) + 's';

    return '<article class="library-card" style="--delay:' + delay + '" aria-labelledby="l-' + esc(c.id) + '">' +
      '<figure class="card-media">' +
      '<img src="' + esc(imgSrc) + '" width="640" height="420" loading="lazy" alt="Ảnh cây ' + esc(c.name) + '"' +
      ' onerror="this.onerror=null;this.src=\'' + imgFallback + '\'">' +
      '<div class="card-media-overlay" aria-hidden="true"></div>' +
      '<div class="media-top-row">' +
      '<span class="pill-category">' + esc(c.category) + '</span>' +
      '<span class="pill-age">' + esc(c.difficulty) + '</span>' +
      '</div>' +
      '<figcaption>' +
      '<h2 id="l-' + esc(c.id) + '">' + esc(c.name) + '</h2>' +
      (c.scientificName ? '<p class="sci-sub">' + esc(c.scientificName) + '</p>' : '') +
      '</figcaption>' +
      '</figure>' +
      '<div class="card-body">' +
      '<dl class="env-grid-2">' +
      '<div><dt>Thời gian thu hoạch:</dt><dd style="color:var(--primary)">' + esc(c.harvest) + '</dd></div>' +
      '<div><dt>Độ ẩm lý tưởng:</dt><dd style="color:var(--moisture)">' + esc(c.idealEnv.humidity) + '</dd></div>' +
      '</dl>' +
      '<div class="lib-details-list">' +
      '<p>☀️ <strong>Ánh sáng:</strong> ' + esc(c.light) + '</p>' +
      '<p>🪴 <strong>Chậu trồng:</strong> ' + esc(c.container || c.soil) + '</p>' +
      '</div>' +
      '<div class="lib-card-footer">' +
      '<select aria-label="Chọn vị trí đặt ' + esc(c.name) + '" id="loc-' + esc(c.id) + '" data-loc-id="' + esc(c.id) + '" style="padding:4px 8px;font-size:11.5px;">' + locOpts + '</select>' +
      '<div style="display:flex;gap:6px;">' +
      '<button type="button" class="btn btn-soft btn-sm" data-guide="' + esc(c.id) + '">Xem kỹ thuật</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-add="' + esc(c.id) + '">+ Thêm</button>' +
      '</div>' +
      '</div>' +
      '</div></article>';
  }

  function render() {
    const data = Store.load();
    const q = fold(searchInput.value.trim());
    const list = data.libraryCatalog.filter(function (c) {
      const matchCat = category === 'all' ||
        (category === 'hydro' ? Boolean(c.hydroCompatible) : c.category === category);
      const haystack = fold(c.name + ' ' + (c.scientificName || '') + ' ' + c.soil + ' ' + c.pests);
      return matchCat && (!q || haystack.indexOf(q) !== -1);
    });

    grid.innerHTML = list.length
      ? list.map(function (c, idx) { return card(c, idx); }).join('')
      : '<div class="empty-state">Không tìm thấy loại cây phù hợp. Hãy thử từ khóa khác như "cà chua", "xà lách", "húng quế"...</div>';

    countBox.textContent = 'Đang hiển thị ' + list.length + ' / ' + data.libraryCatalog.length + ' loại cây';
  }

  function addPlantToGarden(catalogId, locationOverride, triggerBtn) {
    const data = Store.load();
    const c = data.libraryCatalog.filter(function (x) { return x.id === catalogId; })[0];
    if (!c) { return; }

    const locSel = document.getElementById('loc-' + catalogId);
    const chosenLoc = locationOverride || (locSel ? locSel.value : LOCATIONS[0]);
    const plantName = UG.dedupePlantName(data.gardenPlants, c.name);
    const now = new Date().toISOString();
    const photo = Store.photo(c.icon);

    data.gardenPlants.push({
      id: UG.newId('p-'),
      name: plantName,
      scientificName: c.scientificName || '',
      icon: c.icon,
      image: c.image || photo.src,
      imageSource: c.imageSource || photo.source,
      category: c.category,
      location: chosenLoc,
      ageDays: 1,
      idealEnv: { temp: c.idealEnv.temp, light: c.idealEnv.light, humidity: c.idealEnv.humidity },
      moisture: 75,
      health: 92,
      waterIntervalDays: c.waterIntervalDays,
      fertilizeIntervalDays: c.fertilizeIntervalDays,
      lastWateredAt: now,
      lastFertilizedAt: now,
      sensor: null
    });

    if (Store.save(data)) {
      if (triggerBtn) {
        triggerBtn.classList.add('is-confirmed');
        triggerBtn.textContent = '✓ Đã thêm';
        setTimeout(function () {
          triggerBtn.classList.remove('is-confirmed');
          triggerBtn.textContent = '+ Thêm';
        }, 2000);
      }
      UG.toast('Đã thêm "' + plantName + '" (' + chosenLoc + ') vào khu vườn của bạn!');
    } else {
      UG.toast('Bộ nhớ trình duyệt đã đầy, không lưu được.', true);
    }
  }

  function openGuide(catalogId) {
    const data = Store.load();
    const item = data.libraryCatalog.filter(function (x) { return x.id === catalogId; })[0];
    if (!item || !guideModal) { return; }
    activeGuideId = item.id;

    modalName.textContent = item.name;
    modalSci.textContent = (item.scientificName || '') + ' • Nguồn ảnh: ' + (item.imageSource || Store.photo(item.icon).source);
    modalBody.innerHTML =
      '<div class="guide-stats-3">' +
      '<div class="guide-stat"><span>Vòng đời sinh trưởng</span><strong>' + esc(item.harvest) + '</strong></div>' +
      '<div class="guide-stat"><span>Độ ẩm rễ lý tưởng</span><strong style="color:var(--moisture)">' + esc(item.idealEnv.humidity) + '</strong></div>' +
      '<div class="guide-stat"><span>Nhiệt độ tối ưu</span><strong style="color:var(--sunlight)">' + esc(item.idealEnv.temp) + '</strong></div>' +
      '</div>' +
      '<div style="display:grid;gap:10px;font-size:12.5px;">' +
      '<div><strong>Chuẩn bị đất &amp; giá thể đô thị:</strong><p class="section-sub" style="background:var(--surface-container-low);padding:8px 10px;border-radius:8px;margin-top:4px;">' + esc(item.container || '') + ' — ' + esc(item.soil) + '</p></div>' +
      '<div><strong>Kỹ thuật tưới nước &amp; bón phân:</strong><p class="section-sub" style="background:var(--surface-container-low);padding:8px 10px;border-radius:8px;margin-top:4px;">' + esc(item.water) + ' Bón phân hữu cơ mỗi ' + esc(item.fertilizeIntervalDays) + ' ngày.</p></div>' +
      '<div><strong>Phòng trừ sâu bệnh sinh học:</strong><p class="section-sub" style="background:var(--surface-container-low);padding:8px 10px;border-radius:8px;margin-top:4px;">' + esc(item.pests) + '</p></div>' +
      '</div>';

    if (typeof guideModal.showModal === 'function') {
      if (!guideModal.open) { guideModal.showModal(); }
    } else {
      guideModal.setAttribute('open', '');
    }
  }

  searchInput.addEventListener('input', render);
  document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
  });

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      category = chip.getAttribute('data-cat');
      Array.prototype.forEach.call(chips, function (c) {
        const active = c === chip;
        c.classList.toggle('active', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render();
    });
  });

  grid.addEventListener('change', function (e) {
    const locId = e.target && e.target.getAttribute ? e.target.getAttribute('data-loc-id') : null;
    if (locId) {
      selectedLocations[locId] = e.target.value;
    }
  });

  grid.addEventListener('click', function (e) {
    const guideBtn = e.target.closest ? e.target.closest('[data-guide]') : null;
    if (guideBtn) {
      openGuide(guideBtn.getAttribute('data-guide'));
      return;
    }
    const addBtn = e.target.closest ? e.target.closest('[data-add]') : null;
    if (addBtn) {
      addPlantToGarden(addBtn.getAttribute('data-add'), null, addBtn);
    }
  });

  if (closeGuideBtn && guideModal) {
    closeGuideBtn.addEventListener('click', function () {
      if (typeof guideModal.close === 'function') { guideModal.close(); } else { guideModal.removeAttribute('open'); }
    });
    guideModal.addEventListener('click', function (e) {
      if (e.target === guideModal) {
        if (typeof guideModal.close === 'function') { guideModal.close(); } else { guideModal.removeAttribute('open'); }
      }
    });
  }

  if (modalAddBtn && guideModal) {
    modalAddBtn.addEventListener('click', function () {
      if (activeGuideId) {
        addPlantToGarden(activeGuideId, selectedLocations[activeGuideId] || LOCATIONS[0], null);
      }
      if (typeof guideModal.close === 'function') { guideModal.close(); } else { guideModal.removeAttribute('open'); }
    });
  }

  const advisorBtn = document.getElementById('btn-quick-ask');
  if (advisorBtn) {
    advisorBtn.addEventListener('click', function () {
      UG.toast('Cố vấn Urban Flora: Ban công hướng Đông (4-6h nắng sáng) rất hợp Cà chua bi và Xà lách!');
    });
  }

  const scanBtn = document.getElementById('btn-scan-pest');
  const scanOut = document.getElementById('pest-quick-result');
  if (scanBtn && scanOut) {
    scanBtn.addEventListener('click', function () {
      scanOut.hidden = false;
      scanOut.textContent = 'AI Computer Vision quét mẫu: Không phát hiện nấm phấn trắng hay rệp sáp. Duy trì phun phòng tỏi ớt gừng mỗi 10 ngày.';
      UG.toast('Đã hoàn tất quét thử mẫu sâu bệnh.');
    });
  }

  render();
})();

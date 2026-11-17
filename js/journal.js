/* ==========================================================================
   Sprint 2 — Trang Nhật ký tăng trưởng (journal.html — Stitch GrowthJournal)
   Timeline ::before / ::after + pulsing node, lọc cây, sắp xếp Mới/Cũ,
   Modal Thêm ghi chú mới với Form Validation + Regex & nén ảnh Upload.
   ========================================================================== */
(function () {
  'use strict';

  const UG = window.UG;
  const Store = window.GardenStore;
  const esc = UG.esc;

  const modal = document.getElementById('journal-modal');
  const openModalBtn = document.getElementById('btn-open-journal-modal');
  const closeModalBtn = document.getElementById('btn-close-journal-modal');
  const cancelEntryBtn = document.getElementById('btn-cancel-entry');

  const form = document.getElementById('journal-form');
  const plantSel = document.getElementById('j-plant');
  const dateIn = document.getElementById('j-date');
  const stageSel = document.getElementById('j-stage');
  const heightIn = document.getElementById('j-height');
  const moistureIn = document.getElementById('j-moisture');
  const titleIn = document.getElementById('j-title');
  const noteIn = document.getElementById('j-note');
  const fileIn = document.getElementById('j-file');
  const preview = document.getElementById('j-preview');
  const errBox = document.getElementById('j-error');
  const filterSel = document.getElementById('j-filter');
  const sortBtn = document.getElementById('btn-sort-timeline');
  const sortLabel = document.getElementById('sort-order-label');
  const totalStat = document.getElementById('total-entries-stat');
  const timeline = document.getElementById('timeline');

  const plantErr = document.getElementById('j-plant-err');
  const dateErr = document.getElementById('j-date-err');
  const stageErr = document.getElementById('j-stage-err');
  const heightErr = document.getElementById('j-height-err');
  const moistureErr = document.getElementById('j-moisture-err');
  const titleErr = document.getElementById('j-title-err');
  const noteErr = document.getElementById('j-note-err');
  const fileErr = document.getElementById('j-file-err');

  const data = Store.load();
  const MAX_SIDE = 800;
  let lastAddedEntryId = null;
  let sortDesc = true;

  function today() {
    const d = new Date();
    function p(v) { return (v < 10 ? '0' : '') + v; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function showError(msg) {
    if (!errBox) { return; }
    errBox.textContent = msg;
    errBox.hidden = !msg;
  }

  function openModal() {
    if (!modal) { return; }
    if (typeof modal.showModal === 'function') {
      if (!modal.open) { modal.showModal(); }
    } else {
      modal.setAttribute('open', '');
    }
  }

  function closeModal() {
    if (!modal) { return; }
    if (typeof modal.close === 'function') { modal.close(); } else { modal.removeAttribute('open'); }
  }

  if (openModalBtn) { openModalBtn.addEventListener('click', openModal); }
  if (closeModalBtn) { closeModalBtn.addEventListener('click', closeModal); }
  if (cancelEntryBtn) { cancelEntryBtn.addEventListener('click', closeModal); }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) { closeModal(); }
    });
  }

  function fillPlantSelect() {
    plantSel.innerHTML = data.gardenPlants.length
      ? data.gardenPlants.map(function (p) {
          return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
        }).join('')
      : '<option value="">Chưa có cây trong vườn</option>';

    let wanted = null;
    try {
      wanted = new URLSearchParams(window.location.search).get('plant');
    } catch (e) {
      wanted = null;
    }
    if (wanted && data.gardenPlants.some(function (p) { return p.id === wanted; })) {
      plantSel.value = wanted;
      filterSel.setAttribute('data-initial', wanted);
    }
  }

  function fillFilter(selected) {
    const map = {};
    data.gardenPlants.forEach(function (p) { map[p.id] = p.name; });
    data.growthJournal.forEach(function (j) {
      if (!map[j.plantId]) { map[j.plantId] = j.plantName; }
    });
    let html = '<option value="all">Tất cả các cây</option>';
    Object.keys(map).forEach(function (id) {
      html += '<option value="' + esc(id) + '">' + esc(map[id]) + '</option>';
    });
    filterSel.innerHTML = html;
    filterSel.value = selected && map[selected] ? selected : 'all';
  }

  /* Render Timeline theo cấu trúc Stitch GrowthJournal */
  function render() {
    const f = filterSel.value;
    const list = data.growthJournal.filter(function (j) {
      return f === 'all' || j.plantId === f;
    });

    list.sort(function (a, b) {
      if (a.date !== b.date) {
        return sortDesc ? (a.date < b.date ? 1 : -1) : (a.date > b.date ? 1 : -1);
      }
      const idxDiff = data.growthJournal.indexOf(b) - data.growthJournal.indexOf(a);
      return sortDesc ? idxDiff : -idxDiff;
    });

    if (totalStat) {
      totalStat.textContent = String(list.length);
    }

    if (!list.length) {
      timeline.innerHTML = '<li class="empty-state">Chưa có nhật ký cho cây này. Hãy bấm "+ Thêm ghi chú mới" trên thanh điều hướng.</li>';
      return;
    }

    timeline.innerHTML = list.map(function (j, idx) {
      const delay = (Math.min(idx, 10) * 0.06).toFixed(2) + 's';
      const newClass = j.id === lastAddedEntryId ? ' entry-new' : '';
      const fallbackImg = Store.art('basil', 2);

      return '<li class="timeline-item' + newClass + '" style="--delay:' + delay + '">' +
        '<article class="journal-entry-card" aria-label="' + esc(j.plantName + ', ' + UG.formatDate(j.date)) + '">' +
        '<div class="entry-thumb">' +
        '<img src="' + esc(j.imageDataUrl) + '" width="192" height="144" loading="lazy"' +
        ' alt="Ảnh ' + esc(j.plantName) + ' giai đoạn ' + esc(j.stage.toLowerCase()) + '"' +
        ' onerror="this.onerror=null;this.src=\'' + fallbackImg + '\'">' +
        '</div>' +
        '<div class="entry-main">' +
        '<div class="entry-meta-top">' +
        '<div class="entry-badges">' +
        '<span class="count-pill">' + esc(j.plantName) + '</span>' +
        '<span class="pill-age" style="background:var(--surface-container-low);color:var(--secondary);border:1px solid var(--outline-subtle);">Giai đoạn: ' + esc(j.stage) + '</span>' +
        '</div>' +
        '<time class="mono-code" datetime="' + esc(j.date) + '">📅 ' + esc(UG.formatDate(j.date)) + '</time>' +
        '</div>' +
        (j.title ? '<h3 style="font-size:17px;">' + esc(j.title) + '</h3>' : '') +
        '<p class="section-sub" style="line-height:1.55;">' + esc(j.note) + '</p>' +
        '<div class="entry-metrics-row">' +
        '<div style="display:flex;flex-wrap:wrap;gap:14px;">' +
        '<span>📏 Cao: <strong>' + esc(j.heightCm || 20) + ' cm</strong></span>' +
        '<span>💧 Độ ẩm đất lúc ghi: <strong>' + esc(j.moisture !== undefined ? j.moisture : 65) + '%</strong></span>' +
        '<span class="text-success">✓ Trạng thái: <strong>Tốt</strong></span>' +
        '</div>' +
        '<button type="button" class="link-danger" data-del="' + esc(j.id) + '">Xóa nhật ký</button>' +
        '</div></div></article></li>';
    }).join('');
  }

  function readImage(file, done) {
    const reader = new FileReader();
    reader.onerror = function () { done(null, 'Không đọc được file ảnh.'); };
    reader.onload = function () {
      const img = new Image();
      img.onerror = function () { done(null, 'File đã chọn không phải ảnh hợp lệ.'); };
      img.onload = function () {
        const ratio = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  [
    [plantSel, plantErr],
    [dateIn, dateErr],
    [stageSel, stageErr],
    [heightIn, heightErr],
    [moistureIn, moistureErr],
    [titleIn, titleErr],
    [noteIn, noteErr]
  ].forEach(function (pair) {
    if (!pair[0]) { return; }
    pair[0].addEventListener('input', function () {
      UG.setFieldError(pair[0], pair[1], '');
      showError('');
    });
    pair[0].addEventListener('change', function () {
      UG.setFieldError(pair[0], pair[1], '');
      showError('');
    });
  });

  let previewUrl = null;
  fileIn.addEventListener('change', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    const f = fileIn.files && fileIn.files[0];
    if (f && /^image\//.test(f.type)) {
      previewUrl = URL.createObjectURL(f);
      preview.src = previewUrl;
      preview.hidden = false;
      UG.setFieldError(fileIn, fileErr, '');
      showError('');
    } else {
      preview.hidden = true;
      preview.removeAttribute('src');
      if (f) {
        UG.setFieldError(fileIn, fileErr, 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP).');
        fileIn.value = '';
      }
    }
  });

  function saveEntry(plant, imageUrl, imageSource) {
    const entry = {
      id: UG.newId('j-'),
      plantId: plant.id,
      plantName: plant.name,
      date: dateIn.value,
      stage: stageSel.value,
      heightCm: heightIn && heightIn.value ? Math.round(Number(heightIn.value)) : 20,
      moisture: moistureIn && moistureIn.value !== '' ? Math.round(Number(moistureIn.value)) : plant.moisture,
      title: titleIn ? titleIn.value.trim() : '',
      note: noteIn.value.trim(),
      imageDataUrl: imageUrl,
      imageSource: imageSource
    };
    data.growthJournal.push(entry);
    if (!Store.save(data)) {
      data.growthJournal.pop();
      showError('Bộ nhớ trình duyệt đã đầy, không lưu được. Hãy xóa bớt nhật ký cũ hoặc chọn ảnh nhỏ hơn.');
      return;
    }
    lastAddedEntryId = entry.id;
    if (titleIn) { titleIn.value = ''; }
    noteIn.value = '';
    fileIn.value = '';
    preview.hidden = true;
    preview.removeAttribute('src');
    showError('');
    const nextFilter = (!filterSel.value || filterSel.value === 'all') ? 'all' : plant.id;
    fillFilter(nextFilter);
    closeModal();
    render();
    UG.toast('Đã lưu mốc nhật ký mới cho ' + plant.name + '.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;
    let firstInvalid = null;

    const plant = data.gardenPlants.filter(function (p) { return p.id === plantSel.value; })[0];
    if (!plant) {
      UG.setFieldError(plantSel, plantErr, 'Vui lòng chọn cây trồng.');
      valid = false;
      firstInvalid = firstInvalid || plantSel;
    } else {
      UG.setFieldError(plantSel, plantErr, '');
    }

    if (!dateIn.value || !UG.REGEX.dateIso.test(dateIn.value)) {
      UG.setFieldError(dateIn, dateErr, 'Vui lòng chọn ngày ghi nhận hợp lệ (YYYY-MM-DD).');
      valid = false;
      firstInvalid = firstInvalid || dateIn;
    } else if (dateIn.value > today()) {
      UG.setFieldError(dateIn, dateErr, 'Ngày ghi nhận không được vượt quá hôm nay.');
      valid = false;
      firstInvalid = firstInvalid || dateIn;
    } else {
      UG.setFieldError(dateIn, dateErr, '');
    }

    if (!stageSel.value) {
      UG.setFieldError(stageSel, stageErr, 'Vui lòng chọn giai đoạn phát triển.');
      valid = false;
      firstInvalid = firstInvalid || stageSel;
    } else {
      UG.setFieldError(stageSel, stageErr, '');
    }

    if (heightIn && heightIn.value !== '') {
      const hVal = Number(heightIn.value);
      if (isNaN(hVal) || hVal < 1 || hVal > 300) {
        UG.setFieldError(heightIn, heightErr, 'Chiều cao phải từ 1 đến 300 cm.');
        valid = false;
        firstInvalid = firstInvalid || heightIn;
      } else {
        UG.setFieldError(heightIn, heightErr, '');
      }
    }

    if (moistureIn && moistureIn.value !== '') {
      const mVal = Number(moistureIn.value);
      if (isNaN(mVal) || mVal < 0 || mVal > 100) {
        UG.setFieldError(moistureIn, moistureErr, 'Độ ẩm phải nằm trong khoảng 0% - 100%.');
        valid = false;
        firstInvalid = firstInvalid || moistureIn;
      } else {
        UG.setFieldError(moistureIn, moistureErr, '');
      }
    }

    if (titleIn) {
      const titleVal = titleIn.value.trim();
      if (!titleVal || !UG.REGEX.titleText.test(titleVal)) {
        UG.setFieldError(titleIn, titleErr, 'Tiêu đề quan sát từ 4-120 ký tự hợp lệ.');
        valid = false;
        firstInvalid = firstInvalid || titleIn;
      } else {
        UG.setFieldError(titleIn, titleErr, '');
      }
    }

    const noteVal = noteIn.value.trim();
    if (!noteVal) {
      UG.setFieldError(noteIn, noteErr, 'Vui lòng nhập nội dung ghi chú chăm sóc.');
      valid = false;
      firstInvalid = firstInvalid || noteIn;
    } else if (noteVal.length < 5) {
      UG.setFieldError(noteIn, noteErr, 'Nội dung ghi chú quá ngắn (tối thiểu 5 ký tự).');
      valid = false;
      firstInvalid = firstInvalid || noteIn;
    } else {
      UG.setFieldError(noteIn, noteErr, '');
    }

    if (!valid) {
      if (firstInvalid) { firstInvalid.focus(); }
      return;
    }

    const file = fileIn.files && fileIn.files[0];
    if (file) {
      readImage(file, function (url, err) {
        if (!url) {
          UG.setFieldError(fileIn, fileErr, err);
          return;
        }
        saveEntry(plant, url, 'Ảnh tải lên từ thiết bị');
      });
    } else {
      const photo = Store.photo(plant.icon);
      saveEntry(plant, plant.image || photo.src, plant.imageSource || photo.source);
    }
  });

  timeline.addEventListener('click', function (e) {
    const id = e.target.getAttribute && e.target.getAttribute('data-del');
    if (!id) { return; }
    if (!window.confirm('Xóa mốc nhật ký này khỏi dòng thời gian?')) { return; }
    data.growthJournal = data.growthJournal.filter(function (j) { return j.id !== id; });
    Store.save(data);
    fillFilter(filterSel.value);
    render();
    UG.toast('Đã xóa mốc nhật ký.');
  });

  filterSel.addEventListener('change', render);

  if (sortBtn && sortLabel) {
    sortBtn.addEventListener('click', function () {
      sortDesc = !sortDesc;
      sortLabel.textContent = sortDesc ? 'Mới nhất trước' : 'Cũ nhất trước';
      render();
    });
  }

  dateIn.value = today();
  dateIn.max = today();
  fillPlantSelect();
  fillFilter(filterSel.getAttribute('data-initial'));
  render();
})();

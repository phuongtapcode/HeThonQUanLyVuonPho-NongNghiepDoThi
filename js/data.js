/* ==========================================================================
   Sprint 1 — Data Contract & Quản lý Lưu trữ (Module GardenStore)
   Nạp trực tiếp qua thẻ <script> để chạy mượt offline (file://), kết hợp
   đồng bộ với localStorage và cấu trúc chuẩn trong data/plants.json.
   ========================================================================== */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'urban_garden_v2';
  const THEME_KEY = 'urban_garden_theme';
  const DAY = 86400000;
  const HOUR = 3600000;

  /* Danh mục hình SVG dự phòng nếu ảnh WebP bị lỗi hoặc thiếu kết nối */
  const ART = {
    tomato:     { bg: '#FBE9E1', leaf: '#2F7D4E', dark: '#1F5A37', fruit: '#D6402D', kind: 'fruit' },
    chili:      { bg: '#FBEBDD', leaf: '#3A8250', dark: '#25593A', fruit: '#C8281E', kind: 'fruit' },
    strawberry: { bg: '#FBE8EC', leaf: '#3C8750', dark: '#27603A', fruit: '#D8324F', kind: 'fruit' },
    cucumber:   { bg: '#EAF3E2', leaf: '#3F8E4A', dark: '#2A6434', fruit: '#5FA83C', kind: 'fruit' },
    basil:      { bg: '#E7F2E6', leaf: '#2E8B57', dark: '#1F6340', fruit: '#B79AD9', kind: 'herb' },
    rosemary:   { bg: '#E8EFEA', leaf: '#4F7F63', dark: '#365A45', fruit: '#8FA9E0', kind: 'herb' },
    mint:       { bg: '#E3F3EC', leaf: '#33936B', dark: '#226A4B', fruit: '#C7B3E6', kind: 'herb' },
    scallion:   { bg: '#EDF4E3', leaf: '#5FA046', dark: '#3F7430', fruit: '#F2F2F2', kind: 'herb' },
    lettuce:    { bg: '#EAF5E0', leaf: '#6DB44C', dark: '#47862F', fruit: '#9BD36F', kind: 'leafy' },
    kangkong:   { bg: '#E2F1E4', leaf: '#3E9A5B', dark: '#2A703F', fruit: '#9BD36F', kind: 'leafy' }
  };

  /* Bản đồ ảnh WebP thực tế (nén từ Wikimedia Commons CC BY-SA & Google Stitch) */
  const REAL_PHOTOS = {
    tomato: {
      src: 'images/cherry-tomato.webp',
      source: 'Wikimedia Commons — File:Cherry_Tomato.JPG (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cherry_Tomato.JPG'
    },
    basil: {
      src: 'images/sweet-basil.webp',
      source: 'Wikimedia Commons — File:Sweet_Basil_(Ocimum_basilicum).jpg (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sweet_Basil_(Ocimum_basilicum).jpg'
    },
    lettuce: {
      src: 'images/crisp-lettuce.webp',
      source: 'Wikimedia Commons — File:Lactuca_sativa_01.JPG (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lactuca_sativa_01.JPG'
    },
    chili: {
      src: 'images/chili-plant.webp',
      source: 'Wikimedia Commons — File:Chilli_pepper_plant.jpg (CC BY 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chilli_pepper_plant.jpg'
    },
    rosemary: {
      src: 'images/rosemary.webp',
      source: 'Wikimedia Commons — File:Rosemary_Plant.jpg (CC BY-SA 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rosemary_Plant.jpg'
    },
    strawberry: {
      src: 'images/strawberry-pot.webp',
      source: 'Wikimedia Commons — File:Strawberries_in_a_pot_for_home-growing.jpg (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Strawberries_in_a_pot_for_home-growing.jpg'
    },
    mint: {
      src: 'images/mint-herb.webp',
      source: 'Wikimedia Commons — File:Mentha_Spicata.jpg (CC BY 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mentha_Spicata.jpg'
    },
    scallion: {
      src: 'images/scallion.webp',
      source: 'Wikimedia Commons — File:Welsh_onion.jpg (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Welsh_onion.jpg'
    },
    kangkong: {
      src: 'images/water-spinach.webp',
      source: 'Wikimedia Commons — File:Ipomoea_aquatica_(2).JPG (CC BY-SA 3.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ipomoea_aquatica_(2).JPG'
    },
    cucumber: {
      src: 'images/cucumber.webp',
      source: 'Wikimedia Commons — File:Cucurbitales_-_Cucumis_sativus_1.jpg (CC BY-SA 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cucurbitales_-_Cucumis_sativus_1.jpg'
    },
    hero: {
      src: 'images/balcony-hero.webp',
      source: 'Google Stitch — Urban Flora Project Showcase',
      sourceUrl: 'https://stitch.withgoogle.com'
    },
    terrace: {
      src: 'images/balcony-terrace.webp',
      source: 'Wikimedia Commons — File:20140611_Pomodoro_Terrazza_7.jpg (CC BY-SA 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:20140611_Pomodoro_Terrazza_7.jpg'
    }
  };

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  /* Tạo hình SVG dự phòng (sử dụng khi ảnh WebP không tải được) */
  function artSvg(icon, stage) {
    const a = ART[icon] || ART.basil;
    let st = stage;
    if (st === undefined || st === null || st > 3) { st = 3; }
    if (st < 0) { st = 0; }

    const cx = 160;
    const by = 134;
    const count = [2, 4, 6, 9][st];
    const size = [18, 26, 32, 36][st];
    const base = [26, 40, 50, 58][st];

    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">';
    s += '<rect width="320" height="200" fill="' + a.bg + '"/>';
    s += '<circle cx="270" cy="38" r="20" fill="#FFE9A8" opacity=".85"/>';
    s += '<rect y="172" width="320" height="28" fill="#000" opacity=".06"/>';

    for (let i = 0; i < count; i++) {
      const ang = count === 1 ? 0 : -64 + i * (128 / (count - 1));
      const len = base * (0.78 + (i % 3) * 0.13);
      s += '<g transform="rotate(' + round1(ang) + ' ' + cx + ' ' + by + ')">' +
        '<line x1="' + cx + '" y1="' + by + '" x2="' + cx + '" y2="' + round1(by - len) + '" stroke="' + a.dark + '" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="' + cx + '" cy="' + round1(by - len) + '" rx="' + round1(size * 0.42) + '" ry="' + round1(size * 0.7) + '" fill="' + a.leaf + '"/></g>';
    }

    s += '<path d="M118 140h84l-11 38h-62z" fill="#B5683B"/>';
    s += '<rect x="112" y="132" width="96" height="12" rx="3" fill="#C97B4B"/>';
    s += '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* Lấy thông tin ảnh WebP thật theo loại cây */
  function getPhoto(icon) {
    return REAL_PHOTOS[icon] || REAL_PHOTOS.basil;
  }

  const STAGES = ['Nảy mầm', 'Ra lá', 'Ra hoa', 'Thu hoạch'];

  function isoAgo(ms) {
    return new Date(Date.now() - ms).toISOString();
  }

  function pad2(v) {
    return (v < 10 ? '0' : '') + v;
  }

  function dateAgo(days) {
    const d = new Date(Date.now() - days * DAY);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* Khởi tạo bộ dữ liệu mẫu mặc định theo cấu trúc Stitch Urban Flora */
  function buildDefault() {
    const garden = [
      {
        id: 'p-cachua',
        name: 'Cà chua bi Cherry',
        scientificName: 'Solanum lycopersicum',
        icon: 'tomato',
        image: getPhoto('tomato').src,
        imageSource: getPhoto('tomato').source,
        category: 'Cây ăn quả',
        location: 'Chậu thông minh A1 • Sân thượng',
        ageDays: 45,
        idealEnv: { temp: '20-30°C', light: '25,000 - 35,000 Lux', humidity: '60-70%' },
        moisture: 58,
        health: 92,
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14,
        lastWateredAt: isoAgo(1 * DAY),
        lastFertilizedAt: isoAgo(6 * DAY),
        sensor: null
      },
      {
        id: 'p-hungque',
        name: 'Húng quế Tây',
        scientificName: 'Ocimum basilicum',
        icon: 'basil',
        image: getPhoto('basil').src,
        imageSource: getPhoto('basil').source,
        category: 'Gia vị & Thảo mộc',
        location: 'Bệ cửa sổ bếp • Ban công',
        ageDays: 35,
        idealEnv: { temp: '22-30°C', light: '20,000 - 30,000 Lux', humidity: '55-70%' },
        moisture: 28,
        health: 74,
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14,
        lastWateredAt: isoAgo(3 * DAY),
        lastFertilizedAt: isoAgo(10 * DAY),
        sensor: null
      },
      {
        id: 'p-xalach',
        name: 'Xà lách thủy canh',
        scientificName: 'Lactuca sativa',
        icon: 'lettuce',
        image: getPhoto('lettuce').src,
        imageSource: getPhoto('lettuce').source,
        category: 'Rau ăn lá',
        location: 'Giàn hồi lưu • Cửa sổ',
        ageDays: 28,
        idealEnv: { temp: '18-24°C', light: '15,000 - 20,000 Lux', humidity: '70-85%' },
        moisture: 88,
        health: 96,
        waterIntervalDays: 1,
        fertilizeIntervalDays: 10,
        lastWateredAt: isoAgo(8 * HOUR),
        lastFertilizedAt: isoAgo(5 * DAY),
        sensor: null
      },
      {
        id: 'p-otxiem',
        name: 'Ớt xiêm đô thị',
        scientificName: 'Capsicum annuum',
        icon: 'chili',
        image: getPhoto('chili').src,
        imageSource: getPhoto('chili').source,
        category: 'Cây ăn quả',
        location: 'Thùng cải tiến • Sân thượng',
        ageDays: 52,
        idealEnv: { temp: '24-32°C', light: '30,000 - 45,000 Lux', humidity: '50-68%' },
        moisture: 48,
        health: 84,
        waterIntervalDays: 3,
        fertilizeIntervalDays: 14,
        lastWateredAt: isoAgo(3 * DAY - 2 * HOUR),
        lastFertilizedAt: isoAgo(15 * DAY),
        sensor: null
      },
      {
        id: 'p-huongthao',
        name: 'Hương thảo',
        scientificName: 'Salvia rosmarinus',
        icon: 'rosemary',
        image: getPhoto('rosemary').src,
        imageSource: getPhoto('rosemary').source,
        category: 'Gia vị & Thảo mộc',
        location: 'Chậu đất nung • Ban công',
        ageDays: 68,
        idealEnv: { temp: '15-25°C', light: '22,000 - 32,000 Lux', humidity: '40-60%' },
        moisture: 55,
        health: 91,
        waterIntervalDays: 4,
        fertilizeIntervalDays: 30,
        lastWateredAt: isoAgo(2 * DAY),
        lastFertilizedAt: isoAgo(12 * DAY),
        sensor: null
      },
      {
        id: 'p-dautay',
        name: 'Dâu tây Nhật',
        scientificName: 'Fragaria × ananassa',
        icon: 'strawberry',
        image: getPhoto('strawberry').src,
        imageSource: getPhoto('strawberry').source,
        category: 'Cây ăn quả',
        location: 'Chậu treo tường xanh • Ban công',
        ageDays: 60,
        idealEnv: { temp: '16-22°C', light: '22,000 - 28,000 Lux', humidity: '60-75%' },
        moisture: 33,
        health: 66,
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14,
        lastWateredAt: isoAgo(2 * DAY + 3 * HOUR),
        lastFertilizedAt: isoAgo(5 * DAY),
        sensor: null
      }
    ];

    const catalog = [
      {
        id: 'c-cachua',
        name: 'Cà chua bi Cherry',
        scientificName: 'Solanum lycopersicum',
        icon: 'tomato',
        image: getPhoto('tomato').src,
        imageSource: getPhoto('tomato').source,
        category: 'Cây ăn quả',
        hydroCompatible: true,
        difficulty: 'Trung bình',
        idealEnv: { temp: '20-30°C', light: '6-8 giờ nắng/ngày', humidity: '60-75%' },
        container: 'Chậu composite 15-20L có lỗ thoát nước đáy',
        soil: 'Giá thể xơ dừa ủ hoai + phân trùn quế + đá Perlite (4:4:2), chậu sâu tối thiểu 30 cm.',
        light: 'Cần nắng trực tiếp 6-8 giờ (25,000 - 35,000 Lux); đặt nơi thoáng gió hạn chế nấm.',
        water: 'Tưới 2 ngày/lần vào sáng sớm, tưới gốc tránh ướt lá.',
        pests: 'Phun dung dịch tỏi ớt gừng hoặc dầu neem định kỳ 10 ngày để ngừa bọ trĩ và phấn trắng.',
        harvest: '60-80 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14
      },
      {
        id: 'c-hungque',
        name: 'Húng quế Tây',
        scientificName: 'Ocimum basilicum',
        icon: 'basil',
        image: getPhoto('basil').src,
        imageSource: getPhoto('basil').source,
        category: 'Gia vị & Thảo mộc',
        hydroCompatible: true,
        difficulty: 'Dễ',
        idealEnv: { temp: '22-30°C', light: '5-6 giờ nắng/ngày', humidity: '55-70%' },
        container: 'Chậu đất nung đường kính 20 cm',
        soil: 'Đất thịt nhẹ thoát nước tốt, giàu mùn lá mục, pH 6.0-7.0.',
        light: 'Nắng vừa đến nắng sáng (20,000 - 30,000 Lux), tránh nắng gắt trưa hè.',
        water: 'Giữ ẩm đều, tưới 2 ngày/lần; không để đọng nước ở đáy chậu.',
        pests: 'Ngắt ngọn thường xuyên để kích thích đẻ nhánh; mùi tinh dầu giúp xua ruồi muỗi.',
        harvest: '30-45 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14
      },
      {
        id: 'c-xalach',
        name: 'Xà lách thủy canh',
        scientificName: 'Lactuca sativa',
        icon: 'lettuce',
        image: getPhoto('lettuce').src,
        imageSource: getPhoto('lettuce').source,
        category: 'Rau ăn lá',
        hydroCompatible: true,
        difficulty: 'Dễ',
        idealEnv: { temp: '18-24°C', light: '4-5 giờ ánh sáng/ngày', humidity: '70-85%' },
        container: 'Khay xốp nông 15 cm hoặc ống PVC thủy canh',
        soil: 'Giá thể xơ dừa xử lý chát hoặc mút xốp thủy canh (PPM 600-800).',
        light: 'Ánh sáng tán xạ (15,000 - 20,000 Lux), tránh nắng chiều gắt làm lá đắng.',
        water: 'Kiểm tra độ ẩm hoặc mực nước mỗi ngày, thay dung dịch mỗi 10 ngày.',
        pests: 'Che lưới chắn côn trùng, kiểm tra mặt dưới lá và dùng bẫy dính màu vàng.',
        harvest: '30-40 ngày',
        waterIntervalDays: 1,
        fertilizeIntervalDays: 10
      },
      {
        id: 'c-otxiem',
        name: 'Ớt xiêm đô thị',
        scientificName: 'Capsicum annuum',
        icon: 'chili',
        image: getPhoto('chili').src,
        imageSource: getPhoto('chili').source,
        category: 'Cây ăn quả',
        hydroCompatible: false,
        difficulty: 'Dễ',
        idealEnv: { temp: '24-32°C', light: '6-8 giờ nắng/ngày', humidity: '50-68%' },
        container: 'Chậu tự dưỡng 10-15L',
        soil: 'Đất sạch giàu dinh dưỡng trộn vỏ trứng nghiền bổ sung canxi chống thối đuôi trái.',
        light: 'Ưa nắng toàn phần (30,000 - 45,000 Lux), nhiều nắng quả cay đậm.',
        water: 'Tưới 3 ngày/lần, tăng thêm khi trời nắng hanh.',
        pests: 'Rắc tro bếp quanh gốc, phun dầu neem hoặc nước xà phòng loãng ngừa rệp muội.',
        harvest: '65-85 ngày',
        waterIntervalDays: 3,
        fertilizeIntervalDays: 14
      },
      {
        id: 'c-huongthao',
        name: 'Hương thảo',
        scientificName: 'Salvia rosmarinus',
        icon: 'rosemary',
        image: getPhoto('rosemary').src,
        imageSource: getPhoto('rosemary').source,
        category: 'Gia vị & Thảo mộc',
        hydroCompatible: false,
        difficulty: 'Trung bình',
        idealEnv: { temp: '15-25°C', light: '6-8 giờ nắng/ngày', humidity: '40-60%' },
        container: 'Chậu đất nung thoáng khí',
        soil: 'Đất cát pha, thoát nước cực tốt, trộn thêm đá perlite hoặc sỏi nhẹ.',
        light: 'Nắng đầy đủ và thoáng gió; cây sợ úng rễ kéo dài.',
        water: 'Tưới 4 ngày/lần, chờ lớp đất mặt khô ráo hẳn rồi mới tưới.',
        pests: 'Tỉa bớt cành đan chéo tạo độ thông thoáng để tránh nấm phấn trắng.',
        harvest: '90-120 ngày',
        waterIntervalDays: 4,
        fertilizeIntervalDays: 30
      },
      {
        id: 'c-dautay',
        name: 'Dâu tây Nhật',
        scientificName: 'Fragaria × ananassa',
        icon: 'strawberry',
        image: getPhoto('strawberry').src,
        imageSource: getPhoto('strawberry').source,
        category: 'Cây ăn quả',
        hydroCompatible: true,
        difficulty: 'Khó',
        idealEnv: { temp: '16-22°C', light: '5-6 giờ nắng dịu/ngày', humidity: '60-75%' },
        container: 'Túi vải đứng hoặc chậu treo ban công',
        soil: 'Đất tơi xốp giàu mùn pH 5.5-6.5, phủ lớp rơm/vỏ trấu tránh quả chạm đất.',
        light: 'Nắng dịu buổi sáng (20,000 - 28,000 Lux), che lưới giảm nhiệt buổi trưa.',
        water: 'Tưới nhẹ quanh gốc 2 ngày/lần, không để đọng nước lên hoa và trái non.',
        pests: 'Dọn lá già ố vàng, dùng bẫy dính vàng ngừa nhện đỏ và bọ trĩ.',
        harvest: '60-90 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14
      },
      {
        id: 'c-bacha',
        name: 'Bạc hà xanh',
        scientificName: 'Mentha spicata',
        icon: 'mint',
        image: getPhoto('mint').src,
        imageSource: getPhoto('mint').source,
        category: 'Gia vị & Thảo mộc',
        hydroCompatible: true,
        difficulty: 'Dễ',
        idealEnv: { temp: '18-28°C', light: '3-5 giờ nắng/ngày', humidity: '65-80%' },
        container: 'Chậu dài riêng biệt (tránh lan rễ sang cây khác)',
        soil: 'Đất ẩm giàu mùn, giữ ẩm tốt nhưng thoát nước đáy ổn định.',
        light: 'Chịu được bán râm, rất hợp ban công chung cư hướng Đông/Bắc.',
        water: 'Tưới 2 ngày/lần, giữ đất ẩm mát.',
        pests: 'Cắt tỉa thường xuyên, rửa sạch mặt lá bằng vòi phun sương ngừa rệp.',
        harvest: '30-40 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 21
      },
      {
        id: 'c-hanhla',
        name: 'Hành lá tái sinh',
        scientificName: 'Allium fistulosum',
        icon: 'scallion',
        image: getPhoto('scallion').src,
        imageSource: getPhoto('scallion').source,
        category: 'Gia vị & Thảo mộc',
        hydroCompatible: true,
        difficulty: 'Dễ',
        idealEnv: { temp: '18-28°C', light: '4-6 giờ nắng/ngày', humidity: '60-70%' },
        container: 'Khay chữ nhật hoặc chai nhựa tái chế thủy canh',
        soil: 'Đất tơi trộn tro trấu hoặc trồng lại trực tiếp từ gốc hành có rễ.',
        light: 'Nắng sáng vừa phải, thông thoáng.',
        water: 'Tưới 2 ngày/lần vừa ẩm, tránh ngập úng gây thối gốc.',
        pests: 'Ít sâu bệnh; nhặt sâu xanh thủ công nếu phát hiện trên ống lá.',
        harvest: '25-35 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 21
      },
      {
        id: 'c-raumuong',
        name: 'Rau muống sạch',
        scientificName: 'Ipomoea aquatica',
        icon: 'kangkong',
        image: getPhoto('kangkong').src,
        imageSource: getPhoto('kangkong').source,
        category: 'Rau ăn lá',
        hydroCompatible: true,
        difficulty: 'Dễ',
        idealEnv: { temp: '25-35°C', light: '6-8 giờ nắng/ngày', humidity: '70-85%' },
        container: 'Thùng xốp 40x60 cm hoặc khay thủy canh tĩnh',
        soil: 'Đất ẩm nhiều mùn hoặc hệ thủy canh giữ ẩm cao.',
        light: 'Ưa nắng nhiều giúp thân giòn, lá xanh mướt.',
        water: 'Tưới mỗi ngày giữ độ ẩm ổn định cho gốc rễ.',
        pests: 'Che lưới côn trùng ngừa sâu xanh, thu hoạch cắt ngọn kích thích chồi mới.',
        harvest: '25-30 ngày',
        waterIntervalDays: 1,
        fertilizeIntervalDays: 10
      },
      {
        id: 'c-dualeo',
        name: 'Dưa leo leo giàn',
        scientificName: 'Cucumis sativus',
        icon: 'cucumber',
        image: getPhoto('cucumber').src,
        imageSource: getPhoto('cucumber').source,
        category: 'Cây ăn quả',
        hydroCompatible: false,
        difficulty: 'Trung bình',
        idealEnv: { temp: '22-32°C', light: '6-8 giờ nắng/ngày', humidity: '65-75%' },
        container: 'Chậu sâu 30L kèm lưới giàn leo cao 1.5 m',
        soil: 'Đất giàu hữu cơ, thoát nước nhanh, bổ sung phân trùn quế khi ra tua cuốn.',
        light: 'Ưa nắng sáng và thoáng gió để ong/bướm dễ thụ phấn.',
        water: 'Tưới 2 ngày/lần đều đặn, tránh héo rũ làm trái bị đắng.',
        pests: 'Phun sữa tươi pha loãng 1:9 ngừa nấm phấn trắng, bắt bọ dưa thủ công.',
        harvest: '40-50 ngày',
        waterIntervalDays: 2,
        fertilizeIntervalDays: 14
      }
    ];

    const journal = [
      {
        id: 'j-1',
        plantId: 'p-cachua',
        plantName: 'Cà chua bi Cherry',
        date: dateAgo(1),
        stage: 'Ra hoa',
        heightCm: 48,
        moisture: 66,
        title: 'Chùm hoa vàng thụ phấn và đậu trái non đầu tiên',
        note: 'Sau khi bón phân trùn quế và phun dịch tỏi ớt phòng rệp, các hoa cái đã hình thành 8 trái non xanh mọng. Cảm biến duy trì ẩm độ 66%.',
        imageDataUrl: getPhoto('tomato').src,
        imageSource: getPhoto('tomato').source
      },
      {
        id: 'j-2',
        plantId: 'p-xalach',
        plantName: 'Xà lách thủy canh',
        date: dateAgo(2),
        stage: 'Thu hoạch',
        heightCm: 18,
        moisture: 88,
        title: 'Thu hoạch tỉa bẹ lá ngoài giòn ngọt làm salad',
        note: 'Bộ rễ thủy canh trắng muốt dài 24 cm không bị rêu nhớt. Đã thu hoạch 300 g lá ngoài, giữ lại nõn giữa tiếp tục sinh trưởng.',
        imageDataUrl: getPhoto('lettuce').src,
        imageSource: getPhoto('lettuce').source
      },
      {
        id: 'j-3',
        plantId: 'p-hungque',
        plantName: 'Húng quế Tây',
        date: dateAgo(4),
        stage: 'Ra lá',
        heightCm: 24,
        moisture: 55,
        title: 'Bấm ngọn đợt 2 kích thích đẻ 4 nhánh mới',
        note: 'Bấm ngọn giúp cây tập trung nuôi tán lá dày, mùi tinh dầu thơm đậm và giúp xua muỗi tự nhiên ở ban công.',
        imageDataUrl: getPhoto('basil').src,
        imageSource: getPhoto('basil').source
      },
      {
        id: 'j-4',
        plantId: 'p-dautay',
        plantName: 'Dâu tây Nhật',
        date: dateAgo(6),
        stage: 'Ra hoa',
        heightCm: 16,
        moisture: 64,
        title: 'Xuất hiện 3 ngồng hoa trắng nhị vàng',
        note: 'Nhiệt độ ban đêm mát dịu kích thích ra hoa rộ. Dùng cọ mềm hỗ trợ thụ phấn vào 9h sáng và giảm nắng trưa.',
        imageDataUrl: getPhoto('strawberry').src,
        imageSource: getPhoto('strawberry').source
      },
      {
        id: 'j-5',
        plantId: 'p-otxiem',
        plantName: 'Ớt xiêm đô thị',
        date: dateAgo(10),
        stage: 'Ra hoa',
        heightCm: 42,
        moisture: 54,
        title: 'Cây sai hoa, trái non chỉ thiên thẳng đứng',
        note: 'Nắng sân thượng dồi dào giúp ớt phát triển khỏe, kiểm tra mặt dưới lá chưa thấy dấu hiệu nhện đỏ.',
        imageDataUrl: getPhoto('chili').src,
        imageSource: getPhoto('chili').source
      },
      {
        id: 'j-6',
        plantId: 'p-cachua',
        plantName: 'Cà chua bi Cherry',
        date: dateAgo(22),
        stage: 'Nảy mầm',
        heightCm: 9,
        moisture: 72,
        title: 'Gieo hạt vào khay xơ dừa, nảy mầm đều sau 5 ngày',
        note: 'Giữ ẩm bề mặt khay ươm bằng bình phun sương và đưa ra nắng nhẹ buổi sáng.',
        imageDataUrl: getPhoto('terrace').src,
        imageSource: getPhoto('terrace').source
      }
    ];

    const market = [
      { id: 'm-1', product: 'Rau muống sạch', qty: 2, unit: 'kg', price: 25000, seller: 'Chị Lan (tầng 5, tòa B)', own: false },
      { id: 'm-2', product: 'Ớt xiêm hữu cơ', qty: 0.5, unit: 'kg', price: 80000, seller: 'Anh Minh (tòa A)', own: false },
      { id: 'm-3', product: 'Xà lách thủy canh', qty: 1.2, unit: 'kg', price: 45000, seller: 'Vườn Ban Công 12B', own: false }
    ];

    return {
      schemaVersion: 2,
      settings: { autoWater: false, theme: 'light' },
      telemetry: {
        stationId: '#HN-02',
        lightLux: 28400,
        airHumidity: 65,
        ambientTemp: 26.8,
        tankPercent: 82,
        tankLiters: '41/50L',
        updatedAt: new Date().toISOString()
      },
      gardenPlants: garden,
      libraryCatalog: catalog,
      growthJournal: journal,
      marketListings: market
    };
  }

  let memoryCopy = null;
  let memoryTheme = 'light';

  function getStorage() {
    try {
      const s = root.localStorage;
      if (!s) { return null; }
      s.setItem('__ug_test', '1');
      s.removeItem('__ug_test');
      return s;
    } catch (e) {
      return null;
    }
  }

  /* Chuẩn hóa dữ liệu đọc từ localStorage để tương thích mọi bản lưu */
  function normalize(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.gardenPlants)) { return null; }
    let def = null;
    if (!Array.isArray(d.libraryCatalog) || !d.libraryCatalog.length) {
      def = def || buildDefault();
      d.libraryCatalog = def.libraryCatalog;
    }
    if (!Array.isArray(d.growthJournal)) { d.growthJournal = []; }
    if (!Array.isArray(d.marketListings)) { d.marketListings = []; }
    if (!d.settings || typeof d.settings !== 'object') { d.settings = { autoWater: false, theme: 'light' }; }
    if (!d.telemetry || typeof d.telemetry !== 'object') {
      def = def || buildDefault();
      d.telemetry = def.telemetry;
    }
    d.gardenPlants.forEach(function (p) {
      if (!p.image) {
        const photo = getPhoto(p.icon);
        p.image = photo.src;
        p.imageSource = photo.source;
      }
      if (!p.ageDays) { p.ageDays = 30; }
    });
    if (!d.schemaVersion) { d.schemaVersion = 2; }
    return d;
  }

  const GardenStore = {
    key: STORAGE_KEY,
    themeKey: THEME_KEY,
    stages: STAGES,
    art: artSvg,
    photo: getPhoto,

    /* Tải dữ liệu từ localStorage hoặc khởi tạo bộ mẫu */
    load: function () {
      const s = getStorage();
      let raw = null;
      if (s) {
        try { raw = s.getItem(STORAGE_KEY); } catch (e) { raw = null; }
      } else {
        raw = memoryCopy;
      }
      if (raw) {
        try {
          const d = normalize(JSON.parse(raw));
          if (d) { return d; }
        } catch (e2) { /* Khởi tạo lại nếu JSON bị lỗi */ }
      }
      const def = buildDefault();
      GardenStore.save(def);
      return def;
    },

    /* Lưu toàn bộ dữ liệu xuống localStorage */
    save: function (data) {
      const text = JSON.stringify(data);
      const s = getStorage();
      if (!s) { memoryCopy = text; return true; }
      try {
        s.setItem(STORAGE_KEY, text);
        return true;
      } catch (e) {
        return false;
      }
    },

    getTheme: function () {
      const s = getStorage();
      if (s) {
        try {
          const t = s.getItem(THEME_KEY);
          if (t === 'dark' || t === 'light') { return t; }
        } catch (e) { /* bỏ qua */ }
      }
      return memoryTheme;
    },

    setTheme: function (theme) {
      const next = theme === 'dark' ? 'dark' : 'light';
      memoryTheme = next;
      const s = getStorage();
      if (s) {
        try { s.setItem(THEME_KEY, next); } catch (e) { /* bỏ qua */ }
      }
      return next;
    },

    reset: function () {
      const def = buildDefault();
      GardenStore.save(def);
      return def;
    },

    defaults: function () {
      return buildDefault();
    },

    /* Xuất JSON định dạng đẹp (rút gọn base64 khi xem trực tiếp trên Modal) */
    toJSON: function (data, shorten) {
      return JSON.stringify(data || GardenStore.load(), function (k, v) {
        if (shorten && typeof v === 'string' && v.indexOf('data:image') === 0) {
          return v.slice(0, 36) + '...(ảnh ' + v.length + ' ký tự)';
        }
        return v;
      }, 2);
    }
  };

  root.GardenStore = GardenStore;
})(typeof window !== 'undefined' ? window : globalThis);

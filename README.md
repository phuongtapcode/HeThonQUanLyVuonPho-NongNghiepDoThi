# Urban Flora — Hệ thống Quản lý Vườn phố & Nông nghiệp Đô thị

Ứng dụng web tĩnh đa trang quản lý khu vườn đô thị (ban công, sân thượng, cửa sổ), xây dựng bằng **HTML5, CSS3, Vanilla JavaScript và JSON** trên giao diện gốc từ dự án **Quản Lý Vườn Đô Thị (`Urban Flora`)** trên Google Stitch. Chạy trực tiếp offline qua `file://` không cần server hay thư viện phụ thuộc.

---

## 1. Thành viên nhóm & Phân công chính

| Thành viên | Trang phụ trách chính | Nhiệm vụ cốt lõi |
|---|---|---|
| **Huỳnh Thanh Phương** | `index.html` (Khu vườn của tôi) | Phân tích Data Contract (`data/plants.json`, `js/data.js`), logic nhắc lịch & nút `"Đã chăm sóc"` (`js/main.js`, `js/garden.js`), ghép nối hệ thống & kiểm thử tổng thể |
| **Trần Tiến Đạt** | `journal.html` (Nhật ký tăng trưởng) | Luồng nhật ký Timeline & xử lý upload/nén ảnh Canvas (`js/journal.js`), CSS Timeline (`::before`/`::after`, `pulse`), thu thập & nén 12 ảnh nguồn thật `.webp` (`images/`) |
| **Trần Ngọc Hiếu** | `library.html` (Thư viện cây trồng) | Tra cứu không dấu & lọc danh mục cây (`js/library.js`), CSS Responsive Mobile-First & Menu Hamburger, hiệu ứng Progress Bar/AOS, Dark/Light Mode & kiểm thử Accessibility |

> Xem chi tiết từng đầu việc theo 4 giai đoạn tại [PHAN_CONG_CONG_VIEC.csv](PHAN_CONG_CONG_VIEC.csv) và nhật ký làm việc với AI tại [PROMPT_LOG.md](PROMPT_LOG.md).

---

## 2. Cấu trúc thư mục

```text
quan-ly-vuon-pho/
├── index.html                   # Trang chủ: Khu vườn của tôi (Telemetry, Plant Cards, Progress Bar, Tầm nhìn dài hạn)
├── library.html                 # Trang Thư viện cây trồng (Tìm kiếm, lọc nhóm, Modal kỹ thuật, Thêm vào vườn)
├── journal.html                 # Trang Nhật ký tăng trưởng (Timeline, Upload ảnh, Form Validation)
├── css/
│   └── style.css                # Design System Urban Flora (:root Light/Dark, Flexbox/Grid, AOS, @keyframes, Responsive)
├── js/
│   ├── data.js                  # Data Contract v2, nhúng sẵn dữ liệu offline & đồng bộ localStorage (key: urban_garden_v2)
│   ├── main.js                  # Logic nhắc lịch, markCared, vòng lặp for/while, Regex, AOS offline, Dark Mode, Toast, Modal JSON
│   ├── garden.js                # Render Plant Cards, Progress Bar 2 chỉ số, Thêm cây mới & 3 module Tầm nhìn dài hạn
│   ├── library.js               # Tìm kiếm không dấu, lọc chip, giữ trạng thái vị trí, Modal chi tiết & thêm vào vườn
│   └── journal.js               # Render Timeline, sắp xếp Mới/Cũ, lọc theo cây, nén ảnh Canvas & lưu nhật ký
├── data/
│   └── plants.json              # Dữ liệu JSON chuẩn cấu trúc đối chiếu của hệ thống
├── images/                      # 12 ảnh thực tế nén định dạng WebP (từ Wikimedia Commons & Google Stitch)
├── README.md                    # Tài liệu giới thiệu & hướng dẫn sử dụng dự án
├── PROMPT_LOG.md                # Nhật ký quá trình phân tích & làm việc cùng AI (Vibe Coding)
└── PHAN_CONG_CONG_VIEC.csv      # Bảng phân công công việc chi tiết của 3 thành viên
```

---

## 3. Hướng dẫn chạy nhanh

1. Mở thư mục `quan-ly-vuon-pho/`.
2. Nhấp đúp trực tiếp vào file `index.html` để mở trên trình duyệt (Chrome, Edge, Firefox) qua giao thức `file://`.
3. Dữ liệu khởi tạo tự động từ `js/data.js` và lưu thay đổi vào `localStorage`. Có thể bấm **Xem JSON** trên thanh điều hướng để xem trực tiếp, sao chép hoặc tải file `plants-updated.json`.

---

## 4. Tính năng & Kiến thức Học phần áp dụng (Tuần 1 – Tuần 15)

- **Giai đoạn 1 (Tuần 1 – 2):** Áp dụng quy trình Agile/Scrum, phân rã bài toán, Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`, `<time>`) và chuẩn Accessibility (`skip-link`, `aria-live`, `role="progressbar"`).
- **Giai đoạn 2 (Tuần 3 – 7):** Kết hợp Flexbox (1D) và CSS Grid (2D) với `gap`; Design System `:root` Light/Dark Mode; Responsive Mobile-First (`375px`, `768px`, `1024px+`, `1280px`) kèm Menu Hamburger; CSS Transitions, `@keyframes` (`fadeInUp`, `shimmer`, `pulse`, `slideInEntry`, `shakeError`), AOS offline (`data-aos="fade-up"`); tối ưu 12 ảnh thực tế sang định dạng `.webp` kèm `loading="lazy"`.
- **Giai đoạn 3 (Tuần 8 – 12):** Vanilla JS dùng `const`/`let`, `if...else`, `console.log()`, vòng lặp `for` (`UG.summarizeGarden`) & `while` (`UG.dedupePlantName`), hàm DRY, `querySelector`/`addEventListener`, `event.preventDefault()`, Form Validation + Regex (`UG.REGEX`), duyệt mảng hiện đại (`map`, `filter`, `forEach`), `localStorage` & JSON Export.
- **Giai đoạn 4 (Tuần 13 – 15):** Tổ chức mã nguồn theo 2 Sprint (Sprint 1: Core UI & Data Contract; Sprint 2: JS Logic, Validation & Refactor), kiểm thử cú pháp `node --check`, unit test logic qua Node `vm` và kiểm tra hiển thị Chrome đa kích thước.

---

## 5. Nguồn ảnh thực tế

- **Wikimedia Commons (CC BY-SA 3.0 / CC BY-SA 4.0 / CC BY 3.0 / CC BY 4.0):** Ảnh thực tế của Cà chua bi, Húng quế, Xà lách, Ớt xiêm, Hương thảo, Dâu tây, Bạc hà, Hành lá, Rau muống, Dưa leo và Vườn sân thượng (mã định danh gốc được ghi chú trong trường `imageSource` của `data/plants.json`).
- **Google Stitch (`Urban Flora`):** Giao diện thiết kế gốc (3 màn hình `MyGarden`, `PlantLibrary`, `GrowthJournal`) và ảnh showcase ban công xanh (`images/balcony-hero.webp`).

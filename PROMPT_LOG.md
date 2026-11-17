# Nhật ký Prompt & Quy trình Triển khai (Prompt Log)

- **Dự án:** Hệ thống Quản lý Vườn phố & Nông nghiệp Đô thị (`Urban Flora`)
- **Nhóm thực hiện:** Huỳnh Thanh Phương, Trần Tiến Đạt, Trần Ngọc Hiếu
- **Công cụ sử dụng:** Antigravity AI Assistant, Google Stitch MCP (`Quản Lý Vườn Đô Thị`), Skills CLI (`find-skills`, `modern-javascript-patterns`, `responsive-design`, `accessibility`, `impeccable`, `frontend-design`, `superpowers`), Node.js & Chrome.

---

## Tổng hợp các phiên Prompt chính

| Giai đoạn | Tóm tắt Prompt đầu vào | Mục tiêu & Quyết định kỹ thuật | Kết quả & File cập nhật |
|---|---|---|---|
| **1. Thiết lập công cụ & Skills** | Cài đặt bộ skills toàn cục (`-g`) cho quy trình lập kế hoạch, thiết kế sạch và dùng `find-skills` chọn lọc skill phù hợp đề tài *Urban Gardening* (loại bỏ React/Vue/Python). | Xác định bộ kỹ năng cốt lõi cho web tĩnh thuần: Vanilla JS ES6+, Responsive CSS3, Accessibility (ARIA cho Progress Bar) và tinh chỉnh UI. | Cài xong `find-skills`, `superpowers`, `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max`, `modern-javascript-patterns`, `responsive-design`, `accessibility`, `impeccable`. |
| **2. Lập kế hoạch & Data Contract** | Kích hoạt `/plan /grill-me` lập bản kế hoạch cấu trúc thư mục sạch `quan-ly-vuon-pho/`, đảm bảo chạy offline qua `file://`. | Chốt Data Contract JSON (`gardenPlants`, `libraryCatalog`, `growthJournal`, `marketListings`), lưu bền vững bằng `localStorage` để không phụ thuộc `fetch()` gây lỗi CORS. | Thông qua bản thiết kế 3 trang (`index.html`, `library.html`, `journal.html`) và tách rõ 5 module JS trong `js/`. |
| **3. Kết nối Google Stitch MCP** | Kết nối MCP vào Google Stitch bằng API Key để lấy dự án gốc **Quản Lý Vườn Đô Thị** (`Urban Flora`). | Đồng bộ giao diện gốc 3 màn hình (`MyGarden`, `PlantLibrary`, `GrowthJournal`) cùng bộ màu & typography của `Urban Flora - Design System`. | Truy xuất thành công 3 file HTML gốc và Design System từ Stitch (`projects/9079018637875232920`). |
| **4. Tích hợp ảnh thật WebP & Kiến thức Tuần 1–15** | Lấy giao diện Stitch làm gốc, bổ sung ảnh có nguồn thật nén WebP, hiệu ứng chuyển động (`@keyframes`, AOS) và toàn bộ kiến thức Giáo trình (Tuần 1–15). | Tải 11 ảnh từ Wikimedia Commons (CC BY-SA/CC BY) + 1 ảnh showcase từ Stitch, nén thành `.webp` trong `images/`. Xây dựng `style.css` thuần (hỗ trợ cả Light & Dark Mode offline), AOS offline, Progress Bar shimmer, vòng lặp `for`/`while`, Regex Validation và Modal JSON. | Hoàn thiện `index.html`, `library.html`, `journal.html`, `css/style.css`, `js/*.js`, `data/plants.json` và 12 file ảnh trong `images/`. |
| **5. Tinh chỉnh Logo & Khối Tầm nhìn** | Đổi logo sang chiếc lá xanh sáng không chậu, có gân phân nhánh như nhánh cây, bỏ khung vuông; chỉnh lại bố cục 3 thẻ *Mô Phỏng Tầm Nhìn Dài Hạn*. | Bỏ nền vuông `.brand-icon`, vẽ SVG chiếc lá sáng kèm gân lá phân nhánh; chuẩn hóa 3 thẻ Tầm nhìn (thêm KPI box, dropzone chọn ảnh tùy chỉnh, tách dòng bảng giá nông sản). | Cập nhật `index.html`, `library.html`, `journal.html`, `css/style.css`, `js/garden.js`; kiểm tra chụp màn hình Chrome `1280px` & `375px` đều hiển thị cân đối. |

---

## Kiểm chứng chất lượng trước khi nộp

1. **Cú pháp & Dữ liệu:** `node --check` 5 file JS đạt `0` lỗi; `data/plants.json` hợp lệ (`schemaVersion: 2`, `6` cây vườn, `10` cây thư viện, `6` mốc nhật ký); đủ 12/12 ảnh `.webp` trên đĩa.
2. **Logic JS (Node `vm` unit test):** Xác nhận `UG.markCared` đưa độ ẩm & sức khỏe lên `100%` và xóa cảnh báo quá hạn; `UG.summarizeGarden`, `UG.dedupePlantName`, `UG.REGEX` hoạt động đúng.
3. **Hiển thị đa thiết bị (`file://` trên Chrome headless):** Đã kiểm tra giao diện Desktop (`1280px`) và Mobile (`375px`, `scrollWidth: 360`, không tràn ngang trên cả 3 trang).

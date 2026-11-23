# Ứng Dụng Ôn Tập Trắc Nghiệm & Hệ Thống Lý Thuyết: Hệ Thống Thực Vật 2025

**Trường Đại Học Nông Lâm TP. Hồ Chí Minh**

Hệ thống ôn thi thông minh được xây dựng từ 11 tập tài liệu đề cương và giáo trình chính thức của bộ môn Hệ Thống Thực Vật.

---

## 📊 1. Thống Kê Dữ Liệu & Quy Mô Hệ Thống

| Chỉ tiêu | Số lượng | Chi tiết |
| :--- | :---: | :--- |
| **Tổng số chương** | **11** | Gồm Chương 1 đến Chương 10 (Chương 8 chia thành Phần 1 & Phần 2) |
| **Tổng số chuyên đề (Sections)** | **46** | Phân loại khoa học theo từng nhóm bài học |
| **Tổng số câu hỏi trắc nghiệm** | **334** | Trích xuất nguyên vẹn 100% không bỏ sót bất kỳ câu nào |
| **Số câu có đáp án chính thức** | **334** | Đầy đủ đáp án A, B, C, D kèm phân tích ĐÚNG/SAI từng phương án |
| **Số câu có lưu ý đối chiếu giáo trình** | **46** | Cảnh báo rõ ràng các câu có mâu thuẫn giữa đề cương và giáo trình |
| **Công nghệ lưu trữ** | LocalStorage | Tự động lưu tiến độ, lịch sử làm bài, câu sai, sao lưu tức thì |

### Danh sách các chương:
1. **Chương 1**: Phân loại và danh pháp khoa học (24 câu)
2. **Chương 2**: Rễ, cộng sinh và các loại "củ" (24 câu)
3. **Chương 3**: Mô, thân và lá (27 câu)
4. **Chương 4**: Hoa, hoa đồ và hoa thức (35 câu)
5. **Chương 5**: Quả và hạt (22 câu)
6. **Chương 6**: Di truyền, bào quan và đa dạng sinh học (17 câu)
7. **Chương 7**: Sinh học phân tử trong hệ thống học (34 câu)
8. **Chương 8 (Phần 1)**: Họ thực vật và quan hệ họ hàng - Poaceae, Solanaceae, Fabaceae, Cucurbitaceae, Rutaceae, Anacardiaceae, Malvaceae (47 câu)
9. **Chương 8 (Phần 2)**: Họ thực vật và quan hệ họ hàng - Asteraceae, Brassicaceae, Rubiaceae, Convolvulaceae, Euphorbiaceae, Piperaceae, Zingiberaceae, v.v. (61 câu)
10. **Chương 9**: Tên khoa học các loài cụ thể và các dạng dưới loài (33 câu)
11. **Chương 10**: Ghép cây, thu hoạch và ứng dụng thực tiễn (10 câu)

---

## 🚀 2. Bốn Nhóm Chức Năng Chính

### A. Học Lý Thuyết Trọng Tâm
- Hệ thống hóa toàn bộ **Kiến thức nền** của 46 chuyên đề theo từng chương.
- Làm nổi bật định nghĩa, từ khóa, tên khoa học in nghiêng chuẩn La-tinh (*Oryza sativa*, *Zea mays*...), các họ thực vật viết hoa chuẩn quy ước.
- Nút liên kết thông minh **"Luyện tập nhóm này"** giúp người học kiểm tra ngay kiến thức vừa đọc.

### B. Trắc Nghiệm Tương Tác Theo Chương
- Chế độ hiển thị 1 câu/lần, giao diện chuẩn **Apple Human Interface Guidelines (HIG)**.
- **Phản hồi tức thì (Instant Feedback)**: Khi bấm chọn một phương án:
  - Đổi màu xanh lá (Đúng) hoặc đỏ (Sai) kèm phản hồi âm thanh tinh tế (Web Audio API Synthesizer).
  - Hiển thị hộp **Giải thích chung** và **Phân tích từng phương án A, B, C, D** tại sao Đúng / Sai.
  - Ô cảnh báo màu hổ phách **Lưu ý chuyên môn** đối với 46 câu hỏi có mâu thuẫn hoặc cần đối chiếu giữa đề cương và phân loại APG / Cronquist.
- Ngăn kéo chọn câu hỏi nhanh (**Quick Jump Drawer**) giúp xem toàn bộ danh sách 334 câu dưới dạng ô số màu sắc (Đúng, Sai, Chưa làm).

### C. Ôn Tập Câu Sai (Spaced Repetition)
- Tự động ghi nhận câu sai vào bộ nhớ máy học viên.
- **Theo dõi số lần trả lời sai** (Ví dụ: "Đã sai 2 lần", "Đã sai 3 lần").
- **Quy tắc bảo toàn lịch sử**: Không xóa lịch sử sai chỉ vì người học làm đúng ở lần tiếp theo.
- Bộ lọc câu sai theo từng chương, câu sai nhiều lần (≥ 2 lần), hoặc câu chưa nắm vững.
- Chế độ **"Làm lại toàn bộ câu sai"** để tập trung khắc phục lỗ hổng kiến thức.

### D. Thống Kê & Phân Tích Tiến Độ Học Tập
- Tổng số câu đã làm, số câu đúng, số câu sai, tỷ lệ chính xác (%).
- Bảng tiến độ và tỷ lệ phần trăm hoàn thành của từng chương trong 11 chương.
- Báo động tự động các **Chương có kết quả thấp (< 70%)** để người học ưu tiên ôn tập.
- Bảng xếp hạng **Top những câu hỏi thường xuyên trả lời sai nhất**.
- Nút đặt lại tiến độ an toàn có hộp thoại xác nhận.

---

## 🛠️ 3. Hướng Dẫn Chạy & Truy Cập

### Cách 1: Chạy bằng file 1-click (Khuyên dùng)
Nhấp đúp chuột vào file:
```
d:\Antigravity\DỰ ÁN\Hệ thống thực vật\start.bat
```
Server cục bộ sẽ tự động khởi chạy và mở trình duyệt web tại địa chỉ:
`http://localhost:8080/index.html`

### Cách 2: Chạy bằng dòng lệnh Python
Mở Terminal/PowerShell tại thư mục dự án và chạy:
```powershell
python server.py
```

### Cách 3: Mở trực tiếp không cần server
Do dữ liệu đã được tối ưu hóa xuất ra file `js/botany_data.js`, bạn có thể nhấp đúp trực tiếp vào:
```
d:\Antigravity\DỰ ÁN\Hệ thống thực vật\index.html
```
Website sẽ tải ngay lập tức trên mọi trình duyệt hiện đại (Chrome, Edge, Safari, Firefox).

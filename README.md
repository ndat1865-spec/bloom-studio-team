# Nguyễn Ngọc Minh Thu — Giao diện quản trị

Đây là **bộ khởi đầu giai đoạn 1** được chuẩn bị chung cho nhóm, có thể chạy và commit ngay.
Người phụ trách đọc, chạy thử và tiếp tục phát triển phần này.

## Chuẩn bị

Cài **Node.js 22.12 trở lên** (khuyến nghị Node 24), có sẵn npm.
Lần chạy đầu cần Internet để tải thư viện. Không cần MySQL/Docker.
Không copy `node_modules`, `target`, file môi trường hay code của bản hoàn chỉnh vào gói này.

## Chạy

Mở **Command Prompt hoặc terminal PowerShell** tại thư mục chứa `05-nguyen-ngoc-minh-thu`.
Với PowerShell, bỏ qua dòng bắt đầu bằng `REM` (đó chỉ là chú thích cho Command Prompt).

```bat
cd 05-nguyen-ngoc-minh-thu\admin-frontend
npm ci
npm run dev
```

- Mở http://localhost:15174
- Mặc định Demo: không cần backend.
- Chọn API để gọi Gateway :18080.
- Tab Kết nối tài khoản: thử `demo` / `bloom123` khi Auth và Gateway đang chạy.

Dừng bằng Ctrl+C. Nếu cổng đã bận, dừng đúng tiến trình đang dùng cổng đó hoặc bản starter đã mở trước.
Vite dùng strictPort nên sẽ báo cổng bận, không tự nhảy cổng.

## Đã có

- React + TypeScript + Vite, bảng sản phẩm và tìm kiếm.
- Các chỉ số từ dữ liệu mẫu, danh sách đơn minh họa.
- Form đăng nhập gọi Auth rồi dùng JWT gọi `/auth/me`.
- Chế độ Demo độc lập và API.

## Giới hạn hiện tại

Đây là khung giao diện quản trị chỉ đọc dữ liệu công khai/demo, chưa là hệ thống quản trị có phân quyền. Đăng nhập mẫu trả CUSTOMER và không cấp quyền quản trị. Token chỉ dùng trong lượt kiểm tra, chưa lưu phiên.

## Việc làm tiếp

- Form thêm/sửa/xóa sản phẩm, danh mục.
- Quản lý trạng thái đơn thật.
- Route được bảo vệ cho ADMIN; phối hợp Đạt để kiểm tra quyền ở backend.
- Hồ sơ tài khoản, API Key và các trạng thái lỗi.

## Commit lên repo chung

1. Đạt tạo **một repo GitHub chung rỗng**, thêm 4 bạn làm collaborator.
2. Mỗi bạn clone repo bằng tài khoản GitHub của mình.
3. Copy **nguyên thư mục `05-nguyen-ngoc-minh-thu`** vào gốc repo vừa clone.
4. Mở terminal ở gốc repo. Kiểm tra `git config user.name` và `git config user.email` là thông tin của chính bạn.
5. Chạy thử code rồi dùng các lệnh dưới đây. Không cần `git init` trong thư mục con.

```bat
git switch -c codex/05-nguyen-ngoc-minh-thu
git add 05-nguyen-ngoc-minh-thu/
git diff --cached --stat
git commit -m "feat(admin-frontend): khoi tao bang san pham don mau va dang nhap"
git push -u origin codex/05-nguyen-ngoc-minh-thu
```

Trên GitHub tạo pull request vào nhánh chung; Đạt kiểm tra và ghép.
Các lệnh này chỉ stage phần của bạn. Không dùng `git add .` nếu repo còn phần của người khác.
Commit đầu ghi đúng đây là khung khởi tạo; những commit sau mô tả thay đổi thực tế.


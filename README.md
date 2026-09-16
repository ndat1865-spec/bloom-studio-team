# Trần Thị Mỹ Ngân — Giao diện khách hàng

Đây là **bộ khởi đầu giai đoạn 1** được chuẩn bị chung cho nhóm, có thể chạy và commit ngay.
Người phụ trách đọc, chạy thử và tiếp tục phát triển phần này.

## Chuẩn bị

Cài **Node.js 22.12 trở lên** (khuyến nghị Node 24), có sẵn npm.
Lần chạy đầu cần Internet để tải thư viện. Không cần MySQL/Docker.
Không copy `node_modules`, `target`, file môi trường hay code của bản hoàn chỉnh vào gói này.

## Chạy

Mở **Command Prompt hoặc terminal PowerShell** tại thư mục chứa `04-tran-thi-my-ngan`.
Với PowerShell, bỏ qua dòng bắt đầu bằng `REM` (đó chỉ là chú thích cho Command Prompt).

```bat
cd 04-tran-thi-my-ngan\customer-frontend
npm ci
npm run dev
```

- Mở http://localhost:15173
- Mặc định Demo: không cần backend.
- Chọn nguồn dữ liệu API để gọi Gateway :18080.

Dừng bằng Ctrl+C. Nếu cổng đã bận, dừng đúng tiến trình đang dùng cổng đó hoặc bản starter đã mở trước.
Vite dùng strictPort nên sẽ báo cổng bận, không tự nhảy cổng.

## Đã có

- React + TypeScript + Vite, giao diện responsive.
- Danh sách/tìm hoa, chọn sản phẩm, nhập số lượng, tính giá.
- Chế độ Demo độc lập; chế độ API không tự giấu lỗi bằng dữ liệu giả.
- Hiển thị lỗi kết nối và trạng thái đang tải.

## Giới hạn hiện tại

Nút Tính giá chưa đặt hàng. Demo dùng dữ liệu trình duyệt; chế độ API cần Gateway, Product và Order. Giao diện này là một project riêng của bộ khởi đầu; sau này có thể ghép vào frontend chung.

## Việc làm tiếp

- Trang chi tiết, giỏ hàng nhiều dòng.
- Đăng ký/đăng nhập và lưu phiên.
- Form người nhận, tạo đơn thật.
- Kết nối API hoàn chỉnh và kiểm thử thao tác mua hàng.

## Commit lên repo chung

1. Đạt tạo **một repo GitHub chung rỗng**, thêm 4 bạn làm collaborator.
2. Mỗi bạn clone repo bằng tài khoản GitHub của mình.
3. Copy **nguyên thư mục `04-tran-thi-my-ngan`** vào gốc repo vừa clone.
4. Mở terminal ở gốc repo. Kiểm tra `git config user.name` và `git config user.email` là thông tin của chính bạn.
5. Chạy thử code rồi dùng các lệnh dưới đây. Không cần `git init` trong thư mục con.

```bat
git switch -c codex/04-tran-thi-my-ngan
git add 04-tran-thi-my-ngan/
git diff --cached --stat
git commit -m "feat(customer-frontend): khoi tao giao dien hoa va tinh gia"
git push -u origin codex/04-tran-thi-my-ngan
```

Trên GitHub tạo pull request vào nhánh chung; Đạt kiểm tra và ghép.
Các lệnh này chỉ stage phần của bạn. Không dùng `git add .` nếu repo còn phần của người khác.
Commit đầu ghi đúng đây là khung khởi tạo; những commit sau mô tả thay đổi thực tế.


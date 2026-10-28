# Project Guidance

## User Preferences

- Giao diện tiếng Việt
- Hệ thống dành cho phòng khám đa khoa với nhiều vai trò người dùng

## Accepted Requirements

- 9 lớp dữ liệu: Bệnh nhân, Bác sĩ, Lịch hẹn khám, Hồ sơ khám bệnh, Đơn thuốc, Chi tiết đơn thuốc, Thuốc, Tài khoản người dùng, Vai trò
- Đăng nhập, đăng xuất, đổi mật khẩu, kiểm tra quyền, khóa tài khoản
- Gán/gỡ quyền cho vai trò và xem danh sách quyền
- Lấy và cập nhật thông tin cá nhân; cập nhật thông tin bệnh nhân
- Đăng ký khám bệnh và đặt lịch khám
- Xem lịch sử khám bệnh và truy xuất lịch sử khám của bệnh nhân
- Xem lịch hẹn, tạo lịch hẹn, xác nhận lịch hẹn, hủy lịch hẹn, cập nhật trạng thái lịch hẹn
- Khám bệnh, lập/cập nhật/xem hồ sơ khám bệnh, cập nhật kết quả khám, thêm kết quả xét nghiệm
- Tạo đơn thuốc, thêm/xóa thuốc trong đơn, thêm chi tiết thuốc, cập nhật liều dùng, tính tổng số loại thuốc, tính số lượng thuốc cần dùng, in đơn thuốc
- Xem và cập nhật thông tin thuốc, kiểm tra tồn kho, kiểm tra hạn sử dụng

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend verified commands from src/backend: mops check --fix, mops build. Frontend verified commands from src/frontend: pnpm typecheck, pnpm fix. Root command pnpm bindgen regenerates frontend bindings.
- Role-gating reads through the accounts map (isClinicalStaff) is the correct approach when the authorization component's roles cannot separate doctors and receptionists from patients.
- Frontend role gating must mirror the exact backend guard: MANAGE_ROLES must equal the role the backend method requires.
- React Query mutations must invalidate both the list key and the singular detail key, or the detail view stays stale after an edit.
- useAccount calls getAccount, which is admin-only; do not use it to derive staff permissions.
- OQL auto-derivation needs a <Type>Value.mo with _toRow for every variant field; collection fields like [Text] force manual mode.
- Two mixins each declaring a private top-level func with the same name collide when both are included in the actor; rename one.

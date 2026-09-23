package dh13c6.nguyentiendat516.bloom.authservice.dto;

import dh13c6.nguyentiendat516.bloom.authservice.entity.User;

/**
 * SOS06 - DTO tra ve cho User. Khong bao gio tra truong password ra ngoai.
 *
 * PHAN MO RONG: kem thong tin ho so + dia chi mac dinh de trang Tai khoan
 * va trang Thanh toan dung lai, khong phai goi them API.
 */
public record UserResponse(
        Long id,
        String username,
        String role,
        String fullName,
        String email,
        String phone,
        String address,
        String city,
        String displayName,
        boolean hasDefaultAddress
) {

    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getRole().name(),
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.getAddress(),
                u.getCity(),
                u.getDisplayName(),
                u.hasDefaultAddress());
    }
}

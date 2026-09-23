package dh13c6.nguyentiendat516.bloom.authservice.service;

import dh13c6.nguyentiendat516.bloom.authservice.dto.UserResponse;
import dh13c6.nguyentiendat516.bloom.authservice.entity.User;
import dh13c6.nguyentiendat516.bloom.authservice.exception.ConflictException;
import dh13c6.nguyentiendat516.bloom.authservice.exception.NotFoundException;
import dh13c6.nguyentiendat516.bloom.authservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Quan tri tai khoan - chi ADMIN goi duoc (khai o SecurityConfig, khong kiem tra tay).
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse getById(Long id) {
        return UserResponse.from(findOrThrow(id));
    }

    /** Doi role va/hoac dat lai mat khau. Mat khau moi luon duoc ma hoa truoc khi luu. */
    public UserResponse update(Long id, String newRole, String newPassword) {
        User user = findOrThrow(id);
        if (newRole != null && !newRole.isBlank()) {
            try {
                user.setRole(User.Role.valueOf(newRole.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ConflictException("Role phải là ADMIN hoặc CUSTOMER");
            }
        }
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        return UserResponse.from(userRepository.save(user));
    }

    public void delete(Long id) {
        userRepository.delete(findOrThrow(id));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản id = " + id));
    }
}

package dh13c6.nguyentiendat516.bloom.authservice.service;

import dh13c6.nguyentiendat516.bloom.authservice.dto.*;
import dh13c6.nguyentiendat516.bloom.authservice.entity.User;
import dh13c6.nguyentiendat516.bloom.authservice.exception.ConflictException;
import dh13c6.nguyentiendat516.bloom.authservice.exception.InvalidCredentialsException;
import dh13c6.nguyentiendat516.bloom.authservice.exception.NotFoundException;
import dh13c6.nguyentiendat516.bloom.authservice.repository.UserRepository;
import dh13c6.nguyentiendat516.bloom.authservice.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Xac thuc tai khoan va cap JWT.
 *
 * Khac ban monolith o hai diem:
 * - Mat khau luu bang BCrypt, khong con plain text. Ban monolith so sanh bang
 *   password.equals(...) va tra ca entity User (ke ca truong password) ve cho client.
 * - Dang nhap thanh cong tra ve JWT da ky, khong tra ve doi tuong User de client
 *   tu luu role vao localStorage roi tu khai lai qua ?role=ADMIN.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new InvalidCredentialsException("Sai tên đăng nhập hoặc mật khẩu"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            // Cung mot thong bao voi truong hop khong tim thay username, de khong lo ra
            // tai khoan nao co that
            throw new InvalidCredentialsException("Sai tên đăng nhập hoặc mật khẩu");
        }

        return new LoginResponse(user.getId(), jwtUtil.generateToken(user),
                user.getUsername(), user.getRole().name());
    }

    /** Dang ky luon tao tai khoan CUSTOMER - client khong duoc tu chon role. */
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }
        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(User.Role.CUSTOMER);
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse getById(Long id) {
        return UserResponse.from(findOrThrow(id));
    }

    /** Sua ho so cua chinh minh. id luon lay tu token, khong nhan tu URL. */
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        User user = findOrThrow(id);
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.email() != null) user.setEmail(request.email());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.address() != null) user.setAddress(request.address());
        if (request.city() != null) user.setCity(request.city());
        return UserResponse.from(userRepository.save(user));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản id = " + id));
    }
}

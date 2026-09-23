package dh13c6.nguyentiendat516.bloom.authservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * SOS06 - Entity User phuc vu dang nhap va phan quyen thuc hanh.
 * LUU Y: password luu dang text dung theo bai hoc, chi dung cho tai khoan demo local.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(max = 100, message = "Tên đăng nhập tối đa 100 ký tự")
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @NotNull(message = "Role phải là ADMIN hoặc CUSTOMER")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    // ============================================================
    // PHAN MO RONG ngoai SOS01-SOS10: ho so nguoi dung.
    // Tat ca deu CHO PHEP NULL — tai khoan cu tao truoc khi co ho so van dang nhap binh thuong.
    // phone/address/city dong vai tro "dia chi mac dinh", dung de dien san o trang thanh toan.
    // ============================================================

    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    @Column(name = "email", length = 150)
    private String email;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    @Column(name = "phone", length = 20)
    private String phone;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    @Column(name = "address", length = 255)
    private String address;

    @Size(max = 60, message = "Quận / thành phố tối đa 60 ký tự")
    @Column(name = "city", length = 60)
    private String city;

    /** Ten hien thi: uu tien ho ten that, chua co thi dung username. */
    @Transient
    public String getDisplayName() {
        return (fullName != null && !fullName.isBlank()) ? fullName : username;
    }

    /** Da du thong tin de dien san form thanh toan chua. */
    @Transient
    public boolean hasDefaultAddress() {
        return phone != null && !phone.isBlank() && address != null && !address.isBlank();
    }

    public enum Role {
        ADMIN, CUSTOMER
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}

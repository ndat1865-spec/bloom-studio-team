package dh13c6.nguyentiendat516.bloom.authservice.controller;

import dh13c6.nguyentiendat516.bloom.authservice.dto.UserResponse;
import dh13c6.nguyentiendat516.bloom.authservice.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Quan tri tai khoan. Toan bo /users/** da duoc SecurityConfig gioi han cho ROLE_ADMIN. */
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userService.getAll();
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userService.update(id, body.get("role"), body.get("password"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}

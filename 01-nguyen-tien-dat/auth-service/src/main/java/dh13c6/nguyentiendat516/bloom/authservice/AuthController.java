package dh13c6.nguyentiendat516.bloom.authservice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    public record Credentials(
            @jakarta.validation.constraints.NotBlank
            @Pattern(regexp = "[a-zA-Z0-9_]{3,30}", message = "Ten gom 3-30 chu cai, so hoac dau gach duoi") String username,
            @jakarta.validation.constraints.NotBlank
            @Size(min = 6, max = 64, message = "Mat khau dai 6-64 ky tu")
            @Pattern(regexp = "[\\x20-\\x7E]+", message = "Mat khau demo dung ky tu ASCII") String password) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.Profile register(@Valid @RequestBody Credentials input) {
        return service.register(input.username(), input.password());
    }

    @PostMapping("/login")
    public AuthService.Session login(@Valid @RequestBody Credentials input) {
        return service.login(input.username(), input.password());
    }

    @GetMapping("/me")
    public AuthService.Profile me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.me(authorization);
    }
}

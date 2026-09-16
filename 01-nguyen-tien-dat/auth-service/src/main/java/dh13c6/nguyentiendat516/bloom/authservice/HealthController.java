package dh13c6.nguyentiendat516.bloom.authservice;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping({"/", "/health"})
    public Map<String, String> health() {
        return Map.of("service", "auth-service", "status", "UP", "stage", "starter", "owner", "Nguyễn Tiến Đạt");
    }
}

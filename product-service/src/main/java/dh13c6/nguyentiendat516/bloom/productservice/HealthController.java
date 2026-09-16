package dh13c6.nguyentiendat516.bloom.productservice;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping({"/", "/health"})
    public Map<String, String> health() {
        return Map.of("service", "product-service", "status", "UP", "stage", "starter", "owner", "Hoàng Tuấn Anh");
    }
}


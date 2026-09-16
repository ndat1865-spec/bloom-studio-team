package dh13c6.nguyentiendat516.bloom.orderservice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final ProductClient products;
    public OrderController(ProductClient products) { this.products = products; }

    public record PreviewRequest(@NotNull @Positive Long productId, @Min(1) @Max(99) int quantity) {}
    public record Preview(long productId, String productName, int quantity, BigDecimal unitPrice, BigDecimal total, String note) {}

    @GetMapping("/demo")
    public List<Map<String, Object>> demo() {
        return List.of(Map.of("id", "DEMO-001", "productName", "Bo hong do", "quantity", 2, "total", 700000, "status", "DEMO"));
    }

    @PostMapping("/preview")
    public Preview preview(@Valid @RequestBody PreviewRequest request) {
        ProductClient.Product product = products.find(request.productId());
        if (request.quantity() > product.stockQuantity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "So luong vuot ton kho");
        }
        return new Preview(product.id(), product.name(), request.quantity(), product.price(),
                product.price().multiply(BigDecimal.valueOf(request.quantity())), "Chi tinh gia, chua tao don va chua tru ton kho");
    }
}


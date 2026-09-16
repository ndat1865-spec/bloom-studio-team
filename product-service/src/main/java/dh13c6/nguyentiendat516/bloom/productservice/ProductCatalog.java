package dh13c6.nguyentiendat516.bloom.productservice;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductCatalog {
    public record Category(long id, String name) {}
    public record Product(long id, String name, BigDecimal price, long categoryId, int stockQuantity) {}

    private final List<Category> categories = List.of(new Category(1, "Hoa bo"), new Category(2, "Hoa gio"), new Category(3, "Hoa chau"));
    private final List<Product> products = List.of(
            new Product(1, "Bo hong do", new BigDecimal("350000"), 1, 20),
            new Product(2, "Gio huong duong", new BigDecimal("420000"), 2, 12),
            new Product(3, "Chau lan trang", new BigDecimal("650000"), 3, 8));

    public List<Category> categories() { return categories; }

    public List<Product> search(String name) {
        String term = name.strip().toLowerCase(Locale.ROOT);
        return products.stream().filter(p -> p.name().toLowerCase(Locale.ROOT).contains(term)).toList();
    }

    public Product find(long id) {
        return products.stream().filter(p -> p.id() == id).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay san pham"));
    }
}


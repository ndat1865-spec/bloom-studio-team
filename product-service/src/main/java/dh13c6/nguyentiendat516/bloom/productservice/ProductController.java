package dh13c6.nguyentiendat516.bloom.productservice;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {
    private final ProductCatalog catalog;
    public ProductController(ProductCatalog catalog) { this.catalog = catalog; }

    @GetMapping("/products")
    public List<ProductCatalog.Product> products(@RequestParam(defaultValue = "") String name) { return catalog.search(name); }

    @GetMapping("/products/{id}")
    public ProductCatalog.Product product(@PathVariable long id) { return catalog.find(id); }

    @GetMapping("/categories")
    public List<ProductCatalog.Category> categories() { return catalog.categories(); }
}


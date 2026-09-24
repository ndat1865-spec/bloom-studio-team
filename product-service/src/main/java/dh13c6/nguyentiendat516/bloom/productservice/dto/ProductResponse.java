package dh13c6.nguyentiendat516.bloom.productservice.dto;

import dh13c6.nguyentiendat516.bloom.productservice.entity.Product;

/**
 * SOS05 - DTO tra ve cho Product.
 * Dung DTO thay cho @JsonBackReference de: (1) khong lap vong JSON,
 * (2) van giu category {id, name} cho form sua o frontend.
 */
public record ProductResponse(
        Long id,
        String name,
        Double price,
        String description,
        String imageUrl,
        Integer stockQuantity,
        CategorySummary category
) {
    public static ProductResponse from(Product p) {
        CategorySummary cat = (p.getCategory() == null)
                ? null
                : new CategorySummary(p.getCategory().getId(), p.getCategory().getName());
        return new ProductResponse(p.getId(), p.getName(), p.getPrice(), p.getDescription(),
                p.getImageUrl(), p.getStockQuantity(), cat);
    }
}

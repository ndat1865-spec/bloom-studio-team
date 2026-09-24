package dh13c6.nguyentiendat516.bloom.orderservice.client;

/**
 * Anh chup thong tin san pham do product-service tra ve.
 *
 * Chi khai bao nhung truong order-service thuc su dung. product-service tra ve nhieu
 * truong hon (description, stockQuantity, category) - Spring Boot mac dinh bo qua
 * truong la nen khong sao, va day cung la mot loi ich cua giao tiep bang JSON: hai
 * service tien hoa doc lap, them truong moi khong lam vo ben con lai.
 */
public record ProductSnapshot(
        Long id,
        String name,
        Double price,
        String imageUrl
) {
}

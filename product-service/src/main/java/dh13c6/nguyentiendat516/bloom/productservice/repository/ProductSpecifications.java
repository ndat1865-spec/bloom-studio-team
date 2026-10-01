package dh13c6.nguyentiendat516.bloom.productservice.repository;

import dh13c6.nguyentiendat516.bloom.productservice.entity.FlowerColor;
import dh13c6.nguyentiendat516.bloom.productservice.entity.Occasion;
import dh13c6.nguyentiendat516.bloom.productservice.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Ghep dieu kien loc san pham thanh MOT cau truy van duy nhat.
 *
 * Truoc day moi to hop (ten, danh muc, ten + danh muc) la mot phuong thuc repository
 * rieng. Them dip, mau, khoang gia ma van lam kieu do thi so phuong thuc tang theo cap
 * so nhan, nen chuyen sang Specification: dieu kien nao co gia tri thi moi them vao WHERE.
 * Loc, sap xep va phan trang van chay duoi CSDL.
 */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> matching(String name, Long categoryId, Occasion occasion,
                                                  FlowerColor color, Double minPrice, Double maxPrice) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();

            if (name != null && !name.isBlank()) {
                where.add(cb.like(cb.lower(root.get("name")), "%" + name.trim().toLowerCase() + "%"));
            }
            if (categoryId != null) {
                where.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (occasion != null) {
                // Dip nam o bang phu product_occasions -> can JOIN. Moi san pham chi co
                // mot dong khop voi mot dip cu the nen khong bi nhan ban ket qua.
                where.add(cb.equal(root.join("occasions"), occasion));
            }
            if (color != null) {
                where.add(cb.equal(root.get("color"), color));
            }
            if (minPrice != null) {
                where.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                where.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            return cb.and(where.toArray(new Predicate[0]));
        };
    }
}

package dh13c6.nguyentiendat516.bloom.productservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * SOS02 -> SOS05 - Entity Product.
 * price giu kieu Double dung theo mo hinh trong tai lieu.
 */
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 100, message = "Tên sản phẩm tối đa 100 ký tự")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotNull(message = "Giá không được để trống")
    @PositiveOrZero(message = "Giá không được âm")
    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    /**
     * Ton kho. Truong nay KHONG co o ban monolith - them khi tach service.
     * Hoa tuoi moi ngay chi co so luong nhat dinh, va day cung la cho duy nhat
     * order-service phai goi sang product-service (reserve-stock / release-stock).
     * Chi duoc thay doi qua hai API noi bo do, khong sua truc tiep qua PUT /products/{id}.
     */
    @NotNull(message = "Tồn kho không được để trống")
    @PositiveOrZero(message = "Tồn kho không được âm")
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    /**
     * SOS05 - phia "con" cua quan he 1-N.
     * Khong dung @JsonBackReference: response duoc build bang DTO (ProductResponse)
     * de van tra ve category {id, name} cho form sua o frontend.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    public Product() {
    }

    public Product(Long id, String name, Double price, String description, String imageUrl,
                   Integer stockQuantity, Category category) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.stockQuantity = stockQuantity;
        this.category = category;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}

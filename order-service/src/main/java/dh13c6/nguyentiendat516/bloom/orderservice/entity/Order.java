package dh13c6.nguyentiendat516.bloom.orderservice.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Don hang — PHAN MO RONG ngoai SOS01-SOS10.
 *
 * Bang "orders" la bang moi, khong sua doi products / categories / users.
 * Moi con so tien deu do tang Service tinh lai tu bang products, khong tin gia client gui len.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ma don hien thi cho khach, vi du BS-8F3A21C7. */
    @Column(name = "code", nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "subtotal", nullable = false)
    private Double subtotal;

    @Column(name = "delivery_fee", nullable = false)
    private Double deliveryFee;

    @Column(name = "total", nullable = false)
    private Double total;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    /**
     * Chu don hang. Null khi khach chua dang nhap - khach vang lai van dat hang duoc.
     *
     * KHONG con @ManyToOne User: sau khi tach service, du lieu tai khoan nam o DB cua
     * auth-service nen khong the co khoa ngoai that. Chi luu id dang so; ten va so dien
     * thoai nguoi nhan da duoc chup lai vao chinh don hang o cac truong ben tren.
     */
    @Column(name = "user_id")
    private Long userId;

    /**
     * Ten tai khoan dat don, CHUP LAI tu claim "sub" cua JWT tai thoi diem dat hang.
     *
     * Vi sao chup lai thay vi goi sang auth-service moi lan hien danh sach don: trang
     * quan tri liet ke 20 don mot trang, neu tra cuu tung don se thanh 20 loi goi mang.
     * Chup lai cung dung ve nghiep vu - doi tai khoan sau nay khong duoc lam doi lich su don cu.
     */
    @Column(name = "username", length = 100)
    private String username;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }

    /** Gan hai chieu de JPA luu duoc khoa ngoai order_id. */
    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(Double deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
}

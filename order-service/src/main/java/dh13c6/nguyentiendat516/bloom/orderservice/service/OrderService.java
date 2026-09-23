package dh13c6.nguyentiendat516.bloom.orderservice.service;

import dh13c6.nguyentiendat516.bloom.orderservice.client.ProductClient;
import dh13c6.nguyentiendat516.bloom.orderservice.client.ProductSnapshot;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.CreateOrderRequest;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.OrderLineRequest;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.Order;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.OrderItem;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.OrderStatus;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.BadRequestException;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.ConflictException;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.NotFoundException;
import dh13c6.nguyentiendat516.bloom.orderservice.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Nghiep vu don hang.
 *
 * Khac ban monolith o cho quan trong nhat: gia va ton kho khong con doc tu CSDL cua
 * chinh minh nua ma phai goi sang product-service. Doan code nay vi the phai xu ly
 * them nhung tinh huong monolith khong bao gio gap.
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public static final double FREE_DELIVERY_THRESHOLD = 80.0;
    public static final double DELIVERY_FEE = 6.50;

    private final OrderRepository orderRepository;
    private final ProductClient productClient;

    public OrderService(OrderRepository orderRepository, ProductClient productClient) {
        this.orderRepository = orderRepository;
        this.productClient = productClient;
    }

    /**
     * Dat hang.
     *
     * KHONG dung @Transactional bao ca ham: transaction cua MySQL chi quan duoc cac bang
     * trong bloom_order, no khong the rollback viec da tru ton kho ben product-service.
     * Vi vay phai tu bu tru bang tay - xem khoi catch ben duoi.
     *
     * userId lay tu JWT da xac thuc, KHONG nhan tu body. Ban monolith nhan userId tu
     * client va da tu ghi nhan day la han che cua no.
     */
    public Order createOrder(Long userId, String username, CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Giỏ hàng đang trống");
        }
        if (request.deliveryDate() != null && request.deliveryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Ngày giao hàng không được ở quá khứ");
        }

        Order order = new Order();
        order.setCode(generateCode());
        order.setCustomerName(request.customerName().trim());
        order.setPhone(request.phone().trim());
        order.setAddress(request.address().trim());
        order.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        order.setDeliveryDate(request.deliveryDate());
        order.setStatus(OrderStatus.PENDING);
        order.setUserId(userId);
        order.setUsername(username);

        Map<Long, Integer> lines = mergeLines(request.items());
        List<Map.Entry<Long, Integer>> daTruKho = new ArrayList<>();
        double subtotal = 0.0;

        try {
            for (Map.Entry<Long, Integer> entry : lines.entrySet()) {
                Long productId = entry.getKey();
                int quantity = entry.getValue();

                // Mot loi goi lam ca hai viec: tru ton kho VA lay ve ten, gia, anh.
                // Gia lay tu product-service, khong bao gio tin gia client gui len.
                ProductSnapshot snapshot = productClient.reserveStock(productId, quantity);
                daTruKho.add(entry);

                double unitPrice = snapshot.price() == null ? 0.0 : snapshot.price();
                double lineTotal = round2(unitPrice * quantity);

                OrderItem item = new OrderItem();
                item.setProductId(productId);
                item.setProductName(snapshot.name());
                item.setUnitPrice(round2(unitPrice));
                item.setImageUrl(snapshot.imageUrl());
                item.setQuantity(quantity);
                item.setLineTotal(lineTotal);
                order.addItem(item);

                subtotal += lineTotal;
            }

            double roundedSubtotal = round2(subtotal);
            double fee = roundedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0.0 : DELIVERY_FEE;
            order.setSubtotal(roundedSubtotal);
            order.setDeliveryFee(fee);
            order.setTotal(round2(roundedSubtotal + fee));

            return orderRepository.save(order);

        } catch (RuntimeException ex) {
            // BU TRU: mot dong loi thi phai tra lai ton kho cho nhung dong da tru truoc do,
            // neu khong kho hang se hao dan sau moi don dat that bai giua chung.
            hoanTraTonKho(daTruKho);
            throw ex;
        }
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng id = " + id));
    }

    public Page<Order> getOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<Order> getOrdersByUser(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Order updateStatus(Long id, OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    /** Huy don: hoan tra ton kho truoc roi moi doi trang thai. */
    public Order cancel(Long id) {
        Order order = getOrderById(id);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Đơn hàng này đã bị huỷ trước đó");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new ConflictException("Đơn hàng đã giao thì không huỷ được");
        }
        for (OrderItem item : order.getItems()) {
            if (item.getProductId() != null) {
                productClient.releaseStock(item.getProductId(), item.getQuantity());
            }
        }
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    // ===================== HO TRO =====================

    private void hoanTraTonKho(List<Map.Entry<Long, Integer>> daTruKho) {
        for (Map.Entry<Long, Integer> e : daTruKho) {
            try {
                productClient.releaseStock(e.getKey(), e.getValue());
            } catch (RuntimeException ignored) {
                // Chi ghi log, khong nem tiep: nem o day se che mat loi goc khien nguoi
                // dung nhan duoc thong bao sai.
                // GIOI HAN DA BIET: luc nay ton kho bi lech, phai doi soat lai bang tay.
                // Cach lam dung trong thuc te la Saga pattern hoac hang doi bu tru.
                log.error("Hoàn trả tồn kho thất bại cho sản phẩm id = {}, số lượng {}",
                        e.getKey(), e.getValue());
            }
        }
    }

    /** Gop cac dong trung productId lai, so luong cong don. */
    private Map<Long, Integer> mergeLines(Iterable<OrderLineRequest> lines) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        for (OrderLineRequest line : lines) {
            merged.merge(line.productId(), line.quantity(), Integer::sum);
        }
        return merged;
    }

    private String generateCode() {
        return "BLM" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(100, 1000);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

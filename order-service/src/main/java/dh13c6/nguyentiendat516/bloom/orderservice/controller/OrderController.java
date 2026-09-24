package dh13c6.nguyentiendat516.bloom.orderservice.controller;

import dh13c6.nguyentiendat516.bloom.orderservice.dto.*;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.Order;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.NotFoundException;
import dh13c6.nguyentiendat516.bloom.orderservice.service.OrderOverviewService;
import dh13c6.nguyentiendat516.bloom.orderservice.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Don hang.
 *
 * userId LUON lay tu JWT da xac thuc, khong bao gio nhan tu body hay query param.
 * Chi tiet mot don con kiem tra nguoi goi dung la chu don - neu khong, khach A chi
 * can doi so tren URL la doc duoc don cua khach B (lo hong IDOR).
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderOverviewService orderOverviewService;

    public OrderController(OrderService orderService,
                           OrderOverviewService orderOverviewService) {
        this.orderService = orderService;
        this.orderOverviewService = orderOverviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(Authentication authentication,
                                @Valid @RequestBody CreateOrderRequest request) {
        return OrderResponse.from(orderService.createOrder(
                currentUserId(authentication), authentication.getName(), request));
    }

    /** Don cua chinh toi. */
    @GetMapping("/my")
    public PageResponse<OrderResponse> myOrders(Authentication authentication, Pageable pageable) {
        Page<Order> page = orderService.getOrdersByUser(currentUserId(authentication), pageable);
        return PageResponse.from(page, OrderResponse::from);
    }

    /**
     * So lieu tong quan - chi ADMIN, khai o SecurityConfig.
     *
     * Chi tra phan order-service tu tinh duoc. Ba con so tong san pham / danh muc /
     * khach hang do frontend goi rieng tung service roi ghep lai, vi chung thuoc
     * CSDL ma service nay khong duoc phep doc.
     */
    @GetMapping("/overview")
    public OrderOverviewResponse overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return orderOverviewService.getOverview(from, to);
    }

    /** Toan bo don - chi ADMIN, khai o SecurityConfig. */
    @GetMapping
    public PageResponse<OrderResponse> getAll(Pageable pageable) {
        return PageResponse.from(orderService.getOrders(pageable), OrderResponse::from);
    }

    @GetMapping("/{id}")
    public OrderResponse getById(Authentication authentication, @PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        requireOwnerOrAdmin(authentication, order);
        return OrderResponse.from(order);
    }

    /** Doi trang thai - chi ADMIN, khai o SecurityConfig. */
    @PutMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id,
                                      @Valid @RequestBody UpdateOrderStatusRequest request) {
        return OrderResponse.from(orderService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public OrderResponse cancel(Authentication authentication, @PathVariable Long id) {
        requireOwnerOrAdmin(authentication, orderService.getOrderById(id));
        return OrderResponse.from(orderService.cancel(id));
    }

    // ===================== HO TRO =====================

    /** JwtAuthFilter dat userId vao o credentials cua Authentication. */
    private Long currentUserId(Authentication authentication) {
        return (Long) authentication.getCredentials();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /**
     * Tra 404 chu khong phai 403 khi khong phai chu don: bao 403 la vo tinh xac nhan
     * don hang do co that, giup ke to mo do duoc so luong don cua he thong.
     */
    private void requireOwnerOrAdmin(Authentication authentication, Order order) {
        if (isAdmin(authentication)) {
            return;
        }
        Long userId = currentUserId(authentication);
        if (order.getUserId() == null || !order.getUserId().equals(userId)) {
            throw new NotFoundException("Không tìm thấy đơn hàng id = " + order.getId());
        }
    }
}

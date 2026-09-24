package dh13c6.nguyentiendat516.bloom.orderservice.dto;

import dh13c6.nguyentiendat516.bloom.orderservice.entity.Order;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Don hang tra ve cho client. Khong lo thong tin tai khoan ngoai username. */
public record OrderResponse(
        Long id,
        String code,
        String customerName,
        String phone,
        String address,
        String note,
        LocalDate deliveryDate,
        Double subtotal,
        Double deliveryFee,
        Double total,
        String status,
        Instant createdAt,
        String username,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getCode(),
                order.getCustomerName(),
                order.getPhone(),
                order.getAddress(),
                order.getNote(),
                order.getDeliveryDate(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getTotal(),
                order.getStatus().name(),
                order.getCreatedAt(),
                order.getUsername(),
                order.getItems().stream().map(OrderItemResponse::from).toList());
    }
}

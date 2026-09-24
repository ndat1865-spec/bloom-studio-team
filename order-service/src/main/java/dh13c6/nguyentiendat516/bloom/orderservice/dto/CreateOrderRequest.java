package dh13c6.nguyentiendat516.bloom.orderservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/** Body cua POST /api/orders. */
public record CreateOrderRequest(
        @NotBlank(message = "Tên người nhận không được để trống")
        @Size(min = 2, max = 100, message = "Tên người nhận cần 2 đến 100 ký tự")
        String customerName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Size(min = 8, max = 20, message = "Số điện thoại cần 8 đến 20 ký tự")
        String phone,

        @NotBlank(message = "Địa chỉ giao hàng không được để trống")
        @Size(min = 5, max = 255, message = "Địa chỉ cần 5 đến 255 ký tự")
        String address,

        @Size(max = 500, message = "Lời nhắn tối đa 500 ký tự")
        String note,

        LocalDate deliveryDate,

        // KHONG co userId: chu don luon lay tu JWT da xac thuc trong
        // OrderController, khong bao gio tin gia tri client gui len. Neu de o day
        // thi khach A chi can sua mot so trong body la dat hang duoc duoi ten khach B.

        @NotEmpty(message = "Giỏ hàng đang trống")
        @Valid
        List<OrderLineRequest> items
) {
}

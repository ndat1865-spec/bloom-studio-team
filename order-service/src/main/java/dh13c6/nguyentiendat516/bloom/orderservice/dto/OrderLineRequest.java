package dh13c6.nguyentiendat516.bloom.orderservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Mot dong gio hang client gui len.
 *
 * CHI co productId va quantity. Gia KHONG nam o day: server tu doc gia tu bang products,
 * de client khong the tu dat gia bang DevTools.
 */
public record OrderLineRequest(
        @NotNull(message = "Thiếu mã sản phẩm") Long productId,
        @NotNull(message = "Thiếu số lượng")
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        @Max(value = 99, message = "Số lượng tối đa là 99")
        Integer quantity
) {
}

package dh13c6.nguyentiendat516.bloom.orderservice.controller;

import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.PublicVoucher;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.VoucherCheckRequest;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.VoucherCheckResponse;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.VoucherRequest;
import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.VoucherResponse;
import dh13c6.nguyentiendat516.bloom.orderservice.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ma giam gia. Quyen tung duong dan khai o SecurityConfig:
 *  - GET  /vouchers/public : ai cung xem duoc (goi y o trang thanh toan)
 *  - POST /vouchers/check  : can dang nhap (quy tac "moi tai khoan mot lan" can biet la ai)
 *  - con lai               : chi ADMIN
 */
@RestController
@RequestMapping("/vouchers")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping("/public")
    public List<PublicVoucher> usableNow() {
        return voucherService.listUsableNow().stream().map(PublicVoucher::from).toList();
    }

    /**
     * Vi ma cua toi: ma chung dang chay + ma rieng cua toi, kem danh gia cho don `amount`
     * (bo trong = chi xem con dung duoc khong). Dung cho trang "Ma giam gia cua toi" va popup
     * chon ma o trang dat hoa.
     */
    @GetMapping("/mine")
    public List<VoucherDtos.MyVoucher> mine(Authentication authentication,
                                           @RequestParam(required = false) Double amount) {
        return voucherService.wallet((Long) authentication.getCredentials(), amount).stream()
                .map(a -> new VoucherDtos.MyVoucher(a.voucher().getCode(), a.voucher().getDescription(),
                        a.voucher().getType().name(), a.voucher().getValue(), a.voucher().getMaxDiscount(),
                        a.voucher().getMinOrderValue(), a.voucher().getStartDate(), a.voucher().getEndDate(),
                        a.voucher().isPersonal(), a.status(), a.reason(), a.discount()))
                .toList();
    }

    /** Xem truoc so tien giam. Khong ghi gi xuong CSDL, khong tru luot dung. */
    @PostMapping("/check")
    public VoucherCheckResponse check(Authentication authentication,
                                      @Valid @RequestBody VoucherCheckRequest request) {
        VoucherService.Quote quote = voucherService.evaluate(
                request.code(), request.amount(), (Long) authentication.getCredentials());
        return new VoucherCheckResponse(quote.voucher().getCode(), quote.voucher().getDescription(),
                quote.discount());
    }

    // ===================== ADMIN =====================

    @GetMapping
    public List<VoucherResponse> listAll() {
        return voucherService.listAll().stream().map(VoucherResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VoucherResponse create(@Valid @RequestBody VoucherRequest request) {
        return VoucherResponse.from(voucherService.create(request));
    }

    @PutMapping("/{id}")
    public VoucherResponse update(@PathVariable Long id, @Valid @RequestBody VoucherRequest request) {
        return VoucherResponse.from(voucherService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        voucherService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

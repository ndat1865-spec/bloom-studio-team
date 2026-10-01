package dh13c6.nguyentiendat516.bloom.orderservice.service;

import dh13c6.nguyentiendat516.bloom.orderservice.dto.VoucherDtos.VoucherRequest;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.Order;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.Voucher;
import dh13c6.nguyentiendat516.bloom.orderservice.entity.VoucherRedemption;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.BadRequestException;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.ConflictException;
import dh13c6.nguyentiendat516.bloom.orderservice.exception.NotFoundException;
import dh13c6.nguyentiendat516.bloom.orderservice.repository.OrderRepository;
import dh13c6.nguyentiendat516.bloom.orderservice.repository.VoucherRedemptionRepository;
import dh13c6.nguyentiendat516.bloom.orderservice.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/**
 * Nghiep vu ma giam gia.
 *
 * Cac quy tac (kiem tra theo thu tu, bao dung ly do cho khach):
 *  1. Ma ton tai            2. Dang bat
 *  3. Da toi ngay bat dau   4. Chua qua ngay het han
 *  5. Con luot dung         6. Tai khoan nay chua dung (neu ma gioi han moi nguoi mot lan)
 *  7. Don dat gia tri toi thieu
 */
@Service
public class VoucherService {

    /** Ket qua ap ma: ma nao, giam bao nhieu. */
    public record Quote(Voucher voucher, double discount) {
    }

    /** Danh gia mot ma cho mot don - khong nem loi, de hien trong vi / popup chon ma. */
    public record Assessment(Voucher voucher, String status, String reason, double discount) {
        public boolean usable() {
            return "USABLE".equals(status);
        }
    }

    private final VoucherRepository voucherRepository;
    private final VoucherRedemptionRepository redemptionRepository;
    private final OrderRepository orderRepository;

    public VoucherService(VoucherRepository voucherRepository,
                          VoucherRedemptionRepository redemptionRepository,
                          OrderRepository orderRepository) {
        this.voucherRepository = voucherRepository;
        this.redemptionRepository = redemptionRepository;
        this.orderRepository = orderRepository;
    }

    // ===================== AP MA =====================

    /**
     * Kiem tra ma va tinh so tien giam tren gia tri don amount.
     * Nem BadRequestException kem ly do cu the khi ma khong dung duoc.
     */
    public Quote evaluate(String rawCode, double amount, Long userId) {
        Voucher v = voucherRepository.findByCode(normalize(rawCode))
                // Ma rieng cua nguoi khac: bao "khong ton tai" - khong xac nhan ma do co that
                .filter(found -> !found.isPersonal() || found.getOwnerUserId().equals(userId))
                .orElseThrow(() -> new BadRequestException("Mã giảm giá không tồn tại"));
        Assessment a = assess(v, amount, userId);
        if (!a.usable()) {
            throw new BadRequestException(a.reason());
        }
        return new Quote(v, a.discount());
    }

    /**
     * Danh gia ma v cho don `amount` cua userId, theo dung thu tu quy tac o dau lop.
     * amount null = chi xet ma con dung duoc khong, bo qua dieu kien don toi thieu.
     * "Hom nay" theo gio Viet Nam: container chay UTC, 0h - 7h sang se lech mot ngay.
     */
    public Assessment assess(Voucher v, Double amount, Long userId) {
        LocalDate today = LocalDate.now(DeliveryPolicy.SHOP_ZONE);
        if (!v.isActive()) {
            return new Assessment(v, "INACTIVE", "Mã " + v.getCode() + " đã ngừng áp dụng", 0);
        }
        if (v.getStartDate() != null && today.isBefore(v.getStartDate())) {
            return new Assessment(v, "NOT_STARTED", "Mã " + v.getCode() + " chưa đến ngày áp dụng", 0);
        }
        if (v.getEndDate() != null && today.isAfter(v.getEndDate())) {
            return new Assessment(v, "EXPIRED", "Mã " + v.getCode() + " đã hết hạn", 0);
        }
        if (v.getUsageLimit() != null && v.getUsedCount() >= v.getUsageLimit()) {
            return new Assessment(v, "USED_UP", "Mã " + v.getCode() + " đã hết lượt sử dụng", 0);
        }
        if (v.isOnePerCustomer() && userId != null
                && redemptionRepository.existsByVoucherIdAndUserId(v.getId(), userId)) {
            return new Assessment(v, "ALREADY_USED",
                    "Bạn đã dùng mã " + v.getCode() + " rồi, mỗi tài khoản chỉ dùng một lần", 0);
        }
        double min = v.getMinOrderValue() == null ? 0 : v.getMinOrderValue();
        if (amount != null && amount < min) {
            // Tien VND, tach hang nghin bang dau cham: 800.000d
            return new Assessment(v, "BELOW_MIN", String.format(Locale.forLanguageTag("vi-VN"),
                    "Mã %s áp dụng cho đơn từ %,.0fđ (đơn hiện tại %,.0fđ)", v.getCode(), min, amount), 0);
        }
        return new Assessment(v, "USABLE", null, amount == null ? 0 : discountFor(v, amount));
    }

    /**
     * Vi ma cua khach: ma chung dang chay + moi ma rieng cua khach (ca da dung / het han, de
     * khach thay lich su). Ma dung duoc len truoc, giam nhieu nhat truoc.
     */
    public List<Assessment> wallet(Long userId, Double amount) {
        List<Assessment> out = new java.util.ArrayList<>();
        for (Voucher v : voucherRepository.findByOwnerUserIdOrderByCreatedAtDesc(userId)) {
            out.add(assess(v, amount, userId));
        }
        for (Voucher v : voucherRepository.findByActiveTrueAndOwnerUserIdIsNullOrderByCreatedAtDesc()) {
            Assessment a = assess(v, amount, userId);
            // Ma chung da het han / het luot / chua mo thi khong nhoi vao vi
            if (a.usable() || "BELOW_MIN".equals(a.status()) || "ALREADY_USED".equals(a.status())) {
                out.add(a);
            }
        }
        out.sort(java.util.Comparator
                .comparing((Assessment a) -> !a.usable())
                .thenComparing(a -> -a.discount())
                .thenComparing(a -> !a.voucher().isPersonal()));
        return out;
    }

    /**
     * Luu don VA ghi nhan luot dung ma trong CUNG mot transaction.
     *
     * Tang luot dung bang UPDATE co dieu kien (xem VoucherRepository): neu giua luc
     * evaluate() va luc nay co nguoi khac lay mat luot cuoi, cau lenh tra ve 0 -> 409,
     * transaction rollback, don khong duoc luu. OrderService bat loi nay va hoan ton kho.
     */
    @Transactional
    public Order saveWithVoucher(Order order, Quote quote, Long userId) {
        if (quote == null) {
            return orderRepository.save(order);
        }
        if (voucherRepository.tryIncrementUsage(quote.voucher().getId()) == 0) {
            throw new ConflictException("Mã " + quote.voucher().getCode() + " vừa hết lượt sử dụng");
        }
        Order saved = orderRepository.save(order);
        redemptionRepository.save(new VoucherRedemption(quote.voucher().getId(), userId, saved.getId()));
        return saved;
    }

    /** Huy don -> tra lai luot dung ma, de khach dat lai don khac van dung duoc ma. */
    @Transactional
    public void releaseFor(Order order) {
        redemptionRepository.findByOrderId(order.getId()).ifPresent(redemption -> {
            voucherRepository.decrementUsage(redemption.getVoucherId());
            redemptionRepository.delete(redemption);
        });
    }

    /** Ma dang dung duoc - hien goi y o trang thanh toan. */
    public List<Voucher> listUsableNow() {
        LocalDate today = LocalDate.now(DeliveryPolicy.SHOP_ZONE);
        // Chi ma chung - ma rieng cua ai thi chi nguoi do thay trong vi
        return voucherRepository.findByActiveTrueAndOwnerUserIdIsNullOrderByCreatedAtDesc().stream()
                .filter(v -> v.getStartDate() == null || !today.isBefore(v.getStartDate()))
                .filter(v -> v.getEndDate() == null || !today.isAfter(v.getEndDate()))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit())
                .toList();
    }

    // ===================== QUAN TRI =====================

    public List<Voucher> listAll() {
        return voucherRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Voucher create(VoucherRequest request) {
        String code = normalize(request.code());
        if (voucherRepository.existsByCode(code)) {
            throw new ConflictException("Mã " + code + " đã tồn tại");
        }
        Voucher v = new Voucher();
        v.setCode(code);
        apply(v, request);
        return voucherRepository.save(v);
    }

    @Transactional
    public Voucher update(Long id, VoucherRequest request) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mã giảm giá id = " + id));
        String code = normalize(request.code());
        if (!code.equals(v.getCode())) {
            // Doi ma cua mot ma da co nguoi dung se lam lich su don kho doi chieu
            if (v.getUsedCount() > 0) {
                throw new ConflictException("Mã đã có người dùng, không đổi tên mã được nữa");
            }
            if (voucherRepository.existsByCode(code)) {
                throw new ConflictException("Mã " + code + " đã tồn tại");
            }
            v.setCode(code);
        }
        apply(v, request);
        return voucherRepository.save(v);
    }

    /** Ma da co nguoi dung thi khong xoa - chi tat (active = false) de giu lich su. */
    @Transactional
    public void delete(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mã giảm giá id = " + id));
        if (v.getUsedCount() > 0) {
            throw new ConflictException("Mã đã được dùng " + v.getUsedCount()
                    + " lần, không xoá được. Hãy tắt mã thay vì xoá");
        }
        voucherRepository.delete(v);
    }

    // ===================== HO TRO =====================

    private void apply(Voucher v, VoucherRequest r) {
        if (r.type() == Voucher.Type.PERCENT && r.value() > 100) {
            throw new BadRequestException("Giảm theo phần trăm tối đa 100%");
        }
        if (r.startDate() != null && r.endDate() != null && r.endDate().isBefore(r.startDate())) {
            throw new BadRequestException("Ngày hết hạn phải sau ngày bắt đầu");
        }
        if (r.usageLimit() != null && r.usageLimit() < v.getUsedCount()) {
            throw new BadRequestException("Số lượt tối đa không được nhỏ hơn số lượt đã dùng ("
                    + v.getUsedCount() + ")");
        }
        v.setDescription(r.description() == null || r.description().isBlank() ? null : r.description().trim());
        v.setType(r.type());
        v.setValue(round2(r.value()));
        // Tran giam chi co nghia voi kieu phan tram
        v.setMaxDiscount(r.type() == Voucher.Type.PERCENT && r.maxDiscount() != null && r.maxDiscount() > 0
                ? round2(r.maxDiscount()) : null);
        v.setMinOrderValue(r.minOrderValue() == null ? 0.0 : round2(r.minOrderValue()));
        v.setStartDate(r.startDate());
        v.setEndDate(r.endDate());
        v.setUsageLimit(r.usageLimit());
        v.setOnePerCustomer(Boolean.TRUE.equals(r.onePerCustomer()));
        v.setActive(r.active() == null || r.active());
        // Ma rieng: ADMIN chon khach tu danh sach tai khoan (chi ADMIN goi duoc API nay)
        if (r.ownerUserId() != null) {
            if (r.ownerUsername() == null || r.ownerUsername().isBlank()) {
                throw new BadRequestException("Thiếu tên đăng nhập của khách được tặng mã");
            }
            if (v.getUsedCount() > 0 && !r.ownerUserId().equals(v.getOwnerUserId())) {
                throw new ConflictException("Mã đã có người dùng, không đổi người sở hữu được");
            }
            v.setOwnerUserId(r.ownerUserId());
            v.setOwnerUsername(r.ownerUsername().trim());
        } else {
            v.setOwnerUserId(null);
            v.setOwnerUsername(null);
        }
    }

    private double discountFor(Voucher v, double amount) {
        double discount = v.getType() == Voucher.Type.PERCENT
                ? amount * v.getValue() / 100.0
                : v.getValue();
        if (v.getType() == Voucher.Type.PERCENT && v.getMaxDiscount() != null) {
            discount = Math.min(discount, v.getMaxDiscount());
        }
        // Khong bao gio giam qua gia tri don
        return round2(Math.min(discount, amount));
    }

    private static String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

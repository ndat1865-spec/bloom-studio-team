package dh13c6.nguyentiendat516.bloom.orderservice.repository;

import dh13c6.nguyentiendat516.bloom.orderservice.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Phan mo rong ngoai SOS01-SOS10: repository cho don hang. */
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByCode(String code);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** PHAN MO RONG: don cua rieng mot tai khoan, moi nhat truoc. */
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    /** PHAN MO RONG: don trong mot khoang thoi gian, phuc vu trang Tong quan cua ADMIN. */
    List<Order> findByCreatedAtBetween(Instant start, Instant end);

    boolean existsByCode(String code);
}

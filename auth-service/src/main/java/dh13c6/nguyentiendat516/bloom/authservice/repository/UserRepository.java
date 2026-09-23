package dh13c6.nguyentiendat516.bloom.authservice.repository;

import dh13c6.nguyentiendat516.bloom.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** SOS06 - Repository cho User. */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRole(User.Role role);
}

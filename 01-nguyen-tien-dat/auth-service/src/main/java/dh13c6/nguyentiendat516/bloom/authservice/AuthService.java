package dh13c6.nguyentiendat516.bloom.authservice;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import javax.crypto.SecretKey;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final Map<String, Account> accounts = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    // Khoa chi nam trong RAM; khoi dong lai se huy cac token cu.
    private final SecretKey key = Jwts.SIG.HS256.key().build();

    private record Account(long id, String username, String passwordHash, String role) {}
    public record Profile(long id, String username, String role) {}
    public record Session(String token, Profile user) {}

    public AuthService() {
        register("demo", "bloom123");
    }

    public Profile register(String username, String password) {
        Account account = new Account(sequence.incrementAndGet(), username, encoder.encode(password), "CUSTOMER");
        if (accounts.putIfAbsent(username, account) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten dang nhap da ton tai");
        }
        return profile(account);
    }

    public Session login(String username, String password) {
        Account account = accounts.get(username);
        if (account == null || !encoder.matches(password, account.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai ten dang nhap hoac mat khau");
        }
        Date now = new Date();
        String token = Jwts.builder().subject(account.username()).claim("userId", account.id())
                .claim("role", account.role()).issuedAt(now)
                .expiration(new Date(now.getTime() + 3600000)).signWith(key).compact();
        return new Session(token, profile(account));
    }

    public Profile me(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Can Bearer token");
        }
        try {
            String username = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(authorization.substring(7)).getPayload().getSubject();
            Account account = accounts.get(username);
            if (account == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai");
            }
            return profile(account);
        } catch (JwtException | IllegalArgumentException error) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token khong hop le hoac het han");
        }
    }

    private Profile profile(Account account) {
        return new Profile(account.id(), account.username(), account.role());
    }
}

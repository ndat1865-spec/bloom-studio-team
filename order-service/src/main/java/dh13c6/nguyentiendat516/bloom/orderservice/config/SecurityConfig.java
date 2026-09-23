package dh13c6.nguyentiendat516.bloom.orderservice.config;

import dh13c6.nguyentiendat516.bloom.orderservice.security.JwtAuthFilter;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // BAT BUOC. authenticationEntryPoint goi sendError(), servlet container
                    // chuyen tiep sang /error. Neu khong mo lan chuyen tiep nay thi no lai
                    // roi vao anyRequest().authenticated() - o che do STATELESS lan chuyen
                    // tiep khong mang theo authentication nen bi chan, goi lai entry point,
                    // ra 401 rong. Hau qua: MOI loi deu hien thanh 401, ke ca 404 va 500,
                    // che mat loi that va rat kho tim.
                    .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
                    // Doi trang thai don va xem toan bo don: chi ADMIN
                    .requestMatchers(HttpMethod.PUT, "/orders/*/status").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/orders", "/orders/overview").hasRole("ADMIN")
                    // Con lai chi can dang nhap; quyen tren tung don do OrderController
                    // kiem tra (chu don hoac ADMIN) vi no phu thuoc du lieu, khong the
                    // khai bang duong dan duoc.
                    .anyRequest().authenticated())
            // BAT BUOC: mac dinh Spring Security tra 403 cho ca truong hop THIEU token,
            // sai quy uoc ma frontend dua vao de tu dang xuat khi het phien.
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                    (req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

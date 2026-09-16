package dh13c6.nguyentiendat516.bloom.orderservice;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ProductClient {
    public record Product(long id, String name, BigDecimal price, long categoryId, int stockQuantity) {}
    private final RestClient client;

    public ProductClient(@Value("${product.service.url}") String baseUrl) {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(3));
        client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public Product find(long id) {
        try {
            Product product = client.get().uri("/products/{id}", id).retrieve().body(Product.class);
            if (product == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Product Service tra du lieu rong");
            }
            return product;
        } catch (HttpClientErrorException.NotFound error) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay san pham");
        } catch (RestClientException error) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Product Service chua san sang");
        }
    }
}


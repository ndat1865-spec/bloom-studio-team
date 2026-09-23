package dh13c6.nguyentiendat516.bloom.authservice.dto;

import java.util.List;

/**
 * Ket qua kiem tra key, chi tra cho api-gateway qua /internal/**.
 *
 * reason chi de Gateway ghi log va chon ma trang thai, KHONG duoc chuyen nguyen van
 * ve cho doi tac: noi ro "key da bi thu hoi" hay "key khong ton tai" la cho ke do
 * biet chuoi nao tung la key that.
 */
public record ApiKeyValidationResponse(
        boolean valid,
        String reason,
        String ownerName,
        List<String> scopes
) {

    public static ApiKeyValidationResponse valid(String ownerName, List<String> scopes) {
        return new ApiKeyValidationResponse(true, "OK", ownerName, scopes);
    }

    public static ApiKeyValidationResponse invalid(String reason) {
        return new ApiKeyValidationResponse(false, reason, null, List.of());
    }
}

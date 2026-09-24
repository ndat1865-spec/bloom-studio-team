package dh13c6.nguyentiendat516.bloom.productservice;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * File du lieu seed va thu muc anh phai luon khop nhau.
 *
 * Khong co test nay thi doi ten mot file anh, hoac them mot dong seed tro toi anh khong
 * ton tai, se khong ai biet cho toi luc mo cua hang tren trinh duyet va thay o trong.
 */
class SeedCatalogueTests {

    private static final int SO_COT = 6;

    @Test
    void seedFileIsWellFormedAndEveryImageExists() throws Exception {
        List<String[]> dong = docFileSeed();

        assertEquals(20, dong.size(), "So san pham seed thay doi ngoai y muon");

        Set<String> ten = new LinkedHashSet<>();
        Set<String> danhMuc = new LinkedHashSet<>();
        for (String[] cot : dong) {
            String tenSanPham = cot[0].trim();
            assertFalse(tenSanPham.isEmpty(), "Ten san pham rong");
            assertTrue(ten.add(tenSanPham), "Ten san pham bi trung: " + tenSanPham);

            assertTrue(Double.parseDouble(cot[1].trim()) > 0, "Gia khong hop le: " + tenSanPham);
            assertTrue(Integer.parseInt(cot[2].trim()) >= 0, "Ton kho am: " + tenSanPham);

            String anh = cot[3].trim();
            assertTrue(anh.startsWith("uploads/seed/"),
                    "Anh seed phai nam trong classpath, khong phu thuoc thu muc lam viec: " + anh);
            assertTrue(new ClassPathResource("static/" + anh).exists(),
                    "Thieu file anh cho san pham " + tenSanPham + ": " + anh);

            danhMuc.add(cot[4].trim());
            assertFalse(cot[5].trim().isEmpty(), "Mo ta rong: " + tenSanPham);
        }

        assertEquals(Set.of("Bespoke Arrangements", "Event Florals", "Wedding Flowers"), danhMuc);
    }

    private List<String[]> docFileSeed() throws Exception {
        List<String[]> ketQua = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("seed/danh-muc-hoa.txt").getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                String[] cot = line.split(Pattern.quote("|"), SO_COT);
                assertEquals(SO_COT, cot.length, "Dong seed thieu cot: " + line);
                ketQua.add(cot);
            }
        }
        return ketQua;
    }
}

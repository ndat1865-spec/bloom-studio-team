package dh13c6.nguyentiendat516.bloom.chatservice.bot;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Nhan dien dip va ngan sach tu cau khach go - khach go co dau, khong dau, viet tat deu phai hieu. */
class ScriptedBotTests {

    private static String occ(String text) {
        return ScriptedBot.detectOccasion(ScriptedBot.normalize(text));
    }

    private static Long budget(String text) {
        return ScriptedBot.detectBudget(ScriptedBot.normalize(text));
    }

    @Test
    void detectsOccasionWithOrWithoutAccents() {
        assertEquals("BIRTHDAY", occ("Mai sinh nhật mẹ mình"));
        assertEquals("BIRTHDAY", occ("hoa sinh nhat cho ban"));
        assertEquals("OPENING", occ("Khai trương cửa hàng bạn"));
        assertEquals("SYMPATHY", occ("cần vòng hoa viếng đám tang"));
        assertEquals("LOVE", occ("tặng vợ nhân dịp kỷ niệm"));
        assertEquals("THANKS", occ("hoa cảm ơn thầy cô 20/11"));
        assertEquals("WEDDING", occ("hoa cầm tay cô dâu"));
        assertNull(occ("shop ơi cho hỏi"));
    }

    @Test
    void detectsBudgetInCommonVietnameseForms() {
        assertEquals(500_000L, budget("khoảng 500k"));
        assertEquals(500_000L, budget("tầm 500 nghìn"));
        assertEquals(1_000_000L, budget("1 triệu đổ lại"));
        assertEquals(1_500_000L, budget("ngân sách 1tr5"));
        assertEquals(700_000L, budget("700.000đ"));
        assertEquals(2_000_000L, budget("2 củ"));
        assertNull(budget("mai giao lúc 9 giờ"));
        assertNull(budget("20/11"));
    }
}

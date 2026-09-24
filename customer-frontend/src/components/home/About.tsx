import { RevealSection } from "@/components/site/RevealSection";
import { SectionHeading } from "@/components/site/SectionHeading";

const CHIPS = ["London", "Est. 2018", "Sustainable Sourcing"];

export function About() {
  return (
    <RevealSection id="about" labelledBy="about-heading">
      <div className="shell grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <div>
          <SectionHeading id="about-heading" eyebrow="EC1 · Từ năm 2018" title="The Studio" />

          <blockquote data-anim="fade-up" className="pull-quote mt-10 text-foreground">
            <span aria-hidden="true" className="text-accent">
              “
            </span>
            Every arrangement is made the day you order it. No warehouse. No batch production. Just
            flowers, cut fresh.
            <span aria-hidden="true" className="text-accent">
              ”
            </span>
          </blockquote>

          <div data-anim="fade-up" className="prose-measure mt-9 space-y-5 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
            <p>
              Bloom Studio bắt đầu năm 2018 từ một bàn gỗ trong một xưởng nhỏ ở EC1. Chúng tôi nhập
              hoa từ các trại trồng ở Kent và Lincolnshire, cộng thêm hoa chợ Hà Lan vào mùa thấp
              điểm, và cắt theo đơn thay vì giữ hàng tồn.
            </p>
            <p>
              Mỗi tuần studio làm khoảng hai trăm bó cho khách lẻ, văn phòng và tiệc cưới. Cùng một
              đội đó dựng hoa cưới cuối tuần — nghĩa là người tư vấn cho bạn cũng chính là người cầm
              kéo.
            </p>
          </div>

          <ul data-anim="fade-up" className="mt-9 flex flex-wrap gap-3">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="label-micro rounded-chip border border-accent/50 px-4 py-2.5 text-accent"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <figure data-anim="reveal" className="lg:justify-self-end">
          <img
            src="/images/studio.jpg"
            alt="Đôi tay cầm bó hoa gói giấy thủ công trong xưởng hoa, ánh sáng ấm từ cửa sổ"
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover"
          />
        </figure>
      </div>
    </RevealSection>
  );
}

import { RevealSection } from "@/components/site/RevealSection";
import { SectionHeading } from "@/components/site/SectionHeading";

const STEPS = [
  {
    number: "01",
    title: "Choose Your Stems",
    body: "Nói cho chúng tôi dịp, ngân sách và tông màu bạn thích. Không cần chọn từng bông — mùa nào hoa nấy, chúng tôi chọn giúp.",
  },
  {
    number: "02",
    title: "We Build It By Hand",
    body: "Mỗi bó được buộc tay trong studio EC1 vào đúng ngày bạn đặt. Không kho lạnh, không sản xuất hàng loạt.",
  },
  {
    number: "03",
    title: "Same-Day Delivery",
    body: "Đặt trước 11h sáng, hoa tới trong ngày ở Central và Greater London. Hoặc chọn ngày giao khi thanh toán.",
  },
];

export function Process() {
  return (
    <RevealSection id="process" labelledBy="process-heading" className="bg-surface">
      <div className="shell">
        <SectionHeading
          id="process-heading"
          eyebrow="Đặt trước 11:00 · Giao trong ngày"
          title="How It Works"
        />

        <ol className="mt-16 grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} data-anim="fade-up" className="relative">
              {/* So lon mo phia sau — trang tri, khong doc bang trinh doc man hinh */}
              <span
                aria-hidden="true"
                className="num pointer-events-none absolute -top-10 left-0 select-none font-display text-[7rem] font-bold italic leading-none text-foreground opacity-[0.05]"
              >
                {step.number}
              </span>

              <div className="relative">
                <p className="label-micro text-accent">Step {step.number}</p>
                <h3 className="display-lg mt-4 text-foreground">{step.title}</h3>
                <p className="prose-measure mt-4 text-sm font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </RevealSection>
  );
}

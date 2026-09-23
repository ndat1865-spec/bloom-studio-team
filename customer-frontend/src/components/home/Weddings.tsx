import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RevealSection } from "@/components/site/RevealSection";
import { SectionHeading } from "@/components/site/SectionHeading";

const CHIPS = [
  {
    label: "Ceremony",
    src: "/images/wedding-1.jpg",
    alt: "Bó hoa cưới tông hồng và trắng đặt trên vải lanh",
  },
  {
    label: "Reception",
    src: "/images/wedding-2.jpg",
    alt: "Bàn tiệc dài với bình hoa nhỏ và nến, ánh sáng trầm",
  },
  {
    label: "Bridal Party",
    src: "/images/wedding-3.jpg",
    alt: "Bàn ăn được bày với hoa tươi và ly thủy tinh",
  },
];

export function Weddings() {
  return (
    <RevealSection id="weddings" labelledBy="weddings-heading" className="bg-surface">
      <div className="shell">
        <SectionHeading id="weddings-heading" eyebrow="Trọn gói từ £800" title="Wedding Florals" />

        <p data-anim="fade-up" className="pull-quote prose-measure mt-10 text-foreground">
          From bouquets to full venue styling — we work with you from the first consultation to the
          last petal.
        </p>

        <ul className="mt-14 grid grid-cols-1 gap-0.5 sm:grid-cols-3">
          {CHIPS.map((chip) => (
            <li key={chip.label} data-anim="reveal">
              <figure>
                <img
                  src={chip.src}
                  alt={chip.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
                <figcaption className="label-micro mt-4 text-muted-foreground">
                  {chip.label}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        {/*
          CTA noi dung viec no lam: mo danh muc Wedding Flowers.
          Khong dung "Start your wedding enquiry" vi form dat lich tu van khong nam trong
          pham vi SOS01-SOS10 — xem README muc "Khong nam trong pham vi".
        */}
        <div data-anim="fade-up" className="mt-12">
          <Button variant="primary" size="lg" asChild>
            <Link to="/products?category=3">See wedding flowers →</Link>
          </Button>
        </div>
      </div>
    </RevealSection>
  );
}

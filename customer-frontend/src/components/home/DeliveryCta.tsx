import { Link } from "react-router-dom";
import { RevealSection } from "@/components/site/RevealSection";

/**
 * Band dusty rose tran vien — diem dao nguoc duy nhat cua trang.
 * Chu va nut dung mau nen xanh rung de dat tuong phan tren nen rose.
 */
export function DeliveryCta() {
  return (
    <RevealSection id="delivery" labelledBy="delivery-heading" className="bg-accent">
      <div className="shell">
        <h2 id="delivery-heading" data-anim="fade-up" className="display-section text-background">
          Same-Day London Delivery
        </h2>

        <p
          data-anim="fade-up"
          className="prose-measure mt-6 text-[1.0625rem] font-light leading-relaxed text-background/85"
        >
          Order before 11am for same-day delivery across Central and Greater London — or choose your
          date at checkout.
        </p>

        <div data-anim="fade-up" className="mt-9">
          <Link
            to="/products"
            className="inline-flex h-12 items-center justify-center border border-background bg-background px-8 font-sans text-[11px] font-medium uppercase tracking-[0.1em] text-foreground transition-colors duration-200 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
          >
            Order now →
          </Link>
        </div>

        <p data-anim="fade-up" className="label-micro mt-8 text-background/90">
          Free delivery over £80 · Recyclable packaging · Sustainably sourced
        </p>
      </div>
    </RevealSection>
  );
}

import { Link } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { FREE_DELIVERY_THRESHOLD, useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";

/**
 * Gio hang — PHAN MO RONG ngoai SOS01-SOS10.
 *
 * Nguyen tac thiet ke (xem docs/prompt-redesign-commerce-screens.md):
 *  - Anh san pham lon (128px desktop): thuong hieu nay song bang anh
 *  - Cum thao tac don ve ben phai thay vi rai deu ca chieu ngang
 *  - Nut xoa la icon lang, de "Thanh toan" la hanh dong noi bat DUY NHAT
 *  - Khoi tom tat dung bac mau be mat, KHONG dung vien hop
 */
export default function CartPage() {
  const { lines, count, subtotal, deliveryFee, total, setQuantity, remove } = useCart();

  const missingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Giỏ hàng</p>
        <h1 className="display-section mt-5 text-foreground">Your Basket</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
      </header>

      {lines.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="Giỏ hàng đang trống"
            description="Chưa có bó hoa nào trong giỏ. Xem danh mục của studio và thêm bó bạn thích."
            action={
              <Button variant="primary" size="lg" asChild>
                <Link to="/products">Xem danh mục hoa →</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[1fr_20rem]">
          {/* ---------- Danh sach dong ---------- */}
          <section aria-labelledby="cart-lines-heading">
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <h2 id="cart-lines-heading" className="label-micro text-muted-foreground">
                Sản phẩm
              </h2>
              <p className="num label-micro text-muted-foreground">{count} bó</p>
            </div>

            <ul>
              {lines.map((line) => (
                /*
                  Hang ngang chi bat tu XL (1280px) tro len.

                  Khong dung lg: tai dung 1024px, khoi tom tat don ben phai cung bat
                  cung luc, cat cot trai chi con 566px. Anh 128 + cum thao tac ~256 an
                  gan het, ten san pham chi con 80px va vo thanh ba dong.
                  Duoi xl thi cho cum thao tac xuong hang rieng, ten duoc tron ca chieu ngang.
                */
                <li
                  key={line.productId}
                  className="group flex flex-col gap-5 border-b border-border py-7 transition-colors hover:border-border-strong/40 xl:flex-row xl:items-center"
                >
                  {/* Anh + ten luon di cung nhau tren mot hang, o moi kho man hinh */}
                  <div className="flex min-w-0 flex-1 items-center gap-5 sm:gap-6">
                    {/* Anh lon — tai san manh nhat cua thuong hieu */}
                    <Link
                      to={`/products/${line.productId}`}
                      className="block shrink-0 overflow-hidden bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <img
                        src={resolveImageUrl(line.imageUrl)}
                        alt={line.name}
                        onError={(event) => {
                          const img = event.currentTarget;
                          if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                        }}
                        className="size-24 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:size-32"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-semibold italic leading-snug text-foreground">
                        <Link
                          to={`/products/${line.productId}`}
                          className="transition-colors hover:text-accent"
                        >
                          {line.name}
                        </Link>
                      </h3>
                      <p className="num mt-1.5 text-sm text-muted-foreground">
                        {formatPrice(line.price)} / bó
                      </p>
                    </div>
                  </div>

                  {/* Cum thao tac: don chat ve ben phai */}
                  <div className="flex shrink-0 items-center justify-between gap-4 sm:gap-7 xl:justify-end">
                    <QuantityStepper
                      id={`qty-${line.productId}`}
                      value={line.quantity}
                      onChange={(next) => setQuantity(line.productId, next)}
                      label={`Số lượng ${line.name}`}
                    />

                    {/* Thanh tien: canh phai, do rong co dinh de cac dong thang cot */}
                    <p className="num w-24 shrink-0 text-right font-display text-lg font-semibold italic text-foreground">
                      {formatPrice(line.price * line.quantity)}
                    </p>

                    {/* Nut xoa lang: icon-only, chi chuyen mau canh bao khi hover/focus */}
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      aria-label={`Xoá ${line.name} khỏi giỏ hàng`}
                      className="inline-flex size-10 shrink-0 items-center justify-center text-muted-foreground/50 transition-colors hover:text-danger focus-visible:text-danger focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/products"
              className="label-micro mt-7 inline-block text-muted-foreground transition-colors hover:text-accent"
            >
              ← Tiếp tục chọn hoa
            </Link>
          </section>

          {/* ---------- Tom tat: bac mau be mat, khong vien hop ---------- */}
          <aside aria-labelledby="cart-summary-heading" className="lg:sticky lg:top-28 lg:self-start">
            <div className="bg-surface p-7">
              <h2 id="cart-summary-heading" className="label-micro text-accent">
                Tóm tắt đơn
              </h2>

              <dl className="mt-6 space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tạm tính</dt>
                  <dd className="num text-foreground">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phí giao hàng</dt>
                  <dd className="num text-foreground">
                    {deliveryFee === 0 ? "Miễn phí" : formatPrice(deliveryFee)}
                  </dd>
                </div>
              </dl>

              {/* Dong duy nhat duoc phong to tren ca khoi */}
              <div className="mt-6 flex items-baseline justify-between border-t border-border-strong/40 pt-5">
                <span className="label-micro text-muted-foreground">Tổng cộng</span>
                <span className="num font-display text-3xl font-semibold italic text-accent">
                  {formatPrice(total)}
                </span>
              </div>

              {/*
                Tien do toi nguong mien phi giao hang. Mot dong chu kho khong cho thay
                "con bao xa nua"; thanh tien do noi dieu do trong mot cai liec mat.
                Da dat duoc thi doi sang loi xac nhan, khong bay thanh day 100% vo nghia.
              */}
              {missingForFreeDelivery > 0 ? (
                <div className="mt-6">
                  <div
                    className="h-0.5 w-full overflow-hidden bg-border"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={FREE_DELIVERY_THRESHOLD}
                    aria-valuenow={Math.round(subtotal)}
                    aria-label="Tiến độ tới mức miễn phí giao hàng"
                  >
                    <span
                      className="block h-full bg-accent transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-light leading-relaxed text-muted-foreground">
                    Mua thêm{" "}
                    <span className="num text-accent">{formatPrice(missingForFreeDelivery)}</span> để
                    được miễn phí giao hàng.
                  </p>
                </div>
              ) : (
                <p className="mt-6 flex items-center gap-2 text-xs font-light text-success">
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  Đơn này được miễn phí giao hàng.
                </p>
              )}

              <Button variant="primary" size="lg" className="mt-7 w-full" asChild>
                <Link to="/checkout">Thanh toán →</Link>
              </Button>

              <p className="mt-5 text-xs font-light leading-relaxed text-muted-foreground">
                Trả tiền khi nhận hàng, không thu tiền trước.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

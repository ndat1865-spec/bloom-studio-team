import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { ApiError, api, type Order } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";

/**
 * Chi tiet don hang cho quan tri — mo tu trang Don hang.
 *
 * Du lieu doc tu GET /api/orders/{id} (ADMIN xem duoc moi don), KHONG lay tu
 * state dieu huong, nen tai lai trang (F5) van hien dung don.
 *
 * Thiet ke: band hai cot o dau trang — trai la ma don + trang thai,
 * phai la anh cua san pham dau tien trong don. Ma don dung DM Sans letter-spacing
 * rong (khong phai serif nghieng) vi day la ma may sinh, khong phai tieu de.
 */

const MONTHS = [
  "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
  "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12",
];

/** "22:27 · 13 tháng 9, 2026" */
function formatPlacedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} · ${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

/** "25 tháng 9, 2026" */
function formatDeliveryDate(value: string | null): string {
  if (!value) return "Sớm nhất có thể";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${MONTHS[month - 1]}, ${year}`;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError("Mã đơn hàng không hợp lệ.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .getOrder(numericId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setOrder(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Không tìm thấy đơn hàng này."
            : err instanceof Error
              ? err.message
              : "Không tải được đơn hàng.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="shell page-pad">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="aspect-[4/5] w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="shell page-pad">
        <ErrorState
          message={error ?? "Không tải được đơn hàng."}
          action={
            <Button variant="outline" size="md" asChild>
              <Link to="/admin/orders">Về danh sách đơn</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Anh cua san pham dau tien trong don
  const heroItem = order.items[0];

  return (
    <div className="shell page-pad">
      {/* ---------- Band dau trang: ma don | anh ---------- */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div>
          <Link
            to="/admin/orders"
            className="label-micro inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Tất cả đơn hàng
          </Link>

          <h1 className="display-section mt-5 text-foreground">Chi tiết đơn</h1>
          <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />

          <p className="prose-measure mt-6 text-[1.0625rem] font-light leading-relaxed text-muted-foreground">
            Toàn bộ thông tin của đơn này: sản phẩm đã đặt, nơi nhận và số tiền.
          </p>

          {/* Ma don: sans, letter-spacing rong — doc nhu MA, khong phai tieu de */}
          <div className="mt-9">
            <p className="label-micro text-muted-foreground">Mã đơn hàng</p>
            <p className="num mt-3 font-sans text-3xl font-medium tracking-[0.12em] text-accent sm:text-4xl">
              {order.code}
            </p>
          </div>

          {/* Badge xuong dong rieng, khong tranh cho voi ma don */}
          <div className="mt-5">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {heroItem ? (
          <img
            src={resolveImageUrl(heroItem.imageUrl)}
            alt=""
            aria-hidden="true"
            onError={(event) => {
              const img = event.currentTarget;
              if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
            }}
            className="aspect-[4/5] w-full bg-surface-raised object-cover"
          />
        ) : null}
      </div>

      {/* ---------- Thong tin giao hang: bac mau be mat, khong vien hop ---------- */}
      <section aria-labelledby="delivery-info-heading" className="mt-12 bg-surface p-7 sm:p-9">
        <h2 id="delivery-info-heading" className="label-micro text-accent">
          Thông tin giao hàng
        </h2>

        {/*
          Nhan NAM TREN gia tri. Kieu "nhan trai / gia tri phai" khien mot dong dai
          (dia chi) bi keo cach nhan ca nghin pixel — mat khong noi duoc cap voi nhau.
        */}
        <dl className="mt-7 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {[
            { label: "Đặt lúc", value: formatPlacedAt(order.createdAt), num: true },
            { label: "Người nhận", value: order.customerName },
            { label: "Điện thoại", value: order.phone, num: true },
            { label: "Ngày giao", value: formatDeliveryDate(order.deliveryDate) },
            { label: "Địa chỉ", value: order.address, span: true },
            ...(order.note ? [{ label: "Lời nhắn", value: order.note, span: true }] : []),
          ].map((row) => (
            <div
              key={row.label}
              className={`border-b border-border py-4 ${row.span ? "sm:col-span-2" : ""}`}
            >
              <dt className="label-micro text-muted-foreground">{row.label}</dt>
              <dd className={`mt-2 text-sm text-foreground ${row.num ? "num" : ""}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Cac dong hang ---------- */}
      <section aria-labelledby="order-items-heading" className="mt-12">
        <h2
          id="order-items-heading"
          className="label-micro border-b border-border pb-4 text-muted-foreground"
        >
          Sản phẩm trong đơn
        </h2>

        <ul>
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-5 border-b border-border py-6">
              <img
                src={resolveImageUrl(item.imageUrl)}
                alt=""
                onError={(event) => {
                  const img = event.currentTarget;
                  if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                }}
                className="size-20 shrink-0 bg-surface-raised object-cover sm:size-24"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold italic text-foreground sm:text-xl">
                  {item.productName}
                </p>
                <p className="num mt-1.5 text-sm text-muted-foreground">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="num w-24 shrink-0 text-right text-base font-medium text-foreground">
                {formatPrice(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        {/* Cum tong can phai */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-xs">
            <dl className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tạm tính</dt>
                <dd className="num text-foreground">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phí giao hàng</dt>
                <dd className="num text-foreground">
                  {order.deliveryFee === 0 ? "Miễn phí" : formatPrice(order.deliveryFee)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex items-baseline justify-between border-t border-border-strong/40 pt-5">
              <span className="label-micro text-muted-foreground">Tổng cộng</span>
              <span className="num font-display text-3xl font-semibold italic text-accent">
                {formatPrice(order.total)}
              </span>
            </div>

            <p className="mt-4 text-xs font-light leading-relaxed text-muted-foreground">
              Giá tại thời điểm đặt hàng. Trả tiền khi nhận hàng (COD).
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Button variant="outline" size="lg" asChild>
          <Link to="/admin/orders">← Tất cả đơn hàng</Link>
        </Button>
      </div>
    </div>
  );
}

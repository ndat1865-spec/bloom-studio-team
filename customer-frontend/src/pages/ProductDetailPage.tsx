import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Scissors, ShoppingBag, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Notice, Skeleton } from "@/components/ui/feedback";
import { ApiError, api, type Product } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";

/** Bao nhieu bo cung danh muc gioi thieu o cuoi trang. */
const RELATED_LIMIT = 3;

/** Cam ket ban hang — cung mot bo voi noi dung landing page. */
const PROMISES = [
  { icon: Scissors, label: "Cắt tươi trong ngày", hint: "Bó ngay buổi sáng ship" },
  { icon: Truck, label: "Same-day London", hint: "Đặt trước 11:00 sáng" },
  { icon: Wallet, label: "Trả khi nhận hàng", hint: "Không thu tiền trước" },
];

/** Trang chi tiet mot san pham — su dung GET /api2025/products/{id}. */
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const { add } = useCart();

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError("Mã sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setQuantity(1);
    setAdded(null);
    setRelated([]);

    api
      .getProduct(numericId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Không tìm thấy sản phẩm này."
            : err instanceof Error
              ? err.message
              : "Không tải được sản phẩm.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  /*
    Goi y cung danh muc. Tach thanh effect rieng de neu API nay hong
    thi phan chinh cua trang van hien binh thuong — day chi la phan them.
    Lay du RELATED_LIMIT + 1 vi con phai loai chinh san pham dang xem ra.
  */
  const categoryId = product?.category?.id ?? null;
  const productId = product?.id ?? null;

  useEffect(() => {
    if (categoryId == null || productId == null) return;
    const controller = new AbortController();

    api
      .listProducts({ categoryId, page: 0, size: RELATED_LIMIT + 1 }, controller.signal)
      .then((page) =>
        setRelated(page.content.filter((item) => item.id !== productId).slice(0, RELATED_LIMIT)),
      )
      .catch(() => setRelated([]));

    return () => controller.abort();
  }, [categoryId, productId]);

  return (
    <div className="shell page-pad">
      <Button variant="link" size="sm" asChild className="mb-10">
        <Link to="/products">
          <ArrowLeft aria-hidden="true" />
          Quay lại danh sách
        </Link>
      </Button>

      {loading ? (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          message={error}
          action={
            <Button variant="outline" size="md" asChild>
              <Link to="/products">Về danh sách hoa</Link>
            </Button>
          }
        />
      ) : product ? (
        <>
          <article className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
            {/*
              Anh DINH khi cuon: cot phai cao hon cot trai, neu anh cuon theo thi
              nua duoi ben trai bi bo trong mot khoang lon.
            */}
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden bg-surface-raised">
                <img
                  src={resolveImageUrl(product.imageUrl)}
                  alt={product.name}
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                  }}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.04]"
                />
              </div>
            </div>

            <div>
              <p className="label-micro text-accent">{product.category?.name ?? "Chưa phân loại"}</p>

              <h1 className="display-section mt-5 text-foreground">{product.name}</h1>
              <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />

              <p className="num mt-8 font-display text-4xl font-semibold italic text-accent">
                {formatPrice(product.price)}
              </p>

              {product.description ? (
                <p className="prose-measure mt-8 text-[1.0625rem] font-light leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              ) : null}

              {/*
                ---------- Them vao gio (phan mo rong ngoai SOS01-SOS10) ----------
                Dung bac mau be mat, KHONG vien hop — giong khoi tom tat o Gio hang
                va Thanh toan, theo dung nguyen tac trong DESIGN.md.
              */}
              <div className="mt-10 bg-surface p-7">
                {added ? (
                  <Notice tone="success" className="mb-6">
                    {added}
                  </Notice>
                ) : null}

                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="label-micro mb-3 text-muted-foreground">Số lượng</p>
                    <QuantityStepper
                      id="detail-quantity"
                      value={quantity}
                      onChange={setQuantity}
                      label={`Số lượng ${product.name}`}
                    />
                  </div>

                  {/* Thanh tien chi dang len khi mua tu 2 bo tro len */}
                  {quantity > 1 ? (
                    <div className="text-right">
                      <p className="label-micro text-muted-foreground">Thành tiền</p>
                      <p className="num mt-2 font-display text-2xl font-semibold italic text-foreground">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="mt-7 w-full"
                  onClick={() => {
                    add(product, quantity);
                    setAdded(`Đã thêm ${quantity} × ${product.name} vào giỏ hàng.`);
                  }}
                >
                  <ShoppingBag aria-hidden="true" />
                  Thêm vào giỏ hàng
                </Button>

                {/* Duong lui de dang chu, khong phai nut to — "Them vao gio" phai la CTA duy nhat */}
                <div className="mt-5 text-center">
                  <Link
                    to="/cart"
                    className="label-micro text-muted-foreground transition-colors hover:text-accent"
                  >
                    Xem giỏ hàng →
                  </Link>
                </div>
              </div>

              {/* ---------- Cam ket ban hang ---------- */}
              <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
                {PROMISES.map((promise) => (
                  <li key={promise.label} className="bg-background px-5 py-6 text-center">
                    <promise.icon
                      className="mx-auto size-4 text-accent"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-xs text-foreground">{promise.label}</p>
                    <p className="mt-1.5 text-xs font-light text-muted-foreground">
                      {promise.hint}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-10 border-t border-border">
                <div className="flex justify-between border-b border-border py-4">
                  <dt className="label-micro text-muted-foreground">Mã sản phẩm</dt>
                  <dd className="num text-sm text-foreground">#{product.id}</dd>
                </div>
                <div className="flex justify-between border-b border-border py-4">
                  <dt className="label-micro text-muted-foreground">Danh mục</dt>
                  <dd className="text-sm text-foreground">{product.category?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-border py-4">
                  <dt className="label-micro text-muted-foreground">Giao hàng</dt>
                  <dd className="text-sm text-foreground">Same-day, London · đặt trước 11:00</dd>
                </div>
              </dl>
            </div>
          </article>

          {/*
            ---------- Cung danh muc ----------
            Truoc day trang ket thuc o bang thong so roi la mot khoang trong den footer:
            xem xong mot bo hoa thi khong con duong nao di tiep.
          */}
          {related.length > 0 ? (
            <section aria-labelledby="related-heading" className="mt-24 border-t border-border pt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="label-micro text-accent">Cùng danh mục</p>
                  <h2
                    id="related-heading"
                    className="mt-4 font-display text-3xl font-semibold italic text-foreground"
                  >
                    Có thể bạn cũng thích
                  </h2>
                </div>
                <Link
                  to={`/products?category=${product.category?.id ?? ""}`}
                  className="label-micro text-muted-foreground transition-colors hover:text-accent"
                >
                  Xem tất cả →
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

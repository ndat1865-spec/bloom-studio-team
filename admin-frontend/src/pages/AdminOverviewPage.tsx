import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Loader2, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/feedback";
import { InitialsAvatar } from "@/components/site/InitialsAvatar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AdminOverview } from "@/lib/api";
import { formatPrice } from "@/lib/format";

/**
 * Admin > Tong quan cua hang. PHAN MO RONG ngoai SOS01-SOS10.
 *
 * CHI hien nhung chi so tinh duoc tu du lieu that cua du an.
 * Ton kho, doi tra, danh gia, tin nhan, thanh toan online deu KHONG co trong pham vi
 * nay nen khong dung o day — bay so 0 cho nhung thu khong ton tai chi gay hieu nham.
 */
export default function AdminOverviewPage() {
  const { user, role } = useAuth();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  // Khoang ngay DA AP DUNG — chi doi khi bam "Cap nhat", khong doi theo tung phim go
  const [range, setRange] = useState({ from: monthAgo, to: today });

  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .getAdminOverview(range.from, range.to, controller.signal)
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không tải được số liệu tổng quan.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [role, range]);

  function handleApply(event: React.FormEvent) {
    event.preventDefault();
    setRange({ from, to });
  }

  const name = user?.displayName || user?.fullName || user?.username;

  return (
    <div className="shell page-pad">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-micro text-accent">Trung tâm vận hành</p>
          <h1 className="display-section mt-5 text-foreground">Tổng quan cửa hàng</h1>
          <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        </div>

        {/*
          O danh tinh admin chi de doc: trang ho so /tai-khoan nam o customer-frontend,
          app quan tri khong co. Khong bam duoc thi cung khong co hieu ung hover.
        */}
        <div className="flex items-center gap-3 bg-surface px-5 py-4">
          <InitialsAvatar name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{name}</p>
            <p className="label-micro mt-1 text-accent">Quản trị viên</p>
          </div>
        </div>
      </header>

      {/* ---------- Chon ky bao cao ---------- */}
      <form
        onSubmit={handleApply}
        className="mt-10 flex flex-col gap-5 bg-surface p-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="label-micro text-muted-foreground">Kỳ báo cáo</p>
          <p className="num mt-2.5 text-base text-foreground">
            {formatDate(range.from)} — {formatDate(range.to)}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Field id="from" label="Từ ngày" className="w-auto">
            {(props) => (
              <Input
                {...props}
                type="date"
                max={to}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            )}
          </Field>
          <Field id="to" label="Đến ngày" className="w-auto">
            {(props) => (
              <Input
                {...props}
                type="date"
                min={from}
                max={today}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            )}
          </Field>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Cập nhật
          </Button>
        </div>
      </form>

      {error ? (
        <div className="mt-10">
          <ErrorState
            message={error}
            action={
              <Button
                variant="outline"
                size="md"
                onClick={() => setRange({ from: range.from, to: range.to })}
              >
                Thử lại
              </Button>
            }
          />
        </div>
      ) : null}

      {data ? (
        <>
          {/* ---------- Doanh thu + bieu do + viec can xu ly ---------- */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
            <section aria-labelledby="revenue-heading" className="bg-surface p-7">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h2 id="revenue-heading" className="label-micro text-muted-foreground">
                    Doanh thu trong kỳ
                  </h2>
                  <p className="num mt-3 font-display text-5xl font-semibold italic text-accent">
                    {formatPrice(data.revenue)}
                  </p>
                  <p className="mt-3 text-xs font-light text-muted-foreground">
                    Không tính {data.cancelledCount} đơn đã huỷ
                    {data.cancelledValue > 0 ? ` (${formatPrice(data.cancelledValue)})` : ""}
                  </p>
                </div>

                <dl className="flex gap-10">
                  <div>
                    <dt className="label-micro text-muted-foreground">Số đơn</dt>
                    <dd className="num mt-2.5 text-xl text-foreground">{data.orderCount}</dd>
                  </div>
                  <div>
                    <dt className="label-micro text-muted-foreground">Trung bình/đơn</dt>
                    <dd className="num mt-2.5 text-xl text-foreground">
                      {formatPrice(data.averageOrderValue)}
                    </dd>
                  </div>
                </dl>
              </div>

              <RevenueChart daily={data.daily} />
            </section>

            {/* ---------- Can xu ly ---------- */}
            <section aria-labelledby="todo-heading" className="bg-surface p-7">
              <div className="flex items-baseline justify-between border-b border-border pb-5">
                <div>
                  <p className="label-micro text-accent">Ưu tiên hôm nay</p>
                  <h2
                    id="todo-heading"
                    className="mt-2 font-display text-2xl font-semibold italic text-foreground"
                  >
                    Cần xử lý
                  </h2>
                </div>
                <span className="num font-display text-3xl font-semibold italic text-accent">
                  {data.pendingCount + data.confirmedCount}
                </span>
              </div>

              <ul className="mt-5">
                <TodoRow
                  icon={ClipboardList}
                  label="Đơn chờ xác nhận"
                  hint="Kiểm tra và xác nhận đơn"
                  value={data.pendingCount}
                />
                <TodoRow
                  icon={Truck}
                  label="Đã xác nhận, chờ giao"
                  hint="Theo dõi tiến độ giao hoa"
                  value={data.confirmedCount}
                />
                <TodoRow
                  icon={PackageCheck}
                  label="Đã giao trong kỳ"
                  hint="Đơn hoàn tất"
                  value={data.deliveredCount}
                />
              </ul>

              <Button variant="outline" size="md" className="mt-7 w-full" asChild>
                <Link to="/admin/orders">Mở danh sách đơn →</Link>
              </Button>
            </section>
          </div>

          {/* ---------- Ban chay + quy mo cua hang ---------- */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
            <section aria-labelledby="top-heading" className="bg-surface p-7">
              <div className="flex items-baseline justify-between border-b border-border pb-5">
                <div>
                  <p className="label-micro text-accent">Hàng hoá</p>
                  <h2
                    id="top-heading"
                    className="mt-2 font-display text-2xl font-semibold italic text-foreground"
                  >
                    Bán chạy nhất
                  </h2>
                </div>
                <Link
                  to="/admin/products"
                  className="label-micro text-muted-foreground transition-colors hover:text-accent"
                >
                  Mở danh mục →
                </Link>
              </div>

              {data.topProducts.length === 0 ? (
                <p className="mt-7 text-sm font-light text-muted-foreground">
                  Chưa có đơn nào trong kỳ này để xếp hạng.
                </p>
              ) : (
                <ol className="mt-5">
                  {data.topProducts.map((product, index) => (
                    <li
                      key={product.productId}
                      className="flex items-center gap-5 border-b border-border py-4 last:border-0"
                    >
                      <span className="num w-5 shrink-0 text-sm text-muted-foreground/60">
                        {index + 1}
                      </span>
                      <Link
                        to={`/products/${product.productId}`}
                        className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors hover:text-accent"
                      >
                        {product.name}
                      </Link>
                      <span className="num shrink-0 text-xs text-muted-foreground">
                        {product.quantity} bó
                      </span>
                      <span className="num w-24 shrink-0 text-right text-sm text-foreground">
                        {formatPrice(product.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section aria-labelledby="scale-heading" className="bg-surface p-7">
              <h2 id="scale-heading" className="label-micro border-b border-border pb-5 text-muted-foreground">
                Quy mô cửa hàng
              </h2>
              <dl className="mt-2">
                <ScaleRow label="Sản phẩm" value={data.totalProducts} to="/admin/products" />
                <ScaleRow label="Danh mục" value={data.totalCategories} to="/admin/categories" />
                <ScaleRow label="Khách hàng" value={data.totalCustomers} />
              </dl>
              <p className="mt-6 text-xs font-light leading-relaxed text-muted-foreground">
                Ba số này tính trên toàn bộ cửa hàng, không phụ thuộc kỳ báo cáo đã chọn.
              </p>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Mot dong trong khoi "Can xu ly". */
function TodoRow({
  icon: Icon,
  label,
  hint,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-border py-4 last:border-0">
      <span
        aria-hidden="true"
        className="inline-flex size-10 shrink-0 items-center justify-center bg-surface-raised text-accent"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        <p className="mt-0.5 text-xs font-light text-muted-foreground">{hint}</p>
      </div>
      <span className="num shrink-0 text-lg text-foreground">{value}</span>
    </li>
  );
}

function ScaleRow({ label, value, to }: { label: string; value: number; to?: string }) {
  const content = (
    <>
      <dt className="text-sm font-light text-muted-foreground">{label}</dt>
      <dd className="num font-display text-xl font-semibold italic text-foreground">{value}</dd>
    </>
  );
  return to ? (
    <Link
      to={to}
      className="flex items-baseline justify-between border-b border-border py-4 transition-colors last:border-0 hover:text-accent"
    >
      {content}
    </Link>
  ) : (
    <div className="flex items-baseline justify-between border-b border-border py-4 last:border-0">
      {content}
    </div>
  );
}

/**
 * Bieu do cot doanh thu theo ngay — SVG thuan, khong keo them thu vien.
 *
 * Kem mot <table> chi danh cho trinh doc man hinh: hinh ve khong doc duoc,
 * nhung so lieu thi van phai tiep can duoc.
 */
function RevenueChart({ daily }: { daily: AdminOverview["daily"] }) {
  const max = Math.max(...daily.map((point) => point.revenue), 0);

  if (daily.length === 0 || max === 0) {
    return (
      <p className="mt-10 border-t border-border pt-7 text-sm font-light text-muted-foreground">
        Chưa có doanh thu nào trong kỳ này.
      </p>
    );
  }

  const width = 720;
  const height = 180;
  const gap = daily.length > 60 ? 0.5 : 2;
  const barWidth = Math.max(1, width / daily.length - gap);

  return (
    <figure className="mt-10 border-t border-border pt-7">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Biểu đồ doanh thu theo ngày, cao nhất ${formatPrice(max)}`}
        className="h-44 w-full"
      >
        {daily.map((point, index) => {
          const barHeight = max === 0 ? 0 : (point.revenue / max) * (height - 4);
          return (
            <rect
              key={point.date}
              x={index * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              className="fill-accent/70"
            >
              <title>
                {formatDate(point.date)}: {formatPrice(point.revenue)} · {point.orders} đơn
              </title>
            </rect>
          );
        })}
      </svg>

      <figcaption className="num mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(daily[0].date)}</span>
        <span>Cao nhất {formatPrice(max)}</span>
        <span>{formatDate(daily[daily.length - 1].date)}</span>
      </figcaption>

      <table className="sr-only">
        <caption>Doanh thu theo ngày</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Doanh thu</th>
            <th scope="col">Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatDate(point.date)}</th>
              <td>{formatPrice(point.revenue)}</td>
              <td>{point.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** yyyy-mm-dd -> dd/mm/yyyy. */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AccountLayout } from "@/components/account/AccountLayout";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/feedback";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";

/**
 * Tai khoan > Don hang cua toi. PHAN MO RONG ngoai SOS01-SOS10.
 *
 * Lay tu GET /orders?userId=... — chi don da gan voi tai khoan dang dang nhap.
 * Don dat khi CHUA dang nhap khong co userId nen se khong hien o day.
 */
export default function AccountOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const userId = user?.id;

  useEffect(() => {
    if (userId == null) return;
    const controller = new AbortController();

    setOrders(null);
    setError(null);

    api
      .listMyOrders(0, 50, controller.signal)
      .then((page) => setOrders(page.content))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không tải được danh sách đơn hàng.");
      });

    return () => controller.abort();
  }, [userId, reloadKey]);

  if (!user) return null;

  return (
    <AccountLayout
      eyebrow="Lịch sử mua sắm"
      title="Đơn hàng của tôi"
      description="Toàn bộ đơn bạn đã đặt khi đăng nhập bằng tài khoản này."
    >
      {error ? (
        <ErrorState
          message={error}
          action={
            <Button variant="outline" size="md" onClick={() => setReloadKey((key) => key + 1)}>
              Thử lại
            </Button>
          }
        />
      ) : orders === null ? (
        <Spinner label="Đang tải đơn hàng…" />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Khi bạn đặt hoa lúc đã đăng nhập, đơn sẽ được lưu vào đây để theo dõi."
          action={
            <Button variant="primary" size="lg" asChild>
              <Link to="/products">Xem danh mục hoa →</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-5">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-5 bg-surface p-5 transition-colors hover:bg-surface-raised/50 sm:flex-row sm:items-center"
            >
              {/*
                Anh xep chong o BEN TRAI ma don thay vi thanh mot hang rieng —
                the don thap hon han nen xem duoc nhieu don hon trong mot man hinh.
                Cac anh sau lui dan sang trai va co vien nen van doc ra la mot chong.
              */}
              <Link
                to={`/orders/${order.id}`}
                aria-hidden="true"
                tabIndex={-1}
                className="flex shrink-0 items-center"
              >
                {order.items.slice(0, 3).map((item, index) => (
                  <img
                    key={item.id}
                    src={resolveImageUrl(item.imageUrl)}
                    alt=""
                    onError={(event) => {
                      const img = event.currentTarget;
                      if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                    }}
                    className={
                      index === 0
                        ? "size-16 shrink-0 bg-surface-raised object-cover"
                        : "-ml-6 size-16 shrink-0 bg-surface-raised object-cover ring-2 ring-surface"
                    }
                  />
                ))}
                {order.items.length > 3 ? (
                  <span className="num -ml-2 text-xs text-muted-foreground">
                    +{order.items.length - 3}
                  </span>
                ) : null}
              </Link>

              {/* Ma don + ngay + noi giao */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="num font-display text-lg font-semibold italic text-foreground">
                    {order.code}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="num mt-1.5 text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  {" · "}
                  {order.items.length} sản phẩm
                </p>
                <p className="mt-1.5 truncate text-xs font-light text-muted-foreground">
                  Giao tới: {order.address}
                </p>
              </div>

              {/* Tong tien + loi vao chi tiet */}
              <div className="flex shrink-0 items-center gap-6">
                <div className="text-right">
                  <p className="label-micro text-muted-foreground">Tổng cộng</p>
                  <p className="num mt-1 font-display text-xl font-semibold italic text-accent">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/orders/${order.id}`}>Xem chi tiết →</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}

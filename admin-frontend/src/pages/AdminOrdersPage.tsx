import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, NativeSelect } from "@/components/ui/field";
import { EmptyState, ErrorState, Notice, TableRowSkeleton } from "@/components/ui/feedback";
import { Pagination } from "@/components/shop/Pagination";
import { ORDER_STATUS_LABELS, OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { api, type Order, type Page } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 10;

/** Quan ly don hang (ADMIN) — PHAN MO RONG ngoai SOS01-SOS10. */
export default function AdminOrdersPage() {
  const { role } = useAuth();
  const [data, setData] = useState<Page<Order> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.listOrders(page, PAGE_SIZE));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [role, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(order: Order, status: string) {
    setUpdatingId(order.id);
    setNotice(null);
    try {
      await api.updateOrderStatus(order.id, status);
      setNotice({
        tone: "success",
        text: `Đơn ${order.code} chuyển sang "${ORDER_STATUS_LABELS[status]?.label ?? status}".`,
      });
      await load();
    } catch (err) {
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Không cập nhật được trạng thái.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Admin · Phần mở rộng</p>
        <h1 className="display-section mt-5 text-foreground">Đơn hàng</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        <p className="prose-measure mt-6 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
          Giỏ hàng và thanh toán là phần mở rộng ngoài SOS01–SOS10. Đơn hàng được lưu thật trong hai
          bảng <code>orders</code> và <code>order_items</code> của MySQL.
        </p>
      </header>

      {notice ? (
        <Notice tone={notice.tone} className="mt-8">
          {notice.text}
        </Notice>
      ) : null}

      <div className="mt-10 overflow-x-auto border border-border">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <caption className="sr-only">Danh sách đơn hàng với người nhận, tổng tiền và trạng thái</caption>
          <thead>
            <tr className="border-b border-border bg-surface">
              <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Mã đơn</th>
              <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Người nhận</th>
              <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Điện thoại</th>
              <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">Số món</th>
              <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">Tổng tiền</th>
              <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Trạng thái</th>
              <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data
              ? Array.from({ length: 4 }).map((_, index) => <TableRowSkeleton key={index} columns={7} />)
              : data?.content.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-raised"
                  >
                    <td className="num px-4 py-4 text-sm text-foreground">{order.code}</td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {order.customerName}
                      {order.username ? (
                        <span className="block text-xs text-muted-foreground">@{order.username}</span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">Khách vãng lai</span>
                      )}
                    </td>
                    <td className="num px-4 py-4 text-sm text-muted-foreground">{order.phone}</td>
                    <td className="num px-4 py-4 text-right text-sm text-foreground">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="num px-4 py-4 text-right text-sm text-foreground">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-40">
                          <Label htmlFor={`status-${order.id}`} className="sr-only">
                            Trạng thái đơn {order.code}
                          </Label>
                          <NativeSelect
                            id={`status-${order.id}`}
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(event) => void changeStatus(order, event.target.value)}
                          >
                            {Object.entries(ORDER_STATUS_LABELS).map(([value, entry]) => (
                              <option key={value} value={value}>
                                {entry.label}
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/orders/${order.id}`}>
                            <ExternalLink aria-hidden="true" />
                            Xem
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <ErrorState
          message={error}
          action={
            <Button variant="outline" size="md" onClick={() => void load()}>
              Thử lại
            </Button>
          }
        />
      ) : null}

      {!loading && data?.content.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Khi khách đặt hoa qua trang /checkout, đơn sẽ xuất hiện ở đây."
        />
      ) : null}

      {data ? <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} /> : null}
    </div>
  );
}

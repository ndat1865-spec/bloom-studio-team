import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { CheckoutSteps } from "@/components/shop/CheckoutSteps";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ApiError, NetworkError, api } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";

type Errors = Partial<
  Record<"customerName" | "phone" | "address" | "city" | "deliveryDate" | "note", string>
>;

/**
 * Thanh toan — PHAN MO RONG ngoai SOS01-SOS10. Chi COD, khong co cong thanh toan.
 *
 * Dia chi tach thanh hai o ngan (duong + quan/thanh pho) thay vi mot <textarea> cao,
 * roi ghep lai thanh chuoi `address` duy nhat ma backend nhan (toi da 255 ky tu).
 */
export default function CheckoutPage() {
  const { lines, subtotal, deliveryFee, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Dien san form tu ho so + dia chi mac dinh (PHAN MO RONG).
   *
   * Chi dien vao o DANG TRONG: nguoi dung da go gi vao thi khong ghi de.
   * Nho vay dia chi da luu van sua duoc cho rieng mot don ma khong dung toi so dia chi.
   */
  useEffect(() => {
    if (!user) return;
    setCustomerName((current) => current || user.displayName || user.fullName || user.username);
    setPhone((current) => current || user.phone || "");
    setAddress((current) => current || user.address || "");
    setCity((current) => current || user.city || "");
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);

  /** Ghep hai o dia chi thanh mot chuoi duy nhat cho API. */
  function fullAddress(): string {
    return [address.trim(), city.trim()].filter(Boolean).join(", ");
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!customerName.trim()) next.customerName = "Nhập tên người nhận.";
    else if (customerName.trim().length < 2) next.customerName = "Tên người nhận cần ít nhất 2 ký tự.";

    if (!phone.trim()) next.phone = "Nhập số điện thoại.";
    else if (phone.trim().length < 8) next.phone = "Số điện thoại cần ít nhất 8 ký tự.";

    if (!address.trim()) next.address = "Nhập địa chỉ giao hàng.";
    else if (fullAddress().length < 5) next.address = "Địa chỉ cần ít nhất 5 ký tự.";
    else if (fullAddress().length > 255) next.address = "Địa chỉ quá dài (tối đa 255 ký tự).";

    if (deliveryDate && deliveryDate < today) next.deliveryDate = "Ngày giao không được ở quá khứ.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Chi gui productId + quantity. Gia va tong tien do backend tinh lai tu CSDL.
      const order = await api.createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: fullAddress(),
        note: note.trim() || null,
        deliveryDate: deliveryDate || null,
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      });
      clear();
      // justPlaced: bao cho trang don biet day la khoanh khac VUA DAT XONG
      // -> hien loi cam on. Tai lai trang (F5) se mat co nay va tro ve
      // dang chi tiet don binh thuong, dung nhu mong doi.
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (error) {
      // That bai -> GIU NGUYEN gio hang de khach thu lai
      if (error instanceof NetworkError) setFormError(error.message);
      else if (error instanceof ApiError) {
        if (error.fieldErrors) setErrors((previous) => ({ ...previous, ...error.fieldErrors }));
        setFormError(error.message);
      } else setFormError("Không đặt được hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="shell page-pad">
        <EmptyState
          title="Không có gì để thanh toán"
          description="Giỏ hàng của bạn đang trống. Chọn vài bó hoa rồi quay lại đây nhé."
          action={
            <Button variant="primary" size="lg" asChild>
              <Link to="/products">Xem danh mục hoa →</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Thanh toán · Trả khi nhận hàng</p>
        <h1 className="display-section mt-5 text-foreground">Checkout</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        <CheckoutSteps current={1} />
      </header>

      <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[1fr_20rem]">
        {/* ---------- Bieu mau ---------- */}
        <section aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="sr-only">
            Thông tin giao hàng
          </h2>

          {/*
            Noi ro form da duoc dien san tu dau — nguoi dung khong phai doan
            tai sao tu nhien co san thong tin, va biet cho de sua lau dai.
          */}
          {user?.hasDefaultAddress ? (
            <p className="mt-5 max-w-xl text-xs font-light leading-relaxed text-muted-foreground">
              Đã điền sẵn từ địa chỉ mặc định của bạn. Sửa ở đây chỉ áp dụng cho đơn này —
              muốn đổi hẳn thì vào{" "}
              <Link
                to="/tai-khoan/dia-chi"
                className="text-accent transition-colors hover:text-accent-strong"
              >
                Sổ địa chỉ
              </Link>
              .
            </p>
          ) : null}

          <form id="checkout-form" onSubmit={handleSubmit} noValidate className="mt-7 max-w-xl space-y-6">
            {formError ? <Notice tone="error">{formError}</Notice> : null}

            <FormSection step="01" title="Người nhận hoa" />

            {/* Hai truong ngan nam chung mot hang */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field id="customerName" label="Người nhận" error={errors.customerName} required>
                {(props) => (
                  <Input
                    {...props}
                    autoComplete="name"
                    maxLength={100}
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                )}
              </Field>

              <Field id="phone" label="Số điện thoại" error={errors.phone} required>
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    autoComplete="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0900 123 456"
                  />
                )}
              </Field>
            </div>

            <FormSection step="02" title="Giao đến đâu" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1.6fr_1fr]">
              <Field id="address" label="Địa chỉ giao hàng" error={errors.address} required>
                {(props) => (
                  <Input
                    {...props}
                    autoComplete="street-address"
                    maxLength={180}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Số nhà, đường, phường"
                  />
                )}
              </Field>

              <Field id="city" label="Quận / Thành phố" error={errors.city}>
                {(props) => (
                  <Input
                    {...props}
                    autoComplete="address-level2"
                    maxLength={60}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Hà Nội"
                  />
                )}
              </Field>
            </div>

            <FormSection step="03" title="Thời gian & lời nhắn" />

            <Field
              id="deliveryDate"
              label="Ngày giao mong muốn"
              error={errors.deliveryDate}
              hint="Để trống nếu muốn giao sớm nhất có thể. Đặt trước 11:00 được giao trong ngày."
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  min={today}
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="sm:max-w-xs"
                />
              )}
            </Field>

            <Field id="note" label="Lời nhắn kèm hoa" error={errors.note}>
              {(props) => (
                <Textarea
                  {...props}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Lời chúc viết lên thiệp, hoặc ghi chú cho người giao hàng…"
                />
              )}
            </Field>

            {/* COD: mot dong co icon, khong con la mot hop vien rieng */}
            <p className="flex items-start gap-2.5 text-sm font-light leading-relaxed text-muted-foreground">
              <Wallet className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                <span className="text-foreground">Trả tiền khi nhận hàng (COD).</span> Studio không
                thu tiền trước và không lưu bất kỳ thông tin thẻ nào.
              </span>
            </p>

            {/*
              Nut dat hang da chuyen sang khoi tom tat ben phai (submit qua form="checkout-form"),
              giong trang Gio hang: hanh dong chinh nam canh so tien.
              Cuoi form chi con duong lui.
            */}
            <Link
              to="/cart"
              className="label-micro inline-block text-muted-foreground transition-colors hover:text-accent"
            >
              ← Quay lại giỏ hàng
            </Link>
          </form>
        </section>

        {/* ---------- Tom tat don, co anh ---------- */}
        <aside aria-labelledby="order-summary-heading" className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-surface p-7">
            <h2 id="order-summary-heading" className="label-micro text-accent">
              Đơn của bạn
            </h2>

            <ul className="mt-6 space-y-4">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-4">
                  <img
                    src={resolveImageUrl(line.imageUrl)}
                    alt=""
                    onError={(event) => {
                      const img = event.currentTarget;
                      if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                    }}
                    className="size-14 shrink-0 bg-surface-raised object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{line.name}</p>
                    <p className="num text-xs text-muted-foreground">
                      {formatPrice(line.price)} × {line.quantity}
                    </p>
                  </div>
                  <p className="num shrink-0 text-sm text-foreground">
                    {formatPrice(line.price * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-7 space-y-3.5 border-t border-border-strong/40 pt-6 text-sm">
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

            <div className="mt-6 flex items-baseline justify-between border-t border-border-strong/40 pt-5">
              <span className="label-micro text-muted-foreground">Tổng cộng</span>
              <span className="num font-display text-3xl font-semibold italic text-accent">
                {formatPrice(total)}
              </span>
            </div>

            {/* Hanh dong chinh: dat ngay duoi tong tien. form=... vi nut nam ngoai <form>. */}
            <Button
              type="submit"
              form="checkout-form"
              variant="primary"
              size="lg"
              className="mt-7 w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Đang gửi đơn…
                </>
              ) : (
                `Đặt hàng · ${formatPrice(total)} →`
              )}
            </Button>

            <p className="mt-5 text-xs font-light leading-relaxed text-muted-foreground">
              Tổng tiền cuối cùng được máy chủ tính lại theo giá trong cơ sở dữ liệu tại thời điểm đặt
              hàng.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Tieu de mot nhom truong trong form thanh toan.
 *
 * Form co sau o nhap xep thang mot cot doc trong nhu mot buc tuong.
 * Chia thanh ba nhom co danh so thi nguoi dien biet minh dang o dau
 * va con bao nhieu buoc nua — dong ngon ngu voi thanh CheckoutSteps o dau trang.
 */
function FormSection({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-border pb-4 pt-2 first:pt-0">
      <span className="num label-micro text-accent">{step}</span>
      <h3 className="label-micro text-muted-foreground">{title}</h3>
    </div>
  );
}

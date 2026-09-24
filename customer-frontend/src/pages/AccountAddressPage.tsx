import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";
import type { ProfilePayload } from "@/lib/api";

/**
 * Tai khoan > So dia chi. PHAN MO RONG ngoai SOS01-SOS10.
 *
 * Pham vi: MOT dia chi mac dinh luu thang tren ban ghi user
 * (cot phone / address / city), khong phai bang dia chi rieng.
 * Trang Thanh toan doc lai dung ba truong nay de dien san form.
 */
export default function AccountAddressPage() {
  const { user, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [city, setCity] = useState(user?.city ?? "");

  if (!user) return null;

  const hasAddress = Boolean(user.address && user.address.trim());

  function startEditing() {
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setCity(user?.city ?? "");
    setErrors({});
    setFormError(null);
    setNotice(null);
    setEditing(true);
  }

  /** Dung chung cho ca luu va xoa — chi khac gia tri truyen vao. */
  async function save(next: { phone: string; address: string; city: string }, message: string) {
    if (!user) return;

    setSaving(true);
    setFormError(null);
    setErrors({});

    // Giu nguyen ho ten / email: trang nay khong quan ly hai truong do
    const payload: ProfilePayload = {
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      ...next,
    };

    try {
      const updated = await api.updateProfile(payload);
      updateUser(updated);
      setEditing(false);
      setNotice(message);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) setErrors(error.fieldErrors);
      setFormError(
        error instanceof Error ? error.message : "Không lưu được địa chỉ. Thử lại sau nhé.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void save({ phone, address, city }, "Đã lưu địa chỉ mặc định.");
  }

  function handleRemove() {
    void save({ phone: "", address: "", city: "" }, "Đã xoá địa chỉ mặc định.");
  }

  return (
    <AccountLayout
      eyebrow="Giao hàng"
      title="Sổ địa chỉ"
      description="Địa chỉ mặc định được điền sẵn khi bạn thanh toán, không phải gõ lại mỗi lần đặt hoa."
      action={
        !editing && hasAddress ? (
          <Button variant="outline" size="md" onClick={startEditing}>
            <Pencil aria-hidden="true" />
            Sửa địa chỉ
          </Button>
        ) : null
      }
    >
      {notice ? (
        <div className="mb-8">
          <Notice tone="success">{notice}</Notice>
        </div>
      ) : null}

      {editing ? (
        <section aria-labelledby="address-form-heading" className="bg-surface p-7">
          <h2
            id="address-form-heading"
            className="border-b border-border pb-5 font-display text-2xl font-semibold italic text-foreground"
          >
            Địa chỉ mặc định
          </h2>

          <form onSubmit={handleSubmit} noValidate className="mt-7 max-w-xl space-y-6">
            {formError ? <Notice tone="error">{formError}</Notice> : null}

            <Field
              id="phone"
              label="Số điện thoại nhận hàng"
              error={errors.phone}
              hint="Người giao hoa sẽ gọi số này."
            >
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

            <Field id="address" label="Địa chỉ giao hàng" error={errors.address}>
              {(props) => (
                <Input
                  {...props}
                  autoComplete="street-address"
                  maxLength={255}
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

            <div className="flex flex-wrap gap-3 pt-1">
              <Button type="submit" variant="primary" size="lg" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang lưu…
                  </>
                ) : (
                  "Lưu địa chỉ"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Huỷ
              </Button>
            </div>
          </form>
        </section>
      ) : hasAddress ? (
        <section aria-labelledby="address-heading" className="bg-surface p-7">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-5">
            <h2
              id="address-heading"
              className="font-display text-2xl font-semibold italic text-foreground"
            >
              Địa chỉ mặc định
            </h2>
            <span className="label-micro text-accent">Đang dùng</span>
          </div>

          <div className="mt-7 flex gap-5">
            <span
              aria-hidden="true"
              className="inline-flex size-11 shrink-0 items-center justify-center bg-surface-raised text-accent"
            >
              <MapPin className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-base text-foreground">
                {user.displayName || user.fullName || user.username}
              </p>
              {user.phone ? (
                <p className="num mt-1.5 text-sm text-muted-foreground">{user.phone}</p>
              ) : (
                <p className="mt-1.5 text-sm font-light text-muted-foreground/60">
                  Chưa có số điện thoại
                </p>
              )}
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                {[user.address, user.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
            <Button variant="outline" size="md" onClick={startEditing} disabled={saving}>
              <Pencil aria-hidden="true" />
              Sửa địa chỉ
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleRemove}
              disabled={saving}
              className="hover:text-danger"
            >
              {saving ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              Xoá địa chỉ
            </Button>
          </div>

          <p className="mt-6 text-xs font-light leading-relaxed text-muted-foreground">
            Địa chỉ này được điền sẵn ở trang{" "}
            <Link to="/checkout" className="text-accent transition-colors hover:text-accent-strong">
              Thanh toán
            </Link>
            . Bạn vẫn sửa được cho từng đơn mà không ảnh hưởng địa chỉ đã lưu.
          </p>
        </section>
      ) : (
        <EmptyState
          title="Chưa có địa chỉ nào"
          description="Lưu một địa chỉ mặc định để những lần đặt hoa sau không phải nhập lại thông tin giao hàng."
          action={
            <Button variant="primary" size="lg" onClick={startEditing}>
              Thêm địa chỉ mặc định
            </Button>
          }
        />
      )}
    </AccountLayout>
  );
}

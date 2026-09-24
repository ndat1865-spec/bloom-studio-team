import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Ban, Check, Copy, KeyRound, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice, TableRowSkeleton } from "@/components/ui/feedback";
import { ApiError, api, type ApiKey, type ApiKeyCreated } from "@/lib/api";

/**
 * Trang quan tri khoa API cua doi tac ngoai.
 *
 * Diem cot loi cua man hinh nay: khoa goc chi hien DUNG MOT LAN, ngay sau khi cap.
 * Sau do he thong chi con SHA-256 nen khong the doc lai — bang ben duoi khong bao gio
 * co cot nao chua khoa that, chi co keyPrefix.
 */

/** Scope khai o Gateway. Them route /api/public/** moi thi bo sung o ca hai noi. */
const SCOPES = [{ value: "products:read", label: "products:read — đọc danh sách hoa" }];

const HAN_DUNG = [
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
  { value: "365", label: "1 năm" },
  { value: "", label: "Không hết hạn" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function trangThai(key: ApiKey) {
  if (key.status === "REVOKED") return { text: "Đã thu hồi", tone: "text-muted-foreground" };
  if (!key.usable) return { text: "Hết hạn", tone: "text-muted-foreground" };
  return { text: "Đang dùng", tone: "text-foreground" };
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [ownerName, setOwnerName] = useState("");
  const [scope, setScope] = useState(SCOPES[0].value);
  const [daysValid, setDaysValid] = useState("30");
  const [ownerError, setOwnerError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  /** Khoa vua cap — giu trong bo nho trang, mat khi F5 va khong the lay lai. */
  const [justCreated, setJustCreated] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const [confirmRevoke, setConfirmRevoke] = useState<ApiKey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiKey | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setKeys(await api.listApiKeys());
    } catch (error) {
      setKeys(null);
      setLoadError(error instanceof Error ? error.message : "Không tải được danh sách khoá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setOwnerName("");
    setScope(SCOPES[0].value);
    setDaysValid("30");
    setOwnerError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const trimmed = ownerName.trim();
    if (!trimmed) {
      setOwnerError("Nhập tên đối tác.");
      return;
    }
    if (trimmed.length > 100) {
      setOwnerError("Tên đối tác tối đa 100 ký tự.");
      return;
    }
    setOwnerError(undefined);

    setSaving(true);
    try {
      const created = await api.createApiKey({
        ownerName: trimmed,
        scopes: [scope],
        daysValid: daysValid === "" ? null : Number(daysValid),
      });
      setJustCreated(created);
      setCopied(false);
      resetForm();
      await load();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.ownerName) {
        setOwnerError(error.fieldErrors.ownerName);
      }
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Không cấp được khoá.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Trinh duyet chan clipboard (thuong la khi khong chay tren HTTPS): de ADMIN tu boi den chep.
      setNotice({ tone: "error", text: "Trình duyệt chặn sao chép tự động — hãy bôi đen và chép tay." });
    }
  }

  async function handleRevoke() {
    if (!confirmRevoke) return;
    setWorking(true);
    try {
      await api.revokeApiKey(confirmRevoke.id);
      setNotice({ tone: "success", text: `Đã thu hồi khoá của "${confirmRevoke.ownerName}".` });
      setConfirmRevoke(null);
      await load();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Không thu hồi được khoá.",
      });
      setConfirmRevoke(null);
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setWorking(true);
    try {
      await api.deleteApiKey(confirmDelete.id);
      setNotice({ tone: "success", text: `Đã xoá hẳn khoá của "${confirmDelete.ownerName}".` });
      setConfirmDelete(null);
      await load();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Không xoá được khoá.",
      });
      setConfirmDelete(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Admin · Đối tác</p>
        <h1 className="display-section mt-5 text-foreground">Khoá API</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        <p className="prose-measure mt-6 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
          Khoá dành cho đối tác ngoài gọi <code>/api/public/**</code> bằng header{" "}
          <code>X-API-KEY</code>, không phải cho người dùng của cửa hàng. Hệ thống chỉ lưu bản
          băm của khoá — <strong>khoá gốc chỉ hiện đúng một lần</strong> ngay sau khi cấp.
        </p>
        <p className="prose-measure mt-3 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
          Thu hồi có thể chậm tới một phút do Gateway nhớ kết quả kiểm tra.
        </p>
      </header>

      {justCreated ? (
        <section
          aria-labelledby="new-key-heading"
          className="mt-8 border border-accent bg-surface p-6"
        >
          <h2 id="new-key-heading" className="display-lg flex items-center gap-2 text-foreground">
            <KeyRound aria-hidden="true" className="size-5 text-accent" />
            Khoá của &ldquo;{justCreated.key.ownerName}&rdquo;
          </h2>
          <p className="mt-3 text-sm text-accent">{justCreated.warning}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <code className="num flex-1 break-all border border-border bg-background px-4 py-3 text-sm text-foreground">
              {justCreated.keyValue}
            </code>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void handleCopy(justCreated.keyValue)}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Đã chép" : "Chép"}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setJustCreated(null);
                setCopied(false);
              }}
            >
              Tôi đã lưu khoá, ẩn đi
            </Button>
          </div>
        </section>
      ) : null}

      {notice ? (
        <Notice tone={notice.tone} className="mt-8">
          {notice.text}
        </Notice>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_22rem] lg:gap-10">
        {/* min-w-0: o luoi, con mac dinh la min-width:auto nen bang rong hon se day
            ca trang tran ngang thay vi tu cuon trong khung overflow-x-auto. */}
        <section aria-labelledby="key-list-heading" className="min-w-0">
          <h2 id="key-list-heading" className="display-lg text-foreground">
            Khoá đã cấp
          </h2>

          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <caption className="sr-only">
                Danh sách khoá API với chủ sở hữu, quyền, trạng thái và lần dùng gần nhất
              </caption>
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Đối tác</th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Khoá</th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Quyền</th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Trạng thái</th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">Dùng gần nhất</th>
                  <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 2 }).map((_, index) => (
                      <TableRowSkeleton key={index} columns={6} />
                    ))
                  : keys?.map((key) => {
                      const status = trangThai(key);
                      return (
                        <tr
                          key={key.id}
                          className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-raised"
                        >
                          <td className="px-4 py-4 text-sm text-foreground">
                            {key.ownerName}
                            <span className="num block text-xs text-muted-foreground">#{key.id}</span>
                          </td>
                          <td className="num px-4 py-4 text-sm text-muted-foreground">
                            {key.keyPrefix}…
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {key.scopes.join(", ")}
                          </td>
                          <td className={`px-4 py-4 text-sm ${status.tone}`}>
                            {status.text}
                            {key.expiresAt ? (
                              <span className="block text-xs text-muted-foreground">
                                hạn {formatDate(key.expiresAt)}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatDate(key.lastUsedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              {key.status === "ACTIVE" ? (
                                <Button variant="ghost" size="sm" onClick={() => setConfirmRevoke(key)}>
                                  <Ban aria-hidden="true" />
                                  Thu hồi
                                </Button>
                              ) : null}
                              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(key)}>
                                <Trash2 aria-hidden="true" />
                                Xoá
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {loadError ? (
            <ErrorState
              message={loadError}
              action={
                <Button variant="outline" size="md" onClick={() => void load()}>
                  Thử lại
                </Button>
              }
            />
          ) : null}

          {!loading && keys?.length === 0 ? (
            <EmptyState
              title="Chưa cấp khoá nào"
              description="Cấp khoá đầu tiên ở biểu mẫu bên cạnh để đối tác gọi được /api/public/products."
            />
          ) : null}
        </section>

        <section aria-labelledby="key-form-heading" className="lg:sticky lg:top-28 lg:self-start">
          <form onSubmit={handleSubmit} noValidate className="border border-border bg-surface p-6">
            <h2 id="key-form-heading" className="display-lg text-foreground">
              Cấp khoá mới
            </h2>
            <span aria-hidden="true" className="mt-4 block h-px w-16 bg-accent" />

            <div className="mt-7 space-y-6">
              <Field id="owner-name" label="Tên đối tác" error={ownerError} required>
                {(props) => (
                  <Input
                    {...props}
                    value={ownerName}
                    maxLength={100}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="Công ty Hoa Tươi ABC"
                  />
                )}
              </Field>

              <Field id="scope" label="Quyền" required>
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                  >
                    {SCOPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field id="days-valid" label="Hạn dùng">
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={daysValid}
                    onChange={(event) => setDaysValid(event.target.value)}
                  >
                    {HAN_DUNG.map((item) => (
                      <option key={item.label} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang cấp…
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    Cấp khoá
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={resetForm} disabled={saving}>
                <RotateCcw aria-hidden="true" />
                Làm mới
              </Button>
            </div>
          </form>
        </section>
      </div>

      <Dialog open={confirmRevoke !== null} onOpenChange={(open) => !open && setConfirmRevoke(null)}>
        <DialogContent
          open={confirmRevoke !== null}
          title="Thu hồi khoá?"
          description={
            confirmRevoke
              ? `Khoá của "${confirmRevoke.ownerName}" (${confirmRevoke.keyPrefix}…) sẽ ngừng hiệu lực nhưng vẫn nằm trong danh sách để truy vết. Gateway có thể còn cho qua tới một phút do cache.`
              : undefined
          }
          footer={
            <>
              <Button variant="ghost" size="md" onClick={() => setConfirmRevoke(null)} disabled={working}>
                Huỷ
              </Button>
              <Button variant="danger" size="md" onClick={handleRevoke} disabled={working}>
                {working ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang thu hồi…
                  </>
                ) : (
                  <>
                    <Ban aria-hidden="true" />
                    Thu hồi
                  </>
                )}
              </Button>
            </>
          }
        />
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent
          open={confirmDelete !== null}
          title="Xoá hẳn khoá?"
          description={
            confirmDelete
              ? `Khoá của "${confirmDelete.ownerName}" bị xoá khỏi cơ sở dữ liệu, không còn dấu vết để truy lại. Thường nên thu hồi thay vì xoá.`
              : undefined
          }
          footer={
            <>
              <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)} disabled={working}>
                Huỷ
              </Button>
              <Button variant="danger" size="md" onClick={handleDelete} disabled={working}>
                {working ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang xoá…
                  </>
                ) : (
                  <>
                    <Trash2 aria-hidden="true" />
                    Xoá
                  </>
                )}
              </Button>
            </>
          }
        />
      </Dialog>
    </div>
  );
}

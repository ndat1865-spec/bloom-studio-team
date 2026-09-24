import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, NativeSelect, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice, TableRowSkeleton } from "@/components/ui/feedback";
import { Pagination } from "@/components/shop/Pagination";
import { ApiError, api, type Category, type Product, type ProductPayload } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";
import { useDebounced, useProducts } from "@/lib/useProducts";

const PAGE_SIZE = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FormState = {
  id: number | null;
  name: string;
  price: string;
  stockQuantity: string;
  description: string;
  categoryId: string;
  /** Anh dang co cua san pham — de biet co giu anh cu hay khong khi sua */
  currentImageUrl: string | null;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  price: "",
  stockQuantity: "",
  description: "",
  categoryId: "",
  currentImageUrl: null,
};

/**
 * SOS09 — trang quan tri san pham.
 *
 * Luong luu: luu san pham truoc (POST/PUT) -> lay id -> neu co file thi upload anh.
 * KIEM TRA CA HAI request: neu luu thanh cong nhung upload that bai,
 * bao dung trang thai va cho thu lai rieng phan anh, khong bao "thanh cong" toan bo.
 */
export default function AdminProductsPage() {

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  /** San pham da luu nhung anh chua len duoc — cho phep thu lai rieng */
  const [pendingUpload, setPendingUpload] = useState<{ productId: number; file: File } | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Doi tu khoa tim kiem -> ve trang 0
  useEffect(() => setPage(0), [debouncedSearch]);

  const query = useMemo(
    () => ({ name: debouncedSearch, page, size: PAGE_SIZE, sort: "id,desc" }),
    [debouncedSearch, page],
  );
  const { data, loading, error, reload } = useProducts(query);

  useEffect(() => {
    const controller = new AbortController();
    api
      .listCategories(controller.signal)
      .then((list) => {
        setCategories(list);
        setCategoriesError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setCategoriesError(err instanceof Error ? err.message : "Không tải được danh mục.");
      });
    return () => controller.abort();
  }, []);

  // Giai phong object URL cua anh xem truoc
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFile(null);
    setPendingUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      stockQuantity: String(product.stockQuantity ?? 0),
      description: product.description ?? "",
      categoryId: product.category ? String(product.category.id) : "",
      currentImageUrl: product.imageUrl,
    });
    setFieldErrors({});
    setFile(null);
    setPendingUpload(null);
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Nhập tên sản phẩm.";
    else if (form.name.trim().length > 100) next.name = "Tên tối đa 100 ký tự.";

    const price = Number(form.price);
    if (form.price.trim() === "") next.price = "Nhập giá.";
    else if (!Number.isFinite(price)) next.price = "Giá phải là số.";
    else if (price < 0) next.price = "Giá không được âm.";

    const stock = Number(form.stockQuantity);
    if (form.stockQuantity.trim() === "") next.stockQuantity = "Nhập số lượng tồn kho.";
    else if (!Number.isInteger(stock)) next.stockQuantity = "Tồn kho phải là số nguyên.";
    else if (stock < 0) next.stockQuantity = "Tồn kho không được âm.";

    if (!form.categoryId) next.categoryId = "Chọn danh mục.";

    if (file) {
      if (file.size > MAX_IMAGE_BYTES) next.image = "Ảnh vượt quá 5MB.";
      else if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name))
        next.image = "Chỉ nhận ảnh jpg, jpeg, png, webp, gif, avif.";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setPendingUpload(null);
    if (!validate()) return;

    const payload: ProductPayload = {
      name: form.name.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      description: form.description.trim(),
      category: { id: Number(form.categoryId) },
    };

    setSaving(true);
    let saved: Product;
    try {
      saved = form.id
        ? await api.updateProduct(form.id, payload)
        : await api.createProduct(payload);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Không lưu được sản phẩm.",
      });
      return;
    }

    // Buoc 2: upload anh (neu co chon file). Ket qua duoc kiem tra rieng.
    if (file) {
      try {
        await api.uploadProductImage(saved.id, file);
        setNotice({
          tone: "success",
          text: `Đã lưu "${saved.name}" và cập nhật ảnh.`,
        });
        resetForm();
      } catch (err) {
        setPendingUpload({ productId: saved.id, file });
        setNotice({
          tone: "error",
          text: `Đã lưu "${saved.name}" (#${saved.id}) nhưng TẢI ẢNH THẤT BẠI: ${
            err instanceof Error ? err.message : "lỗi không xác định"
          }. Sản phẩm vẫn giữ ảnh cũ.`,
        });
      }
    } else {
      setNotice({
        tone: "success",
        text: form.id
          ? `Đã cập nhật "${saved.name}". Không chọn ảnh mới nên ảnh cũ được giữ nguyên.`
          : `Đã thêm "${saved.name}".`,
      });
      resetForm();
    }

    setSaving(false);
    reload();
  }

  async function retryUpload() {
    if (!pendingUpload) return;
    setSaving(true);
    try {
      await api.uploadProductImage(pendingUpload.productId, pendingUpload.file);
      setNotice({ tone: "success", text: "Đã tải ảnh lên thành công." });
      setPendingUpload(null);
      resetForm();
      reload();
    } catch (err) {
      setNotice({
        tone: "error",
        text: `Vẫn chưa tải được ảnh: ${err instanceof Error ? err.message : "lỗi không xác định"}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await api.deleteProduct(confirmTarget.id);
      setNotice({ tone: "success", text: `Đã xoá "${confirmTarget.name}".` });
      if (form.id === confirmTarget.id) resetForm();
      setConfirmTarget(null);
      reload();
    } catch (err) {
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Không xoá được sản phẩm.",
      });
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const imagePreviewSrc = preview ?? resolveImageUrl(form.currentImageUrl);
  const hasImage = Boolean(preview || form.currentImageUrl);

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Admin · SOS09</p>
        <h1 className="display-section mt-5 text-foreground">Quản lý hoa</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        <p className="prose-measure mt-6 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
          Thêm, sửa, xoá sản phẩm và tải ảnh cho danh mục cửa hàng.
        </p>
      </header>

      {notice ? (
        <Notice tone={notice.tone} className="mt-8">
          {notice.text}
          {pendingUpload ? (
            <Button variant="outline" size="sm" className="ml-4" onClick={retryUpload} disabled={saving}>
              Thử tải ảnh lại
            </Button>
          ) : null}
        </Notice>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-12 xl:grid-cols-[1fr_26rem] xl:gap-10">
        {/* ---------- Bang du lieu ---------- */}
        <section aria-labelledby="admin-list-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="admin-list-heading" className="display-lg text-foreground">
              Danh sách sản phẩm
            </h2>
            <div className="w-full max-w-xs">
              <Label htmlFor="admin-search" className="mb-2">
                Tìm theo tên
              </Label>
              <Input
                id="admin-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên sản phẩm…"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <caption className="sr-only">
                Danh sách sản phẩm hoa với ảnh, tên, danh mục, giá và thao tác
              </caption>
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">
                    Ảnh
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">
                    Tên
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">
                    Danh mục
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">
                    Giá
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !data
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRowSkeleton key={index} columns={5} />
                    ))
                  : data?.content.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-raised"
                      >
                        <td className="px-4 py-3">
                          <img
                            src={resolveImageUrl(product.imageUrl)}
                            alt=""
                            onError={(event) => {
                              const img = event.currentTarget;
                              if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                            }}
                            className="size-14 bg-surface-raised object-cover"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground">{product.name}</span>
                          <span className="num block text-xs text-muted-foreground">
                            #{product.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {product.category?.name ?? "—"}
                        </td>
                        <td className="num px-4 py-3 text-right text-sm text-foreground">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(product)}>
                              <Pencil aria-hidden="true" />
                              Sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmTarget(product)}
                            >
                              <Trash2 aria-hidden="true" />
                              Xoá
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
                <Button variant="outline" size="md" onClick={reload}>
                  Thử lại
                </Button>
              }
            />
          ) : null}

          {data && data.content.length === 0 && !loading ? (
            <EmptyState
              title="Chưa có sản phẩm nào"
              description="Dùng biểu mẫu bên cạnh để thêm sản phẩm hoa đầu tiên, hoặc bỏ từ khoá tìm kiếm."
            />
          ) : null}

          {data ? <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} /> : null}
        </section>

        {/* ---------- Bieu mau them / sua ---------- */}
        <section aria-labelledby="admin-form-heading" className="xl:sticky xl:top-28 xl:self-start">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="border border-border bg-surface p-6"
          >
            <h2 id="admin-form-heading" className="display-lg text-foreground">
              {form.id ? `Sửa sản phẩm #${form.id}` : "Thêm sản phẩm"}
            </h2>
            <span aria-hidden="true" className="mt-4 block h-px w-16 bg-accent" />

            <div className="mt-7 space-y-5">
              <Field id="name" label="Tên sản phẩm" error={fieldErrors.name} required>
                {(props) => (
                  <Input
                    {...props}
                    value={form.name}
                    maxLength={100}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Noir Dahlia Hand-Tied"
                  />
                )}
              </Field>

              <Field id="price" label="Giá (GBP)" error={fieldErrors.price} required>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="num"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="68"
                  />
                )}
              </Field>

              <Field
                id="stockQuantity"
                label="Tồn kho"
                error={fieldErrors.stockQuantity}
                required
              >
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    className="num"
                    value={form.stockQuantity}
                    onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                    placeholder="50"
                  />
                )}
              </Field>

              <Field id="description" label="Mô tả" error={fieldErrors.description}>
                {(props) => (
                  <Textarea
                    {...props}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Hoa gì, buộc kiểu nào, hợp dịp nào…"
                  />
                )}
              </Field>

              <Field
                id="categoryId"
                label="Danh mục"
                error={fieldErrors.categoryId ?? categoriesError ?? undefined}
                required
              >
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.categoryId}
                    onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  >
                    <option value="">— Chọn danh mục —</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field
                id="image"
                label="Ảnh sản phẩm"
                error={fieldErrors.image}
                hint={
                  form.id
                    ? "Không chọn ảnh mới thì ảnh cũ được giữ nguyên. Tối đa 5MB."
                    : "jpg, png, webp, gif, avif. Tối đa 5MB."
                }
              >
                {({ invalid, ...props }) => (
                  // `invalid` la co noi bo cua <Field>, khong phai thuoc tinh DOM hop le
                  // -> tach ra va chuyen thanh aria-invalid.
                  <input
                    {...props}
                    aria-invalid={invalid || undefined}
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="w-full border border-border-strong bg-surface-raised px-3.5 py-2.5 text-sm text-muted-foreground file:mr-4 file:border-0 file:bg-primary file:px-4 file:py-2 file:font-sans file:text-[10px] file:font-medium file:uppercase file:tracking-[0.1em] file:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                )}
              </Field>

              {hasImage ? (
                <figure className="flex items-center gap-4 border border-border bg-surface-raised p-3">
                  <img
                    src={imagePreviewSrc}
                    alt=""
                    onError={(event) => {
                      const img = event.currentTarget;
                      if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
                    }}
                    className="size-20 shrink-0 object-cover"
                  />
                  <figcaption className="text-xs font-light text-muted-foreground">
                    {preview ? "Ảnh mới sẽ được tải lên sau khi lưu." : "Ảnh hiện tại của sản phẩm."}
                  </figcaption>
                </figure>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang lưu…
                  </>
                ) : form.id ? (
                  <>
                    <Upload aria-hidden="true" />
                    Lưu thay đổi
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    Thêm sản phẩm
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

      {/* Hop xac nhan xoa — Radix lo focus trap va Esc */}
      <Dialog open={confirmTarget !== null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent
          open={confirmTarget !== null}
          title="Xoá sản phẩm?"
          description={
            confirmTarget
              ? `"${confirmTarget.name}" (#${confirmTarget.id}) sẽ bị xoá khỏi cơ sở dữ liệu. Thao tác này không hoàn tác được.`
              : undefined
          }
          footer={
            <>
              <Button variant="ghost" size="md" onClick={() => setConfirmTarget(null)} disabled={deleting}>
                Huỷ
              </Button>
              <Button variant="danger" size="md" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
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

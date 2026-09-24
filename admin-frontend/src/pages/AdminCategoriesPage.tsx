import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Notice, TableRowSkeleton } from "@/components/ui/feedback";
import { ApiError, api, type Category } from "@/lib/api";

/**
 * Trang quan tri danh muc — phan tich hop them so voi giao dien mau cua SOS09,
 * de CRUD Category cua SOS05/SOS06 duoc dung that trong ung dung.
 *
 * Chinh sach xoa: backend KHONG cascade. Danh muc con san pham se tra 409
 * kem thong bao ro rang; giao dien hien dung thong bao do.
 */
export default function AdminCategoriesPage() {

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCategories(await api.listCategories());
    } catch (error) {
      setCategories(null);
      setLoadError(error instanceof Error ? error.message : "Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setNameError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nhập tên danh mục.");
      return;
    }
    if (trimmed.length > 100) {
      setNameError("Tên danh mục tối đa 100 ký tự.");
      return;
    }
    setNameError(undefined);

    setSaving(true);
    try {
      if (editingId) {
        await api.updateCategory(editingId, trimmed);
        setNotice({ tone: "success", text: `Đã cập nhật danh mục "${trimmed}".` });
      } else {
        await api.createCategory(trimmed);
        setNotice({ tone: "success", text: `Đã thêm danh mục "${trimmed}".` });
      }
      resetForm();
      await load();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.name) setNameError(error.fieldErrors.name);
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Không lưu được danh mục.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await api.deleteCategory(confirmTarget.id);
      setNotice({ tone: "success", text: `Đã xoá danh mục "${confirmTarget.name}".` });
      if (editingId === confirmTarget.id) resetForm();
      setConfirmTarget(null);
      await load();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Không xoá được danh mục.",
      });
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="shell page-pad">
      <header>
        <p className="label-micro text-accent">Admin · SOS05 &amp; SOS06</p>
        <h1 className="display-section mt-5 text-foreground">Danh mục</h1>
        <span aria-hidden="true" className="mt-6 block h-px w-28 bg-accent" />
        <p className="prose-measure mt-6 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
          Danh mục là phía &ldquo;một&rdquo; trong quan hệ 1–N với sản phẩm. Không dùng cascade: muốn
          xoá một danh mục thì phải chuyển hoặc xoá hết sản phẩm bên trong trước.
        </p>
      </header>

      {notice ? (
        <Notice tone={notice.tone} className="mt-8">
          {notice.text}
        </Notice>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_22rem] lg:gap-10">
        <section aria-labelledby="category-list-heading">
          <h2 id="category-list-heading" className="display-lg text-foreground">
            Tất cả danh mục
          </h2>

          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <caption className="sr-only">Danh sách danh mục và số sản phẩm trong mỗi danh mục</caption>
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">
                    Mã
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-muted-foreground">
                    Tên danh mục
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">
                    Sản phẩm
                  </th>
                  <th scope="col" className="label-micro px-4 py-4 text-right text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <TableRowSkeleton key={index} columns={4} />
                    ))
                  : categories?.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-raised"
                      >
                        <td className="num px-4 py-4 text-sm text-muted-foreground">#{category.id}</td>
                        <td className="px-4 py-4 text-sm text-foreground">{category.name}</td>
                        <td className="num px-4 py-4 text-right text-sm text-foreground">
                          {category.productCount}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(category.id);
                                setName(category.name);
                                setNameError(undefined);
                                setNotice(null);
                              }}
                            >
                              <Pencil aria-hidden="true" />
                              Sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmTarget(category)}
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

          {!loading && categories?.length === 0 ? (
            <EmptyState
              title="Chưa có danh mục nào"
              description="Tạo danh mục đầu tiên ở biểu mẫu bên cạnh, ví dụ Bespoke Arrangements."
            />
          ) : null}
        </section>

        <section aria-labelledby="category-form-heading" className="lg:sticky lg:top-28 lg:self-start">
          <form onSubmit={handleSubmit} noValidate className="border border-border bg-surface p-6">
            <h2 id="category-form-heading" className="display-lg text-foreground">
              {editingId ? `Sửa danh mục #${editingId}` : "Thêm danh mục"}
            </h2>
            <span aria-hidden="true" className="mt-4 block h-px w-16 bg-accent" />

            <div className="mt-7">
              <Field id="category-name" label="Tên danh mục" error={nameError} required>
                {(props) => (
                  <Input
                    {...props}
                    value={name}
                    maxLength={100}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Bespoke Arrangements"
                  />
                )}
              </Field>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Đang lưu…
                  </>
                ) : editingId ? (
                  "Lưu thay đổi"
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    Thêm
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

      <Dialog open={confirmTarget !== null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent
          open={confirmTarget !== null}
          title="Xoá danh mục?"
          description={
            confirmTarget
              ? confirmTarget.productCount > 0
                ? `"${confirmTarget.name}" đang có ${confirmTarget.productCount} sản phẩm. Backend sẽ từ chối (409) cho tới khi bạn chuyển hoặc xoá hết sản phẩm bên trong.`
                : `"${confirmTarget.name}" (#${confirmTarget.id}) sẽ bị xoá khỏi cơ sở dữ liệu.`
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

import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AdminHeader } from "@/components/site/AdminHeader";
import { RequireRole } from "@/components/RequireRole";
import { Spinner } from "@/components/ui/feedback";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AdminOverviewPage = lazy(() => import("@/pages/AdminOverviewPage"));
const AdminOrdersPage = lazy(() => import("@/pages/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("@/pages/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/AdminCategoriesPage"));
const AdminApiKeysPage = lazy(() => import("@/pages/AdminApiKeysPage"));
const OrderDetailPage = lazy(() => import("@/pages/OrderDetailPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

/** Khung tran man hinh cho trang dang nhap: chi co <main>. */
function BareLayout() {
  return (
    <main id="main" tabIndex={-1}>
      <Suspense
        fallback={
          <div className="flex min-h-svh items-center justify-center">
            <Spinner label="Đang tải trang…" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </main>
  );
}

/**
 * Khung cua moi trang quan tri. RequireRole boc ca khung nen tung route
 * ben trong khong phai tu kiem tra quyen nua.
 */
function AdminLayout() {
  return (
    <RequireRole role="ADMIN">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-accent focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:text-accent"
      >
        Bỏ qua tới nội dung
      </a>

      <AdminHeader />

      <main id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="shell flex min-h-[50svh] items-center justify-center">
              <Spinner label="Đang tải trang…" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </RequireRole>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<BareLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        {/* Giu nguyen duong dan /admin/... nhu ban mot frontend de link giua cac trang khong doi */}
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="admin" element={<AdminOverviewPage />} />
        <Route path="admin/products" element={<AdminProductsPage />} />
        <Route path="admin/categories" element={<AdminCategoriesPage />} />
        <Route path="admin/orders" element={<AdminOrdersPage />} />
        <Route path="admin/api-keys" element={<AdminApiKeysPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

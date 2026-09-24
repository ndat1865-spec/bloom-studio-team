import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Chan truy cap trai role o phia giao dien.
 *
 * LUU Y: day chi la trai nghiem nguoi dung, KHONG phai bao mat.
 * Backend van tu kiem tra role trong JWT o tung service.
 *
 * App quan tri chi co mot loai nguoi dung: chua dang nhap hoac khong phai ADMIN
 * thi deu ve /login (LoginPage se tu choi tai khoan CUSTOMER).
 */
export function RequireRole({
  role,
  children,
}: {
  role: "ADMIN" | "CUSTOMER";
  children: ReactNode;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

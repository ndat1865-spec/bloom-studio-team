import { Link, NavLink, useNavigate } from "react-router-dom";
import { ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/site/InitialsAvatar";
import { useAuth } from "@/context/AuthContext";
import { SHOP_APP_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { label: "Tổng quan", to: "/admin", end: true },
  { label: "Quản lý hoa", to: "/admin/products", end: false },
  { label: "Danh mục", to: "/admin/categories", end: false },
  { label: "Đơn hàng", to: "/admin/orders", end: false },
  { label: "Khoá API", to: "/admin/api-keys", end: false },
];

/**
 * Thanh dieu huong cua app quan tri. Khong co gio hang hay trang chu cua hang —
 * nhung thu do nam o customer-frontend.
 */
export function AdminHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const name = user.displayName || user.fullName || user.username;

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-[12px]">
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6">
        <Link
          to="/admin"
          className="font-display text-2xl font-bold italic leading-none text-accent transition-colors hover:text-accent-strong"
        >
          Bloom Studio
          <span className="label-micro ml-3 align-middle not-italic text-muted-foreground">
            Quản trị
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href={SHOP_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="label-micro hidden items-center gap-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Xem cửa hàng
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
          <div className="hidden items-center gap-3 md:flex">
            <InitialsAvatar name={name} size="md" />
            <span className="max-w-40 truncate text-sm text-foreground">{name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut aria-hidden="true" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Menu ngang cuon duoc tren man hinh hep, thay cho nut hamburger */}
      <nav
        aria-label="Điều hướng quản trị"
        className="shell -mt-1 flex gap-8 overflow-x-auto pb-3"
      >
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "label-micro shrink-0 py-1 transition-colors hover:text-foreground",
                isActive ? "text-accent" : "text-muted-foreground",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

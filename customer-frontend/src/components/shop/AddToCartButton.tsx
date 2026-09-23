import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Nut tron them nhanh vao gio, dat o goc trai duoi cua anh san pham.
 *
 * - LUON hien thi (khong phai chi khi hover): man hinh cam ung khong co hover
 * - 44px de bam duoc tren dien thoai
 * - Sau khi them: doi sang icon check ~1,2s de khach biet thao tac da duoc ghi nhan
 * - stopPropagation + preventDefault vi the san pham co mot lien ket phu toan bo the
 */
export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // The san pham co lien ket phu kin toan bo the -> chan de khong dieu huong
    event.preventDefault();
    event.stopPropagation();

    add(product, 1);
    setJustAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Thêm ${product.name} vào giỏ hàng`}
      className={cn(
        "relative z-20 inline-flex size-11 items-center justify-center rounded-chip",
        "bg-accent text-background shadow-[0_6px_20px_rgba(0,0,0,0.45)]",
        "transition-[transform,background-color] duration-200 ease-[var(--ease-entrance)]",
        "hover:scale-105 hover:bg-accent-strong active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {justAdded ? (
        <Check className="size-5" aria-hidden="true" />
      ) : (
        <Plus className="size-5" aria-hidden="true" />
      )}
      <span className="sr-only" aria-live="polite">
        {justAdded ? `Đã thêm ${product.name} vào giỏ hàng` : ""}
      </span>
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

/**
 * Icon gio hang + badge so luong, co hieu ung nay khi them hang.
 *
 * - Badge chi hien khi gio co hang
 * - Hieu ung CHI chay khi so luong tang (bumpToken tu CartContext),
 *   khong chay luc trang vua tai va khong chay khi giam so luong
 * - Ton trong prefers-reduced-motion: bo hieu ung, so van doi
 * - aria-live de trinh doc man hinh biet gio vua thay doi
 */
export function CartIndicator({ className }: { className?: string }) {
  const { count, bumpToken } = useCart();
  const reduceMotion = useReducedMotion();
  const [bumping, setBumping] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduceMotion) return;
    setBumping(true);
    const timer = window.setTimeout(() => setBumping(false), 320);
    return () => window.clearTimeout(timer);
  }, [bumpToken, reduceMotion]);

  const label = count === 0 ? "Giỏ hàng, đang trống" : `Giỏ hàng, ${count} sản phẩm`;

  return (
    <Link
      to="/cart"
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center text-foreground transition-colors",
        "hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        animate={bumping ? { rotate: [0, -9, 7, 0] } : { rotate: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
        className="inline-flex"
      >
        <ShoppingBag className="size-5" />
      </motion.span>

      <AnimatePresence>
        {count > 0 ? (
          <motion.span
            key="badge"
            aria-hidden="true"
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: bumping && !reduceMotion ? [1, 1.35, 1] : 1, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
            className={cn(
              "num absolute -right-1 -top-0.5 inline-flex min-w-[1.25rem] items-center justify-center",
              "rounded-chip bg-accent px-1.5 py-0.5 text-[10px] font-medium leading-none text-background",
            )}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* Thong bao cho trinh doc man hinh, khong hien thi bang mat */}
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </Link>
  );
}

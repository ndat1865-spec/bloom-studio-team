import { Link } from "react-router-dom";
import type { Product } from "@/lib/api";
import { FALLBACK_IMAGE, formatPrice, resolveImageUrl } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";

/**
 * The san pham.
 *
 * Cau truc co y: KHONG boc ca the trong mot <Link>, vi nut "them vao gio" la mot <button>
 * va <button> long trong <a> la HTML khong hop le. Thay vao do:
 *   - the la mot khoi `relative`
 *   - lien ket phu kin the bang `after:absolute after:inset-0` (stretched link)
 *   - nut gio la phan tu ANH EM, `relative z-20` nen nam tren lop phu cua lien ket
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex h-full flex-col border border-border bg-surface transition-colors duration-200 hover:border-border-strong">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-raised">
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            const img = event.currentTarget;
            if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
          }}
          className="size-full object-cover transition-transform duration-500 ease-[var(--ease-entrance)] group-hover:scale-[1.03]"
        />

        {/* Nut tron them nhanh — goc trai duoi cua anh */}
        <AddToCartButton product={product} className="absolute bottom-4 left-4" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="label-micro text-accent">{product.category?.name ?? "Chưa phân loại"}</p>

        <h3 className="mt-3 font-display text-xl font-semibold italic leading-snug text-foreground transition-colors duration-200 group-hover:text-accent">
          <Link
            to={`/products/${product.id}`}
            className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {product.name}
          </Link>
        </h3>

        {product.description ? (
          <p className="mt-2.5 line-clamp-2 text-sm font-light leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <p className="num mt-auto pt-5 text-base font-medium text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}

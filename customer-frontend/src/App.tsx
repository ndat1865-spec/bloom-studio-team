import { useEffect, useState } from "react";
import { demoProducts, money, request, type Product, type Quote } from "./api";

export default function App() {
  const [live, setLive] = useState(false);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(demoProducts[0]);
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setError(""); setQuote(null); setSelected(null); setProducts([]);
    if (!live) { setProducts(demoProducts); setSelected(demoProducts[0]); setLoading(false); return; }
    setLoading(true);
    request<Product[]>("/products")
      .then(data => { if (active) { setProducts(data); setSelected(data[0] ?? null); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [live, reload]);

  async function preview() {
    if (!selected) return;
    setError(""); setQuote(null);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(99, selected.stockQuantity)) {
      setError("Số lượng phải là số nguyên từ 1 đến " + Math.min(99, selected.stockQuantity)); return;
    }
    setQuoting(true);
    try {
      const result = live
        ? await request<Quote>("/orders/preview", { method: "POST", body: JSON.stringify({ productId: selected.id, quantity }) })
        : { productId: selected.id, productName: selected.name, quantity, unitPrice: selected.price, total: selected.price * quantity, note: "Tính thử bằng dữ liệu demo trên trình duyệt." };
      setQuote(result);
    } catch (err) { setError((err as Error).message); }
    finally { setQuoting(false); }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return <>
    <header><div><div className="brand">bloom studio.</div><p>Hoa cho những ngày đáng nhớ</p></div>
      <label>Nguồn dữ liệu<select aria-label="Nguồn dữ liệu" value={live ? "api" : "demo"} disabled={quoting} onChange={e => setLive(e.target.value === "api")}><option value="demo">Demo · chạy độc lập</option><option value="api">API · kết nối Gateway</option></select></label>
    </header>
    <main>
      <span className="eyebrow">Bộ sưu tập đầu tiên</span><h1>Một chút hoa, một ngày đẹp.</h1>
      <p className="muted">Chọn một mẫu hoa và xem giá dự kiến cho món quà của bạn.</p>
      <div className="banner">{live ? "Đang dùng API thật qua Gateway :18080." : "Chế độ demo: dữ liệu mẫu có sẵn, không cần chạy backend."} Bản khởi đầu chỉ xem sản phẩm và tính giá; chưa gửi đơn hàng.</div>
      <div className="toolbar"><label>Tìm hoa<input placeholder="Ví dụ: hong" value={search} onChange={e => setSearch(e.target.value)} /></label><button disabled={loading || quoting} onClick={() => setReload(n => n + 1)}>Tải lại</button></div>
      {error && <div role="alert" className="error">{error}</div>}
      {loading && <p role="status">Đang tải sản phẩm…</p>}
      <div className="layout">
        <section className="cards" aria-label="Sản phẩm">
          {filtered.map((p, i) => <article className="card" key={p.id}><div className="flower" aria-hidden="true">{["🌹", "🌻", "🌿"][i % 3]}</div><h3>{p.name}</h3><p className="price">{money(p.price)}</p><p className="muted">Còn {p.stockQuantity} sản phẩm</p><button disabled={quoting} onClick={() => { setSelected(p); setQuantity(1); setQuote(null); setError(""); }}>Chọn hoa</button></article>)}
          {!loading && filtered.length === 0 && <p>Không có sản phẩm phù hợp.</p>}
        </section>
        <aside className="panel"><h2>Tính giá dự kiến</h2><p>{selected?.name ?? "Hãy chọn một sản phẩm"}</p>
          <label>Số lượng<input type="number" min="1" max={Math.min(99, selected?.stockQuantity ?? 99)} value={quantity} disabled={quoting} onChange={e => { setQuantity(Number(e.target.value)); setQuote(null); }} /></label>
          <button disabled={!selected || quoting || loading} onClick={preview}>{quoting ? "Đang tính…" : "Tính giá"}</button>
          {quote && <div role="status"><p>{quote.quantity} × {money(quote.unitPrice)}</p><p className="total">{money(quote.total)}</p><p className="muted">{quote.note}</p></div>}
        </aside>
      </div>
      <footer>Phụ trách: Trần Thị Mỹ Ngân · Giai đoạn 1: giao diện khách hàng, danh sách và tính giá.</footer>
    </main>
  </>;
}


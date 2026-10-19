import Link from "next/link";

type Props = {
  /** Trang hiện tại (bắt đầu từ 1). */
  page: number;
  /** Tổng số bản ghi. */
  total: number;
  /** Số bản ghi mỗi trang. */
  pageSize: number;
  /** Đường dẫn gốc, ví dụ "/admin/binh-luan". */
  basePath: string;
  /** Các tham số lọc cần giữ lại khi đổi trang (bỏ qua giá trị rỗng). */
  params?: Record<string, string | undefined>;
};

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ page, total, pageSize, basePath, params = {} }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const linkClass =
    "rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800";
  const disabledClass =
    "rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";

  return (
    <nav className="flex items-center justify-between gap-2 pt-2" aria-label="Phân trang">
      {current > 1 ? (
        <Link href={hrefFor(basePath, params, current - 1)} className={linkClass} rel="prev">
          ← Trước
        </Link>
      ) : (
        <span className={disabledClass}>← Trước</span>
      )}
      <span className="text-sm text-zinc-500">
        Trang {current} / {totalPages} · {total} mục
      </span>
      {current < totalPages ? (
        <Link href={hrefFor(basePath, params, current + 1)} className={linkClass} rel="next">
          Sau →
        </Link>
      ) : (
        <span className={disabledClass}>Sau →</span>
      )}
    </nav>
  );
}

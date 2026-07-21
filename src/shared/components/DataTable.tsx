import { clsx } from "clsx";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, onRowClick, keyField, loading, emptyMessage = "데이터가 없습니다." }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th key={String(col.key)} className={clsx(
                  "px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                )}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    "border-b border-border last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/30"
                  )}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={clsx(
                      "px-4 py-3 whitespace-nowrap",
                      col.className,
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    )}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

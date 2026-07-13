import type { TableBlockData, TableBlockProps } from "@/types/blocks";

/**
 * DataTable — pure RSC renderer for the blocks.table JSON payload.
 * The data is authored in the Strapi table-editor custom field, so it should
 * already match { headers, rows } — but the frontend never trusts it blindly
 * (decision #4): malformed data renders nothing, ragged rows are padded or
 * truncated to header length.
 */

function toCellText(cell: unknown): string {
  if (typeof cell === "string") return cell;
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  return "";
}

function normalizeTableData(data: unknown): TableBlockData | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;

  const { headers, rows } = data as { headers?: unknown; rows?: unknown };
  if (!Array.isArray(headers) || headers.length === 0) return null;

  const safeHeaders = headers.map(toCellText);
  const safeRows = (Array.isArray(rows) ? rows : [])
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) =>
      safeHeaders.map((_, col) => toCellText(row[col]))
    );

  return { headers: safeHeaders, rows: safeRows };
}

export default function DataTable({ title, description, data }: TableBlockProps) {
  const table = normalizeTableData(data);
  if (!table) return null;

  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-8">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {title}
            </h2>
            <span
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>
        )}

        {description && (
          <p
            className="mb-6 max-w-prose text-base"
            style={{ color: "var(--color-foues-text-body)" }}
          >
            {description}
          </p>
        )}

        <div
          className="overflow-x-auto rounded-lg border"
          style={{ borderColor: "var(--color-foues-border-subtle)" }}
        >
          <table className="w-full border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr style={{ backgroundColor: "var(--color-foues-navy)" }}>
                {table.headers.map((header, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-4 py-3 font-semibold text-white whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t"
                  style={{
                    borderColor: "var(--color-foues-border-subtle)",
                    backgroundColor:
                      rowIndex % 2 === 1 ? "var(--color-foues-surface)" : undefined,
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 align-top"
                      style={{ color: "var(--color-foues-text-body)" }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

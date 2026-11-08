import "server-only";
import ExcelJS from "exceljs";

// Same limits as Laravel's readSpreadsheet(): 5 MB.
// Note: old .xls files are not supported; save them as .xlsx first.
const MAX_BYTES = 5 * 1024 * 1024;

export type SheetRow = { _row: number; [header: string]: string | number | null };

export type ImportState =
  | { ok?: false; error?: string; rowErrors?: string[] }
  | { ok: true; message: string }
  | undefined;

/** Builds an .xlsx download. Strings are always written as text, never as formulas. */
export async function xlsxResponse(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  baseName: string,
): Promise<Response> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.addRow(headers).font = { bold: true };
  for (const r of rows) ws.addRow(r.map((v) => v ?? null));
  ws.columns.forEach((col, i) => {
    const longest = Math.max(headers[i].length, ...rows.map((r) => String(r[i] ?? "").length));
    col.width = Math.min(Math.max(longest + 2, 10), 60);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().replace(/[-:T]/g, "_").slice(0, 19);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}_${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

function cellValue(v: ExcelJS.CellValue): string | number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((p) => p.text).join("").trim() || null;
    if ("result" in v) return cellValue(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text).trim() || null;
  }
  return String(v);
}

/** Reads the first sheet into objects keyed by the header row. Empty rows are skipped. */
export async function readUploadedSheet(
  file: FormDataEntryValue | null,
): Promise<{ rows: SheetRow[] } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: "اختر ملف Excel أولاً." };
  if (file.size > MAX_BYTES) return { error: "حجم الملف يجب ألا يتجاوز 5 ميغابايت." };

  const name = file.name.toLowerCase();
  const wb = new ExcelJS.Workbook();
  try {
    if (name.endsWith(".xlsx")) {
      await wb.xlsx.load(await file.arrayBuffer());
    } else if (name.endsWith(".csv")) {
      const { Readable } = await import("node:stream");
      await wb.csv.read(Readable.from(Buffer.from(await file.arrayBuffer())));
    } else {
      return { error: "نوع الملف غير مدعوم. استخدم ‎.xlsx أو ‎.csv" };
    }
  } catch {
    return { error: "تعذر قراءة الملف. تأكد أنه ملف Excel صالح." };
  }

  const ws = wb.worksheets[0];
  if (!ws) return { rows: [] };

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cellValue(cell.value) ?? "").trim();
  });

  const rows: SheetRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const out: SheetRow = { _row: rowNumber };
    let hasValue = false;
    headers.forEach((h, col) => {
      if (!h) return;
      const v = cellValue(row.getCell(col).value);
      if (v !== null) hasValue = true;
      out[h] = v;
    });
    if (hasValue) rows.push(out);
  });
  return { rows };
}

/** Whole-number IDs only; accepts 12 or "12", rejects "12a" and 12.5. */
export function toInt(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isSafeInteger(n) ? n : null;
}

// Bajo `md` toda columna colapsa a ancho completo; el span pedido aplica
// desde md en adelante (clases literales — el JIT de Tailwind no compone).
const COL_SPAN_MAP: Record<number, string> = {
  1: "col-span-12 md:col-span-1", 2: "col-span-12 md:col-span-2",
  3: "col-span-12 md:col-span-3", 4: "col-span-12 md:col-span-4",
  5: "col-span-12 md:col-span-5", 6: "col-span-12 md:col-span-6",
  7: "col-span-12 md:col-span-7", 8: "col-span-12 md:col-span-8",
  9: "col-span-12 md:col-span-9", 10: "col-span-12 md:col-span-10",
  11: "col-span-12 md:col-span-11", 12: "col-span-12",
};

export function sectionColSpan(n: number | null): string {
  return (n !== null && COL_SPAN_MAP[n]) ? COL_SPAN_MAP[n] : "col-span-12";
}

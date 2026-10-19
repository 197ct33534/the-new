import type { Category } from "@prisma/client";

type Row = { id: string; name: string; parentId: string | null };

function depthOf(map: Map<string, Row>, id: string) {
  let d = 0;
  let p: string | null | undefined = map.get(id)?.parentId;
  while (p) {
    d += 1;
    p = map.get(p)?.parentId;
  }
  return d;
}

export function categorySelectOptions(flat: Category[]) {
  const map = new Map(flat.map((c) => [c.id, c as Row]));
  return flat.map((c) => {
    const d = depthOf(map, c.id);
    const label = `${"—".repeat(d)}${d > 0 ? " " : ""}${c.name}`;
    return { id: c.id, name: c.name, label };
  });
}

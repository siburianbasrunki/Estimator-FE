import type { GroupKey } from "../model/hsp";

export const GROUP_LABEL: Record<GroupKey, "A" | "B" | "C" | "X"> = {
  LABOR: "A",
  MATERIAL: "B",
  EQUIPMENT: "C",
};

export const GROUP_TITLE: Record<GroupKey, string> = {
  LABOR: "TENAGA",
  MATERIAL: "BAHAN",
  EQUIPMENT: "PERALATAN",
};

export const GROUP_ORDER: GroupKey[] = [
  "LABOR",
  "MATERIAL",
  "EQUIPMENT",
];

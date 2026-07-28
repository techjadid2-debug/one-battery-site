export const catalog = [
  { id: "piko_neon", type: "skin", name: "Piko Neon", stars: 75, accent: "#35d6e8" },
  { id: "atlas_oxide", type: "skin", name: "Atlas Oxide", stars: 75, accent: "#efad46" },
  { id: "core_emerald", type: "trail", name: "Emerald Core Trail", stars: 50, accent: "#5fe6a0" },
  { id: "season_foundry", type: "pass", name: "Foundry Season Pass", stars: 150, accent: "#ffe58a" },
] as const;

export function getCatalogItem(itemId: string) {
  return catalog.find((item) => item.id === itemId) ?? null;
}

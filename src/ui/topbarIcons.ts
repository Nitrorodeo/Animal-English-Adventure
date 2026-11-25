/**
 * Logos de la barre du haut, dessinés par le parent (2026-11-25, dossier Animaux/Logo barre haut).
 * Fichiers WebP légers produits par tools/icons/build_topbar_icons.py, dans public/.
 */
export const TOPBAR_ICONS = {
  map: 'assets/ui/topbar-map.webp',
  bag: 'assets/ui/topbar-bag.webp',
  friends: 'assets/ui/topbar-friends.webp',
  gear: 'assets/ui/topbar-gear.webp',
} as const;

export type TopbarIcon = keyof typeof TOPBAR_ICONS;

export const topbarIconUrl = (name: TopbarIcon): string => `${import.meta.env.BASE_URL}${TOPBAR_ICONS[name]}`;

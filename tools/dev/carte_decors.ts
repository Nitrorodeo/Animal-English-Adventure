/** Cartographie des décors par famille (outil ponctuel, 2026-11-24) : terrain, météo, eau, perchoirs, mots du décor. */
import { SPECIES } from '../../src/content/species';
import { getBiome } from '../../src/content/world';
import { PLACE_DEPTH } from '../../src/content/places/depth';
const out: Record<string, unknown>[] = [];
for (const sp of SPECIES.filter((s) => s.playable)) {
  for (const b of sp.allowedBiomes) {
    const p = getBiome(b) as any;
    const d = (PLACE_DEPTH as any)[b] ?? {};
    out.push({ species: sp.id, place: b, name: p.nameFr, weather: p.weather, ground: p.groundY, lane: !!d.lane, seats: (d.seats ?? []).length, groundToo: !!d.groundToo, water: (d.water ?? []).length, floes: (d.floes ?? []).length, words: (p.anchors ?? []).map((a: any) => a.word).join(',') });
  }
}
console.log(JSON.stringify(out));

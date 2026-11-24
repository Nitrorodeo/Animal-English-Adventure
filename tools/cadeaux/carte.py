"""Cartographie des cadeaux du soir : pour chaque décor de chaque famille, ses classes (froid, eau, plage…) et les
cadeaux qui y ont du sens. Lit `tools/cadeaux/catalogue.json` et la carte des décors produite par
`npx vite-node tools/dev/carte_decors.ts > carte.json`.

Usage : python tools/cadeaux/carte.py carte.json [--markdown]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ICI = Path(__file__).parent
# seul décor vraiment intérieur (les autres « grottes » sont des paysages avec une entrée de grotte, vérifié à l'œil)
INTERIEUR = {"an_ice_cave"}
FROID_EN_PLUS = {"ice_coast", "open_sea", "asia_snow_den", "asia_snow_cave", "europe_fox_snow", "na_bear_den"}
PLAGE = {"oc_bush_coast", "oc_rocky_cove", "oc_beach", "an_seal_rocks", "an_seal_sunset"}
ARBRES = ("tree", "forest", "bamboo", "pine", "oak", "redwood", "birch", "fir", "gum", "acacia", "baobab", "eucalyptus", "trunk", "branch", "aspen", "spruce")
EAU = ("pond", "lake", "river", "stream", "sea", "waterhole", "water", "torrent", "basin", "lagoon")


def classes(d: dict) -> set[str]:
    words = [w.strip() for w in d["words"].split(",") if w.strip()]
    c = {"any"}
    # le rivage de rochers et la plage du coucher de soleil des phoques sont des plages ensoleillées : pas « froid »
    cold = d["weather"] in ("cold", "snowy") or d["place"] in FROID_EN_PLUS
    c.add("cold" if cold else "warm")
    if d["place"] not in INTERIEUR:
        c.add("outdoor")
    if any(any(t in w for t in ARBRES) for w in words):
        c.add("trees")
    if d["water"] or d["place"] in PLAGE or any(w in EAU for w in words):
        c.add("water")
    if d["place"] in PLAGE:
        c.add("beach")
    if d["lane"] or (d["seats"] and not d["groundToo"]):
        c.add("perched")
    return c


def permis(g: dict, d: dict, cl: set[str], branch_max: float) -> bool:
    if g.get("species") and g["species"] != d["species"]:
        return False
    if not all(w in cl for w in g["where"]):
        return False
    if "perched" in cl and g["h"] > branch_max:
        return False
    return True


def main() -> None:
    carte = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    cat = json.loads((ICI / "catalogue.json").read_text(encoding="utf-8"))
    gifts, bmax = cat["gifts"], cat["branch_max_h"]
    md = "--markdown" in sys.argv
    par_famille: dict[str, set[str]] = {}
    lignes = []
    for d in carte:
        cl = classes(d)
        ok = [g["id"] for g in gifts if permis(g, d, cl, bmax)]
        par_famille.setdefault(d["species"], set()).update(ok)
        propres = [g["id"] for g in gifts if g.get("species") == d["species"] and g["id"] in ok]
        lignes.append((d["species"], d["place"], d["name"], sorted(cl - {"any"}), len(ok), propres))
    if md:
        print("| Famille | Décor | Classes | Cadeaux possibles | Dont propres à la famille |")
        print("|---|---|---|---|---|")
        for sp, pl, nm, cl, n, pr in lignes:
            print(f"| {sp} | {nm} (`{pl}`) | {', '.join(cl)} | {n} | {', '.join(pr) or '—'} |")
        print()
        print("| Famille | Cadeaux différents sur l'ensemble de ses décors |")
        print("|---|---|")
        for sp, s in par_famille.items():
            print(f"| {sp} | {len(s)} |")
    else:
        for sp, pl, nm, cl, n, pr in lignes:
            print(f"{sp:15} {pl:22} {','.join(cl):38} {n:3} {','.join(pr)}")
        print({sp: len(s) for sp, s in par_famille.items()})
    used = set().union(*par_famille.values())
    orphelins = [g["id"] for g in gifts if g["id"] not in used]
    if orphelins:
        print("Cadeaux jamais possibles :", orphelins, file=sys.stderr)


if __name__ == "__main__":
    main()

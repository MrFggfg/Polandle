import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_array(path, variable):
    text = path.read_text(encoding="utf-8-sig").strip()
    prefix = f"const {variable} = "
    if not text.startswith(prefix) or not text.endswith(";"):
        raise ValueError(f"{path.name}: expected {prefix}...;")
    return json.loads(text[len(prefix):-1])


def check_unique(items, key, label):
    values = [item.get(key) for item in items]
    missing = sum(not value for value in values)
    duplicates = len(values) - len(set(value for value in values if value))
    if missing:
        raise ValueError(f"{label}: {missing} missing {key} values")
    if duplicates:
        raise ValueError(f"{label}: {duplicates} duplicate {key} values")


def main():
    monsters = load_array(ROOT / "js" / "baza_potworow.js", "monsters")
    items = load_array(ROOT / "js" / "przedmioty.js", "przedmioty")

    if not monsters or not items:
        raise ValueError("Databases must not be empty")
    check_unique(monsters, "name", "monsters")
    check_unique(items, "nazwa", "items")

    required_monster = {"name", "level", "attack", "defense", "hp"}
    missing_monster = [item for item in monsters if required_monster - item.keys()]
    if missing_monster:
        raise ValueError(f"monsters: missing required fields in {len(missing_monster)} rows")

    print(f"OK: {len(monsters)} monsters, {len(items)} items")


if __name__ == "__main__":
    main()

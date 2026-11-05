import json

# Słownik tłumaczeń klas z angielskiego na polski
TLUMACZENIA_KLAS = {
    "Human": "Człowiek",
    "Animal": "Zwierzę",
    "Undead": "Nieumarły",
    "Wraith": "Upiór",
    "Mutant": "Mutant",
    "Dragon": "Smok",
    "Dwarf": "Krasnolud",
    "Mythical_being": "Istota mityczna",
    "Elemental": "Żywiołak",
    "Hybrid": "Hybryda",
    "Dark_elf": "Mroczny elf",
    "Madaram": "Madaram",
    "Mountain_elf": "Górski elf",
    "Rodent": "Gryzoń",
    "Demon": "Demon",
    "Amazon": "Amazonka",
    "Alien": "Obcy",
    "Angel": "Anioł",
    "Fowl": "Ptactwo",
    "Giant_human": "Wielkolud",
    "Elf": "Elf",
    "Gnome_forest": "Gnom leśny",
    "Chaos": "Chaos",
    "Orc": "Ork",
    "Werewolf": "Wilkołak",
    "Human_blordrough": "Człowiek z Blordrough",
    "Farm_animal": "Zwierzę hodowlane",
    "Reptile": "Gad",
    "Insect": "Owad",
    "Flora": "Roślina",
    "Gnome": "Gnom",
    "Kobold": "Kobold",
    "Albino_elf": "Elf albinos",
    "Oni": "Oni",
    "Ent": "Ent",
    "Immortal": "Nieśmiertelny",
    "Gargoyle": "Gargulec",
    "Golem": "Golem",
    "Sheepman": "Owcolud",
    "Ogre": "Ogr",
    "Huge_animal": "Ogromne zwierzę",
    "Beholder": "Beholder",
    "Goblin": "Goblin",
    "Fairy": "Wróżka",
    "Frogman": "Żabolud",
    "Ratfolk": "Szczurolud",
    "Slime": "Szlam",
    "Spider": "Pająk",
    "Troll": "Troll",
    "Vampire": "Wampir",
    "Giant": "Olbrzym",
    "Giant_animal": "Olbrzymie zwierzę",
    "Minotaur": "Minotaur",
    "Mummy": "Mumia",
    "Elemental_legendary": "Legendarny żywiołak",
}

# 1. Wczytanie pliku baza_potworow.js
with open("baza_potworow.js", "r", encoding="utf-8") as file:
    tekst = file.read()

# 2. Wyczyszczenie do formatu JSON
czysty_json = tekst.replace("const monsters = ", "").strip().rstrip(";")
monsters = json.loads(czysty_json)

# 3. Podmiana nazw klas
zmieniono = 0
for monster in monsters:
    stara_klasa = monster.get("class")
    if stara_klasa in TLUMACZENIA_KLAS:
        monster["class"] = TLUMACZENIA_KLAS[stara_klasa]
        zmieniono += 1

# 4. Zapis z powrotem do pliku JS z zachowaniem polskich znaków
nowy_tekst = (
    f"const monsters = {json.dumps(monsters, indent=4, ensure_ascii=False)};"
)

with open("baza_potworow.js", "w", encoding="utf-8") as file:
    file.write(nowy_tekst)

print(f"Sukces! Przetłumaczono klasy u {zmieniono} potworów.")
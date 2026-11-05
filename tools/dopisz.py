import json

# 1. Wczytujemy plik JavaScript
with open("baza_potworow.js", "r", encoding="utf-8") as file:
    tekst = file.read()

# 2. Wycinamy "const monsters = " oraz średnik z końca, żeby mieć czysty JSON
czysty_json = tekst.replace("const monsters = ", "").strip().rstrip(";")

# 3. Zamieniamy tekst na listę potworów w Pythonie
monsters = json.loads(czysty_json)

# 4. Dodajemy pole "podpowiedz" tam, gdzie go jeszcze nie ma
for monster in monsters:
    if "podpowiedz" not in monster:
        monster["podpowiedz"] = "xxx"

# 5. Składamy plik z powrotem w format JS i zapisujemy
nowy_tekst = (
    f"const monsters = {json.dumps(monsters, indent=4, ensure_ascii=False)};"
)

with open("baza_potworow.js", "w", encoding="utf-8") as file:
    file.write(nowy_tekst)

print("Sukces! Pole 'podpowiedz': 'xxx' zostało dodane do każdego potwora.")
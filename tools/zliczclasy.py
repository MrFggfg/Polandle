from collections import Counter
import json

# 1. Wczytujemy plik JS
with open("baza_potworow.js", "r", encoding="utf-8") as file:
    tekst = file.read()

# 2. Czyszczenie kodu JS do formatu JSON
czysty_json = tekst.replace("const monsters = ", "").strip().rstrip(";")
monsters = json.loads(czysty_json)

# 3. Zliczanie klas za pomocą Counter
licznik_klas = Counter(monster.get("class", "Brak klasy") for monster in monsters)

# 4. Wyświetlanie wyników
print("=" * 45)
print(f" ŁĄCZNA LICZBA POTWORÓW W BAZIE: {len(monsters)}")
print("=" * 45)
print(f" {'KLASA':<30} | {'ILOŚĆ'}")
print("-" * 45)

for klasa, ilosc in licznik_klas.most_common():
    print(f" {klasa:<30} | {ilosc}")

print("=" * 45)
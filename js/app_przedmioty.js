// ==========================================
// KSIĘGA PRZEDMIOTÓW - KOD OBSŁUGI TABELI I FILTRÓW
// ==========================================

let currentItems = [];
let sortState = { key: 'nazwa', dir: 'asc' };

// Słownik tłumaczeń i mapowania klas CSS dla żywiołów
const zywiolyMap = {
    "fire": { css: "fire", pl: "Ogień" },
    "ogień": { css: "fire", pl: "Ogień" },
    "ogien": { css: "fire", pl: "Ogień" },
    "water": { css: "water", pl: "Woda" },
    "woda": { css: "water", pl: "Woda" },
    "earth": { css: "earth", pl: "Ziemia" },
    "ziemia": { css: "earth", pl: "Ziemia" },
    "wind": { css: "wind", pl: "Wiatr" },
    "wiatr": { css: "wind", pl: "Wiatr" },
    "light": { css: "light", pl: "Światło" },
    "światło": { css: "light", pl: "Światło" },
    "swiatlo": { css: "light", pl: "Światło" },
    "dark": { css: "dark", pl: "Mrok" },
    "mrok": { css: "dark", pl: "Mrok" },
    "shadow": { css: "shadow", pl: "Cień" },
    "cień": { css: "shadow", pl: "Cień" },
    "cien": { css: "shadow", pl: "Cień" },
    "physical": { css: "physical", pl: "Fizyczne" },
    "fizyczne": { css: "physical", pl: "Fizyczne" },
    "energy": { css: "energy", pl: "Energia" },
    "energia": { css: "energy", pl: "Energia" },
    "nature": { css: "nature", pl: "Natura" },
    "natura": { css: "nature", pl: "Natura" },
    "magic": { css: "magic", pl: "Magia" },
    "magia": { css: "magic", pl: "Magia" },
    "poison": { css: "poison", pl: "Trucizna" },
    "trucizna": { css: "poison", pl: "Trucizna" },
    "ice": { css: "ice", pl: "Lód" },
    "lód": { css: "ice", pl: "Lód" },
    "lod": { css: "ice", pl: "Lód" },
    "lightning": { css: "lightning", pl: "Błyskawica" },
    "błyskawica": { css: "lightning", pl: "Błyskawica" },
    "blyskawica": { css: "lightning", pl: "Błyskawica" }
};

// Funkcje pomocnicze do pobierania właściwości z bazy
function getNazwa(p) { return p.nazwa || p.name || 'Nieznany'; }
function getTyp(p) { return p.typ || p.type || '-'; }
function getRodzaj(p) { return p.rodzaj || '-'; }
function getMinPoziom(p) { 
    if (p.min_poziom !== undefined && p.min_poziom !== null) return p.min_poziom;
    if (p.min_level !== undefined && p.min_level !== null) return p.min_level;
    if (p.poziom !== undefined && p.poziom !== null) return p.poziom;
    if (p.lvl !== undefined && p.lvl !== null) return p.lvl;
    return '-';
}
// Waga to pole `rate` w bazie (lub ewentualnie waga/weight)
function getWaga(p) { 
    if (p.rate !== undefined && p.rate !== null) return p.rate;
    if (p.waga !== undefined && p.waga !== null) return p.waga;
    if (p.weight !== undefined && p.weight !== null) return p.weight;
    return '-';
}
function getAtk(p) { return p.atk !== undefined && p.atk !== null ? p.atk : (p.attack !== undefined ? p.attack : '-'); }
function getDef(p) { return p.def !== undefined && p.def !== null ? p.def : (p.defence !== undefined ? p.defence : '-'); }
function getLifesteal(p) { return p.lifesteal !== undefined && p.lifesteal !== null ? p.lifesteal : (p.ls !== undefined ? p.ls : '-'); }

function parseNum(val) {
    if (val === undefined || val === null || val === '' || val === '-') return 0;
    const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
}

const formatZywiolHtml = (val) => {
    if (!val) return '-';
    
    const items = Array.isArray(val) ? val : [val];
    
    return items.map(item => {
        const str = String(item).trim();
        const klucz = str.toLowerCase();
        let css = "default";
        let pl = str;

        if (zywiolyMap[klucz]) {
            css = zywiolyMap[klucz].css;
            pl = zywiolyMap[klucz].pl;
        } else {
            css = klucz.replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
                       .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
                       .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
                       .replace(/\s+/g, '-');
        }
        return `<span class="badge type-${css}">${escapeHtml(pl)}</span>`;
    }).join(" ");
};

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof przedmioty === 'undefined' || !Array.isArray(przedmioty)) {
        console.error("Błąd: Baza przedmiotów nie została załadowana!");
        return;
    }

    currentItems = [...przedmioty];

    populateFilterDropdowns();
    setupEventListeners();
    applyFiltersAndRender();
});

function populateFilterDropdowns() {
    const typSet = new Set();
    const rodzajSet = new Set();

    przedmioty.forEach(p => {
        const typ = getTyp(p);
        const rodzaj = getRodzaj(p);
        if (typ !== '-') typSet.add(typ);
        if (rodzaj !== '-') rodzajSet.add(rodzaj);
    });

    fillSelect('filter-typ', Array.from(typSet).sort());
    fillSelect('filter-rodzaj', Array.from(rodzajSet).sort());
}

function fillSelect(elementId, items) {
    const select = document.getElementById(elementId);
    if (!select) return;
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        select.appendChild(opt);
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const filterTyp = document.getElementById('filter-typ');
    const filterRodzaj = document.getElementById('filter-rodzaj');
    const sortBy = document.getElementById('sort-by');

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
    if (filterTyp) filterTyp.addEventListener('change', applyFiltersAndRender);
    if (filterRodzaj) filterRodzaj.addEventListener('change', applyFiltersAndRender);

    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            const parts = e.target.value.split('-');
            const dir = parts.pop();
            const key = parts.join('-');
            sortState = { key, dir };
            applyFiltersAndRender();
        });
    }

    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-sort');
            if (sortState.key === key) {
                sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.key = key;
                sortState.dir = 'asc';
            }
            applyFiltersAndRender();
        });
    });
}

function applyFiltersAndRender() {
    const searchInput = document.getElementById('search-input');
    const filterTyp = document.getElementById('filter-typ');
    const filterRodzaj = document.getElementById('filter-rodzaj');

    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedTyp = filterTyp ? filterTyp.value : '';
    const selectedRodzaj = filterRodzaj ? filterRodzaj.value : '';

    let filtered = przedmioty.filter(p => {
        const nazwa = getNazwa(p);
        const typ = getTyp(p);
        const rodzaj = getRodzaj(p);
        const minLvl = getMinPoziom(p);
        const waga = getWaga(p);
        const atk = getAtk(p);
        const def = getDef(p);
        const ls = getLifesteal(p);

        const matchText = !searchText || 
            nazwa.toLowerCase().includes(searchText) ||
            typ.toLowerCase().includes(searchText) ||
            rodzaj.toLowerCase().includes(searchText) ||
            String(minLvl).toLowerCase().includes(searchText) ||
            String(waga).toLowerCase().includes(searchText) ||
            String(atk).toLowerCase().includes(searchText) ||
            String(def).toLowerCase().includes(searchText) ||
            String(ls).toLowerCase().includes(searchText) ||
            (p.wzmacnia && JSON.stringify(p.wzmacnia).toLowerCase().includes(searchText)) ||
            (p.oslabia && JSON.stringify(p.oslabia).toLowerCase().includes(searchText)) ||
            (p.osłabia && JSON.stringify(p.osłabia).toLowerCase().includes(searchText));

        const matchTyp = !selectedTyp || typ === selectedTyp;
        const matchRodzaj = !selectedRodzaj || rodzaj === selectedRodzaj;

        return matchText && matchTyp && matchRodzaj;
    });

    filtered.sort((a, b) => {
        let key = sortState.key;
        let valA, valB;

        if (key === 'nazwa') {
            valA = getNazwa(a).toLowerCase();
            valB = getNazwa(b).toLowerCase();
        } else if (key === 'typ') {
            valA = getTyp(a).toLowerCase();
            valB = getTyp(b).toLowerCase();
        } else if (key === 'rodzaj') {
            valA = getRodzaj(a).toLowerCase();
            valB = getRodzaj(b).toLowerCase();
        } else if (key === 'min_poziom') {
            valA = parseNum(getMinPoziom(a));
            valB = parseNum(getMinPoziom(b));
        } else if (key === 'waga' || key === 'rate') {
            valA = parseNum(getWaga(a));
            valB = parseNum(getWaga(b));
        } else if (key === 'atk') {
            valA = parseNum(getAtk(a));
            valB = parseNum(getAtk(b));
        } else if (key === 'def') {
            valA = parseNum(getDef(a));
            valB = parseNum(getDef(b));
        } else if (key === 'lifesteal') {
            valA = parseNum(getLifesteal(a));
            valB = parseNum(getLifesteal(b));
        } else {
            valA = (a[key] || '').toString().toLowerCase();
            valB = (b[key] || '').toString().toLowerCase();
        }

        if (valA < valB) return sortState.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.dir === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('items-table-body');
    const countEl = document.getElementById('item-count');
    
    if (!tbody) return;

    tbody.innerHTML = '';
    if (countEl) countEl.textContent = data.length;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color: #888;">Nie znaleziono przedmiotów spełniających kryteria.</td></tr>`;
        return;
    }

    data.forEach(p => {
        const tr = document.createElement('tr');

        const nazwaPrzedmiotu = getNazwa(p);
        const typVal = getTyp(p);
        const rodzajVal = getRodzaj(p);
        const minPoziomVal = getMinPoziom(p);
        const wagaVal = getWaga(p);
        const atkVal = getAtk(p);
        const defVal = getDef(p);
        const lifestealVal = getLifesteal(p);

        const wzmacniaHtml = formatZywiolHtml(p.wzmacnia);
        const oslabiaHtml = formatZywiolHtml(p.oslabia || p.osłabia);

       // Podmieniając fragment w tr.innerHTML w funkcji renderTable:

tr.innerHTML = `
    <td><strong>${escapeHtml(nazwaPrzedmiotu)}</strong></td>
    <td>${escapeHtml(typVal)}</td>
    <td>${escapeHtml(rodzajVal)}</td>
    <td>${minPoziomVal}</td>
    <td>${wagaVal}</td>
    <td>${atkVal}</td>
    <td>${defVal}</td>
    <td>${escapeHtml(String(lifestealVal))}</td>
    <td class="col-wzmacnia">${wzmacniaHtml}</td>
    <td class="col-oslabia">${oslabiaHtml}</td>
`;

        tbody.appendChild(tr);
    });
}
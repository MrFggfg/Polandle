// ==========================================
// BESTIARIUSZ - KOD OBSŁUGI TABELI, FILTRÓW I SPRITE'ÓW
// ==========================================

(function () {
    'use strict';

    const bestiaryState = {
        currentMonsters: [],
        sortState: { key: 'level', dir: 'asc' },
        filterDebounceTimer: null
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function scheduleFilterRender() {
        if (bestiaryState.filterDebounceTimer) {
            clearTimeout(bestiaryState.filterDebounceTimer);
        }
        bestiaryState.filterDebounceTimer = setTimeout(() => {
            applyFiltersAndRender();
        }, 120);
    }

    const spriteConfigs = {
        'animal.png': 8,
        'albino_elf.png': 5,
        'amazon.png': 8,
        'angel.png': 6,
        'beholder.png': 3,
        'chaos.png': 7,
        'chess.png': 12,
        'dark_elf.png': 8,
        'demon.png': 7,
        'dragon.png': 8,
        'dwarf.png': 8,
        'dwarf_deep.png': 7,
        'dwarf_duergar.png': 8,
        'elemental.png': 8,
        'elf.png': 8,
        'enormous_creature.png': 1,
        'ent.png': 4,
        'fairy.png': 4,
        'farm_animal.png': 12,
        'fowl.png': 6,
        'frogman.png': 3,
        'gargoyle.png': 4,
        'giant_animal.png': 3,
        'giant_human.png': 10,
        'gnome.png': 6,
        'goat.png': 1,
        'goblin.png': 3,
        'golem.png': 4,
        'huge_animal.png': 8,
        'human.png': 5,
        'human_armored.png': 8,
        'human_barbarian.png': 7,
        'human_cannibal.png': 4,
        'human_evil.png': 10,
        'human_imperial.png': 8,
        'human_kalavan.png': 5,
        'human_little.png': 2,
        'human_risecia.png': 4,
        'human_soldier.png': 9,
        'hybrid.png': 8,
        'insect.png': 5,
        'kobold.png': 6,
        'madaram.png': 8,
        'minotaur.png': 2,
        'mountain_dwarf.png': 5,
        'mountain_orc.png': 4,
        'mummy.png': 2,
        'mutant.png': 7,
        'mythical_being.png': 8,
        'naga.png': 4,
        'northpole_elf.png': 10,
        'ogre.png': 4,
        'oni.png': 5,
        'orc.png': 5,
        'pol_chocholy.png': 3,
        'pol_czarty.png': 5,
        'pol_elfy_gorskie.png': 8,
        'pol_kamienne.png': 2,
        'pol_kamienne_wielkie.png': 3,
        'pol_krzewy.png': 3,
        'pol_magowie.png': 8,
        'pol_malze.png': 2,
        'pol_mutanty.png': 7,
        'pol_mutanty_wielkie.png': 4,
        'pol_niesmietelne.png': 4,
        'pol_ogniki.png': 3,
        'pol_olbrzymy.png': 4,
        'pol_owady.png': 4,
        'pol_pasterze.png': 3,
        'pol_piraci.png': 7,
        'pol_piraci_lutin.png': 8,
        'pol_piraci_truskul.png': 8,
        'pol_pokutniki.png': 7,
        'pol_ptaki.png': 4,
        'pol_ptaki_wielkie.png': 1,
        'pol_rycerze.png': 9,
        'pol_serafiny.png': 4,
        'pol_skrzaty_lesne.png': 9,
        'pol_smoki.png': 8,
        'pol_sniegowe.png': 3,
        'pol_szaraki.png': 8,
        'pol_wiesniacy.png': 3,
        'pol_wilkolaki.png': 8,
        'pol_zbojnicy_gorscy.png': 6,
        'pol_zbojnicy_lesni.png': 8,
        'pol_zjawy.png': 8,
        'pol_zjawy_wielkie.png': 6,
        'pol_zwierzeta.png': 8,
        'pol_zwierzeta_male.png': 3,
        'ratfolk.png': 3,
        'reptile.png': 7,
        'rodent.png': 8,
        'sheep.png': 1,
        'sheepman.png': 4,
        'slime.png': 4,
        'spider.png': 3,
        'troll.png': 4,
        'undead.png': 14,
        'undead_fallen.png': 9,
        'undead_skeleton.png': 6,
        'undead_specter.png': 6,
        'undead_zombie.png': 5,
        'vampire.png': 7,
    };

    function getSpriteStyleString(tileid, displaySize = 32) {
        if (!tileid) return 'background-color: transparent;';

        const parts = tileid.split(':');
        const fileName = parts[0];
        const id = Number.parseInt(parts[1], 10);

        const cols = spriteConfigs[fileName] || 8;

        const col = id % cols;
        const rowNum = Math.floor(id / cols);

        return `
            background-image: url('images/${fileName}');
            background-size: ${cols * displaySize}px auto;
            background-position: -${col * displaySize}px -${rowNum * displaySize}px;
            background-repeat: no-repeat;
            width: ${displaySize}px;
            height: ${displaySize}px;
            image-rendering: pixelated;
            margin: 0 auto;
            display: block;
        `;
    }

    function formatRespawn(rawVal) {
        if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal)) || Number(rawVal) === 0) return '-';

        const totalMinutes = Number(rawVal) / 200;

        if (totalMinutes < 1) {
            const seconds = Math.round(totalMinutes * 60);
            return `${seconds} s`;
        }
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const restMinutes = Math.round(totalMinutes % 60);
            return restMinutes > 0 ? `${hours}h ${restMinutes}min` : `${hours}h`;
        }

        const formattedMin = Number.isInteger(totalMinutes) ? totalMinutes : totalMinutes.toFixed(1);
        return `${formattedMin} min`;
    }

    function populateFilterDropdowns() {
        const classSet = new Set();
        const attackSet = new Set();
        const defenseSet = new Set();

        if (!Array.isArray(monsters)) {
            return;
        }

        monsters.forEach((m) => {
            if (m.class) classSet.add(m.class);
            if (m.attackType && m.attackType !== '-' && m.attackType !== 'Brak') attackSet.add(m.attackType);
            if (m.defenseType && m.defenseType !== '-' && m.defenseType !== 'Brak') defenseSet.add(m.defenseType);
        });

        fillSelect('filter-class', Array.from(classSet).sort());
        fillSelect('filter-attack', Array.from(attackSet).sort());
        fillSelect('filter-defense', Array.from(defenseSet).sort());
    }

    function fillSelect(elementId, items) {
        const select = document.getElementById(elementId);
        if (!select) return;

        items.forEach((item) => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            select.appendChild(opt);
        });
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const filterClass = document.getElementById('filter-class');
        const filterAttack = document.getElementById('filter-attack');
        const filterDefense = document.getElementById('filter-defense');
        const sortBy = document.getElementById('sort-by');

        if (searchInput) searchInput.addEventListener('input', scheduleFilterRender);
        if (filterClass) filterClass.addEventListener('change', scheduleFilterRender);
        if (filterAttack) filterAttack.addEventListener('change', scheduleFilterRender);
        if (filterDefense) filterDefense.addEventListener('change', scheduleFilterRender);

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                const [key, dir] = e.target.value.split('-');
                bestiaryState.sortState = { key, dir };
                applyFiltersAndRender();
            });
        }

        document.querySelectorAll('th.sortable').forEach((th) => {
            th.setAttribute('role', 'button');
            th.setAttribute('tabindex', '0');
            th.setAttribute('aria-label', `Sortuj według ${th.textContent.replace('↕', '').trim()}`);

            const sort = () => {
                const key = th.getAttribute('data-sort');
                if (!key) return;

                if (bestiaryState.sortState.key === key) {
                    bestiaryState.sortState.dir = bestiaryState.sortState.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    bestiaryState.sortState.key = key;
                    bestiaryState.sortState.dir = 'asc';
                }
                applyFiltersAndRender();
                document.querySelectorAll('th.sortable').forEach(header => header.setAttribute('aria-sort', 'none'));
                th.setAttribute('aria-sort', bestiaryState.sortState.dir === 'asc' ? 'ascending' : 'descending');
            };

            th.addEventListener('click', sort);
            th.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    sort();
                }
            });
        });
    }

    function applyFiltersAndRender() {
        const searchInput = document.getElementById('search-input');
        const filterClass = document.getElementById('filter-class');
        const filterAttack = document.getElementById('filter-attack');
        const filterDefense = document.getElementById('filter-defense');

        if (!searchInput || !filterClass || !filterAttack || !filterDefense || !Array.isArray(monsters)) {
            return;
        }

        const searchText = searchInput.value.toLowerCase().trim();
        const selectedClass = filterClass.value;
        const selectedAttack = filterAttack.value;
        const selectedDefense = filterDefense.value;

        let filtered = monsters.filter((m) => {
            const matchText = !searchText ||
                (m.name && m.name.toLowerCase().includes(searchText)) ||
                (m.class && m.class.toLowerCase().includes(searchText)) ||
                (m.rareDrop && m.rareDrop.toLowerCase().includes(searchText)) ||
                (m.attackType && m.attackType.toLowerCase().includes(searchText)) ||
                (m.defenseType && m.defenseType.toLowerCase().includes(searchText));

            const matchClass = !selectedClass || m.class === selectedClass;
            const matchAttack = !selectedAttack || m.attackType === selectedAttack;
            const matchDefense = !selectedDefense || m.defenseType === selectedDefense;

            return matchText && matchClass && matchAttack && matchDefense;
        });

        filtered.sort((a, b) => {
            let key = bestiaryState.sortState.key;
            if (key === 'exp') key = 'experience';

            let valA = a[key];
            let valB = b[key];

            const numericKeys = ['level', 'attack', 'defense', 'hp', 'experience', 'respawn'];

            if (numericKeys.includes(key)) {
                valA = (valA !== undefined && valA !== null && valA !== '') ? Number(valA) : 0;
                valB = (valB !== undefined && valB !== null && valB !== '') ? Number(valB) : 0;

                if (Number.isNaN(valA)) valA = 0;
                if (Number.isNaN(valB)) valB = 0;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return bestiaryState.sortState.dir === 'asc' ? -1 : 1;
            if (valA > valB) return bestiaryState.sortState.dir === 'asc' ? 1 : -1;
            return 0;
        });

        renderTable(filtered);
    }

    function renderTable(data) {
        const tbody = document.getElementById('monsters-table-body');
        const countEl = document.getElementById('monster-count');

        if (!tbody) return;

        const fragment = document.createDocumentFragment();
        tbody.innerHTML = '';
        if (countEl) countEl.textContent = String(data.length);

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 20px; color: #888;">Nie znaleziono potworów spełniających kryteria.</td></tr>';
            return;
        }

        data.forEach((m) => {
            const tr = document.createElement('tr');
            const atkClass = m.attackType ? m.attackType.toLowerCase() : 'brak';
            const defClass = m.defenseType ? m.defenseType.toLowerCase() : 'brak';
            const spriteStyle = getSpriteStyleString(m.tileid, 32);

            const spriteCell = document.createElement('td');
            const spriteDiv = document.createElement('div');
            spriteDiv.className = 'monster-sprite';
            spriteDiv.setAttribute('style', spriteStyle);
            spriteCell.appendChild(spriteDiv);
            tr.appendChild(spriteCell);

            const nameCell = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = m.name || '-';
            nameCell.appendChild(strong);
            tr.appendChild(nameCell);

            const classCell = document.createElement('td');
            classCell.textContent = m.class || '-';
            tr.appendChild(classCell);

            const levelCell = document.createElement('td');
            levelCell.textContent = m.level ?? '-';
            tr.appendChild(levelCell);

            const attackCell = document.createElement('td');
            attackCell.textContent = m.attack ?? '-';
            tr.appendChild(attackCell);

            const defenseCell = document.createElement('td');
            defenseCell.textContent = m.defense ?? '-';
            tr.appendChild(defenseCell);

            const hpCell = document.createElement('td');
            hpCell.textContent = m.hp ?? '-';
            tr.appendChild(hpCell);

            const expCell = document.createElement('td');
            expCell.textContent = m.experience ?? '-';
            tr.appendChild(expCell);

            const respawnCell = document.createElement('td');
            respawnCell.textContent = formatRespawn(m.respawn);
            tr.appendChild(respawnCell);

            const sizeCell = document.createElement('td');
            sizeCell.textContent = m.size || '-';
            tr.appendChild(sizeCell);

            const attackTypeCell = document.createElement('td');
            const attackBadge = document.createElement('span');
            attackBadge.className = `badge type-${atkClass}`;
            attackBadge.textContent = m.attackType || '-';
            attackTypeCell.appendChild(attackBadge);
            tr.appendChild(attackTypeCell);

            const defenseTypeCell = document.createElement('td');
            const defenseBadge = document.createElement('span');
            defenseBadge.className = `badge type-${defClass}`;
            defenseBadge.textContent = m.defenseType || '-';
            defenseTypeCell.appendChild(defenseBadge);
            tr.appendChild(defenseTypeCell);

            const rareCell = document.createElement('td');
            rareCell.textContent = m.rareDrop || '-';
            tr.appendChild(rareCell);

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof monsters === 'undefined' || !Array.isArray(monsters)) {
            console.error('Błąd: Baza potworów nie została załadowana!');
            return;
        }

        bestiaryState.currentMonsters = [...monsters];
        populateFilterDropdowns();
        setupEventListeners();
        applyFiltersAndRender();
    });
})();
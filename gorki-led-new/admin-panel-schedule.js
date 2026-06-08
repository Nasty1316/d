/**
 * Визуальный редактор онлайн-расписания во встроенной админ-панели
 */
(function (global) {
    'use strict';

    const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const DAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

    let scheduleData = null;
    let selectedDay = 0;

    function esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escAttr(s) {
        return esc(s);
    }

    function defaultDays() {
        return DAY_LABELS.map((label, i) => ({
            label,
            labelFull: DAY_FULL[i],
            items: [],
        }));
    }

    function normalizeSchedule(raw) {
        const data = raw && typeof raw === 'object' ? raw : {};
        const days = Array.isArray(data.days) ? data.days : [];
        const normalized = defaultDays().map((def, i) => {
            const src = days[i] || {};
            const items = Array.isArray(src.items)
                ? src.items.map((it) => ({
                      time: String(it.time || '').trim(),
                      title: String(it.title || '').trim(),
                      place: String(it.place || '').trim(),
                  }))
                : [];
            return {
                label: src.label || def.label,
                labelFull: src.labelFull || def.labelFull,
                items,
            };
        });
        return {
            note: String(data.note || '').trim(),
            featured: data.featured || null,
            days: normalized,
        };
    }

    async function loadSchedule() {
        try {
            const res = await fetch('get_schedule.php');
            const data = await res.json();
            scheduleData = normalizeSchedule(data.schedule || {});
        } catch (e) {
            scheduleData = normalizeSchedule({});
        }
        return scheduleData;
    }

    function renderDayItems(root) {
        const list = root.querySelector('#schedItemsList');
        if (!list || !scheduleData) return;
        const day = scheduleData.days[selectedDay];
        if (!day.items.length) {
            list.innerHTML = '<p class="schedule-admin-empty">Нет занятий — нажмите «Добавить строку»</p>';
            return;
        }
        list.innerHTML = day.items
            .map(
                (item, i) => `
            <div class="schedule-admin-row" data-idx="${i}">
                <input type="text" class="admin-field sched-field-time" data-field="time" value="${escAttr(item.time)}" placeholder="17:00–20:00">
                <input type="text" class="admin-field sched-field-title" data-field="title" value="${escAttr(item.title)}" placeholder="Название">
                <input type="text" class="admin-field sched-field-place" data-field="place" value="${escAttr(item.place)}" placeholder="Место">
                <button type="button" class="admin-btn secondary sched-row-del" data-idx="${i}" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>`
            )
            .join('');

        list.querySelectorAll('.sched-row-del').forEach((btn) => {
            btn.addEventListener('click', () => {
                collectFromDom(root);
                scheduleData.days[selectedDay].items.splice(Number(btn.dataset.idx), 1);
                renderDayItems(root);
            });
        });
    }

    function renderScheduleUI(root) {
        if (!root || !scheduleData) return;
        root.innerHTML = `
            <div class="schedule-admin-editor">
                <div class="form-group">
                    <label for="schedNote">Примечание под расписанием</label>
                    <textarea id="schedNote" class="admin-field" rows="2" placeholder="Например: уточняйте время по телефону">${esc(scheduleData.note)}</textarea>
                </div>
                <div class="schedule-admin-days" role="tablist">
                    ${scheduleData.days
                        .map(
                            (d, i) =>
                                `<button type="button" class="schedule-admin-day${i === selectedDay ? ' active' : ''}" data-day="${i}">${esc(d.label)}</button>`
                        )
                        .join('')}
                </div>
                <p class="schedule-admin-day-title">${esc(scheduleData.days[selectedDay]?.labelFull || '')}</p>
                <div id="schedItemsList" class="schedule-admin-items"></div>
                <div class="section-actions" style="margin-top:0.75rem">
                    <button type="button" class="admin-btn secondary" id="schedAddRowBtn"><i class="fas fa-plus"></i> Добавить строку</button>
                </div>
                <div class="section-actions">
                    <button type="button" class="admin-btn" id="schedSaveBtn"><i class="fas fa-save"></i> Сохранить расписание</button>
                </div>
            </div>
        `;

        root.querySelectorAll('.schedule-admin-day').forEach((btn) => {
            btn.addEventListener('click', () => {
                collectFromDom(root);
                selectedDay = Number(btn.dataset.day);
                root.querySelectorAll('.schedule-admin-day').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const titleEl = root.querySelector('.schedule-admin-day-title');
                if (titleEl) titleEl.textContent = scheduleData.days[selectedDay]?.labelFull || '';
                renderDayItems(root);
            });
        });

        root.querySelector('#schedAddRowBtn')?.addEventListener('click', () => {
            collectFromDom(root);
            scheduleData.days[selectedDay].items.push({ time: '', title: '', place: '' });
            renderDayItems(root);
        });

        root.querySelector('#schedSaveBtn')?.addEventListener('click', () => saveSchedule(root));

        renderDayItems(root);
    }

    function collectFromDom(root) {
        if (!scheduleData || !root) return;
        scheduleData.note = root.querySelector('#schedNote')?.value.trim() || '';
        const day = scheduleData.days[selectedDay];
        const rows = root.querySelectorAll('.schedule-admin-row');
        day.items = [];
        rows.forEach((row) => {
            const time = row.querySelector('[data-field="time"]')?.value.trim() || '';
            const title = row.querySelector('[data-field="title"]')?.value.trim() || '';
            const place = row.querySelector('[data-field="place"]')?.value.trim() || '';
            if (time || title || place) {
                day.items.push({ time, title, place });
            }
        });
    }

    async function saveSchedule(root) {
        collectFromDom(root);
        if (typeof GorkiSiteCustomization === 'undefined') {
            if (typeof showNotification === 'function') showNotification('Модуль кастомизации не загружен', 'error');
            return;
        }
        try {
            const cfg = GorkiSiteCustomization.getSiteCustomization();
            const result = await GorkiSiteCustomization.saveSiteCustomizationToServer(cfg, '', scheduleData);
            if (result.success) {
                if (typeof window.reloadPublicSchedule === 'function') {
                    await window.reloadPublicSchedule();
                }
                if (typeof showNotification === 'function') showNotification('Расписание сохранено', 'success');
            } else if (typeof showNotification === 'function') {
                showNotification(result.error || 'Ошибка сохранения', 'error');
            }
        } catch (e) {
            if (typeof showNotification === 'function') showNotification('Сервер недоступен', 'error');
        }
    }

    async function openScheduleSection() {
        selectedDay = 0;
        await loadSchedule();
        const root = document.getElementById('scheduleAdminRoot');
        if (root) renderScheduleUI(root);
    }

    global.GorkiAdminSchedule = {
        openScheduleSection,
        loadSchedule,
    };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Кастомизация сайта во встроенной админ-панели
 */
(function (global) {
    'use strict';

    let panelConfig = null;
    let customizeLang = 'ru';

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

    async function ensureConfig() {
        if (typeof GorkiSiteCustomization === 'undefined') {
            panelConfig = { theme: {}, sections: {}, nav: {}, textOverrides: { ru: {}, en: {}, be: {} } };
            return panelConfig;
        }
        GorkiSiteCustomization.invalidateCache();
        panelConfig = await GorkiSiteCustomization.loadSiteCustomization('');
        return panelConfig;
    }

    function getConfig() {
        return panelConfig || (typeof GorkiSiteCustomization !== 'undefined' ? GorkiSiteCustomization.getSiteCustomization() : null);
    }

    function sectionLabels() {
        return {
            home: 'Главный экран',
            about: 'О нас',
            services: 'Услуги',
            facilities: 'Объекты',
            news: 'Новости',
            safety: 'Безопасность',
            visitor: 'Расписание',
            gallery: 'Галерея',
            contacts: 'Контакты',
        };
    }

    function navLabels() {
        return {
            home: 'Главная',
            about: 'О нас',
            services: 'Услуги',
            facilities: 'Объекты',
            news: 'Новости',
            visitor: 'Расписание',
            gallery: 'Галерея',
            contacts: 'Контакты',
        };
    }

    function renderCustomizeUI(root) {
        if (!root) return;
        const cfg = getConfig() || {};
        const theme = cfg.theme || {};
        const hero = cfg.hero || {};
        const sections = cfg.sections || {};
        const nav = cfg.nav || {};

        root.innerHTML = `
            <div class="customize-tabs" role="tablist">
                <button type="button" class="customize-tab active" data-tab="design">Дизайн</button>
                <button type="button" class="customize-tab" data-tab="sections">Разделы</button>
                <button type="button" class="customize-tab" data-tab="texts">Тексты</button>
            </div>
            <div class="customize-panels">
                <div class="customize-panel active" data-panel="design">
                    <div class="customize-grid">
                        <label>Основной цвет <input type="color" id="custPrimary" value="${escAttr(theme.primaryColor || '#2563eb')}"></label>
                        <label>Вторичный <input type="color" id="custSecondary" value="${escAttr(theme.secondaryColor || '#1e40af')}"></label>
                        <label>Акцент <input type="color" id="custAccent" value="${escAttr(theme.accentColor || '#fbbf24')}"></label>
                    </div>
                    <label class="customize-full">Градиент главного экрана
                        <input type="text" id="custHeroGradient" value="${escAttr(theme.heroGradient || '')}" placeholder="linear-gradient(...)">
                    </label>
                    <label class="customize-full">Шрифт
                        <input type="text" id="custFont" value="${escAttr(theme.fontFamily || 'Inter, sans-serif')}">
                    </label>
                    <label class="customize-check"><input type="checkbox" id="custFloatingCards" ${hero.showFloatingCards !== false ? 'checked' : ''}> Плавающие карточки на главной</label>
                    <label class="customize-full">Свой CSS
                        <textarea id="custCustomCss" rows="4" placeholder="/* дополнительные стили */">${esc(theme.customCss || '')}</textarea>
                    </label>
                </div>
                <div class="customize-panel" data-panel="sections">
                    <p class="customize-hint">Скрытые разделы не отображаются на сайте</p>
                    <div class="customize-toggles" id="custSectionToggles"></div>
                    <h4 class="customize-sub">Меню навигации</h4>
                    <div class="customize-toggles" id="custNavToggles"></div>
                </div>
                <div class="customize-panel" data-panel="texts">
                    <div class="customize-langs" id="custLangTabs">
                        <button type="button" class="customize-lang active" data-lang="ru">RU</button>
                        <button type="button" class="customize-lang" data-lang="en">EN</button>
                        <button type="button" class="customize-lang" data-lang="be">BE</button>
                    </div>
                    <input type="search" id="custTextSearch" class="customize-search" placeholder="Поиск по ключу…">
                    <div id="custTextList" class="cust-text-list"></div>
                </div>
            </div>
            <div class="section-actions">
                <button type="button" class="admin-btn" id="custSaveAllBtn"><i class="fas fa-cloud-upload-alt"></i> Сохранить на сервер</button>
                <button type="button" class="admin-btn secondary" id="custApplyLocalBtn"><i class="fas fa-eye"></i> Применить на странице</button>
            </div>
        `;

        const secEl = root.querySelector('#custSectionToggles');
        const navEl = root.querySelector('#custNavToggles');
        if (typeof GorkiSiteCustomization !== 'undefined') {
            GorkiSiteCustomization.SECTION_IDS.forEach((id) => {
                secEl.innerHTML += `<label class="customize-toggle-row"><span>${sectionLabels()[id] || id}</span><input type="checkbox" data-section="${id}" ${sections[id] !== false ? 'checked' : ''}></label>`;
            });
            Object.keys(GorkiSiteCustomization.NAV_HREF_MAP).forEach((id) => {
                navEl.innerHTML += `<label class="customize-toggle-row"><span>${navLabels()[id] || id}</span><input type="checkbox" data-nav="${id}" ${nav[id] !== false ? 'checked' : ''}></label>`;
            });
        }

        root.querySelectorAll('.customize-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                root.querySelectorAll('.customize-tab').forEach((b) => b.classList.remove('active'));
                root.querySelectorAll('.customize-panel').forEach((p) => p.classList.remove('active'));
                btn.classList.add('active');
                root.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add('active');
            });
        });

        root.querySelectorAll('.customize-lang').forEach((btn) => {
            btn.addEventListener('click', () => {
                collectCustomizeForm();
                root.querySelectorAll('.customize-lang').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                customizeLang = btn.dataset.lang;
                renderTextOverrides(root);
            });
        });

        root.querySelector('#custTextSearch')?.addEventListener('input', () => renderTextOverrides(root));
        root.querySelector('#custSaveAllBtn')?.addEventListener('click', () => saveCustomization(true));
        root.querySelector('#custApplyLocalBtn')?.addEventListener('click', () => saveCustomization(false));

        renderTextOverrides(root);
    }

    function renderTextOverrides(root) {
        const list = root.querySelector('#custTextList');
        if (!list || typeof translations === 'undefined') return;
        const cfg = getConfig();
        const overrides = cfg?.textOverrides?.[customizeLang] || {};
        const q = (root.querySelector('#custTextSearch')?.value || '').toLowerCase();
        const keys = Object.keys(translations.ru || translations[customizeLang] || {}).sort();
        const important = keys.filter((k) => /^(hero|nav|about|contacts|footer|site|page|seo|services|facilities|news|gallery|visitor)/.test(k));
        const showKeys = (q ? keys.filter((k) => k.includes(q) || String(translations.ru[k] || '').toLowerCase().includes(q)) : important).slice(0, 80);

        list.innerHTML = showKeys
            .map((key) => {
                const def = (translations[customizeLang] && translations[customizeLang][key]) || translations.ru[key] || '';
                const val = overrides[key] || '';
                return `<div class="cust-text-row"><code>${esc(key)}</code><input type="text" data-cust-key="${escAttr(key)}" value="${escAttr(val)}" placeholder="${escAttr(String(def).slice(0, 60))}"></div>`;
            })
            .join('');
    }

    function collectCustomizeForm() {
        if (!panelConfig) panelConfig = typeof GorkiSiteCustomization !== 'undefined' ? GorkiSiteCustomization.getDefaultConfig() : {};
        panelConfig.theme = {
            primaryColor: document.getElementById('custPrimary')?.value,
            secondaryColor: document.getElementById('custSecondary')?.value,
            accentColor: document.getElementById('custAccent')?.value,
            heroGradient: document.getElementById('custHeroGradient')?.value || '',
            fontFamily: document.getElementById('custFont')?.value || 'Inter, sans-serif',
            customCss: document.getElementById('custCustomCss')?.value || '',
            textDark: panelConfig.theme?.textDark || '#1f2937',
        };
        panelConfig.hero = {
            showFloatingCards: document.getElementById('custFloatingCards')?.checked !== false,
            overlayOpacity: panelConfig.hero?.overlayOpacity ?? 0.4,
        };
        panelConfig.sections = panelConfig.sections || {};
        const scope = document.getElementById('customizeSection') || document;
        scope.querySelectorAll('[data-section]').forEach((cb) => {
            panelConfig.sections[cb.dataset.section] = cb.checked;
        });
        panelConfig.nav = panelConfig.nav || {};
        scope.querySelectorAll('[data-nav]').forEach((cb) => {
            panelConfig.nav[cb.dataset.nav] = cb.checked;
        });
        if (!panelConfig.textOverrides) panelConfig.textOverrides = { ru: {}, en: {}, be: {} };
        document.querySelectorAll('#custTextList input[data-cust-key]').forEach((input) => {
            const key = input.dataset.custKey;
            if (!panelConfig.textOverrides[customizeLang]) panelConfig.textOverrides[customizeLang] = {};
            if (input.value.trim()) panelConfig.textOverrides[customizeLang][key] = input.value.trim();
            else delete panelConfig.textOverrides[customizeLang][key];
        });
        if (typeof GorkiSiteCustomization !== 'undefined') {
            panelConfig.content = GorkiSiteCustomization.collectContentFromLocalStorage();
        }
        return panelConfig;
    }

    async function saveCustomization(toServer) {
        const root = document.getElementById('customizePanelRoot');
        if (root) collectCustomizeForm();
        if (typeof GorkiSiteCustomization !== 'undefined') {
            GorkiSiteCustomization.setSiteCustomization(panelConfig);
            GorkiSiteCustomization.applySiteCustomization(panelConfig);
            if (typeof switchLanguage === 'function') {
                switchLanguage(localStorage.getItem('selectedLanguage') || 'ru');
            }
            if (typeof updateAboutSection === 'function') updateAboutSection();
            if (typeof renderSiteNews === 'function') renderSiteNews();
            if (typeof renderSitePrices === 'function') renderSitePrices();
            if (typeof visitorScheduleRedraw === 'function') visitorScheduleRedraw();
        }
        if (toServer && typeof GorkiSiteCustomization !== 'undefined') {
            try {
                const result = await GorkiSiteCustomization.saveSiteCustomizationToServer(panelConfig, '');
                if (result.success) {
                    if (typeof showNotification === 'function') showNotification('Сохранено на сервер', 'success');
                } else if (typeof showNotification === 'function') {
                    showNotification(result.error || 'Ошибка сервера — применено локально', 'error');
                }
            } catch (e) {
                if (typeof showNotification === 'function') showNotification('Сервер недоступен — только локально', 'error');
            }
        } else if (typeof showNotification === 'function') {
            showNotification('Изменения применены', 'success');
        }
    }

    async function openCustomizeSection() {
        await ensureConfig();
        const root = document.getElementById('customizePanelRoot');
        if (root) {
            renderCustomizeUI(root);
            root.dataset.ready = '1';
        }
    }

    global.GorkiAdminCustomize = {
        openCustomizeSection,
        saveCustomization,
        ensureConfig,
    };
})(typeof window !== 'undefined' ? window : globalThis);

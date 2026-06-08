/**
 * Загрузка и применение настроек кастомизации сайта (сервер + localStorage)
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'gorkiSiteCustomization';
    const CONTENT_KEYS = {
        news: 'gorkiNews',
        about: 'gorkiAbout',
        prices: 'gorkiPrices',
        contacts: 'gorkiContacts',
    };

    const SECTION_IDS = ['home', 'about', 'services', 'facilities', 'news', 'safety', 'visitor', 'gallery', 'contacts'];
    const NAV_HREF_MAP = {
        home: '#home',
        about: '#about',
        services: '#services',
        facilities: '#facilities',
        news: '#news',
        visitor: '#visitor',
        gallery: '#gallery',
        contacts: '#contacts',
    };

    let cachedConfig = null;
    let customStyleEl = null;

    function deepMerge(target, source) {
        const out = { ...target };
        Object.keys(source || {}).forEach((key) => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof out[key] === 'object' && !Array.isArray(out[key])) {
                out[key] = deepMerge(out[key], source[key]);
            } else {
                out[key] = source[key];
            }
        });
        return out;
    }

    function getDefaultConfig() {
        return {
            version: 1,
            theme: {
                primaryColor: '#2563eb',
                secondaryColor: '#1e40af',
                accentColor: '#fbbf24',
                textDark: '#1f2937',
                heroGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
                fontFamily: 'Inter, sans-serif',
                customCss: '',
            },
            sections: Object.fromEntries(SECTION_IDS.map((id) => [id, true])),
            nav: Object.fromEntries(Object.keys(NAV_HREF_MAP).map((id) => [id, true])),
            textOverrides: { ru: {}, en: {}, be: {} },
            seo: { ru: {}, en: {}, be: {} },
            contacts: { blocks: [] },
            footer: { copyright: { ru: '', en: '', be: '' } },
            hero: { showFloatingCards: true, overlayOpacity: 0.4 },
            content: { news: null, about: null, prices: null, contacts: null },
            schedule: null,
        };
    }

    function loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function saveToLocalStorage(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('Не удалось сохранить кастомизацию в localStorage', e);
        }
    }

    async function fetchServerConfig(apiBase) {
        const base = apiBase || '';
        try {
            const res = await fetch(base + 'api/site_customization.php', { cache: 'no-store' });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.success && data.customization) {
                return data.customization;
            }
        } catch (e) {
            /* file:// или сервер недоступен */
        }
        return null;
    }

    async function loadSiteCustomization(apiBase) {
        if (cachedConfig) return cachedConfig;
        const defaults = getDefaultConfig();
        const server = await fetchServerConfig(apiBase);
        const local = loadFromLocalStorage();
        cachedConfig = deepMerge(deepMerge(defaults, local || {}), server || {});
        saveToLocalStorage(cachedConfig);
        return cachedConfig;
    }

    function getSiteCustomization() {
        return cachedConfig || loadFromLocalStorage() || getDefaultConfig();
    }

    function setSiteCustomization(config) {
        cachedConfig = config;
        saveToLocalStorage(config);
        if (typeof global.translations !== 'undefined') {
            mergeTextOverrides(config);
        }
    }

    function mergeTextOverrides(config) {
        const overrides = config?.textOverrides;
        if (!overrides || typeof global.translations === 'undefined') return;
        ['ru', 'en', 'be'].forEach((lang) => {
            if (!global.translations[lang]) global.translations[lang] = {};
            if (overrides[lang]) {
                Object.assign(global.translations[lang], overrides[lang]);
            }
        });
        const seo = config?.seo;
        if (seo) {
            ['ru', 'en', 'be'].forEach((lang) => {
                if (seo[lang]?.['page-title']) {
                    global.translations[lang]['page-title'] = seo[lang]['page-title'];
                }
                if (seo[lang]?.['seo-description']) {
                    global.translations[lang]['seo-description'] = seo[lang]['seo-description'];
                }
            });
        }
    }

    function syncContentToLocalStorage(config) {
        const content = config?.content;
        if (!content) return;
        Object.entries(CONTENT_KEYS).forEach(([field, lsKey]) => {
            const val = content[field];
            if (val != null) {
                try {
                    localStorage.setItem(lsKey, JSON.stringify(val));
                } catch (e) {
                    console.warn('sync content', field, e);
                }
            }
        });
    }

    function collectContentFromLocalStorage() {
        const content = {};
        Object.entries(CONTENT_KEYS).forEach(([field, lsKey]) => {
            try {
                const raw = localStorage.getItem(lsKey);
                content[field] = raw ? JSON.parse(raw) : null;
            } catch (e) {
                content[field] = null;
            }
        });
        return content;
    }

    function applyTheme(config) {
        const theme = config?.theme || {};
        const root = document.documentElement;
        if (theme.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor);
        if (theme.secondaryColor) root.style.setProperty('--secondary-color', theme.secondaryColor);
        if (theme.accentColor) root.style.setProperty('--accent-color', theme.accentColor);
        if (theme.textDark) root.style.setProperty('--text-dark', theme.textDark);
        if (theme.fontFamily) {
            document.body.style.fontFamily = theme.fontFamily;
        }
        const hero = document.querySelector('.hero');
        if (hero && theme.heroGradient) {
            hero.style.background = theme.heroGradient;
        }
        const overlay = document.querySelector('.hero-overlay');
        if (overlay && config?.hero?.overlayOpacity != null) {
            overlay.style.opacity = String(config.hero.overlayOpacity);
        }
        const heroImage = document.querySelector('.hero-image');
        if (heroImage && config?.hero?.showFloatingCards === false) {
            heroImage.style.display = 'none';
        }
        if (!customStyleEl) {
            customStyleEl = document.createElement('style');
            customStyleEl.id = 'gorki-custom-css';
            document.head.appendChild(customStyleEl);
        }
        customStyleEl.textContent = theme.customCss || '';
    }

    function applySectionVisibility(config) {
        const sections = config?.sections || {};
        SECTION_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const visible = sections[id] !== false;
            el.style.display = visible ? '' : 'none';
        });
    }

    function applyNavVisibility(config) {
        const nav = config?.nav || {};
        document.querySelectorAll('.nav-menu a[href^="#"]').forEach((link) => {
            const href = link.getAttribute('href');
            const key = href ? href.replace('#', '') : '';
            if (key && nav[key] === false) {
                const li = link.closest('li');
                if (li) li.style.display = 'none';
            } else {
                const li = link.closest('li');
                if (li) li.style.display = '';
            }
        });
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const CONTACT_TYPE_ICONS = {
        phone: 'phone',
        email: 'envelope',
        address: 'map-marker-alt',
        schedule: 'clock',
    };

    function applyAdminContactsList(lang) {
        const container = document.getElementById('siteContactInfo');
        if (!container) return;
        try {
            const raw = localStorage.getItem(CONTENT_KEYS.contacts);
            if (!raw) return;
            const items = JSON.parse(raw);
            if (!Array.isArray(items) || items.length === 0) return;
            container.innerHTML = items
                .map((item) => {
                    const icon = item.icon || CONTACT_TYPE_ICONS[item.type] || 'info-circle';
                    const title = item.title || item.type || '';
                    return `
                        <div class="contact-item">
                            <i class="fas fa-${escapeHtml(icon)}"></i>
                            <div>
                                <h4>${escapeHtml(title)}</h4>
                                <p>${escapeHtml(item.content || '')}</p>
                            </div>
                        </div>
                    `;
                })
                .join('');
        } catch (e) {
            console.warn('applyAdminContactsList', e);
        }
    }

    function applyContactBlocks(config, lang) {
        const blocks = config?.contacts?.blocks;
        const container = document.getElementById('siteContactInfo');
        if (!container) return;
        if (!Array.isArray(blocks) || blocks.length === 0) {
            applyAdminContactsList(lang);
            return;
        }

        container.innerHTML = blocks
            .map((block) => {
                const title = block.title?.[lang] || block.title?.ru || block.title || '';
                const lines = block.lines?.[lang] || block.lines?.ru || block.lines || [];
                const icon = block.icon || 'info-circle';
                const linesHtml = (Array.isArray(lines) ? lines : [lines])
                    .filter(Boolean)
                    .map((line) => `<p>${escapeHtml(line)}</p>`)
                    .join('');
                return `
                    <div class="contact-item">
                        <i class="fas fa-${escapeHtml(block.icon || icon)}"></i>
                        <div>
                            <h4>${escapeHtml(title)}</h4>
                            ${linesHtml}
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    function applyFooter(config, lang) {
        const copy = config?.footer?.copyright?.[lang] || config?.footer?.copyright?.ru;
        if (!copy) return;
        const el = document.querySelector('.footer-bottom p[data-translate="footer-copyright"]');
        if (el) el.textContent = copy;
    }

    function applySiteCustomization(config, lang) {
        if (!config) return;
        const currentLang = lang || localStorage.getItem('selectedLanguage') || 'ru';
        mergeTextOverrides(config);
        applyTheme(config);
        applySectionVisibility(config);
        applyNavVisibility(config);
        applyContactBlocks(config, currentLang);
        applyFooter(config, currentLang);
        syncContentToLocalStorage(config);
    }

    async function initSiteCustomization(apiBase) {
        const config = await loadSiteCustomization(apiBase);
        mergeTextOverrides(config);
        return config;
    }

    async function saveSiteCustomizationToServer(config, apiBase, schedule) {
        const base = apiBase || '';
        const token =
            (typeof global.GorkiAdminAuth !== 'undefined' && global.GorkiAdminAuth.getAuthHeader())
                ? global.GorkiAdminAuth.getAuthHeader().replace('Bearer ', '')
                : (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('adminToken')) || 'demo-token';
        const body = { customization: config };
        if (schedule) body.schedule = schedule;
        const res = await fetch(base + 'api/site_customization.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: typeof global.GorkiAdminAuth !== 'undefined' ? global.GorkiAdminAuth.getAuthHeader() : 'Bearer ' + token,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success && data.customization) {
            setSiteCustomization(data.customization);
        }
        return data;
    }

    function getEditableTranslationKeys() {
        if (typeof global.translations === 'undefined' || !global.translations.ru) return [];
        return Object.keys(global.translations.ru).sort();
    }

    function groupKeysByPrefix(keys) {
        const groups = {};
        keys.forEach((key) => {
            const prefix = key.includes('-') ? key.split('-')[0] : 'other';
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push(key);
        });
        return groups;
    }

    global.GorkiSiteCustomization = {
        STORAGE_KEY,
        SECTION_IDS,
        NAV_HREF_MAP,
        CONTENT_KEYS,
        getDefaultConfig,
        loadSiteCustomization,
        getSiteCustomization,
        setSiteCustomization,
        mergeTextOverrides,
        applySiteCustomization,
        initSiteCustomization,
        saveSiteCustomizationToServer,
        collectContentFromLocalStorage,
        syncContentToLocalStorage,
        getEditableTranslationKeys,
        groupKeysByPrefix,
        invalidateCache: () => {
            cachedConfig = null;
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);

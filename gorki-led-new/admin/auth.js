/**
 * Авторизация админ-панели (localStorage + резерв sessionStorage)
 */
(function (global) {
    'use strict';

    const TOKEN_KEY = 'gorkiAdminToken';
    const TIME_KEY = 'gorkiAdminLoginTime';
    const LEGACY_TOKEN_KEY = 'adminToken';
    const LEGACY_TIME_KEY = 'loginTime';
    const TOKEN_VALUE = 'demo-token';
    const MAX_AGE_MS = 24 * 60 * 60 * 1000;

    function readStore() {
        try {
            localStorage.setItem('__gorki_test', '1');
            localStorage.removeItem('__gorki_test');
            return localStorage;
        } catch (e) {
            try {
                sessionStorage.setItem('__gorki_test', '1');
                sessionStorage.removeItem('__gorki_test');
                return sessionStorage;
            } catch (e2) {
                return null;
            }
        }
    }

    const store = readStore();

    function getItem(key) {
        if (!store) return null;
        let v = store.getItem(key);
        if (v != null) return v;
        try {
            if (store !== sessionStorage) v = sessionStorage.getItem(key);
            if (v == null && store !== localStorage) v = localStorage.getItem(key);
        } catch (e) {}
        return v;
    }

    function setItem(key, value) {
        if (!store) throw new Error('Хранилище браузера недоступно');
        store.setItem(key, value);
        try {
            if (store !== sessionStorage) sessionStorage.setItem(key, value);
            if (store !== localStorage) localStorage.setItem(key, value);
        } catch (e) {}
        if (key === TOKEN_KEY || key === LEGACY_TOKEN_KEY) {
            try {
                sessionStorage.setItem(LEGACY_TOKEN_KEY, value);
                localStorage.setItem(LEGACY_TOKEN_KEY, value);
            } catch (e) {}
        }
        if (key === TIME_KEY || key === LEGACY_TIME_KEY) {
            try {
                sessionStorage.setItem(LEGACY_TIME_KEY, value);
                localStorage.setItem(LEGACY_TIME_KEY, value);
            } catch (e) {}
        }
    }

    function removeItem(key) {
        if (!store) return;
        store.removeItem(key);
        try {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        } catch (e) {}
    }

    function getToken() {
        return getItem(TOKEN_KEY) || getItem(LEGACY_TOKEN_KEY);
    }

    function getLoginTime() {
        const t = getItem(TIME_KEY) || getItem(LEGACY_TIME_KEY);
        return t ? parseInt(t, 10) : null;
    }

    function isLoggedIn() {
        if (getToken() !== TOKEN_VALUE) return false;
        const loginTime = getLoginTime();
        if (loginTime == null || Number.isNaN(loginTime)) return true;
        return Date.now() - loginTime < MAX_AGE_MS;
    }

    function setSession() {
        const now = String(Date.now());
        setItem(TOKEN_KEY, TOKEN_VALUE);
        setItem(TIME_KEY, now);
        setItem(LEGACY_TOKEN_KEY, TOKEN_VALUE);
        setItem(LEGACY_TIME_KEY, now);
    }

    function clearSession() {
        [TOKEN_KEY, TIME_KEY, LEGACY_TOKEN_KEY, LEGACY_TIME_KEY].forEach(removeItem);
    }

    function login(username, password) {
        const user = String(username || '').trim();
        const pass = String(password || '').trim();
        if (user === 'admin' && (pass === 'admin123' || pass === 'admin')) {
            try {
                setSession();
                return { ok: true };
            } catch (e) {
                return { ok: false, error: 'Не удалось сохранить сессию. Откройте сайт через http://localhost (start_local_server.bat) или разрешите cookies.' };
            }
        }
        return { ok: false, error: 'Неверный логин или пароль. Логин: admin, пароль: admin123' };
    }

    function logout() {
        clearSession();
    }

    function requireAuth(loginUrl) {
        if (isLoggedIn()) return true;
        clearSession();
        window.location.replace(loginUrl || 'login.html');
        return false;
    }

    function getAuthHeader() {
        return 'Bearer ' + (getToken() || TOKEN_VALUE);
    }

    global.GorkiAdminAuth = {
        TOKEN_VALUE,
        login,
        logout,
        isLoggedIn,
        requireAuth,
        getToken,
        getAuthHeader,
        clearSession,
        setSession,
    };
})(typeof window !== 'undefined' ? window : globalThis);

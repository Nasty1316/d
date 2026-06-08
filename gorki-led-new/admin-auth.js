/**
 * Авторизация встроенной админ-панели на сайте
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
            v = sessionStorage.getItem(key);
            if (v == null) v = localStorage.getItem(key);
        } catch (e) {}
        return v;
    }

    function setItem(key, value) {
        if (!store) throw new Error('storage');
        store.setItem(key, value);
        try {
            sessionStorage.setItem(key, value);
            localStorage.setItem(key, value);
        } catch (e) {}
    }

    function removeItem(key) {
        [store, sessionStorage, localStorage].forEach((s) => {
            try {
                if (s) s.removeItem(key);
            } catch (e) {}
        });
    }

    function isLoggedIn() {
        const token = getItem(TOKEN_KEY) || getItem(LEGACY_TOKEN_KEY);
        if (token !== TOKEN_VALUE) return false;
        const t = getItem(TIME_KEY) || getItem(LEGACY_TIME_KEY);
        if (!t) return true;
        const age = Date.now() - parseInt(t, 10);
        return !Number.isNaN(age) && age < MAX_AGE_MS;
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
                return { ok: false, error: 'Хранилище браузера недоступно' };
            }
        }
        return { ok: false, error: 'Неверный логин или пароль (admin / admin123)' };
    }

    function logout() {
        clearSession();
    }

    function getAuthHeader() {
        return 'Bearer ' + (getItem(TOKEN_KEY) || getItem(LEGACY_TOKEN_KEY) || TOKEN_VALUE);
    }

    global.GorkiAdminAuth = {
        login,
        logout,
        isLoggedIn,
        getAuthHeader,
        setSession,
        clearSession,
    };
})(typeof window !== 'undefined' ? window : globalThis);

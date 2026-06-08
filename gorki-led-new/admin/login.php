<?php
/**
 * Резервный вход (если JavaScript не сработал) — POST сюда с login.html
 */
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim((string) ($_POST['username'] ?? ''));
    $pass = trim((string) ($_POST['password'] ?? ''));
    if ($user === 'admin' && ($pass === 'admin123' || $pass === 'admin')) {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход…</title>';
        echo '<script src="auth.js"></script></head><body>';
        echo '<p>Вход выполнен, переход в панель…</p>';
        echo '<script>try{GorkiAdminAuth.setSession();}catch(e){}window.location.replace("index.html");</script>';
        echo '</body></html>';
        exit;
    }
    $loginError = 'Неверный логин или пароль';
}
header('Location: login.html' . ($loginError ? '?error=1' : ''));
exit;

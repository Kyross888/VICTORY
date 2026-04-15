<?php
// ============================================================
//  db.php  —  Single source of truth for DB connection
//  Railway: set MYSQLHOST, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, MYSQLPORT
//  in your Railway service environment variables.
// ============================================================

define('DB_HOST',    getenv('MYSQLHOST')     ?: getenv('DB_HOST')     ?: 'localhost');
define('DB_NAME',    getenv('MYSQLDATABASE') ?: getenv('DB_NAME')     ?: 'lunas_pos');
define('DB_USER',    getenv('MYSQLUSER')     ?: getenv('DB_USER')     ?: 'root');
define('DB_PASS',    getenv('MYSQLPASSWORD') ?: getenv('DB_PASS')     ?: '');
define('DB_PORT',    getenv('MYSQLPORT')     ?: getenv('DB_PORT')     ?: '3306');
define('DB_CHARSET', 'utf8mb4');

$dsn = "mysql:host=" . DB_HOST
     . ";port=" . DB_PORT
     . ";dbname=" . DB_NAME
     . ";charset=" . DB_CHARSET;

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// ── Session helpers ──────────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Helper: send JSON and exit
function respond(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Helper: require login; returns session user array
function requireAuth(): array {
    if (empty($_SESSION['user'])) {
        respond(['success' => false, 'error' => 'Not authenticated'], 401);
    }
    return $_SESSION['user'];
}

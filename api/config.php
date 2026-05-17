<?php
// ============================================================
// Ro-Route API — Configuration & Helpers
// ============================================================

// CORS Headers — allow frontend origin
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
];

// Add Railway/production frontend URL from env
if (!empty(getenv('FRONTEND_URL'))) {
    $allowedOrigins[] = rtrim(getenv('FRONTEND_URL'), '/');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins) || preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (!empty(getenv('FRONTEND_URL'))) {
    header('Access-Control-Allow-Origin: ' . rtrim(getenv('FRONTEND_URL'), '/'));
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection — uses Railway env vars or falls back to localhost
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $host = getenv('MYSQLHOST') ?: getenv('DB_HOST') ?: 'localhost';
        $port = getenv('MYSQLPORT') ?: getenv('DB_PORT') ?: '3306';
        $db   = getenv('MYSQLDATABASE') ?: getenv('DB_NAME') ?: 'roroute_db';
        $user = getenv('MYSQLUSER') ?: getenv('DB_USER') ?: 'root';
        $pass = getenv('MYSQLPASSWORD') ?: getenv('DB_PASS') ?: '';

        try {
            $pdo = new PDO(
                "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            jsonResponse(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
        }
    }
    return $pdo;
}

// JSON response helper
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Get JSON body
function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Simple token generation
function generateToken($userId) {
    $payload = $userId . '|' . time() . '|' . bin2hex(random_bytes(16));
    return base64_encode($payload);
}

// Get Authorization header (with XAMPP/Apache fallbacks)
function getAuthorizationHeader() {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                return $value;
            }
        }
    }
    return '';
}

// Validate token and get user
function getAuthUser() {
    $header = getAuthorizationHeader();
    if (!preg_match('/Bearer\s+(.+)/', $header, $matches)) {
        return null;
    }

    $token = $matches[1];
    $db = getDB();

    $stmt = $db->prepare('SELECT u.* FROM user_tokens t JOIN users u ON t.user_id = u.id WHERE t.token = ? AND t.expires_at > NOW()');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        unset($user['password']);
    }

    return $user;
}

// Require authentication
function requireAuth($allowedRoles = null) {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    if ($allowedRoles && !in_array($user['role'], $allowedRoles)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    return $user;
}

// Create tokens table if not exists
function ensureTokensTable() {
    $db = getDB();
    $db->exec("
        CREATE TABLE IF NOT EXISTS user_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

ensureTokensTable();

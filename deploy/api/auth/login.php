<?php
// Auth — Login (with brute-force protection)
require_once __DIR__ . '/../config.php';

$body = getBody();
$email = $body['email'] ?? '';
$password = $body['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(['error' => 'Email and password are required'], 422);
}

$db = getDB();
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

// ── Brute-force protection: check recent failed attempts ────
$maxAttempts = 5;
$lockoutMinutes = 15;

$stmt = $db->prepare("
    SELECT COUNT(*) AS attempts 
    FROM login_attempts 
    WHERE email = ? AND success = 0 AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
");
$stmt->execute([$email, $lockoutMinutes]);
$result = $stmt->fetch();

if ($result && $result['attempts'] >= $maxAttempts) {
    // Log the blocked attempt
    $stmt = $db->prepare("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 0)");
    $stmt->execute([$email, $ip]);
    
    jsonResponse([
        'error' => "Too many failed login attempts. Please try again after {$lockoutMinutes} minutes.",
        'locked' => true,
        'retry_after' => $lockoutMinutes
    ], 429);
}

// ── Authenticate user ────
$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    // Log failed attempt
    $stmt = $db->prepare("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 0)");
    $stmt->execute([$email, $ip]);
    
    // Calculate remaining attempts
    $stmt = $db->prepare("
        SELECT COUNT(*) AS attempts 
        FROM login_attempts 
        WHERE email = ? AND success = 0 AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    ");
    $stmt->execute([$email, $lockoutMinutes]);
    $failResult = $stmt->fetch();
    $remaining = $maxAttempts - ($failResult['attempts'] ?? 0);
    
    $msg = 'Invalid email or password';
    if ($remaining > 0 && $remaining <= 3) {
        $msg .= ". {$remaining} attempt(s) remaining before lockout.";
    }
    
    jsonResponse(['error' => $msg, 'remaining_attempts' => max(0, $remaining)], 401);
}

// ── Successful login ────
// Log successful attempt
$stmt = $db->prepare("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 1)");
$stmt->execute([$email, $ip]);

// Clear failed attempts for this email on successful login
$stmt = $db->prepare("DELETE FROM login_attempts WHERE email = ? AND success = 0");
$stmt->execute([$email]);

// Cleanup expired tokens
$db->exec("DELETE FROM user_tokens WHERE expires_at < NOW()");

// Generate token
$token = generateToken($user['id']);
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

$stmt = $db->prepare('INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
$stmt->execute([$user['id'], $token, $expiresAt]);

// Log to audit
$stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address) VALUES (?, 'login', 'User logged in', ?)");
$stmt->execute([$user['id'], $ip]);

unset($user['password']);

// If driver, get driver info
$driverInfo = null;
if ($user['role'] === 'driver') {
    $stmt = $db->prepare('SELECT * FROM drivers WHERE user_id = ? AND deleted_at IS NULL');
    $stmt->execute([$user['id']]);
    $driverInfo = $stmt->fetch();
}

jsonResponse([
    'user' => $user,
    'driver' => $driverInfo,
    'token' => $token,
    'expires_at' => $expiresAt,
]);

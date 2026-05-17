<?php
// Auth — Register
require_once __DIR__ . '/../config.php';

$body = getBody();
$name = trim($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$phone = trim($body['phone'] ?? '');
$password = $body['password'] ?? '';

if (!$name || !$email || !$password) {
    jsonResponse(['error' => 'Name, email, and password are required'], 422);
}

if (strlen($password) < 6) {
    jsonResponse(['error' => 'Password must be at least 6 characters'], 422);
}

$db = getDB();

// Check if email exists
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'Email is already registered'], 409);
}

// Create user
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, "passenger")');
$stmt->execute([$name, $email, $phone, $hashed]);
$userId = $db->lastInsertId();

// Generate token
$token = generateToken($userId);
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
$stmt = $db->prepare('INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
$stmt->execute([$userId, $token, $expiresAt]);

$user = [
    'id' => (int)$userId,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'role' => 'passenger',
];

jsonResponse(['user' => $user, 'token' => $token, 'expires_at' => $expiresAt], 201);

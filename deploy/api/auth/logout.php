<?php
// Auth — Logout (invalidate token)
require_once __DIR__ . '/../config.php';

$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s+(.+)/', $header, $matches)) {
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM user_tokens WHERE token = ?');
    $stmt->execute([$matches[1]]);
}

jsonResponse(['message' => 'Logged out successfully']);

<?php
// Auth — Get current user
require_once __DIR__ . '/../config.php';

$user = requireAuth();

$driverInfo = null;
if ($user['role'] === 'driver') {
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM drivers WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $driverInfo = $stmt->fetch();
}

jsonResponse(['user' => $user, 'driver' => $driverInfo]);

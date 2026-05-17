<?php
// Admin — Users list
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();

$role = $_GET['role'] ?? '';
$sql = "SELECT id, name, email, phone, role, is_active, created_at FROM users";
$params = [];

if ($role) {
    $sql .= " WHERE role = ?";
    $params[] = $role;
}

$sql .= " ORDER BY created_at DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);

jsonResponse(['users' => $stmt->fetchAll()]);

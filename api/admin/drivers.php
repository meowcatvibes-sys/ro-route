<?php
// Admin — Drivers CRUD
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("
        SELECT d.*, u.name, u.email, u.phone
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.deleted_at IS NULL
        ORDER BY d.id ASC
    ");
    jsonResponse(['drivers' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $body = getBody();
    $action = $body['action'] ?? 'create';

    if ($action === 'create') {
        // Create user account first
        $hashed = password_hash($body['password'] ?? 'driver123', PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'driver')");
        $stmt->execute([$body['name'], $body['email'], $body['phone'] ?? '', $hashed]);
        $userId = $db->lastInsertId();

        // Create driver profile
        $stmt = $db->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $body['license_number'], $body['license_expiry'], $body['status'] ?? 'active']);
        jsonResponse(['message' => 'Driver created', 'id' => $db->lastInsertId()], 201);
    }

    if ($action === 'update') {
        // Update user
        $stmt = $db->prepare("UPDATE users SET name=?, email=?, phone=?, updated_at=NOW() WHERE id = (SELECT user_id FROM drivers WHERE id=?)");
        $stmt->execute([$body['name'], $body['email'], $body['phone'] ?? '', $body['id']]);

        // Update driver
        $stmt = $db->prepare("UPDATE drivers SET license_number=?, license_expiry=?, status=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$body['license_number'], $body['license_expiry'], $body['status'], $body['id']]);
        jsonResponse(['message' => 'Driver updated']);
    }

    if ($action === 'delete') {
        // Soft delete — preserve driver data for historical records
        $stmt = $db->prepare("UPDATE drivers SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$body['id']]);
        // Deactivate user account
        $stmt = $db->prepare("SELECT user_id FROM drivers WHERE id = ?");
        $stmt->execute([$body['id']]);
        $driver = $stmt->fetch();
        if ($driver) {
            $db->prepare("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?")->execute([$driver['user_id']]);
        }
        jsonResponse(['message' => 'Driver archived']);
    }
}

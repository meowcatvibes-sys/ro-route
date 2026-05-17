<?php
// Admin — Buses CRUD
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List all buses (exclude soft-deleted)
    $stmt = $db->query("SELECT * FROM buses WHERE deleted_at IS NULL ORDER BY id ASC");
    jsonResponse(['buses' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $body = getBody();
    $action = $body['action'] ?? 'create';

    if ($action === 'create') {
        $stmt = $db->prepare("INSERT INTO buses (bus_name, plate_number, bus_type, total_seats, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['bus_name'], $body['plate_number'],
            $body['bus_type'] ?? 'aircon', $body['total_seats'] ?? 45,
            $body['status'] ?? 'active'
        ]);
        jsonResponse(['message' => 'Bus created', 'id' => $db->lastInsertId()], 201);
    }

    if ($action === 'update') {
        $stmt = $db->prepare("UPDATE buses SET bus_name=?, plate_number=?, bus_type=?, total_seats=?, status=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([
            $body['bus_name'], $body['plate_number'],
            $body['bus_type'], $body['total_seats'],
            $body['status'], $body['id']
        ]);
        jsonResponse(['message' => 'Bus updated']);
    }

    if ($action === 'delete') {
        // Soft delete — preserve data for historical records
        $stmt = $db->prepare("UPDATE buses SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$body['id']]);
        jsonResponse(['message' => 'Bus archived']);
    }
}

<?php
// Admin — Announcements CRUD
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    // Public access for listing
    $stmt = $db->query("
        SELECT a.*, u.name AS author_name
        FROM announcements a
        JOIN users u ON a.admin_id = u.id
        WHERE a.is_active = 1 AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC
    ");
    jsonResponse(['announcements' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $user = requireAuth(['admin']);
    $body = getBody();
    $action = $body['action'] ?? 'create';

    if ($action === 'create') {
        $stmt = $db->prepare("INSERT INTO announcements (admin_id, title, content, is_active) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['id'], $body['title'], $body['content'], $body['is_active'] ?? 1]);
        jsonResponse(['message' => 'Announcement created', 'id' => $db->lastInsertId()], 201);
    }

    if ($action === 'update') {
        $stmt = $db->prepare("UPDATE announcements SET title=?, content=?, is_active=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([$body['title'], $body['content'], $body['is_active'], $body['id']]);
        jsonResponse(['message' => 'Announcement updated']);
    }

    if ($action === 'delete') {
        // Soft delete
        $stmt = $db->prepare("UPDATE announcements SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$body['id']]);
        jsonResponse(['message' => 'Announcement archived']);
    }
}

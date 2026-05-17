<?php
// Admin — Schedules CRUD
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("
        SELECT s.*, b.bus_name, b.bus_type, b.total_seats, u.name AS driver_name,
               COALESCE(booked.count, 0) AS booked_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.departure_date DESC, s.departure_time ASC
    ");
    jsonResponse(['schedules' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $body = getBody();
    $action = $body['action'] ?? 'create';

    if ($action === 'create') {
        $stmt = $db->prepare("INSERT INTO schedules (bus_id, driver_id, route, departure_date, departure_time, estimated_arrival, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['bus_id'], $body['driver_id'], $body['route'],
            $body['departure_date'], $body['departure_time'],
            $body['estimated_arrival'] ?? null, $body['fare'],
            $body['status'] ?? 'scheduled'
        ]);
        jsonResponse(['message' => 'Schedule created', 'id' => $db->lastInsertId()], 201);
    }

    if ($action === 'update') {
        $stmt = $db->prepare("UPDATE schedules SET bus_id=?, driver_id=?, route=?, departure_date=?, departure_time=?, estimated_arrival=?, fare=?, status=?, updated_at=NOW() WHERE id=?");
        $stmt->execute([
            $body['bus_id'], $body['driver_id'], $body['route'],
            $body['departure_date'], $body['departure_time'],
            $body['estimated_arrival'], $body['fare'],
            $body['status'], $body['id']
        ]);
        jsonResponse(['message' => 'Schedule updated']);
    }

    if ($action === 'delete') {
        // Soft delete — preserve schedule data for booking history
        $stmt = $db->prepare("UPDATE schedules SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$body['id']]);
        jsonResponse(['message' => 'Schedule archived']);
    }
}

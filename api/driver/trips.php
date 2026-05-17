<?php
// Driver — My trips & status update
require_once __DIR__ . '/../config.php';

$user = requireAuth(['driver']);
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Get driver ID
$stmt = $db->prepare("SELECT id FROM drivers WHERE user_id = ?");
$stmt->execute([$user['id']]);
$driver = $stmt->fetch();
if (!$driver) jsonResponse(['error' => 'Driver profile not found'], 404);

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'upcoming'; // upcoming, current, history

    $sql = "
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               COALESCE(booked.count, 0) AS passenger_count
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.driver_id = ?
    ";

    if ($type === 'current') {
        $sql .= " AND s.status IN ('boarding', 'departed', 'in_transit')";
    } elseif ($type === 'history') {
        $sql .= " AND s.status IN ('arrived', 'cancelled')";
    } else {
        $sql .= " AND s.status = 'scheduled'";
    }

    $sql .= " ORDER BY s.departure_date ASC, s.departure_time ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute([$driver['id']]);
    jsonResponse(['trips' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $body = getBody();
    $scheduleId = $body['schedule_id'] ?? 0;
    $newStatus = $body['status'] ?? '';

    $validStatuses = ['boarding', 'departed', 'in_transit', 'arrived'];
    if (!in_array($newStatus, $validStatuses)) {
        jsonResponse(['error' => 'Invalid status'], 400);
    }

    // Verify this is driver's trip
    $stmt = $db->prepare("SELECT id FROM schedules WHERE id = ? AND driver_id = ?");
    $stmt->execute([$scheduleId, $driver['id']]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Trip not found or not assigned to you'], 403);
    }

    $stmt = $db->prepare("UPDATE schedules SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$newStatus, $scheduleId]);

    // If arrived, mark all bookings as completed
    if ($newStatus === 'arrived') {
        $stmt = $db->prepare("UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE schedule_id = ? AND status = 'confirmed'");
        $stmt->execute([$scheduleId]);
    }

    jsonResponse(['message' => 'Trip status updated to ' . $newStatus]);
}

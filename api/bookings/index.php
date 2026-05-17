<?php
// Bookings — List user's bookings
require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDB();

$sql = "
    SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
           b.bus_name, b.plate_number, b.bus_type
    FROM bookings bk
    JOIN schedules s ON bk.schedule_id = s.id
    JOIN buses b ON s.bus_id = b.id
";

$params = [];

if ($user['role'] === 'passenger') {
    $sql .= " WHERE bk.user_id = ?";
    $params[] = $user['id'];
} else if ($user['role'] === 'admin') {
    // Admin sees all bookings
    $status = $_GET['status'] ?? '';
    $date = $_GET['date'] ?? '';
    $conditions = [];
    if ($status) { $conditions[] = "bk.status = ?"; $params[] = $status; }
    if ($date) { $conditions[] = "s.departure_date = ?"; $params[] = $date; }
    if ($conditions) $sql .= " WHERE " . implode(' AND ', $conditions);
}

$sql .= " ORDER BY bk.created_at DESC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$bookings = $stmt->fetchAll();

jsonResponse(['bookings' => $bookings]);

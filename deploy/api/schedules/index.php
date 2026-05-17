<?php
// Schedules — List with filters
require_once __DIR__ . '/../config.php';

$db = getDB();

$route = $_GET['route'] ?? '';
$date = $_GET['date'] ?? '';
$busType = $_GET['bus_type'] ?? '';

$sql = "
    SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
           u.name AS driver_name,
           (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN drivers d ON s.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN (
        SELECT schedule_id, COUNT(*) AS count
        FROM bookings
        WHERE status NOT IN ('cancelled')
        GROUP BY schedule_id
    ) booked ON s.id = booked.schedule_id
    WHERE s.status != 'cancelled'
";

$params = [];

if ($route && $route !== 'all') {
    $sql .= " AND s.route = ?";
    $params[] = $route;
}

if ($date) {
    $sql .= " AND s.departure_date = ?";
    $params[] = $date;
}

if ($busType && $busType !== 'all') {
    $sql .= " AND b.bus_type = ?";
    $params[] = $busType;
}

$sql .= " ORDER BY s.departure_date ASC, s.departure_time ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$schedules = $stmt->fetchAll();

jsonResponse(['schedules' => $schedules]);

<?php
// Bookings — Show detail
require_once __DIR__ . '/../config.php';

$user = requireAuth();
$id = $_GET['id'] ?? 0;
if (!$id) jsonResponse(['error' => 'Booking ID required'], 400);

$db = getDB();
$stmt = $db->prepare("
    SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
           b.bus_name, b.plate_number, b.bus_type,
           u.name AS passenger_name, u.email AS passenger_email, u.phone AS passenger_phone
    FROM bookings bk
    JOIN schedules s ON bk.schedule_id = s.id
    JOIN buses b ON s.bus_id = b.id
    JOIN users u ON bk.user_id = u.id
    WHERE bk.id = ?
");
$stmt->execute([$id]);
$booking = $stmt->fetch();

if (!$booking) jsonResponse(['error' => 'Booking not found'], 404);

// Passengers can only see their own
if ($user['role'] === 'passenger' && $booking['user_id'] != $user['id']) {
    jsonResponse(['error' => 'Forbidden'], 403);
}

jsonResponse(['booking' => $booking]);

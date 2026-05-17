<?php
// Schedules — Show detail with booked seats
require_once __DIR__ . '/../config.php';

$id = $_GET['id'] ?? 0;
if (!$id) jsonResponse(['error' => 'Schedule ID required'], 400);

$db = getDB();

$stmt = $db->prepare("
    SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
           u.name AS driver_name
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN drivers d ON s.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE s.id = ?
");
$stmt->execute([$id]);
$schedule = $stmt->fetch();

if (!$schedule) jsonResponse(['error' => 'Schedule not found'], 404);

// Get booked seats
$stmt = $db->prepare("
    SELECT seat_number, user_id, u.name AS passenger_name
    FROM bookings bk
    JOIN users u ON bk.user_id = u.id
    WHERE bk.schedule_id = ? AND bk.status != 'cancelled'
");
$stmt->execute([$id]);
$bookedSeats = $stmt->fetchAll();

$schedule['booked_seats'] = $bookedSeats;
$schedule['available_seats'] = $schedule['total_seats'] - count($bookedSeats);

jsonResponse(['schedule' => $schedule]);

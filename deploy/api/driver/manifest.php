<?php
// Driver — Passenger manifest for a trip
require_once __DIR__ . '/../config.php';

$user = requireAuth(['driver', 'admin']);
$db = getDB();

$scheduleId = $_GET['schedule_id'] ?? 0;
if (!$scheduleId) jsonResponse(['error' => 'Schedule ID required'], 400);

$stmt = $db->prepare("
    SELECT bk.seat_number, bk.booking_ref, bk.payment_status, bk.status,
           u.name AS passenger_name, u.phone AS passenger_phone
    FROM bookings bk
    JOIN users u ON bk.user_id = u.id
    WHERE bk.schedule_id = ? AND bk.status != 'cancelled'
    ORDER BY bk.seat_number ASC
");
$stmt->execute([$scheduleId]);

jsonResponse(['passengers' => $stmt->fetchAll()]);

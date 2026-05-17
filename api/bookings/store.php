<?php
// Bookings — Create new booking
require_once __DIR__ . '/../config.php';

$user = requireAuth(['passenger']);
$body = getBody();

$scheduleId = $body['schedule_id'] ?? 0;
$seatNumber = $body['seat_number'] ?? '';
$paymentMethod = $body['payment_method'] ?? 'cash';

if (!$scheduleId || !$seatNumber) {
    jsonResponse(['error' => 'Schedule ID and seat number are required'], 422);
}

$db = getDB();

// Check schedule exists and is bookable
$stmt = $db->prepare("SELECT s.*, b.total_seats FROM schedules s JOIN buses b ON s.bus_id = b.id WHERE s.id = ? AND s.status IN ('scheduled', 'boarding')");
$stmt->execute([$scheduleId]);
$schedule = $stmt->fetch();

if (!$schedule) {
    jsonResponse(['error' => 'Schedule not available for booking'], 400);
}

// Check seat is not taken
$stmt = $db->prepare("SELECT id FROM bookings WHERE schedule_id = ? AND seat_number = ? AND status != 'cancelled'");
$stmt->execute([$scheduleId, $seatNumber]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'Seat is already taken'], 409);
}

// Generate booking reference
$bookingRef = 'RR-' . date('Ymd') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

// Create booking
$stmt = $db->prepare("
    INSERT INTO bookings (booking_ref, user_id, schedule_id, seat_number, amount_paid, payment_method, payment_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
");

$paymentStatus = ($paymentMethod === 'cash') ? 'pending' : 'paid';
$stmt->execute([$bookingRef, $user['id'], $scheduleId, $seatNumber, $schedule['fare'], $paymentMethod, $paymentStatus]);

$bookingId = $db->lastInsertId();

// Get full booking with details
$stmt = $db->prepare("
    SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival,
           b.bus_name, b.plate_number, b.bus_type, u.name AS passenger_name, u.email, u.phone
    FROM bookings bk
    JOIN schedules s ON bk.schedule_id = s.id
    JOIN buses b ON s.bus_id = b.id
    JOIN users u ON bk.user_id = u.id
    WHERE bk.id = ?
");
$stmt->execute([$bookingId]);
$booking = $stmt->fetch();

jsonResponse(['booking' => $booking, 'message' => 'Booking created successfully'], 201);

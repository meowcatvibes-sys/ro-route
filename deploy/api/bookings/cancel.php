<?php
// Bookings — Cancel
require_once __DIR__ . '/../config.php';

$user = requireAuth();
$body = getBody();
$id = $body['id'] ?? 0;
if (!$id) jsonResponse(['error' => 'Booking ID required'], 400);

$db = getDB();
$stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
$stmt->execute([$id]);
$booking = $stmt->fetch();

if (!$booking) jsonResponse(['error' => 'Booking not found'], 404);

if ($user['role'] === 'passenger' && $booking['user_id'] != $user['id']) {
    jsonResponse(['error' => 'Forbidden'], 403);
}

if ($booking['status'] === 'cancelled') {
    jsonResponse(['error' => 'Booking is already cancelled'], 400);
}

$stmt = $db->prepare("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?");
$stmt->execute([$id]);

jsonResponse(['message' => 'Booking cancelled successfully']);

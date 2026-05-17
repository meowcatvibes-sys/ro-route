<?php
// Admin — Dashboard Stats
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();

$today = date('Y-m-d');

// Today's bookings
$stmt = $db->prepare("SELECT COUNT(*) AS count FROM bookings WHERE DATE(created_at) = ?");
$stmt->execute([$today]);
$todayBookings = $stmt->fetch()['count'];

// Today's revenue
$stmt = $db->prepare("SELECT COALESCE(SUM(amount_paid), 0) AS total FROM bookings WHERE DATE(created_at) = ? AND payment_status = 'paid'");
$stmt->execute([$today]);
$todayRevenue = $stmt->fetch()['total'];

// Active trips today
$stmt = $db->prepare("SELECT COUNT(*) AS count FROM schedules WHERE departure_date = ? AND status IN ('boarding', 'departed', 'in_transit')");
$stmt->execute([$today]);
$activeTrips = $stmt->fetch()['count'];

// Total registered users
$stmt = $db->query("SELECT COUNT(*) AS count FROM users WHERE role = 'passenger'");
$totalUsers = $stmt->fetch()['count'];

// Total buses
$stmt = $db->query("SELECT COUNT(*) AS count FROM buses WHERE status = 'active'");
$activeBuses = $stmt->fetch()['count'];

// Total drivers
$stmt = $db->query("SELECT COUNT(*) AS count FROM drivers WHERE status = 'active'");
$activeDrivers = $stmt->fetch()['count'];

// Recent bookings
$stmt = $db->query("
    SELECT bk.*, u.name AS passenger_name, s.route, s.departure_date
    FROM bookings bk
    JOIN users u ON bk.user_id = u.id
    JOIN schedules s ON bk.schedule_id = s.id
    ORDER BY bk.created_at DESC LIMIT 10
");
$recentBookings = $stmt->fetchAll();

// Today's trips
$stmt = $db->prepare("
    SELECT s.*, b.bus_name, u.name AS driver_name,
           (b.total_seats - COALESCE(booked.count, 0)) AS available_seats, b.total_seats
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN drivers d ON s.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
    WHERE s.departure_date = ?
    ORDER BY s.departure_time ASC
");
$stmt->execute([$today]);
$todayTrips = $stmt->fetchAll();

jsonResponse([
    'stats' => [
        'today_bookings' => (int)$todayBookings,
        'today_revenue' => (float)$todayRevenue,
        'active_trips' => (int)$activeTrips,
        'total_users' => (int)$totalUsers,
        'active_buses' => (int)$activeBuses,
        'active_drivers' => (int)$activeDrivers,
    ],
    'recent_bookings' => $recentBookings,
    'today_trips' => $todayTrips,
]);

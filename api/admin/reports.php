<?php
// Admin — Revenue Reports
require_once __DIR__ . '/../config.php';

$user = requireAuth(['admin']);
$db = getDB();

$range = $_GET['range'] ?? '7'; // days

// Daily revenue for the range
$stmt = $db->prepare("
    SELECT DATE(bk.created_at) AS date,
           COUNT(*) AS bookings,
           SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.amount_paid ELSE 0 END) AS revenue
    FROM bookings bk
    WHERE bk.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(bk.created_at)
    ORDER BY date ASC
");
$stmt->execute([(int)$range]);
$dailyRevenue = $stmt->fetchAll();

// Payment method breakdown
$stmt = $db->query("
    SELECT payment_method, COUNT(*) AS count,
           SUM(amount_paid) AS total
    FROM bookings
    WHERE payment_status = 'paid'
    GROUP BY payment_method
");
$paymentBreakdown = $stmt->fetchAll();

// Route breakdown
$stmt = $db->query("
    SELECT s.route, COUNT(bk.id) AS bookings,
           SUM(bk.amount_paid) AS revenue
    FROM bookings bk
    JOIN schedules s ON bk.schedule_id = s.id
    WHERE bk.payment_status = 'paid'
    GROUP BY s.route
");
$routeBreakdown = $stmt->fetchAll();

// Total stats
$stmt = $db->query("SELECT COUNT(*) AS total_bookings, SUM(CASE WHEN payment_status='paid' THEN amount_paid ELSE 0 END) AS total_revenue, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled FROM bookings");
$totals = $stmt->fetch();

// Bus type breakdown
$stmt = $db->query("
    SELECT b.bus_type, COUNT(bk.id) AS bookings, SUM(bk.amount_paid) AS revenue
    FROM bookings bk
    JOIN schedules s ON bk.schedule_id = s.id
    JOIN buses b ON s.bus_id = b.id
    WHERE bk.payment_status = 'paid'
    GROUP BY b.bus_type
");
$busTypeBreakdown = $stmt->fetchAll();

jsonResponse([
    'daily_revenue' => $dailyRevenue,
    'payment_breakdown' => $paymentBreakdown,
    'route_breakdown' => $routeBreakdown,
    'bus_type_breakdown' => $busTypeBreakdown,
    'totals' => $totals,
]);

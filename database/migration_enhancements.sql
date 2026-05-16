-- ============================================================
-- Ro-Route Database Enhancement Migration
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. LOGIN ATTEMPTS TABLE (Criteria #12 - Brute Force Protection)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    success TINYINT(1) DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ────────────────────────────────────────────────────────────
-- 2. SOFT DELETE COLUMNS (Criteria #8 - Data Archiving)
-- ────────────────────────────────────────────────────────────
ALTER TABLE buses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Index for faster filtering of non-deleted records
ALTER TABLE buses ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE drivers ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE schedules ADD INDEX idx_deleted_at (deleted_at);
ALTER TABLE announcements ADD INDEX idx_deleted_at (deleted_at);


-- ────────────────────────────────────────────────────────────
-- 3. ADDITIONAL INDEXES (Criteria #16 - Performance Optimization)
-- ────────────────────────────────────────────────────────────
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE bookings ADD INDEX idx_user_id (user_id);
ALTER TABLE bookings ADD INDEX idx_schedule_id (schedule_id);
ALTER TABLE bookings ADD INDEX idx_status (status);
ALTER TABLE bookings ADD INDEX idx_booking_ref (booking_ref);
ALTER TABLE schedules ADD INDEX idx_departure_date (departure_date);
ALTER TABLE schedules ADD INDEX idx_route (route);
ALTER TABLE schedules ADD INDEX idx_status (status);
ALTER TABLE user_tokens ADD INDEX idx_token (token);
ALTER TABLE user_tokens ADD INDEX idx_expires (expires_at);
ALTER TABLE audit_logs ADD INDEX idx_user_id (user_id);
ALTER TABLE audit_logs ADD INDEX idx_action (action);


-- ────────────────────────────────────────────────────────────
-- 4. DATABASE VIEWS (Criteria #18 - Reusable Query Logic)
-- ────────────────────────────────────────────────────────────

-- View 1: Booking Summary with passenger and schedule details
DROP VIEW IF EXISTS vw_booking_summary;
CREATE VIEW vw_booking_summary AS
SELECT 
    b.id,
    b.booking_ref,
    b.seat_number,
    b.amount_paid,
    b.payment_method,
    b.payment_status,
    b.status AS booking_status,
    b.created_at AS booked_at,
    u.name AS passenger_name,
    u.email AS passenger_email,
    u.phone AS passenger_phone,
    s.route,
    s.departure_date,
    s.departure_time,
    s.estimated_arrival,
    s.fare,
    s.status AS trip_status,
    bus.bus_name,
    bus.plate_number,
    bus.bus_type,
    d_user.name AS driver_name
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN buses bus ON s.bus_id = bus.id
LEFT JOIN drivers d ON s.driver_id = d.id
LEFT JOIN users d_user ON d.user_id = d_user.id;

-- View 2: Daily Revenue Summary
DROP VIEW IF EXISTS vw_daily_revenue;
CREATE VIEW vw_daily_revenue AS
SELECT 
    s.departure_date,
    s.route,
    COUNT(b.id) AS total_bookings,
    SUM(CASE WHEN b.status != 'cancelled' THEN b.amount_paid ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
    SUM(CASE WHEN b.payment_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
GROUP BY s.departure_date, s.route
ORDER BY s.departure_date DESC;

-- View 3: Schedule Details with bus, driver, and booking counts
DROP VIEW IF EXISTS vw_schedule_details;
CREATE VIEW vw_schedule_details AS
SELECT 
    s.id,
    s.route,
    s.departure_date,
    s.departure_time,
    s.estimated_arrival,
    s.fare,
    s.status,
    bus.bus_name,
    bus.plate_number,
    bus.bus_type,
    bus.total_seats,
    d_user.name AS driver_name,
    COALESCE(booked.count, 0) AS booked_seats,
    (bus.total_seats - COALESCE(booked.count, 0)) AS available_seats
FROM schedules s
JOIN buses bus ON s.bus_id = bus.id
LEFT JOIN drivers d ON s.driver_id = d.id
LEFT JOIN users d_user ON d.user_id = d_user.id
LEFT JOIN (
    SELECT schedule_id, COUNT(*) AS count 
    FROM bookings 
    WHERE status != 'cancelled' 
    GROUP BY schedule_id
) booked ON s.id = booked.schedule_id
WHERE s.deleted_at IS NULL;

-- View 4: Active Users Summary
DROP VIEW IF EXISTS vw_user_summary;
CREATE VIEW vw_user_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.role,
    u.is_active,
    u.created_at,
    COALESCE(booking_stats.total_bookings, 0) AS total_bookings,
    COALESCE(booking_stats.total_spent, 0) AS total_spent
FROM users u
LEFT JOIN (
    SELECT user_id, 
           COUNT(*) AS total_bookings, 
           SUM(amount_paid) AS total_spent
    FROM bookings 
    WHERE status != 'cancelled'
    GROUP BY user_id
) booking_stats ON u.id = booking_stats.user_id;


-- ────────────────────────────────────────────────────────────
-- 5. STORED PROCEDURES (Criteria #19)
-- ────────────────────────────────────────────────────────────

-- Stored Procedure 1: Get Dashboard Statistics
DROP PROCEDURE IF EXISTS sp_get_dashboard_stats;
DELIMITER //
CREATE PROCEDURE sp_get_dashboard_stats(IN p_date DATE)
BEGIN
    -- Today's bookings
    SELECT COUNT(*) AS todays_bookings
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE s.departure_date = p_date AND b.status != 'cancelled';

    -- Active trips
    SELECT COUNT(*) AS active_trips
    FROM schedules
    WHERE status IN ('boarding', 'departed', 'in_transit') AND deleted_at IS NULL;

    -- Total registered users
    SELECT COUNT(*) AS total_users FROM users WHERE is_active = 1;

    -- Today's revenue
    SELECT COALESCE(SUM(b.amount_paid), 0) AS todays_revenue
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE s.departure_date = p_date AND b.status != 'cancelled' AND b.payment_status = 'paid';
END //
DELIMITER ;

-- Stored Procedure 2: Cancel Booking with Audit Log
DROP PROCEDURE IF EXISTS sp_cancel_booking;
DELIMITER //
CREATE PROCEDURE sp_cancel_booking(
    IN p_booking_id INT,
    IN p_user_id INT,
    IN p_ip VARCHAR(45)
)
BEGIN
    DECLARE v_ref VARCHAR(50);
    
    -- Get booking reference
    SELECT booking_ref INTO v_ref FROM bookings WHERE id = p_booking_id;
    
    -- Update booking status
    UPDATE bookings 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE id = p_booking_id;
    
    -- Log the cancellation
    INSERT INTO audit_logs (user_id, action, description, ip_address)
    VALUES (p_user_id, 'booking_cancelled', CONCAT('Cancelled booking: ', v_ref), p_ip);
END //
DELIMITER ;

-- Stored Procedure 3: Generate Revenue Report
DROP PROCEDURE IF EXISTS sp_revenue_report;
DELIMITER //
CREATE PROCEDURE sp_revenue_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        s.departure_date,
        s.route,
        bus.bus_name,
        COUNT(b.id) AS total_bookings,
        SUM(CASE WHEN b.status != 'cancelled' THEN b.amount_paid ELSE 0 END) AS revenue,
        SUM(CASE WHEN b.payment_method = 'gcash' THEN 1 ELSE 0 END) AS gcash_count,
        SUM(CASE WHEN b.payment_method = 'maya' THEN 1 ELSE 0 END) AS maya_count,
        SUM(CASE WHEN b.payment_method = 'cash' THEN 1 ELSE 0 END) AS cash_count,
        SUM(CASE WHEN b.payment_method = 'bank' THEN 1 ELSE 0 END) AS bank_count
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    JOIN buses bus ON s.bus_id = bus.id
    WHERE s.departure_date BETWEEN p_start_date AND p_end_date
    GROUP BY s.departure_date, s.route, bus.bus_name
    ORDER BY s.departure_date DESC;
END //
DELIMITER ;


-- ────────────────────────────────────────────────────────────
-- 6. TRIGGERS (Criteria #19)
-- ────────────────────────────────────────────────────────────

-- Trigger 1: Auto-log when a new booking is created
DROP TRIGGER IF EXISTS trg_after_booking_insert;
DELIMITER //
CREATE TRIGGER trg_after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, description, ip_address, created_at)
    VALUES (
        NEW.user_id, 
        'booking_created', 
        CONCAT('New booking created: ', NEW.booking_ref, ' | Seat: ', NEW.seat_number, ' | Amount: ₱', NEW.amount_paid),
        NULL,
        NOW()
    );
END //
DELIMITER ;

-- Trigger 2: Auto-log when booking status changes
DROP TRIGGER IF EXISTS trg_after_booking_update;
DELIMITER //
CREATE TRIGGER trg_after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_logs (user_id, action, description, ip_address, created_at)
        VALUES (
            NEW.user_id,
            'booking_status_changed',
            CONCAT('Booking ', NEW.booking_ref, ' status changed: ', OLD.status, ' → ', NEW.status),
            NULL,
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- Trigger 3: Auto-log when schedule status changes (driver updates)
DROP TRIGGER IF EXISTS trg_after_schedule_update;
DELIMITER //
CREATE TRIGGER trg_after_schedule_update
AFTER UPDATE ON schedules
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_logs (user_id, action, description, ip_address, created_at)
        VALUES (
            NEW.driver_id,
            'trip_status_changed',
            CONCAT('Schedule #', NEW.id, ' status changed: ', OLD.status, ' → ', NEW.status),
            NULL,
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- ============================================================
-- Ro-Route: Roxas-Manila Integrated Travel Portal
-- Database Schema + Seed Data
-- ============================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS roroute_db;
USE roroute_db;

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('passenger', 'admin', 'driver') NOT NULL DEFAULT 'passenger',
    profile_photo VARCHAR(255) DEFAULT NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Drivers Table (extends user) ─────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Buses Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_name VARCHAR(50) NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    bus_type ENUM('aircon', 'non_aircon') NOT NULL DEFAULT 'aircon',
    total_seats INT NOT NULL DEFAULT 45,
    seat_layout JSON DEFAULT NULL,
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Schedules Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    route ENUM('roxas_to_manila', 'manila_to_roxas') NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    estimated_arrival TIME DEFAULT NULL,
    fare DECIMAL(10, 2) NOT NULL,
    status ENUM('scheduled', 'boarding', 'departed', 'in_transit', 'arrived', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Bookings Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    schedule_id INT NOT NULL,
    seat_number VARCHAR(5) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('gcash', 'maya', 'cash', 'bank') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    status ENUM('confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'confirmed',
    qr_code TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Announcements Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Audit Logs Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- SEED DATA
-- ============================================================
-- Passwords are hashed using bcrypt (all passwords below = 'password123')
-- For demo: using plain text marker, hash in Laravel later

-- ── Admin Users ──────────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin RoRoute', 'admin@roroute.com', '+639111111111', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Terminal Manager', 'manager@roroute.com', '+639111222333', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- ── Driver Users ─────────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role) VALUES
('Pedro Santos', 'pedro@roroute.com', '+639222333444', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('Carlos Reyes', 'carlos@roroute.com', '+639333444555', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('Ramon Dela Cruz', 'ramon@roroute.com', '+639444555666', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('Miguel Lopez', 'miguel@roroute.com', '+639555666777', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver');

-- ── Passenger Users ──────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role) VALUES
('Juan Dela Cruz', 'juan@email.com', '+639123456789', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger'),
('Maria Santos', 'maria@email.com', '+639234567890', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger'),
('Ana Reyes', 'ana@email.com', '+639345678901', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger'),
('Jose Garcia', 'jose@email.com', '+639456789012', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger'),
('Rosa Cruz', 'rosa@email.com', '+639567890123', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger');

-- ── Driver Profiles ──────────────────────────────────────────
INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES
(3, 'N06-12-345678', '2028-06-15', 'active'),
(4, 'N06-12-456789', '2027-11-20', 'active'),
(5, 'N06-12-567890', '2028-03-10', 'active'),
(6, 'N06-12-678901', '2027-09-25', 'active');

-- ── Buses ────────────────────────────────────────────────────
INSERT INTO buses (bus_name, plate_number, bus_type, total_seats, status) VALUES
('RR-Bus 01', 'ABC-1234', 'aircon', 45, 'active'),
('RR-Bus 02', 'DEF-5678', 'non_aircon', 45, 'active'),
('RR-Bus 03', 'GHI-9012', 'aircon', 45, 'active'),
('RR-Bus 04', 'JKL-3456', 'aircon', 45, 'active'),
('RR-Bus 05', 'MNO-7890', 'non_aircon', 45, 'active'),
('RR-Bus 06', 'PQR-1122', 'aircon', 45, 'maintenance'),
('RR-Bus 07', 'STU-3344', 'aircon', 45, 'active');

-- ── Schedules ────────────────────────────────────────────────
INSERT INTO schedules (bus_id, driver_id, route, departure_date, departure_time, estimated_arrival, fare, status) VALUES
(1, 1, 'roxas_to_manila', '2026-05-15', '06:00:00', '18:00:00', 850.00, 'in_transit'),
(2, 2, 'roxas_to_manila', '2026-05-15', '08:00:00', '20:00:00', 650.00, 'boarding'),
(3, 3, 'roxas_to_manila', '2026-05-15', '12:00:00', '00:00:00', 850.00, 'scheduled'),
(4, 4, 'manila_to_roxas', '2026-05-15', '07:00:00', '19:00:00', 850.00, 'departed'),
(5, 1, 'manila_to_roxas', '2026-05-15', '09:30:00', '21:30:00', 650.00, 'scheduled'),
(1, 2, 'roxas_to_manila', '2026-05-16', '06:00:00', '18:00:00', 850.00, 'scheduled'),
(3, 3, 'manila_to_roxas', '2026-05-16', '07:00:00', '19:00:00', 850.00, 'scheduled'),
(7, 4, 'roxas_to_manila', '2026-05-16', '12:00:00', '00:00:00', 900.00, 'scheduled'),
(4, 1, 'manila_to_roxas', '2026-05-17', '06:00:00', '18:00:00', 850.00, 'scheduled'),
(2, 2, 'roxas_to_manila', '2026-05-17', '08:00:00', '20:00:00', 650.00, 'scheduled');

-- ── Bookings ─────────────────────────────────────────────────
INSERT INTO bookings (booking_ref, user_id, schedule_id, seat_number, amount_paid, payment_method, payment_status, status) VALUES
('RR-20260515-001', 7, 1, '1A', 850.00, 'gcash', 'paid', 'confirmed'),
('RR-20260515-002', 8, 1, '1B', 850.00, 'maya', 'paid', 'confirmed'),
('RR-20260515-003', 9, 1, '2A', 850.00, 'cash', 'paid', 'confirmed'),
('RR-20260515-004', 10, 2, '5B', 650.00, 'gcash', 'paid', 'confirmed'),
('RR-20260515-005', 11, 2, '8C', 650.00, 'cash', 'pending', 'confirmed'),
('RR-20260515-006', 7, 4, '3A', 850.00, 'maya', 'paid', 'confirmed'),
('RR-20260515-007', 8, 3, '12A', 850.00, 'gcash', 'paid', 'confirmed'),
('RR-20260515-008', 11, 5, '10D', 650.00, 'cash', 'paid', 'cancelled');

-- ── Announcements ────────────────────────────────────────────
INSERT INTO announcements (admin_id, title, content, is_active) VALUES
(1, 'Welcome to Ro-Route!', 'We are excited to launch the Ro-Route Integrated Travel Portal. Book your bus trips between Roxas City, Capiz and Manila online with ease. Enjoy hassle-free travel!', 1),
(1, 'Holiday Schedule Advisory', 'Please be advised that additional trips will be available during the upcoming holiday season (May 25 - June 1). Book early to secure your preferred seats!', 1),
(1, 'New Aircon Buses Added', 'We have added two brand new aircon buses to our fleet for a more comfortable travel experience. Available starting May 20, 2026.', 1),
(2, 'Terminal Maintenance Notice', 'The Roxas City Bus Terminal will undergo maintenance on May 18, 2026 from 10PM to 6AM. All scheduled trips remain unaffected.', 1);


-- ============================================================
-- VERIFY DATA
-- ============================================================
SELECT '--- USERS ---' AS '';
SELECT id, name, email, role FROM users;

SELECT '--- DRIVERS ---' AS '';
SELECT d.id, u.name, d.license_number, d.status 
FROM drivers d JOIN users u ON d.user_id = u.id;

SELECT '--- BUSES ---' AS '';
SELECT id, bus_name, plate_number, bus_type, total_seats, status FROM buses;

SELECT '--- SCHEDULES ---' AS '';
SELECT s.id, b.bus_name, u.name AS driver, s.route, s.departure_date, s.departure_time, s.fare, s.status
FROM schedules s 
JOIN buses b ON s.bus_id = b.id 
JOIN drivers d ON s.driver_id = d.id
JOIN users u ON d.user_id = u.id;

SELECT '--- BOOKINGS ---' AS '';
SELECT bk.booking_ref, u.name AS passenger, bk.seat_number, bk.amount_paid, bk.payment_method, bk.status
FROM bookings bk JOIN users u ON bk.user_id = u.id;

SELECT '--- ANNOUNCEMENTS ---' AS '';
SELECT id, title, is_active FROM announcements;

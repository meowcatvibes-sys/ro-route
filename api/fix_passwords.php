<?php
// Fix all passwords to 'password123'
$pdo = new PDO('mysql:host=localhost;dbname=roroute_db;charset=utf8mb4', 'root', '');
$hash = password_hash('password123', PASSWORD_DEFAULT);

$stmt = $pdo->prepare("UPDATE users SET password = ?");
$stmt->execute([$hash]);

// Verify
$stmt = $pdo->query("SELECT id, email, password FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Password Fix Results</h2>";
echo "<p>New hash: <code>$hash</code></p>";
echo "<p>Verify 'password123': <strong>" . (password_verify('password123', $hash) ? 'PASS ✅' : 'FAIL ❌') . "</strong></p>";
echo "<table border='1' cellpadding='5'><tr><th>ID</th><th>Email</th><th>Verify</th></tr>";
foreach ($users as $u) {
    $ok = password_verify('password123', $u['password']) ? '✅' : '❌';
    echo "<tr><td>{$u['id']}</td><td>{$u['email']}</td><td>$ok</td></tr>";
}
echo "</table>";
echo "<p><strong>Done! All passwords are now 'password123'</strong></p>";

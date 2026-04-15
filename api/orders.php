<?php
// ============================================================
//  api/orders.php  —  Place, list, void transactions
//
//  POST  ?action=place   → create a new transaction
//  GET   ?action=list    → paginated transaction history
//  GET   ?action=get&id= → single transaction with items
//  POST  ?action=void&id=→ void a transaction
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

$action = $_GET['action'] ?? 'list';

// ── PLACE ORDER ──────────────────────────────────────────────
if ($action === 'place') {
    $user      = requireAuth();
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];

    $items          = $body['items']          ?? [];
    $order_type     = $body['order_type']     ?? 'Dine-in';
    $payment_method = $body['payment_method'] ?? 'Cash';
    $subtotal       = (float)($body['subtotal']        ?? 0);
    $discount       = (float)($body['discount']        ?? 0);
    $coupon_discount = (float)($body['coupon_discount'] ?? 0);
    $total          = (float)($body['total']           ?? 0);
    $customer_id    = $body['customer_id'] ?? null;

    if (empty($items)) {
        respond(['success' => false, 'error' => 'Cart is empty.'], 400);
    }

    // Generate unique reference  e.g. LUNA-A3F9
    $ref = 'LUNA-' . strtoupper(substr(md5(uniqid('', true)), 0, 6));

    $pdo->beginTransaction();
    try {
        // Insert transaction header
        $stmt = $pdo->prepare(
            "INSERT INTO transactions
               (reference_no, branch_id, user_id, order_type, payment_method,
                subtotal, discount, coupon_discount, total, customer_id)
             VALUES (?,?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $ref,
            $user['branch_id'],
            $user['id'],
            $order_type,
            $payment_method,
            $subtotal,
            $discount,
            $coupon_discount,
            $total,
            $customer_id ?: null,
        ]);
        $txnId = $pdo->lastInsertId();

        // Insert each line item + deduct stock
        $lineStmt = $pdo->prepare(
            "INSERT INTO transaction_items
               (transaction_id, product_id, product_name, unit_price, quantity, line_total)
             VALUES (?,?,?,?,?,?)"
        );
        $stockStmt = $pdo->prepare(
            "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?"
        );

        foreach ($items as $item) {
            $prodId   = (int)($item['product_id'] ?? 0);
            $qty      = (int)($item['quantity']   ?? 1);
            $price    = (float)($item['price']    ?? 0);
            $prodName = $item['name'] ?? '';

            $lineStmt->execute([$txnId, $prodId ?: null, $prodName, $price, $qty, $price * $qty]);

            // Deduct stock only if we have a known product_id
            if ($prodId) {
                $stockStmt->execute([$qty, $prodId]);
            }
        }

        // Update customer stats if linked
        if ($customer_id) {
            $pdo->prepare(
                "UPDATE customers SET visits = visits + 1,
                    total_spent = total_spent + ?,
                    last_visit  = CURDATE()
                 WHERE id = ?"
            )->execute([$total, $customer_id]);
        }

        $pdo->commit();
        respond(['success' => true, 'reference_no' => $ref, 'transaction_id' => $txnId]);

    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// ── LIST TRANSACTIONS ────────────────────────────────────────
if ($action === 'list') {
    requireAuth();

    $date      = $_GET['date']      ?? '';
    $branchId  = $_GET['branch_id'] ?? '';
    $page      = max(1, (int)($_GET['page'] ?? 1));
    $limit     = 50;
    $offset    = ($page - 1) * $limit;

    $sql    = "SELECT t.*, u.first_name, u.last_name, b.name AS branch_name
               FROM transactions t
               LEFT JOIN users    u ON t.user_id    = u.id
               LEFT JOIN branches b ON t.branch_id  = b.id
               WHERE 1=1";
    $params = [];

    if ($date) {
        $sql .= " AND DATE(t.created_at) = ?";
        $params[] = $date;
    }
    if ($branchId) {
        $sql .= " AND t.branch_id = ?";
        $params[] = (int)$branchId;
    }

    // Total count for pagination
    $countStmt = $pdo->prepare(str_replace('SELECT t.*, u.first_name, u.last_name, b.name AS branch_name', 'SELECT COUNT(*)', $sql));
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $sql .= " ORDER BY t.created_at DESC LIMIT $limit OFFSET $offset";
    $stmt  = $pdo->prepare($sql);
    $stmt->execute($params);

    respond([
        'success' => true,
        'data'    => $stmt->fetchAll(),
        'total'   => (int)$total,
        'page'    => $page,
        'pages'   => ceil($total / $limit),
    ]);
}

// ── GET SINGLE TRANSACTION ───────────────────────────────────
if ($action === 'get') {
    requireAuth();
    $id = (int)($_GET['id'] ?? 0);

    $stmt = $pdo->prepare(
        "SELECT t.*, u.first_name, u.last_name, b.name AS branch_name
         FROM transactions t
         LEFT JOIN users    u ON t.user_id   = u.id
         LEFT JOIN branches b ON t.branch_id = b.id
         WHERE t.id = ?"
    );
    $stmt->execute([$id]);
    $txn = $stmt->fetch();
    if (!$txn) respond(['success' => false, 'error' => 'Transaction not found.'], 404);

    $items = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
    $items->execute([$id]);
    $txn['items'] = $items->fetchAll();

    respond(['success' => true, 'data' => $txn]);
}

// ── VOID ─────────────────────────────────────────────────────
if ($action === 'void') {
    requireAuth();
    $id = (int)($_GET['id'] ?? 0);

    // Restore stock
    $items = $pdo->prepare("SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?");
    $items->execute([$id]);
    foreach ($items->fetchAll() as $item) {
        if ($item['product_id']) {
            $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")
                ->execute([$item['quantity'], $item['product_id']]);
        }
    }

    $pdo->prepare("UPDATE transactions SET status = 'voided' WHERE id = ?")->execute([$id]);
    respond(['success' => true, 'message' => 'Transaction voided and stock restored.']);
}

respond(['success' => false, 'error' => 'Unknown action.'], 400);

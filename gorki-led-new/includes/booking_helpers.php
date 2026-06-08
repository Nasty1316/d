<?php

const MAX_BOOKING_USERS = 200;

function booking_facilities() {
    return [
        'ice' => ['label' => 'Ледовая арена', 'duration' => 60],
        'gym' => ['label' => 'Спортивный зал', 'duration' => 90],
        'stadium' => ['label' => 'Стадион', 'duration' => 120],
        'fitness' => ['label' => 'Тренажёрный зал / фитнес', 'duration' => 60],
        'other' => ['label' => 'Другое / уточнить в сообщении', 'duration' => 60],
    ];
}

function booking_clean_str($v, $max = 2000) {
    $v = trim(strip_tags((string) $v));
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max);
    }
    return substr($v, 0, $max);
}

function booking_time_to_minutes($time) {
    $parts = explode(':', (string) $time);
    $h = isset($parts[0]) ? (int) $parts[0] : 0;
    $m = isset($parts[1]) ? (int) $parts[1] : 0;
    return $h * 60 + $m;
}

function booking_ranges_overlap($start1, $dur1, $start2, $dur2) {
    $end1 = $start1 + $dur1;
    $end2 = $start2 + $dur2;
    return $start1 < $end2 && $start2 < $end1;
}

function booking_normalize_time($time) {
    $time = trim((string) $time);
    if (preg_match('/^\d{1,2}:\d{2}$/', $time)) {
        $parts = explode(':', $time);
        return sprintf('%02d:%02d', (int) $parts[0], (int) $parts[1]);
    }
    return '';
}

function booking_get_max_users($db) {
    $row = $db->fetch("SELECT value FROM settings WHERE key = 'max_booking_users'");
    if ($row && is_numeric($row['value'])) {
        return max(1, (int) $row['value']);
    }
    return MAX_BOOKING_USERS;
}

function booking_count_registered_users($db) {
    return $db->count('users', "role = 'user' AND is_active = 1");
}

function booking_validate_time($time) {
    $normalized = booking_normalize_time($time);
    if ($normalized === '') {
        return false;
    }
    $mins = booking_time_to_minutes($normalized);
    return $mins >= 9 * 60 && $mins <= 23 * 60;
}

function booking_find_conflicts($db, $facility, $date, $startTime, $durationMinutes, $excludeId = null) {
    $params = [
        'facility' => $facility,
        'date' => $date,
    ];
    $sql = "SELECT id, start_time, duration_minutes FROM bookings
            WHERE facility = :facility AND booking_date = :date AND status = 'confirmed'";
    if ($excludeId !== null) {
        $sql .= ' AND id != :exclude_id';
        $params['exclude_id'] = $excludeId;
    }
    $existing = $db->fetchAll($sql, $params);
    $startMin = booking_time_to_minutes($startTime);
    foreach ($existing as $row) {
        $otherStart = booking_time_to_minutes($row['start_time']);
        $otherDur = (int) $row['duration_minutes'];
        if (booking_ranges_overlap($startMin, $durationMinutes, $otherStart, $otherDur)) {
            return $row;
        }
    }
    return null;
}

function booking_migrate_user_phone($db) {
    $cols = $db->fetchAll("PRAGMA table_info(users)");
    $hasPhone = false;
    foreach ($cols as $col) {
        if ($col['name'] === 'phone') {
            $hasPhone = true;
            break;
        }
    }
    if (!$hasPhone) {
        $db->query('ALTER TABLE users ADD COLUMN phone VARCHAR(40)');
    }
}

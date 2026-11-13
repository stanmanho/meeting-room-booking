-- 2026-06 預約加上會議名稱；取消改成軟刪除，保留紀錄給計費對帳
ALTER TABLE bookings ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMPTZ;

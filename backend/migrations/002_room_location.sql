-- 2026-03 東京辦公室開幕：會議室要記錄所在地與時區
ALTER TABLE rooms ADD COLUMN location TEXT NOT NULL DEFAULT '台北';
ALTER TABLE rooms ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Taipei';

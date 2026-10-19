-- Migration: Tambah kolom untuk integrasi Pakasir
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom payment_method
--    'manual_transfer' = default (alur lama: upload bukti + verifikasi admin)
--    'pakasir_qris'    = bayar via QRIS Pakasir (konfirmasi otomatis via webhook)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'manual_transfer';

-- 2. Tambah kolom untuk menyimpan response dari Pakasir API
--    Isi contoh:
--    {
--      "payment_number": "<qris_string>",
--      "fee": 1003,
--      "total_payment": 101003,
--      "expired_at": "2025-09-19T01:18:49Z",
--      "payment_method": "qris"
--    }
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS pakasir_data JSONB;

-- 3. Index untuk lookup by invoice_id (dipakai webhook & serverless)
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id
  ON transactions(invoice_id);

-- 4. Index untuk filter by payment_method di admin panel
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
  ON transactions(payment_method);

-- schema.sql: struktur database aplikasimu (Postgres).
-- Database dibangun ulang dari berkas ini setiap pratinjau dan setiap uji.

-- Minggu 2 · Rapikan tabel transaksi:
-- tambahkan NOT NULL dan CHECK supaya data yang salah ditolak database.
CREATE TABLE transaksi (
  id SERIAL PRIMARY KEY,
  tanggal DATE,
  keterangan TEXT,
  jumlah INTEGER,
  jenis TEXT
);

-- Minggu 7 · Tambahkan tabel kategori, lalu kolom kategori_id pada tabel
-- transaksi yang merujuk ke kategori(id).

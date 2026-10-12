-- seed.sql: contoh data untuk pratinjau. Ganti dengan catatanmu sendiri.
INSERT INTO transaksi (tanggal, keterangan, jumlah, jenis) VALUES
  ('2026-10-01', 'Uang saku', 1500000, 'masuk'),
  ('2026-10-02', 'Makan siang', 18000, 'keluar'),
  ('2026-10-03', 'Bensin motor', 25000, 'keluar'),
  ('2026-10-05', 'Kuota internet', 75000, 'keluar');

-- Minggu 7 · Setelah tabel kategori dibuat, isi kategorinya lalu tautkan
-- transaksi, misalnya:
-- INSERT INTO kategori (nama) VALUES ('Makan'), ('Transport'), ('Kuota');
-- UPDATE transaksi SET kategori_id = 1 WHERE keterangan = 'Makan siang';

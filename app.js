// ==============================================================
//  Catatan Keuangan: berkas yang kamu kerjakan setiap minggu.
//  Kerjakan fungsi bertanda "Minggu N" pada minggu itu. Pratinjau di
//  kanan memakai database Postgres yang dibangun dari schema.sql dan
//  seed.sql, jadi perubahanmu langsung terlihat.
// ==============================================================

// ---- Pengaturan (ganti dengan milikmu) ----
let namaPemilik = "Nama Kamu";
let anggaran = { Makan: 600000, Transport: 200000, Kuota: 100000 };

// Minggu 1 · Tampilkan saldo dalam Rupiah
function formatRupiah(angka) {
  const negatif = angka < 0;
  const absolut = Math.abs(angka);
  const diformat = absolut.toLocaleString("id-ID");
  return negatif ? "-Rp " + diformat : "Rp " + diformat;
}

// Minggu 2 · Ambil daftar transaksi (rapikan juga schema.sql)
async function daftarTransaksi(db) {
  const hasil = await db.query("SELECT * FROM transaksi");
  return hasil.rows; // urutkan dari tanggal paling lama
}

// Minggu 3 · Bungkus transaksi dalam class
class Transaksi {
  constructor(data) {
    this.id = data.id;
    this.tanggal = data.tanggal;
    this.keterangan = data.keterangan;
    this.jumlah = data.jumlah;
    this.jenis = data.jenis;
  }

  nilai() {
    return this.jumlah; // pengeluaran seharusnya bernilai negatif
  }
}

// Minggu 4 · Hitung saldo
function hitungSaldo(daftar) {
  let saldo = 0;
  for (let i = 1; i < daftar.length; i++) {
    saldo += daftar[i].jumlah;
  }
  return saldo; // periksa awal perulangan dan pakai nilai() dari class Transaksi
}

// Minggu 5 · Simpan transaksi dari formulir
async function tambahTransaksi(db, data) {
  const hasil = await db.query(
    "INSERT INTO transaksi (tanggal, keterangan, jumlah, jenis) VALUES ('" +
      data.tanggal + "', '" + data.keterangan + "', " + data.jumlah + ", '" + data.jenis + "') RETURNING id"
  );
  return hasil.rows[0].id; // keterangan yang berisi tanda petik merusak query ini
}

// Minggu 6 · Periksa isian formulir
function validasiTransaksi(data) {
  const galat = [];
  if (data.keterangan === "") galat.push("Keterangan wajib diisi");
  return galat; // periksa juga tanggal, jumlah, dan jenis
}

// Minggu 7 · Tampilkan kategori (tambahkan tabel kategori di schema.sql)
async function transaksiDenganKategori(db) {
  const hasil = await db.query("SELECT keterangan FROM transaksi ORDER BY tanggal, id");
  return hasil.rows; // sertakan nama kategori, atau "Tanpa kategori"
}

// Minggu 8 · Total pengeluaran per kategori
async function totalPerKategori(db) {
  const hasil = await db.query(
    "SELECT k.nama AS kategori, SUM(t.jumlah) AS total FROM transaksi t JOIN kategori k ON k.id = t.kategori_id GROUP BY k.nama"
  );
  return hasil.rows; // hanya pengeluaran, urut dari total terbesar
}

// Minggu 9 · Urutkan tabel transaksi
function urutkanTransaksi(daftar, kolom, arah) {
  return daftar.sort((a, b) => a[kolom] - b[kolom]); // jangan ubah daftar asli; dukung teks dan arah "turun"
}

// Minggu 10 · Cari transaksi
function cariTransaksi(daftar, kata) {
  return daftar.filter(t => t.keterangan == kata); // cari sebagian kata, tanpa peduli huruf besar/kecil
}

// Minggu 11 · Batalkan aksi terakhir
class RiwayatAksi {
  constructor() {
    this.tumpukan = [];
  }

  catat(aksi) {
    this.tumpukan.push(aksi);
  }

  batalkan() {
    return this.tumpukan.shift(); // yang dibatalkan seharusnya aksi terakhir; bila kosong kembalikan null
  }

  jumlah() {
    return this.tumpukan.length;
  }
}

// Minggu 12 · Laporan bulanan
async function ringkasanBulanan(db, tahun, bulan) {
  const hasil = await db.query(
    "SELECT jenis, SUM(jumlah) AS total FROM transaksi WHERE EXTRACT(MONTH FROM tanggal) = $1 GROUP BY jenis",
    [bulan]
  );
  return hasil.rows; // kembalikan { masuk, keluar, saldo } untuk tahun dan bulan itu
}

// Minggu 13 · Pemasukan dan pengeluaran sebagai class turunan
class Pemasukan extends Transaksi {
  label() {
    return "Pemasukan";
  }
}

class Pengeluaran extends Transaksi {
  label() {
    return "Pengeluaran";
  }
}

function buatTransaksi(data) {
  return new Transaksi(data); // kembalikan Pemasukan atau Pengeluaran sesuai jenisnya
}

// Minggu 14 · Peringatan anggaran
function cekAnggaran(totalKategori, anggaran) {
  const lewat = [];
  for (const baris of totalKategori) {
    const batas = anggaran[baris.kategori];
    if (baris.total >= batas) lewat.push({ kategori: baris.kategori, lebih: baris.total - batas });
  }
  return lewat; // hanya yang benar-benar melebihi, urut dari kelebihan terbesar
}

// Minggu 15 · Ekspor ke CSV
function eksporCSV(daftar) {
  const baris = daftar.map(t => [t.tanggal, t.keterangan, t.jenis, t.jumlah].join(","));
  return baris.join("\n"); // tambahkan baris judul dan amankan keterangan yang berisi koma atau petik
}

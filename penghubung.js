/* penghubung.js: disediakan dosen, tidak perlu diubah.
   Menyiapkan database dari schema.sql dan seed.sql, lalu menghubungkan
   fungsi di app.js dengan halaman. */
(function () {
  function $(pilihan) { return document.querySelector(pilihan); }
  function esc(teks) {
    return String(teks == null ? '' : teks).replace(/[&<>"']/g, function (h) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[h];
    });
  }
  function galat(pesan) { if (window.tampilkanGalat) window.tampilkanGalat(pesan); else console.error(pesan); }
  function ada(nama) { try { return typeof eval(nama) === 'function'; } catch (e) { return false; } }
  function ambil(nama) { try { return eval(nama); } catch (e) { return undefined; } }
  async function panggil(nama, args, cadangan) {
    var fn = ambil(nama);
    if (typeof fn !== 'function') return cadangan;
    try { return await fn.apply(null, args); }
    catch (e) { galat('Fungsi ' + nama + ': ' + (e && e.message ? e.message : e)); return cadangan; }
  }
  function rupiah(n) {
    var fn = ambil('formatRupiah');
    if (typeof fn === 'function') { try { var h = fn(n); if (typeof h === 'string') return h; } catch (e) {} }
    return 'Rp ' + n;
  }
  function tanggalTeks(t) {
    if (t instanceof Date) return t.toISOString().slice(0, 10);
    return t == null ? '' : String(t);
  }
  function objek(baris) {
    var buat = ambil('buatTransaksi');
    try { if (typeof buat === 'function') { var o = buat(baris); if (o) return o; } } catch (e) {}
    var K = ambil('Transaksi');
    try { if (typeof K === 'function') return new K(baris); } catch (e) {}
    return baris;
  }
  function nilaiDari(o) {
    try { if (o && typeof o.nilai === 'function') return o.nilai(); } catch (e) {}
    return o && o.jenis === 'keluar' ? -o.jumlah : o ? o.jumlah : 0;
  }

  var db = null;
  var semua = [];
  var urut = { kolom: null, arah: 'naik' };
  var riwayat = null;
  try { var R = ambil('RiwayatAksi'); if (typeof R === 'function') riwayat = new R(); } catch (e) {}

  async function muatKategori() {
    var pilih = $('#isi-kategori');
    if (!pilih) return;
    try {
      var r = await db.query('SELECT id, nama FROM kategori ORDER BY nama');
      pilih.innerHTML = '<option value="">Tanpa kategori</option>' + r.rows.map(function (k) { return '<option value="' + esc(k.id) + '">' + esc(k.nama) + '</option>'; }).join('');
    } catch (e) { pilih.innerHTML = '<option value="">Tanpa kategori</option>'; }
  }

  async function muat() {
    var daftar = await panggil('daftarTransaksi', [db], null);
    if (!Array.isArray(daftar)) {
      try { daftar = (await db.query('SELECT * FROM transaksi ORDER BY id')).rows; } catch (e) { daftar = []; }
    }
    var kat = ada('transaksiDenganKategori') ? await panggil('transaksiDenganKategori', [db], null) : null;
    semua = daftar.map(function (b, i) {
      var k = Array.isArray(kat) && kat[i] && kat[i].kategori ? kat[i].kategori : '';
      return Object.assign({}, b, { namaKategori: k });
    });
    var objekSemua = semua.map(objek);
    var saldo = await panggil('hitungSaldo', [objekSemua], 0);
    $('#saldo').textContent = rupiah(saldo);
    tampilkanTabel();
    await tampilkanKategori();
    await tampilkanLaporan();
  }

  function tampilkanTabel() {
    var isi = semua;
    var q = $('#cari') ? $('#cari').value : '';
    if (q && ada('cariTransaksi')) { try { var c = ambil('cariTransaksi')(isi, q); if (Array.isArray(c)) isi = c; } catch (e) { galat('Fungsi cariTransaksi: ' + e.message); } }
    if (urut.kolom && ada('urutkanTransaksi')) { try { var u = ambil('urutkanTransaksi')(isi.slice(), urut.kolom, urut.arah); if (Array.isArray(u)) isi = u; } catch (e) { galat('Fungsi urutkanTransaksi: ' + e.message); } }
    $('#isi-tabel').innerHTML = isi.length ? isi.map(function (b) {
      var o = objek(b);
      var label = '';
      try { if (o && typeof o.label === 'function') label = ' <span class="kecil">' + esc(o.label()) + '</span>'; } catch (e) {}
      var n = nilaiDari(o);
      return '<tr><td>' + esc(tanggalTeks(b.tanggal)) + '</td><td>' + esc(b.keterangan) + label + '</td><td>' + esc(b.namaKategori || '-') +
        '</td><td class="angka ' + (n < 0 ? 'keluar' : 'masuk') + '">' + esc(rupiah(n)) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="kecil">Belum ada transaksi.</td></tr>';
  }

  async function tampilkanKategori() {
    var ul = $('#per-kategori');
    var total = ada('totalPerKategori') ? await panggil('totalPerKategori', [db], null) : null;
    if (!Array.isArray(total)) { ul.innerHTML = '<li class="kecil">Muncul setelah tabel kategori dibuat (minggu 7–8).</li>'; $('#peringatan').innerHTML = ''; return; }
    ul.innerHTML = total.length ? total.map(function (t) { return '<li><span>' + esc(t.kategori) + '</span><strong>' + esc(rupiah(Number(t.total))) + '</strong></li>'; }).join('') : '<li class="kecil">Belum ada pengeluaran berkategori.</li>';
    var lewat = ada('cekAnggaran') ? await panggil('cekAnggaran', [total, ambil('anggaran') || {}], []) : [];
    $('#peringatan').innerHTML = Array.isArray(lewat) ? lewat.map(function (l) { return '<li>⚠ ' + esc(l.kategori) + ' melebihi anggaran ' + esc(rupiah(l.lebih)) + '</li>'; }).join('') : '';
  }

  async function tampilkanLaporan() {
    var nilai = $('#pilih-bulan').value;
    if (!nilai) return;
    var bagian = nilai.split('-');
    var r = ada('ringkasanBulanan') ? await panggil('ringkasanBulanan', [db, Number(bagian[0]), Number(bagian[1])], null) : null;
    if (!r || Array.isArray(r)) { $('#laporan').innerHTML = '<dt class="kecil">Muncul setelah ringkasanBulanan selesai (minggu 12).</dt><dd></dd>'; return; }
    $('#laporan').innerHTML = '<dt>Pemasukan</dt><dd class="masuk">' + esc(rupiah(r.masuk)) + '</dd><dt>Pengeluaran</dt><dd class="keluar">' + esc(rupiah(r.keluar)) +
      '</dd><dt><strong>Saldo</strong></dt><dd><strong>' + esc(rupiah(r.saldo)) + '</strong></dd>';
  }

  async function simpan(e) {
    e.preventDefault();
    var data = {
      tanggal: $('#isi-tanggal').value,
      keterangan: $('#isi-keterangan').value,
      jumlah: $('#isi-jumlah').value,
      jenis: $('#isi-jenis').value,
    };
    var galat = await panggil('validasiTransaksi', [data], []);
    var ul = $('#pesan-form');
    if (Array.isArray(galat) && galat.length) { ul.innerHTML = galat.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join(''); return; }
    ul.innerHTML = '';
    data.keterangan = data.keterangan.trim();
    data.jumlah = Number(data.jumlah);
    var id;
    try { id = await ambil('tambahTransaksi')(db, data); }
    catch (err) { ul.innerHTML = '<li>Database menolak: ' + esc(err && err.message ? err.message : err) + '</li>'; return; }
    var kat = $('#isi-kategori').value;
    if (kat && id != null) { try { await db.query('UPDATE transaksi SET kategori_id = $1 WHERE id = $2', [Number(kat), id]); } catch (err) {} }
    if (riwayat && id != null) { try { riwayat.catat({ jenis: 'tambah', id: id }); } catch (err) {} }
    $('#isi-keterangan').value = '';
    $('#isi-jumlah').value = '';
    await muat();
  }

  async function batalkan() {
    if (!riwayat) return;
    var aksi = null;
    try { aksi = riwayat.batalkan(); } catch (e) { galat('RiwayatAksi.batalkan: ' + e.message); }
    if (aksi && aksi.id != null) { await db.query('DELETE FROM transaksi WHERE id = $1', [aksi.id]); await muat(); }
  }

  async function mulai() {
    var nama = ambil('namaPemilik');
    if (nama) $('#pemilik').textContent = nama;
    var hariIni = new Date().toISOString().slice(0, 10);
    $('#isi-tanggal').value = hariIni;
    $('#pilih-bulan').value = hariIni.slice(0, 7);
    var status = $('#status-db');
    try {
      var PG = (await import("https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js")).PGlite;
      db = new PG();
      await db.waitReady;
    } catch (e) {
      status.textContent = 'Database belum dapat dimuat. Periksa koneksi internet.';
      return;
    }
    // Di luar platform (proyek diunduh), baca schema.sql dan seed.sql dari folder yang sama.
    if (typeof window.__SKEMA__ !== 'string') {
      try { window.__SKEMA__ = await (await fetch('schema.sql')).text(); window.__DATA__ = await (await fetch('seed.sql')).text(); }
      catch (e) { status.textContent = 'schema.sql tidak dapat dibaca. Jalankan proyek lewat server lokal, bukan file://.'; return; }
    }
    try { await db.exec(window.__SKEMA__ || ''); }
    catch (e) { status.textContent = ''; galat('schema.sql: ' + e.message); return; }
    try { await db.exec(window.__DATA__ || ''); }
    catch (e) { galat('seed.sql: ' + e.message); }
    status.textContent = '';
    status.hidden = true;
    await muatKategori();
    await muat();
  }

  $('#form-transaksi').addEventListener('submit', simpan);
  $('#tombol-batal').addEventListener('click', batalkan);
  $('#cari').addEventListener('input', tampilkanTabel);
  $('#pilih-bulan').addEventListener('change', tampilkanLaporan);
  document.querySelectorAll('th button[data-kolom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-kolom');
      urut.arah = urut.kolom === k && urut.arah === 'naik' ? 'turun' : 'naik';
      urut.kolom = k;
      tampilkanTabel();
    });
  });
  $('#tombol-ekspor').addEventListener('click', async function () {
    var csv = await panggil('eksporCSV', [semua], '');
    $('#hasil-ekspor').value = typeof csv === 'string' ? csv : '';
  });
  mulai();
})();

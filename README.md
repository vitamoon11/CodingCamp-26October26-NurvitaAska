# Expense & Budget Visualizer — pocketwise

Aplikasi web pencatat pengeluaran harian yang dibuat dengan HTML, CSS, dan Vanilla JavaScript.

## Fitur wajib
- Form input nama transaksi, jumlah, dan kategori (Makanan, Transportasi, Hiburan).
- Validasi seluruh kolom dan jumlah pengeluaran.
- Daftar transaksi yang dapat dihapus.
- Total pengeluaran dan jumlah transaksi diperbarui otomatis.
- Grafik distribusi pengeluaran berdasarkan kategori menggunakan Chart.js.
- Data transaksi disimpan pada browser Local Storage.
- Tampilan responsif untuk ponsel dan desktop.

## Tiga fitur tambahan yang dipilih
1. **Ringkasan bulanan:** total dan jumlah transaksi untuk bulan berjalan.
2. **Pengurutan transaksi:** terbaru, jumlah terbesar, jumlah terkecil, atau kategori A–Z.
3. **Mode gelap/terang:** pilihan tema disimpan pada Local Storage.

## Menjalankan aplikasi
1. Ekstrak ZIP.
2. Buka folder proyek.
3. Buka `index.html` di browser. Koneksi internet diperlukan untuk memuat Chart.js dan Google Fonts dari CDN.
4. Tambahkan transaksi untuk menguji aplikasi.

## Publikasi ke GitHub Pages
1. Buat repository baru di GitHub.
2. Salin seluruh isi folder ini ke repository (termasuk `.kiro/`).
3. Buka Settings → Pages.
4. Pilih sumber deployment dari branch `main` dan folder `/ (root)`, lalu simpan.
5. Tunggu proses deployment selesai dan buka URL yang diberikan GitHub Pages.

## Catatan
- Data disimpan di Local Storage browser yang sedang digunakan, bukan di akun cloud. Data tidak otomatis tersinkron ke perangkat lain.
- Jangan menyimpan data keuangan sensitif pada demo ini.
- Sesuaikan nama repository dengan format yang ditentukan penyelenggara.

'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-brand-dark leading-relaxed">{children}</p>
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-brand-muted leading-relaxed">{children}</p>
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-brand-dark text-sm mt-3">{children}</h3>
}

function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1 text-sm text-brand-dark">{children}</ul>
}

function StepItem({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-brand-dark text-brand-accent-light text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-brand-dark text-[14px]">{title}</div>
        {children && <div className="text-sm text-brand-muted mt-1 leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}

function Steps({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 text-sm text-amber-900 leading-relaxed flex gap-2">
      <FontAwesomeIcon icon={faCircleInfo} className="text-amber-700 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 text-sm text-red-900 leading-relaxed flex gap-2">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-600 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

function Path({ children }: { children: React.ReactNode }) {
  return <code className="bg-brand-light text-brand-dark text-[12px] font-mono px-1.5 py-0.5 rounded">{children}</code>
}

/* ------------------------------------------------------------------ */
/*  Chapter renderers                                                  */
/* ------------------------------------------------------------------ */

function Chapter1() {
  return (
    <>
      <Lead>Halaman pertama yang muncul setelah login. Ringkasan operasional harian.</Lead>
      <Sub>Kartu statistik atas</Sub>
      <Bullets>
        <li><strong>Total Order</strong> — jumlah order produk yang masuk (semua status).</li>
        <li><strong>Total Donasi</strong> — jumlah donasi/penyaluran yang masuk.</li>
        <li><strong>Revenue</strong> — total nilai uang dari order yang sudah <em>PAID</em>.</li>
        <li><strong>Pending Bayar</strong> — order yang menunggu konfirmasi pembayaran.</li>
      </Bullets>
      <Sub>Cek order & donasi terbaru</Sub>
      <Steps>
        <StepItem number={1} title="Buka Dashboard">Klik <Path>/admin/dashboard</Path> di sidebar.</StepItem>
        <StepItem number={2} title="Scroll ke bawah">Section "Order Terbaru" dan "Donasi Terbaru" tampil di bawah grafik.</StepItem>
        <StepItem number={3} title="Klik baris untuk detail">Klik nomor order/donasi → langsung ke halaman detail.</StepItem>
      </Steps>
      <TipBox>Grafik harian bisa di-hover untuk lihat angka per tanggal. Filter range bisa diubah di kanan atas chart.</TipBox>
    </>
  )
}

function Chapter2() {
  return (
    <>
      <Lead>Kelola katalog hewan qurban yang dijual lewat website. Setiap produk muncul di halaman <Path>/katalog</Path> dan <Path>/produk/[slug]</Path>.</Lead>
      <Sub>Tambah produk baru</Sub>
      <Steps>
        <StepItem number={1} title="Buka halaman Produk">Klik menu "Produk" di sidebar.</StepItem>
        <StepItem number={2} title="Klik tombol Tambah">Tombol di pojok kanan atas, ikon ➕.</StepItem>
        <StepItem number={3} title="Isi data utama">Nama, slug (otomatis dari nama), berat (kg), harga, stok, kategori, badge.</StepItem>
        <StepItem number={4} title="Upload foto utama">Klik area upload, pilih file dari device. Foto pertama jadi cover.</StepItem>
        <StepItem number={5} title="Tambah gallery (opsional)">Bisa upload beberapa foto sekaligus untuk halaman detail produk.</StepItem>
        <StepItem number={6} title="Tambah video YouTube (opsional)">Paste link YouTube di field "Video URLs". Bisa lebih dari satu, pisah dengan koma/baris baru.</StepItem>
        <StepItem number={7} title="Isi deskripsi">Deskripsi panjang muncul di halaman detail produk. Boleh pakai HTML sederhana.</StepItem>
        <StepItem number={8} title="Set status & lokasi">Status default ACTIVE. Pilih lokasi qurban: INDONESIA / AFRICA / PALESTINE.</StepItem>
        <StepItem number={9} title="Simpan">Klik "Simpan" — produk langsung muncul di katalog.</StepItem>
      </Steps>
      <TipBox>💡 Foto produk minimal 800×800px supaya tampilan di mobile & desktop tajam. Kompresi WebP/JPEG &lt; 500KB untuk loading cepat.</TipBox>
      <Sub>Edit, nonaktifkan, hapus</Sub>
      <Bullets>
        <li><strong>Edit</strong> — klik ikon pensil di kolom Aksi → modal terbuka dengan data yang sudah ada.</li>
        <li><strong>Nonaktifkan</strong> — di modal edit, ubah Status ke INACTIVE → produk tidak tampil di katalog publik tapi data tetap aman.</li>
        <li><strong>Hapus</strong> — klik ikon trash → konfirmasi → produk dihapus permanen.</li>
      </Bullets>
      <WarningBox>⚠️ Hapus produk tidak bisa dibatalkan. Jika produk sudah pernah dipesan, lebih aman <em>nonaktifkan</em> daripada hapus — agar histori order tetap utuh.</WarningBox>
    </>
  )
}

function Chapter3() {
  return (
    <>
      <Lead>Campaign = program donasi qurban (mis. Qurban Palestina, Qurban Pelosok). Setiap campaign punya halaman publik di <Path>/penyaluran/[slug]</Path>.</Lead>
      <Sub>Buat campaign baru</Sub>
      <Steps>
        <StepItem number={1} title="Buka menu Campaign">Klik "Campaign" di sidebar.</StepItem>
        <StepItem number={2} title="Klik Tambah Campaign">Modal tambah terbuka.</StepItem>
        <StepItem number={3} title="Isi info dasar">Title, slug, lokasi, target jumlah hewan, harga (opsional), tipe hewan (domba/sapi), program type (qurban/aqiqah).</StepItem>
        <StepItem number={4} title="Upload cover image">Foto utama campaign — muncul di kartu list & header detail.</StepItem>
        <StepItem number={5} title="Isi konten cerita">Pakai block editor: paragraf teks, foto (upload atau URL), video YouTube. Drag untuk re-order block.</StepItem>
        <StepItem number={6} title="Toggle Allow Share & Active">Allow Share = boleh donasi 1 hewan untuk beberapa orang. Active = tampil di publik.</StepItem>
        <StepItem number={7} title="Simpan">Campaign langsung muncul di <Path>/penyaluran</Path>.</StepItem>
      </Steps>
      <Sub>Tambah Kabar Terbaru (Update)</Sub>
      <Steps>
        <StepItem number={1} title="Buka detail campaign di admin">Klik nama campaign → halaman edit.</StepItem>
        <StepItem number={2} title="Section 'Kabar Terbaru'">Scroll ke bawah → klik "Tambah Update".</StepItem>
        <StepItem number={3} title="Isi judul + konten + foto">Update muncul kronologis di halaman publik campaign.</StepItem>
      </Steps>
      <Sub>Status campaign</Sub>
      <Bullets>
        <li><strong>Active</strong> — tampil di <Path>/penyaluran</Path> dan bisa menerima donasi.</li>
        <li><strong>Inactive</strong> — disembunyikan dari publik. Histori donasi tetap tersimpan.</li>
      </Bullets>
      <TipBox>💡 Untuk campaign yang sudah selesai (target tercapai), nonaktifkan saja — jangan hapus. Donatur lama masih bisa lihat halaman kalau punya link.</TipBox>
    </>
  )
}

function Chapter4() {
  return (
    <>
      <Lead>Daftar semua order produk hewan qurban dari website.</Lead>
      <Sub>Lihat & cari order</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/pesanan">Tabel semua order tampil, urut terbaru.</StepItem>
        <StepItem number={2} title="Filter status">Pakai dropdown di atas tabel: PENDING / CONFIRMED / SHIPPED / DELIVERED / CANCELLED.</StepItem>
        <StepItem number={3} title="Search nama / nomor">Ketik di kotak search — filter live.</StepItem>
        <StepItem number={4} title="Klik baris untuk detail">Modal detail muncul dengan semua data pemesan + produk.</StepItem>
      </Steps>
      <Sub>Konfirmasi pembayaran manual</Sub>
      <Lead>Dipakai saat customer transfer manual + upload bukti (bukan via Tripay otomatis).</Lead>
      <Steps>
        <StepItem number={1} title="Buka /admin/konfirmasi">Khusus untuk order UNPAID yang sudah upload bukti transfer.</StepItem>
        <StepItem number={2} title="Cek bukti transfer">Klik foto bukti — preview besar muncul.</StepItem>
        <StepItem number={3} title="Klik Konfirmasi">Status order otomatis jadi PAID + CONFIRMED. Sistem auto-buat record Pengiriman jika delivery method = HOME_DELIVERY (lihat Bab 6).</StepItem>
        <StepItem number={4} title="Atau Tolak">Kalau bukti tidak valid, klik Tolak — status jadi EXPIRED + CANCELLED. Customer akan dapat notif.</StepItem>
      </Steps>
      <Sub>Export data</Sub>
      <Steps>
        <StepItem number={1} title="Klik tombol Export">Di pojok kanan atas tabel — file CSV ter-download.</StepItem>
        <StepItem number={2} title="Filter dulu jika perlu">Export mengikuti filter aktif, jadi bisa export per status atau per range tanggal.</StepItem>
      </Steps>
      <TipBox>💡 Bukti transfer disimpan di <Path>/uploads/proof/</Path>. Bisa di-akses langsung via URL untuk arsip.</TipBox>
    </>
  )
}

function Chapter5() {
  return (
    <>
      <Lead>Daftar semua donasi yang masuk ke campaign-campaign aktif.</Lead>
      <Sub>Akses & filter</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/penyaluran">Tabel donasi semua campaign.</StepItem>
        <StepItem number={2} title="Filter per campaign">Dropdown campaign di atas tabel.</StepItem>
        <StepItem number={3} title="Filter status bayar">PAID / UNPAID / EXPIRED.</StepItem>
      </Steps>
      <Sub>Konfirmasi donasi manual</Sub>
      <Steps>
        <StepItem number={1} title="Buka detail donasi">Klik baris di tabel.</StepItem>
        <StepItem number={2} title="Cek bukti transfer">Foto bukti muncul kalau donatur sudah upload.</StepItem>
        <StepItem number={3} title="Klik Konfirmasi">Status jadi PAID + donasi tercatat masuk target campaign.</StepItem>
      </Steps>
      <TipBox>💡 Donasi tidak otomatis bikin record Pengiriman seperti Order produk — karena hewan didistribusikan oleh tim penyaluran ke daerah, bukan ke alamat donatur.</TipBox>
    </>
  )
}

function Chapter6() {
  return (
    <>
      <Lead>Modul terlengkap: track pengiriman hewan qurban dari konfirmasi bayar sampai serah terima ke pemesan.</Lead>
      <Sub>Tambah data pengiriman offline</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/pengiriman">List semua pengiriman.</StepItem>
        <StepItem number={2} title="Klik Tambah">Modal terbuka, 4 section: Pemesan / Hewan / Pembayaran / Pengiriman.</StepItem>
        <StepItem number={3} title="Isi minimal No WhatsApp">Field wajib. Sisanya opsional — bisa diisi konsumen sendiri lewat link.</StepItem>
        <StepItem number={4} title="Simpan & dapat link">Setelah simpan, dialog "Link konsumen sudah dibuat!" muncul. Token unik otomatis dibuat.</StepItem>
        <StepItem number={5} title="Copy / Kirim via WA">Klik tombol Copy untuk salin link, atau Kirim via WA untuk buka WhatsApp dengan template undangan.</StepItem>
      </Steps>
      <Sub>Kelola PIC pengiriman</Sub>
      <Steps>
        <StepItem number={1} title="Klik 'Kelola PIC'">Tombol di header /admin/pengiriman.</StepItem>
        <StepItem number={2} title="Tambah PIC baru">Nama, No Telepon, keterangan, toggle Aktif.</StepItem>
        <StepItem number={3} title="Edit / nonaktifkan">PIC yang nonaktif tidak muncul di dropdown saat assign.</StepItem>
      </Steps>
      <Sub>Assign PIC ke pengiriman</Sub>
      <Steps>
        <StepItem number={1} title="Edit pengiriman">Klik ikon pensil di tabel.</StepItem>
        <StepItem number={2} title="Section 'Pengiriman' → PIC dropdown">Pilih PIC dari list aktif.</StepItem>
        <StepItem number={3} title="Isi No Kendaraan (opsional)">Bisa diisi tim lapangan saat klik 'Mulai Perjalanan' juga.</StepItem>
        <StepItem number={4} title="Simpan">PIC tampil di kolom PIC tabel + di card tim lapangan.</StepItem>
      </Steps>
      <Sub>Kirim notifikasi tugas / pengingat ke PIC</Sub>
      <Steps>
        <StepItem number={1} title="Buka detail pengiriman">Klik "Detail" di kolom Aksi.</StepItem>
        <StepItem number={2} title="Card Pengiriman">2 tombol muncul kalau PIC sudah di-assign:</StepItem>
        <StepItem number={3} title="📲 Kirim Tugas ke PIC">Pesan lengkap (alamat, hewan, tag, jadwal, link lapangan, kode akses) → buka WhatsApp di tab baru.</StepItem>
        <StepItem number={4} title="🔔 Kirim Pengingat ke PIC">Pesan ringkas — biasanya dipakai H-1 untuk reminder.</StepItem>
      </Steps>
      <P>Atau dari tabel: klik ikon 📱 (mobile) di kolom Aksi — hanya muncul untuk row yang sudah punya PIC.</P>
      <Sub>Update status pengiriman (admin)</Sub>
      <P>Di detail pengiriman, Card Pengiriman punya tombol cepat: Dijadwalkan / Dalam Perjalanan / Terkirim. Biasanya status di-update otomatis lewat halaman tim lapangan (Bab 11).</P>
      <Sub>Penjelasan status</Sub>
      <Bullets>
        <li><strong>Menunggu Data</strong> — dibuat tapi konsumen belum isi form alamat.</li>
        <li><strong>Belum Dijadwalkan</strong> — konsumen sudah isi form, admin belum set tanggal kirim.</li>
        <li><strong>Dijadwalkan</strong> — tanggal & jam kirim sudah ditentukan.</li>
        <li><strong>Dalam Perjalanan</strong> — tim lapangan sedang berangkat. Notif WA otomatis ke pemesan.</li>
        <li><strong>Terkirim</strong> — hewan sudah diserahkan + foto serah terima diupload.</li>
      </Bullets>
      <Sub>Export</Sub>
      <P>Klik tombol Export di header — CSV download dengan filter aktif (search/status/PIC/tanggal).</P>
      <TipBox>💡 Tabel kolom "Tgl Kirim" tampilkan <em>Req: 14 Jun</em> warna biru italic kalau itu adalah <strong>request konsumen</strong> yang belum dikonfirmasi admin (admin belum set tanggal final).</TipBox>
    </>
  )
}

function Chapter7() {
  return (
    <>
      <Lead>Konfigurasi Facebook Pixel + Conversion API untuk track event website (PageView, AddToCart, Purchase, dll).</Lead>
      <Sub>Setup Pixel + CAPI</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/pengaturan">Scroll ke section "Pixel & Tracking".</StepItem>
        <StepItem number={2} title="Pixel ID">Paste ID dari Meta Events Manager. Contoh: <Path>1234567890</Path>.</StepItem>
        <StepItem number={3} title="Conversion API Access Token">Generate di Meta Events Manager → Settings → Conversions API → Generate Access Token. Paste di sini.</StepItem>
        <StepItem number={4} title="Event mapping">Set event yang fire per halaman: PageView (semua), ViewContent (detail produk), AddToCart (checkout), Purchase (terimakasih).</StepItem>
        <StepItem number={5} title="Test Event Code (opsional)">Saat testing, isi kode dari Meta → Events Manager → Test Events. Event akan masuk ke Test Events panel realtime.</StepItem>
        <StepItem number={6} title="Save">Klik Simpan — perubahan langsung berlaku tanpa restart.</StepItem>
      </Steps>
      <WarningBox>⚠️ <strong>Wajib kosongkan Test Event Code saat go live!</strong> Kalau lupa, semua event production akan masuk ke panel test (terhitung sebagai test, tidak masuk Ads Manager untuk attribution).</WarningBox>
      <Sub>Trigger Purchase event</Sub>
      <Bullets>
        <li><strong>tripay_callback</strong> — fire saat webhook Tripay konfirm PAID (default, paling akurat).</li>
        <li><strong>terimakasih_page</strong> — fire saat user buka halaman /terimakasih.</li>
        <li><strong>both</strong> — fire dua-duanya (event_id sama supaya Meta dedupe).</li>
      </Bullets>
    </>
  )
}

function Chapter8() {
  return (
    <>
      <Lead>Sistem otomatis kirim WA ke customer yang belum bayar setelah delay tertentu.</Lead>
      <Sub>Aktifkan & set delay</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/pengaturan">Scroll ke section "Follow Up Otomatis".</StepItem>
        <StepItem number={2} title="Toggle Aktif">Default ON. Kalau OFF, follow up tidak dikirim sama sekali.</StepItem>
        <StepItem number={3} title="Set delay">Jam + Menit. Contoh: 0 jam 45 menit = follow up dikirim 45 menit setelah order dibuat (kalau masih UNPAID).</StepItem>
        <StepItem number={4} title="Save">Berlaku saat cron berikutnya jalan (tiap 5 menit).</StepItem>
      </Steps>
      <Sub>Edit template pesan</Sub>
      <P>Ada dua tab: <strong>Produk</strong> (untuk order katalog) dan <strong>Donasi</strong> (untuk donasi campaign).</P>
      <Bullets>
        <li><Path>{`{{nama}}`}</Path> — nama customer</li>
        <li><Path>{`{{nomor_pesanan}}`}</Path> — nomor order/donasi</li>
        <li><Path>{`{{total}}`}</Path> — nominal pembayaran (sudah diformat IDR)</li>
        <li><Path>{`{{campaign}}`}</Path> — nama campaign (donasi only)</li>
      </Bullets>
      <P>Boleh pakai <code>*bold*</code> dan <code>_italic_</code> ala WhatsApp.</P>
      <TipBox>💡 Cron runner di server VPS jalan tiap 5 menit memanggil <Path>/api/cron/followup</Path>. Setiap order/donasi hanya difollow-up sekali (di-track via <Path>followup_sent_orders</Path>).</TipBox>
      <WarningBox>⚠️ Kalau OneSender disabled atau credentials salah, follow up gagal kirim — cek error log di <Path>/var/log/beyond-qurban-cron.log</Path> atau pm2 logs.</WarningBox>
    </>
  )
}

function Chapter9() {
  return (
    <>
      <Lead>Integrasi gateway WhatsApp via OneSender — dipakai untuk semua notif otomatis (konfirmasi bayar, follow up, transit pengiriman).</Lead>
      <Sub>Konfigurasi credentials</Sub>
      <Steps>
        <StepItem number={1} title="Buka /admin/pengaturan">Section "WhatsApp Gateway".</StepItem>
        <StepItem number={2} title="OneSender URL">Endpoint API. Default: <Path>https://wa3607.oneapi.my.id/api/v1/messages</Path>. Bisa juga base URL saja, sistem auto-tambah path.</StepItem>
        <StepItem number={3} title="API Key">Token dari dashboard OneSender. Treated as secret — tidak ditampilkan ulang setelah save.</StepItem>
        <StepItem number={4} title="Toggle Enabled">ON = sistem kirim WA otomatis. OFF = semua notif WA disabled (tombol manual via wa.me tetap jalan).</StepItem>
        <StepItem number={5} title="Save">Berlaku langsung.</StepItem>
      </Steps>
      <Sub>Test koneksi</Sub>
      <Steps>
        <StepItem number={1} title="Tombol Test">Di section yang sama, klik "Test Kirim".</StepItem>
        <StepItem number={2} title="Isi nomor tujuan">Format bebas (085xxx / 6285xxx / +62 85xxx) — sistem auto-normalisasi.</StepItem>
        <StepItem number={3} title="Cek WhatsApp tujuan">Pesan test "Halo dari Beyond Qurban..." muncul dalam beberapa detik.</StepItem>
      </Steps>
      <TipBox>💡 Env vars <Path>WA_GATEWAY_URL</Path> + <Path>WA_GATEWAY_TOKEN</Path> di <Path>.env</Path> jadi fallback kalau row di Settings DB belum diisi. Auto-enable kalau env present, kecuali admin explicit OFF.</TipBox>
    </>
  )
}

function Chapter10() {
  return (
    <>
      <Lead>Konfigurasi global yang dipakai di banyak halaman: identitas toko, kode tim lapangan, info bank.</Lead>
      <Sub>Identitas toko</Sub>
      <Bullets>
        <li><strong>Nama toko</strong> — tampil di header website + email & WA template.</li>
        <li><strong>Logo</strong> — upload PNG transparan, ukuran rekomendasi 200×200px.</li>
        <li><strong>Email & alamat</strong> — tampil di footer.</li>
        <li><strong>WhatsApp CS</strong> — nomor untuk tombol "Hubungi CS" di header.</li>
      </Bullets>
      <Sub>Kode akses tim lapangan</Sub>
      <Steps>
        <StepItem number={1} title="Section 'Tim Lapangan'">Di /admin/pengaturan.</StepItem>
        <StepItem number={2} title="Edit kode">Default <Path>QURBAN2026</Path>. Ganti agar lebih aman.</StepItem>
        <StepItem number={3} title="Bagikan ke kurir">Kode ini yang dipakai untuk login di <Path>/lapangan</Path>.</StepItem>
        <StepItem number={4} title="Save">Tim lapangan yang sudah login pakai kode lama akan ter-logout otomatis pada request berikutnya.</StepItem>
      </Steps>
      <Sub>Info rekening bank</Sub>
      <P>Section "Bank Transfer" — input nama bank, no rekening, nama pemilik. Tampil di halaman pembayaran sebagai instruksi transfer manual.</P>
      <Sub>Voucher</Sub>
      <P>Section "Voucher" untuk kelola kode diskon. Klik Tambah → isi kode, persen diskon, min belanja, max pemakaian.</P>
    </>
  )
}

function Chapter11() {
  return (
    <>
      <Lead>Halaman khusus tim lapangan / kurir — akses lewat <Path>/lapangan</Path>, tidak butuh akun admin.</Lead>
      <Sub>Akses & login</Sub>
      <Steps>
        <StepItem number={1} title="Buka /lapangan">Bisa di HP / desktop. Mobile-first design.</StepItem>
        <StepItem number={2} title="Input kode akses">Kode dari koordinator (lihat Bab 10).</StepItem>
        <StepItem number={3} title="Tersimpan di sessionStorage">Sampai browser ditutup. Tab refresh tetap login.</StepItem>
      </Steps>
      <Sub>Lihat & filter daftar</Sub>
      <Bullets>
        <li><strong>Default:</strong> tampil semua pengiriman yang belum terkirim, urut tanggal terdekat.</li>
        <li><strong>Filter tanggal:</strong> pill "Semua / Hari Ini / Besok" atau pilih tanggal manual.</li>
        <li><strong>Filter PIC:</strong> "Semua PIC / Belum ada PIC / per nama PIC" — kurir bisa filter pengiriman tugas dia sendiri.</li>
        <li><strong>Filter status:</strong> "Semua / Dijadwalkan / Dalam Perjalanan / Belum Dijadwalkan".</li>
      </Bullets>
      <Sub>Buka detail & ambil aksi</Sub>
      <Steps>
        <StepItem number={1} title="Klik card">Drawer detail terbuka — semua data lengkap (pemesan, hewan, jadwal, PIC, lokasi, catatan, foto).</StepItem>
        <StepItem number={2} title="Tombol di drawer">WA Donatur · Buka Maps · WA PIC · Dalam Perjalanan · Sudah Terkirim.</StepItem>
      </Steps>
      <Sub>Klik "Dalam Perjalanan"</Sub>
      <Steps>
        <StepItem number={1} title="Modal konfirmasi">Pilih PIC + isi No Kendaraan.</StepItem>
        <StepItem number={2} title="Klik 'Mulai Perjalanan'">Status update + sistem <strong>otomatis kirim WA ke pemesan</strong> via OneSender (server-side, tanpa buka tab baru).</StepItem>
        <StepItem number={3} title="Toast muncul">"Status diperbarui. Notifikasi WA sudah dikirim ke pemesan."</StepItem>
      </Steps>
      <Sub>Klik "Sudah Terkirim"</Sub>
      <Steps>
        <StepItem number={1} title="Modal konfirmasi (lebih panjang)">PIC + No Kendaraan + Diterima Oleh* + No HP/WA Penerima + Keterangan tambahan + Upload foto serah terima.</StepItem>
        <StepItem number={2} title="Foto wajib">Klik area upload → kamera atau galeri. Format JPG/PNG/WebP, max 4MB.</StepItem>
        <StepItem number={3} title="Klik 'Konfirmasi Terkirim'">Foto upload → status update → WA "Sudah diterima oleh [nama]" terbuka di tab baru untuk dikirim manual.</StepItem>
      </Steps>
      <Sub>Tombol Panduan</Sub>
      <P>Di header lapangan ada tombol "❓ Panduan" yang menampilkan checklist 5-langkah yang lebih ringkas dari halaman ini.</P>
    </>
  )
}

function Chapter12() {
  return (
    <>
      <Lead>Halaman publik untuk konsumen lengkapi data pengiriman. URL: <Path>beyondqurban.com/pengiriman/[token]</Path>.</Lead>
      <Sub>Alur kerja</Sub>
      <Steps>
        <StepItem number={1} title="Admin input data minimal">Di /admin/pengiriman → tambah pengiriman → minimal No WhatsApp.</StepItem>
        <StepItem number={2} title="Sistem generate token">Otomatis saat simpan. Token unik, sulit ditebak.</StepItem>
        <StepItem number={3} title="Admin kirim link via WA">Tombol "Kirim via WA" buka template undangan dengan link.</StepItem>
        <StepItem number={4} title="Konsumen klik link">Halaman form muncul di browser konsumen, tanpa login.</StepItem>
        <StepItem number={5} title="Konsumen isi form">Nama, WhatsApp, alamat lengkap, kecamatan, kota, pin Maps (paste link), nama untuk sertifikat, catatan.</StepItem>
        <StepItem number={6} title="Pilih waktu pengiriman">Tampil HANYA kalau admin belum jadwalkan. Tanggal + 4 sesi (Pagi / Siang / Sore / Sore Akhir).</StepItem>
        <StepItem number={7} title="Submit">Status form jadi "Sudah Diisi ✓" di tabel admin. statusKirim auto-pindah dari "Menunggu Data" ke "Belum Dijadwalkan".</StepItem>
      </Steps>
      <Sub>Edit data</Sub>
      <Bullets>
        <li>Konsumen bisa edit data sampai <strong>H-3 dari tanggal pengiriman</strong>.</li>
        <li>Setelah H-3 form dikunci — tampil pesan "Hubungi CS untuk perubahan".</li>
        <li>Token tidak berubah — link yang sama bisa dipakai berulang.</li>
      </Bullets>
      <Sub>Yang dilihat konsumen kalau admin sudah jadwalkan</Sub>
      <P>Banner emerald: "📅 Jadwal kirim: <em>14 Juni 2026 · 10.00-13.00</em>" — tidak ada picker waktu, hanya info read-only.</P>
      <TipBox>💡 Setelah konsumen submit, admin lihat tanggal request di tabel kolom "Tgl Kirim" warna biru italic <em>"Req: 14 Jun"</em>. Admin perlu konfirmasi/override jadwal final lewat /admin/pengiriman edit.</TipBox>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Main switch                                                         */
/* ------------------------------------------------------------------ */

export default function ChapterContent({ chapter }: { chapter: number }) {
  switch (chapter) {
    case 1: return <Chapter1 />
    case 2: return <Chapter2 />
    case 3: return <Chapter3 />
    case 4: return <Chapter4 />
    case 5: return <Chapter5 />
    case 6: return <Chapter6 />
    case 7: return <Chapter7 />
    case 8: return <Chapter8 />
    case 9: return <Chapter9 />
    case 10: return <Chapter10 />
    case 11: return <Chapter11 />
    case 12: return <Chapter12 />
    default: return <p className="text-sm text-brand-muted italic">Bab tidak ditemukan.</p>
  }
}

/* ------------------------------------------------------------------ */
/*  Search keywords (used by sidebar to highlight matching chapters)   */
/* ------------------------------------------------------------------ */

export const CHAPTER_KEYWORDS: Record<number, string> = {
  1: 'dashboard statistik order donasi revenue grafik chart hari ini total',
  2: 'produk katalog hewan domba sapi tambah edit foto gallery video youtube stok harga kategori berat slug deskripsi nonaktif',
  3: 'campaign program penyaluran donasi cerita kabar update gambar video target nominal slug aktif',
  4: 'pesanan order konfirmasi bayar transfer manual paid unpaid status export csv',
  5: 'donasi penyaluran qurban campaign list tabel konfirmasi bayar manual',
  6: 'pengiriman kirim pic tag hewan token link form konsumen offline online whatsapp wa export status menunggu data dijadwalkan dalam perjalanan terkirim',
  7: 'pixel facebook meta capi conversion api token test event tracking analytics',
  8: 'follow up followup auto otomatis cron template variabel pesan unpaid pengingat reminder',
  9: 'whatsapp wa onesender gateway api key url credentials test koneksi nomor pengirim',
  10: 'pengaturan umum nama logo toko store kode akses tim lapangan rekening bank info voucher',
  11: 'tim lapangan kurir kode akses kirim foto serah terima upload status update filter pic tanggal panduan',
  12: 'form konsumen donatur token link pengiriman alamat maps pin kecamatan kota waktu sesi h-3',
}

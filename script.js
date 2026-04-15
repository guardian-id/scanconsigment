// 1. URL POWER AUTOMATE (URL Milik Bos)
const powerAutomateUrl = "https://default9ec0d6c58a25418fb3841c77c55584.c2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/51bca68d357d4d1caed9194b68e882a2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KSDuVbQVZELWa-UTZZybscXlvsARTjA_eQ31LzWk564";

// Inisialisasi Library QR Code
const html5QrCode = new Html5Qrcode("reader");

// ---------------------------------------------------------
// 2. LOGIKA SCANNER (OPTIMAL UNTUK MENCEGAH BLUR)
// ---------------------------------------------------------
document.getElementById('startBtn').addEventListener('click', () => {
    const readerElement = document.getElementById('reader');
    readerElement.style.display = 'block';
    
    html5QrCode.start(
        { facingMode: "environment" }, // Prioritas kamera belakang
        { 
            fps: 20,                         // Kecepatan frame lebih tinggi agar mulus
            qrbox: { width: 280, height: 180 }, // Ukuran kotak bidik
            // PENGATURAN RESOLUSI TINGGI (Agar Gambar Tajam/Gak Blur)
            videoConstraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: "environment"
            }
        },
        (decodedText) => {
            // Jika Berhasil Scan:
            document.getElementById('mainBarcode').value = decodedText; // Isi kolom barcode
            
            if (navigator.vibrate) navigator.vibrate(100); // Getar tanda sukses
            
            // Tutup Kamera Otomatis
            html5QrCode.stop().then(() => { 
                readerElement.style.display = 'none'; 
            }).catch(err => console.warn("Gagal stop kamera:", err));
        }
    ).catch(err => {
        alert("Gagal membuka kamera. Pastikan izin kamera diberikan dan lensa tidak tertutup.");
        readerElement.style.display = 'none';
    });
});

// ---------------------------------------------------------
// 3. LOGIKA KIRIM DATA & TERIMA PESAN BALIK
// ---------------------------------------------------------
document.getElementById('mainSendBtn').addEventListener('click', async () => {
    const btn = document.getElementById('mainSendBtn');
    
    // Ambil semua data dari input tunggal
    const nama = document.getElementById('mainNama').value;
    const store = document.getElementById('mainStore').value;
    const barcode = document.getElementById('mainBarcode').value;
    const qty = document.getElementById('mainQty').value;
    const jenis = document.getElementById('mainJenis').value; // Ambil jenis

    // Validasi Dasar
    if (!nama || !store || !barcode || !qty || !jenis) {
        alert("⚠️ Mohon lengkapi semua data (Nama, Store, Barcode, Qty, & Jenis)!");
        return;
    }

    // Susun Paket Data (JSON)
    const payload = {
        nama_scan: nama,
        code_store: store,
        barcode: barcode,
        jenis: jenis,
        qty: parseInt(qty),
        timestamp: new Date().toISOString()
    };

    try {
        // Efek Visual saat Mengirim
        btn.innerText = "⏳ Sedang Mengirim...";
        btn.disabled = true;

        const response = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // MENANGKAP PESAN BALIK DARI FLOW
        if (response.ok) {
    const dataBalik = await response.json(); 
    
    alert("✅ Data telah sesuai di sistem!\nToko: " + (dataBalik.pesan || "Data Terkirim"));
    
    // Reset Form
    document.getElementById('mainBarcode').value = "";
    document.getElementById('mainQty').value = "";
    document.getElementById('mainBarcode').focus();

} else {
    // --- PENANGANAN ERROR DI SINI ---
    if (response.status === 400) {
        try {
            const errorData = await response.json();
            // Munculkan pesan error dari Power Automate jika ada, atau pesan default
            alert("⚠️ Kesalahan Input!!\n" + (errorData.pesan || "Data tidak valid periksa kembali kode toko atau kode barang.")+"\nSilakan koreksi dengan input ulang dengan data benar");
        } catch (e) {
            alert("⚠️ Error 400: Permintaan ditolak oleh sistem.");
        }
    } else if (response.status === 404) {
        alert("📍 URL Flow tidak ditemukan.");
    } else {
        alert("❌ Terjadi kesalahan sistem (Status: " + (errorData.pesan || "Unknown error") + ")");
    }
}
    } catch (error) {
        alert("🌐 Koneksi Internet Bermasalah. Cek Sinyal HP Anda.");
        console.error("Error Detail:", error);
    } finally {
        // Balikkan Tombol ke Kondisi Semula
        btn.innerText = "KIRIM DATA";
        btn.disabled = false;
    }
});
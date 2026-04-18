// 1. URL POWER AUTOMATE (URL Milik Bos)
const powerAutomateUrl = "https://default9ec0d6c58a25418fb3841c77c55584.c2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/51bca68d357d4d1caed9194b68e882a2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KSDuVbQVZELWa-UTZZybscXlvsARTjA_eQ31LzWk564";

// Inisialisasi Library QR Code
const html5QrCode = new Html5Qrcode("reader");

// ---------------------------------------------------------
// 2. LOGIKA SCANNER (OPTIMAL UNTUK MENCEGAH BLUR)
document.getElementById('startBtn').addEventListener('click', () => {
    const readerElement = document.getElementById('reader');
    readerElement.style.display = 'block'; 

    // 1. MASUK MODE FULLSCREEN SAAT KLIK SCAN
    if (readerElement.requestFullscreen) {
        readerElement.requestFullscreen();
    } else if (readerElement.webkitRequestFullscreen) {
        readerElement.webkitRequestFullscreen(); // Untuk Safari/iOS
    }

    html5QrCode.start(
        { facingMode: "environment" },
        { 
            fps: 20,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                return { width: viewfinderWidth * 0.8, height: viewfinderHeight * 0.4 };
            },
            // --- OPTIMASI RESOLUSI AGAR TAJAM & FULL SCREEN ---
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },  // Menjaga ketajaman gambar
                height: { ideal: 720 },  // Menjaga ketajaman gambar
                aspectRatio: window.innerHeight / window.innerWidth // Mengikuti rasio HP
            }
        },
        (decodedText) => {
            // Jika Berhasil Scan:
            document.getElementById('mainBarcode').value = decodedText;
            if (navigator.vibrate) navigator.vibrate(100);

            // 2. KELUAR DARI FULLSCREEN SETELAH BERHASIL
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }

            html5QrCode.stop().then(() => { 
                readerElement.style.display = 'none'; 
            }).catch(err => console.warn("Gagal stop kamera:", err));
        }
    ).catch(err => {
        alert("Gagal membuka kamera. Pastikan izin kamera diberikan.");
        readerElement.style.display = 'none';
        
        // Pastikan keluar fullscreen jika gagal buka kamera
        if (document.exitFullscreen) document.exitFullscreen();
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

    // 2. Logika penyesuaian waktu otomatis (WIB, WITA, WIT)
    const sekarang = new Date();
    const offset = sekarang.getTimezoneOffset() * 60000;
    const waktuLokal = new Date(sekarang.getTime() - offset);

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
        timestamp: waktuLokal.toISOString().slice(0, -1)
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
// --- AUTO-FILL KODE STORE DARI URL ---
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storeOtomatis = urlParams.get('store'); // Mengambil data dari ?store=...

    if (storeOtomatis) {
        const fieldStore = document.getElementById('mainStore');
        if (fieldStore) {
            fieldStore.value = storeOtomatis;
            console.log("Kode Store berhasil terisi otomatis: " + storeOtomatis);
        }
    }
});

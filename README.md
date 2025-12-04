<!-- =============================== -->
<!-- 📌 PROJECT README - MAMPIR APP -->
<!-- =============================== -->

<h1 align="center">📍 <b>MAMPIR — Mangan lan Plesir</b></h1>
<p align="center">Aplikasi mobile untuk eksplorasi wisata & kuliner Kota Surakarta</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Build-React%20Native-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Database-Firebase-yellow?style=for-the-badge">
  <img src="https://img.shields.io/badge/Map-Google%20Maps-green?style=for-the-badge">
</p>

---

## 🔥 Tentang Aplikasi

**MAMPIR (Mangan lan Plesir)** adalah aplikasi eksplorasi wisata & kuliner berbasis **React Native**.  
Aplikasi ini dirancang untuk membantu pengguna menemukan lokasi menarik di Kota **Surakarta**, lengkap dengan:

✨ Rekomendasi tempat,  
⭐ Rating & review pengguna,  
🗺 Peta interaktif, serta  
📍 Navigasi lokasi.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|------|-----------|
| 🔍 Pencarian Lokasi | Menampilkan destinasi wisata & kuliner terdekat |
| ⭐ Rating & Review | Penilaian pengguna untuk tempat yang pernah dikunjungi |
| 🗺 Web Map + Google Maps | Visualisasi titik lokasi dalam peta interaktif |
| 🏆 Rekomendasi Pilihan Terbaik | Berdasarkan rating & popularitas |
| 📜 Riwayat Kunjungan | Menyimpan lokasi yang pernah dibuka pengguna |

---

## 🛠 Tech Stack

| Komponen | Teknologi |
|--------|-----------|
| Framework | **React Native (Expo)** |
| Basis Data | **Firebase Realtime Database** |
| Peta | **Google Maps API**, WebView HTML Map |
| UI | ThemedView, FontAwesome, StyleSheet |

---

## 🗂 Struktur Folder Utama

```bash
📁 app
│── index.tsx               # Home & Popular Recommendation
│── gmap.tsx                # Google Map Integration
│── mapwebview.tsx          # Alternative Web Map
│── lokasi.tsx              # List Tempat Kuliner & Wisata
│── review.tsx              # Halaman Review dan Rating
│── forminputlocation.tsx   # Tambah lokasi baru
│── formeditlocation.tsx    # Edit lokasi

---

## Tampilan
![Landing 1](assets/images/gambar1.jpeg)
![Landing2l](tampilan/landing2.png)
![Landing3](tampilan/landing3.png)
![Map1](tampilan/map1.png)
![Map2](tampilan/map2.png)
![Data1](tampilan/data1.png)
![Data2](tampilan/data2.png)
![Info](tampilan/inpo.png)

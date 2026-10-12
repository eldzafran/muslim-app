const MECCA_LAT = 21.4225;
const MECCA_LNG = 39.8262;

let qiblaBearing = 0;

const btnStart = document.getElementById('btnStart');
const statusInfo = document.getElementById('statusInfo');
const compass = document.getElementById('compass');
const qiblaArrow = document.getElementById('qiblaArrow');

// 1. Perhitungan Great Circle Bearing untuk Arah Kiblat
function calculateQiblaBearing(lat, lng) {
  const phi1 = lat * (Math.PI / 180);
  const phi2 = MECCA_LAT * (Math.PI / 180);
  const lambda1 = lng * (Math.PI / 180);
  const lambda2 = MECCA_LNG * (Math.PI / 180);

  const y = Math.sin(lambda2 - lambda1);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);
  
  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  return (qibla + 360) % 360;
}

// 2. Mengambil Akses Lokasi GPS User
function requestLocation() {
  if (!navigator.geolocation) {
    statusInfo.textContent = 'Browser kamu tidak mendukung akses lokasi/GPS.';
    return;
  }

  statusInfo.textContent = 'Mencari posisi GPS... Pastikan izin GPS aktif.';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      qiblaBearing = calculateQiblaBearing(lat, lng);
      statusInfo.textContent = `Arah Kiblat: ${qiblaBearing.toFixed(1)}° dari Utara. Putar/gerakkan HP kamu.`;

      setupCompass();
    },
    (error) => {
      console.error('Error Geolocation:', error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          statusInfo.textContent = 'Izin lokasi ditolak. Buka setelan browser untuk mengizinkan akses lokasi.';
          break;
        case error.POSITION_UNAVAILABLE:
          statusInfo.textContent = 'Informasi lokasi tidak ditemukan. Pastikan GPS HP kamu aktif.';
          break;
        case error.TIMEOUT:
          statusInfo.textContent = 'Waktu permintaan lokasi habis. Silakan klik tombol kembali.';
          break;
        default:
          statusInfo.textContent = 'Gagal mendeteksi lokasi.';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// 3. Mengaktifkan Sensor Orientasi / Kompas
function setupCompass() {
  // Dukungan Khusus iOS Safari
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          statusInfo.textContent = 'Izin sensor gerak/kompas ditolak di peramban iOS.';
        }
      })
      .catch((err) => {
        console.error(err);
        statusInfo.textContent = 'Gagal meminta izin kompas di perangkat ini.';
      });
  } else {
    // Dukungan Android & Browser Standar
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      statusInfo.textContent = 'Perangkat ini tidak memiliki sensor magnetometer/kompas.';
    }
  }
}

// 4. Update Tampilan Rotasi Kompas & Panah Kiblat
function handleOrientation(event) {
  let heading = null;

  if (event.webkitCompassHeading) {
    // iOS Safari
    heading = event.webkitCompassHeading;
  } else if (event.absolute && event.alpha !== null) {
    // Android Absolute Compass
    heading = 360 - event.alpha;
  } else if (event.alpha !== null) {
    heading = 360 - event.alpha;
  }

  if (heading !== null) {
    compass.style.transform = `rotate(${-heading}deg)`;
    qiblaArrow.style.transform = `rotate(${qiblaBearing}deg)`;
  }
}

// Event Listener Tombol Utama
btnStart.addEventListener('click', () => {
  requestLocation();
});
const MECCA_LAT = 21.4225;
const MECCA_LNG = 39.8262;

let qiblaBearing = 0;

const btnStart = document.getElementById('btnStart');
const statusInfo = document.getElementById('statusInfo');
const compass = document.getElementById('compass');
const qiblaArrow = document.getElementById('qiblaArrow');

// Rumus Great Circle Bearing untuk hitung arah kiblat
function calculateQiblaBearing(userLat, userLng) {
  const phi1 = userLat * (Math.PI / 180);
  const phi2 = MECCA_LAT * (Math.PI / 180);
  const lambda1 = userLng * (Math.PI / 180);
  const lambda2 = MECCA_LNG * (Math.PI / 180);

  const y = Math.sin(lambda2 - lambda1);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);
  
  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  return (qibla + 360) % 360;
}

// Dapatkan koordinat lokasi user via GPS
function getLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        qiblaBearing = calculateQiblaBearing(lat, lng);
        statusInfo.textContent = `Arah Kiblat: ${qiblaBearing.toFixed(1)}° dari Utara. Putar HP kamu.`;
        initCompass();
      },
      (error) => {
        statusInfo.textContent = 'Gagal mengambil lokasi. Pastikan izin GPS aktif.';
      }
    );
  } else {
    statusInfo.textContent = 'Geolocation tidak didukung di browser ini.';
  }
}

// Inisialisasi sensor kompas HP
function initCompass() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Penanganan khusus untuk browser iOS (Safari)
    DeviceOrientationEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          statusInfo.textContent = 'Izin akses sensor gerak ditolak.';
        }
      })
      .catch(console.error);
  } else {
    // Browser standar / Android
    window.addEventListener('deviceorientationabsolute', handleOrientation, true) ||
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

// Putar elemen visual kompas sesuai orientasi HP
function handleOrientation(event) {
  let alpha = event.alpha;
  
  // Ambil heading khusus perangkat iOS jika ada
  if (event.webkitCompassHeading) {
    alpha = event.webkitCompassHeading;
  }

  if (alpha !== null && alpha !== undefined) {
    // Memutar piringan kompas ke arah Utara
    compass.style.transform = `rotate(${-alpha}deg)`;
    
    // Memutar panah hijau ke arah derajat kiblat
    qiblaArrow.style.transform = `rotate(${qiblaBearing}deg)`;
  }
}

btnStart.addEventListener('click', () => {
  statusInfo.textContent = 'Mengambil lokasi...';
  getLocation();
});
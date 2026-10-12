// --- TAB NAVIGATION & HEADER TITLE ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');

const pageTitlesMap = {
  jadwal: 'Dashboard Jadwal Salat',
  qibla: 'Kompas Arah Kiblat',
  kalender: 'Kalender Hijriah & Puasa Sunnah',
  quran: 'Al-Qur\'an Digital 114 Surah',
  dzikir: 'Dzikir & Doa Harian',
  reminder: 'Self-Reminder Muslim'
};

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const targetTab = btn.dataset.tab;
    document.getElementById(targetTab).classList.add('active');
    pageTitle.textContent = pageTitlesMap[targetTab] || 'Dashboard Utama';
  });
});

// --- VARIABLES & GPS ---
let currentLat = -6.2088;
let currentLng = 106.8456;
let qiblaDegree = 0;

function fetchCityName(lat, lng) {
  const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

  fetch(geoUrl)
    .then(res => res.json())
    .then(data => {
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.city_district || data.address.county || "Lokasi Anda";
        const state = data.address.state || "";
        document.getElementById('cityName').textContent = `${city}, ${state}`;
      } else {
        document.getElementById('cityName').textContent = `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`;
      }
    })
    .catch(() => {
      document.getElementById('cityName').textContent = `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`;
    });
}

function fetchPrayerTimes(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const timings = data.data.timings;
      const dateData = data.data.date;

      updatePrayerUI(timings);
      startCountdown(timings);

      const masehi = dateData.readable;
      const hijriDay = dateData.hijri.day;
      const hijriMonth = dateData.hijri.month.en;
      const hijriYear = dateData.hijri.year;

      document.getElementById('dateInfo').textContent = `${masehi} • ${hijriDay} ${hijriMonth} ${hijriYear} H`;
      renderHijriCalendar(dateData.hijri);
    });
}

function updatePrayerUI(timings) {
  const keys = ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  keys.forEach(key => {
    const el = document.getElementById(`time-${key}`);
    if (el) el.textContent = timings[key];
  });
}

function getLocation() {
  if (navigator.geolocation) {
    document.getElementById('cityName').textContent = 'Mendapatkan GPS...';
    navigator.geolocation.getCurrentPosition(
      pos => {
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;

        fetchCityName(currentLat, currentLng);
        fetchPrayerTimes(currentLat, currentLng);
        updateQiblaDirection(currentLat, currentLng);
      },
      () => {
        document.getElementById('cityName').textContent = 'Jakarta (Default)';
        fetchPrayerTimes(currentLat, currentLng);
        updateQiblaDirection(currentLat, currentLng);
      }
    );
  } else {
    document.getElementById('cityName').textContent = 'Jakarta (Default)';
    fetchPrayerTimes(currentLat, currentLng);
    updateQiblaDirection(currentLat, currentLng);
  }
}

document.getElementById('btnRefreshLocation').addEventListener('click', getLocation);

function startCountdown(timings) {
  setInterval(() => {
    const now = new Date();
    const list = [
      { name: 'Subuh', time: timings.Fajr },
      { name: 'Dzuhur', time: timings.Dhuhr },
      { name: 'Ashar', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isya', time: timings.Isha }
    ];

    let next = null;
    for (let p of list) {
      const [h, m] = p.time.split(':');
      const pDate = new Date();
      pDate.setHours(parseInt(h), parseInt(m), 0);

      if (pDate > now) {
        next = { name: p.name, date: pDate, clockTime: p.time };
        break;
      }
    }

    if (!next) {
      const [h, m] = timings.Fajr.split(':');
      const pDate = new Date();
      pDate.setDate(pDate.getDate() + 1);
      pDate.setHours(parseInt(h), parseInt(m), 0);
      next = { name: 'Subuh (Besok)', date: pDate, clockTime: timings.Fajr };
    }

    document.getElementById('nextPrayerName').textContent = next.name;
    document.getElementById('nextPrayerTime').textContent = `(${next.clockTime})`;

    const diff = next.date - now;
    const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

    document.getElementById('countdown').textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// --- SENSOR KOMPAS KIBLAT ---
function calculateQiblaAngle(lat, lng) {
  const kaabaLat = 21.4225 * (Math.PI / 180);
  const kaabaLng = 39.8262 * (Math.PI / 180);

  const userLat = lat * (Math.PI / 180);
  const userLng = lng * (Math.PI / 180);

  const y = Math.sin(kaabaLng - userLng);
  const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(kaabaLng - userLng);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = qiblaRad * (180 / Math.PI);
  return (qiblaDeg + 360) % 360;
}

function updateQiblaDirection(lat, lng) {
  qiblaDegree = calculateQiblaAngle(lat, lng);
  document.getElementById('qiblaDegree').textContent = `${qiblaDegree.toFixed(1)}°`;
  
  const kaabaPointer = document.getElementById('kaabaPointer');
  if (kaabaPointer) {
    kaabaPointer.style.transform = `rotate(${qiblaDegree}deg)`;
  }
}

document.getElementById('btnEnableCompass').addEventListener('click', startCompassSensor);

function startCompassSensor() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          alert('Sensor Kompas Aktif! Posisikan HP mendatar.');
        } else {
          alert('Izin sensor kompas ditolak oleh perangkat.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Gagal mengaktifkan sensor kompas.');
      });
  } 
  else if ('ondeviceorientationabsolute' in window) {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    alert('Sensor Kompas Aktif! Posisikan HP mendatar.');
  } else if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', handleOrientation, true);
    alert('Sensor Kompas Aktif! Posisikan HP mendatar.');
  } else {
    alert('Perangkat/Browser Anda tidak mendukung sensor kompas.');
  }
}

function handleOrientation(event) {
  let compassHeading = null;

  if (event.webkitCompassHeading) {
    compassHeading = event.webkitCompassHeading;
  } 
  else if (event.alpha !== null) {
    compassHeading = 360 - event.alpha;
  }

  if (compassHeading !== null) {
    const compassDial = document.getElementById('compassDial');
    if (compassDial) {
      compassDial.style.transform = `rotate(${-compassHeading}deg)`;
    }
  }
}

// --- KALENDER HIJRIAH DENGAN DUA BULAN DYNAMIS ---
function renderHijriCalendar(hijriData) {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const eventsList = document.getElementById('eventsList');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMasehiDay = today.getDate();
  const currentHijriDay = parseInt(hijriData.day);

  // Daftar nama bulan Hijriah
  const hijriMonths = [
    "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir",
    "Jumadal Ula", "Jumadal Akhirah", "Rajab", "Sya'ban",
    "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"
  ];

  const currentMonthIndex = hijriData.month.number - 1; // Index 0-11
  const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;

  const currentMonthName = hijriData.month.en;
  const prevMonthName = hijriMonths[prevMonthIndex];

  // Set Judul Kalender Menampilkan Kedua Bulan
  document.getElementById('hijriMonthTitle').textContent = `Kalender ${prevMonthName} / ${currentMonthName} ${hijriData.year} H`;

  // Hitung selisih offset
  const hijriOffset = currentHijriDay - currentMasehiDay;
  const daysInMasehiMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let masehiDay = 1; masehiDay <= daysInMasehiMonth; masehiDay++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';

    const dateObj = new Date(currentYear, currentMonth, masehiDay);
    const dayOfWeek = dateObj.getDay();

    let calculatedHijriDay = masehiDay + hijriOffset;
    let monthLabel = "";

    // Tentukan bulan Hijriah berdasarkan tanggalnya
    if (calculatedHijriDay <= 0) {
      calculatedHijriDay += 30; // Asumsi bulan sebelumnya 30 hari
      monthLabel = prevMonthName;
    } else {
      monthLabel = currentMonthName;
    }

    const isMondayThursday = (dayOfWeek === 1 || dayOfWeek === 4);
    const isAyyamulBidh = (calculatedHijriDay === 13 || calculatedHijriDay === 14 || calculatedHijriDay === 15);

    if (isAyyamulBidh) dayCell.classList.add('is-ayyam');
    else if (isMondayThursday) dayCell.classList.add('is-senkam');

    dayCell.innerHTML = `
      <span class="masehi-num">${masehiDay}</span>
      <span class="hijri-num" title="${monthLabel}">${calculatedHijriDay} H</span>
    `;

    grid.appendChild(dayCell);
  }

  eventsList.innerHTML = `
    <li><strong>Ayyamul Bidh (${currentMonthName}):</strong> Tanggal 13, 14, 15 ${currentMonthName}</li>
    <li><strong>Puasa Senin-Kamis:</strong> Setiap hari Senin & Kamis</li>
  `;
}

// --- AL-QUR'AN DIGITAL ---
let currentAudio = null;

function fetchAllSurahs() {
  fetch('https://api.alquran.cloud/v1/surah')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('selectSurah');
      select.innerHTML = '<option value="">-- Pilih Surah --</option>';
      data.data.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.number;
        opt.textContent = `${s.number}. ${s.englishName} (${s.name})`;
        select.appendChild(opt);
      });
    });
}

function fetchSurah(surahNum) {
  if (!surahNum) return;

  const container = document.getElementById('quranContainer');
  container.innerHTML = '<p class="empty-state">Memuat ayat Al-Qur\'an...</p>';

  fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,id.indonesian`)
    .then(res => res.json())
    .then(data => {
      const arabAyahs = data.data[0].ayahs;
      const indoAyahs = data.data[1].ayahs;

      let html = '';

      if (parseInt(surahNum) !== 1 && parseInt(surahNum) !== 9) {
        html += `<div style="text-align: center; font-family: 'Amiri', serif; font-size: 24px; color: #004d40; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; margin-bottom: 16px;">بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ</div>`;
      }

      arabAyahs.forEach((ayah, i) => {
        let arabText = ayah.text;

        if (parseInt(surahNum) !== 1 && ayah.numberInSurah === 1) {
          arabText = arabText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '');
          arabText = arabText.replace(/^بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ\s*/, '');
        }

        const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;

        html += `
          <div class="ayat-box">
            <div class="ayat-header">
              <span class="ayat-number">${ayah.numberInSurah}</span>
              <button class="btn-play" onclick="playAudio('${audioUrl}')">▶ Audio</button>
            </div>
            <p class="arabic-text">${arabText}</p>
            <p class="translation-text">${indoAyahs[i].text}</p>
          </div>
        `;
      });

      container.innerHTML = html;
    });
}

function playAudio(url) {
  if (currentAudio) currentAudio.pause();
  currentAudio = new Audio(url);
  currentAudio.play();
}

document.getElementById('selectSurah').addEventListener('change', (e) => {
  fetchSurah(e.target.value);
});

// --- DZIKIR DATA ---
const dzikirData = [
  {
    category: 'matsurat_pagi',
    title: 'Membaca Ayat Kursi',
    count: '1x',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    latin: 'Allahu laa ilaaha illaa huwal hayyul qayyuum...',
    arti: 'Barangsiapa membacanya di pagi hari, ia akan dilindungi dari gangguan jin hingga sore hari.'
  },
  {
    category: 'matsurat_pagi',
    title: 'Membaca Surah Al-Ikhlas',
    count: '3x',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
    latin: 'Qul huwallahu ahad. Allahush shamad. Lam yalid wa lam yuulad. Wa lam yakul lahuu kufuwan ahad.',
    arti: 'Membacanya 3x setiap pagi dan petang mencukupkanmu dari segala sesuatu.'
  },
  {
    category: 'matsurat_pagi',
    title: 'Membaca Surah Al-Falaq',
    count: '3x',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾',
    latin: 'Qul a\'uudzu birabbil falaq...',
    arti: 'Perlindungan dari kejahatan makhluk, malam yang gelap, dan dengki.'
  },
  {
    category: 'matsurat_petang',
    title: 'Dzikir Petang: Sayyidul Istighfar',
    count: '1x',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    latin: 'Allahumma anta rabbii laa ilaaha illaa anta khalaqtanii wa anaa \'abduka...',
    arti: 'Barangsiapa membacanya di sore hari dengan penuh keyakinan lalu meninggal malam itu, ia masuk surga.'
  },
  {
    category: 'dzikir_salat',
    title: 'Istighfar Setelah Salat',
    count: '3x',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    latin: 'Astaghfirullahal \'adziim alladzii laa ilaaha illaa huwal hayyul qayyuumu wa atuubu ilaih.',
    arti: 'Memohon ampunan kepada Allah setelah menyelesaikan salat fardhu.'
  },
  {
    category: 'harian',
    title: 'Doa Keluar Rumah',
    count: '1x',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: 'Bismillahi tawakkaltu \'alallah, laa haula wa laa quwwata illaa billaah.',
    arti: 'Dengan nama Allah, aku bertawakal kepada Allah. Tiada daya dan upaya kecuali dengan pertolongan Allah.'
  }
];

function renderDzikir(filter = 'matsurat_pagi') {
  const container = document.getElementById('dzikirContainer');
  let html = '';

  const filtered = dzikirData.filter(d => d.category === filter);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">Dzikir untuk kategori ini belum tersedia.</p>';
    return;
  }

  filtered.forEach(d => {
    html += `
      <div class="dzikir-card">
        <div class="dzikir-header">
          <span class="dzikir-title">${d.title}</span>
          <span class="count-badge">${d.count}</span>
        </div>
        <p class="arabic-text">${d.arabic}</p>
        <p style="font-size: 11px; font-style: italic; color: #64748b; margin-bottom: 4px;">${d.latin}</p>
        <p class="translation-text">${d.arti}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}

document.querySelectorAll('.filter-pills .pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDzikir(btn.dataset.filter);
  });
});

// --- SELF-REMINDER DATA ---
const reminders = [
  {
    category: 'Ketenangan Hati',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    text: '"Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram."',
    source: '— QS. Ar-Ra\'d: 28',
    wisdom: 'Dzikir adalah obat bagi jiwa yang gelisah dan sarana mendekatkan diri kepada Sang Pencipta.'
  },
  {
    category: 'Sabar & Keikhlasan',
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    text: '"Sesungguhnya bersama kesulitan ada kemudahan."',
    source: '— QS. Al-Insyirah: 6',
    wisdom: 'Setiap ujian hidup yang dihadapi dengan kesabaran pasti diiringi jalan keluar dari Allah.'
  },
  {
    category: 'Akhlak & Kebaikan',
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    text: '"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya."',
    source: '— HR. Ahmad & Thabrani',
    wisdom: 'Ukur kebaikan diri dari seberapa besar manfaat, senyuman, dan bantuan yang bisa kita berikan kepada sesama.'
  }
];

function getRandomReminder() {
  const randomIndex = Math.floor(Math.random() * reminders.length);
  const r = reminders[randomIndex];

  document.getElementById('reminderCategory').textContent = r.category;
  document.getElementById('reminderArabic').textContent = r.arabic;
  document.getElementById('reminderText').textContent = r.text;
  document.getElementById('reminderSource').textContent = r.source;
  document.getElementById('reminderWisdom').textContent = r.wisdom;
}

document.getElementById('btnNewReminder').addEventListener('click', getRandomReminder);

document.getElementById('btnCopyReminder').addEventListener('click', () => {
  const text = `${document.getElementById('reminderArabic').textContent}\n\n${document.getElementById('reminderText').textContent}\n${document.getElementById('reminderSource').textContent}\n\nSelf-Reminder El Muslim`;
  navigator.clipboard.writeText(text).then(() => {
    alert('Teks berhasil disalin ke clipboard!');
  });
});

// Inisialisasi Awal
getLocation();
fetchAllSurahs();
renderDzikir('matsurat_pagi');
// Konfigurasi
const CONFIG = { 
    password: "MITRA GEMOY",
    mediaCount: 30,  
    slideshowSpeed: 3500
};

// Global Variables
let mouse = {x: null, y: null, isDown: false};
let allMediaData = [], visibleMedia = [], currentMediaIndex = 0;
let autoScrollInt = null;
let slideshowInterval = null, isPlayingSlide = false, currentRotation = 0;
let inactivityTimer;

// DOM Elements
const audio = document.getElementById('bg-audio');
const mBtn = document.getElementById('music-btn');
const viz = document.getElementById('audio-viz');
const circle = document.getElementById('scroll-circle');
const circumference = 26 * 2 * Math.PI;

// Audio Context untuk SFX
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ==================== EVENT LISTENERS ====================
window.addEventListener('mousedown', () => mouse.isDown = true);
window.addEventListener('mouseup', () => mouse.isDown = false);
window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', updateScrollRing);
window.addEventListener('click', createSpark);
window.addEventListener('mousemove', resetTimer);
window.addEventListener('touchstart', resetTimer);
window.addEventListener('scroll', resetTimer);
resetTimer();

// ==================== SPARK EFFECT ====================
function createSpark(e) {
    if(e.target.tagName === 'VIDEO' || e.target.tagName === 'IMG' && document.getElementById('lightbox').classList.contains('show')) return;
    for(let i = 0; i < 4; i++) {
        let spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = e.clientX + 'px';
        spark.style.top = e.clientY + 'px';
        document.body.appendChild(spark);
        let angle = Math.random() * Math.PI * 2;
        let velocity = 10 + Math.random() * 15;
        let tx = Math.cos(angle) * velocity;
        let ty = Math.sin(angle) * velocity;
        spark.animate([
            {transform: 'translate(0,0) scale(1)', opacity: 1},
            {transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0}
        ], {duration: 500, easing: 'ease-out'});
        setTimeout(() => spark.remove(), 500);
    }
    playSFX('tap');
}

// ==================== SFX ====================
function playSFX(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
}

// ==================== INACTIVITY DIMMER ====================
function resetTimer() {
    document.body.classList.remove('screensaver-active');
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => { document.body.classList.add('screensaver-active'); }, 20000);
}

// ==================== CHRONOS CLOCK ====================
function updateChronos() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibTime = new Date(utc + (3600000 * 7));
    
    document.getElementById('tb-hr').innerText = String(wibTime.getHours()).padStart(2, '0');
    document.getElementById('tb-min').innerText = String(wibTime.getMinutes()).padStart(2, '0');
    document.getElementById('tb-sec').innerText = String(wibTime.getSeconds()).padStart(2, '0');
    
    const dd = String(wibTime.getDate()).padStart(2, '0');
    const mm = String(wibTime.getMonth() + 1).padStart(2, '0');
    const yyyy = wibTime.getFullYear();
    document.getElementById('update-date').innerText = `${dd}-${mm}-${yyyy}`;
}
setInterval(updateChronos, 1000);
updateChronos();

// ==================== WISDOM ENGINE ====================
const wiseQuotes = ['"Tahu Bulat"'];

function typeWriterQuote() {
    const qEl = document.getElementById('quote-text');
    let qIdx = Math.floor(Math.random() * wiseQuotes.length);
    let text = wiseQuotes[qIdx];
    qEl.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            qEl.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 40);
        } else {
            setTimeout(typeWriterQuote, 8000);
        }
    }
    type();
}

// ==================== BACKGROUND CANVAS ====================
const bgCanvas = document.getElementById('bg-canvas');
const ctxBg = bgCanvas.getContext('2d');
const curCanvas = document.getElementById('cursor-canvas');
const ctxCur = curCanvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    curCanvas.width = window.innerWidth;
    curCanvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    for(let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            s: Math.random() * 1.5,
            v: Math.random() * 0.2 + 0.1,
            o: Math.random()
        });
    }
}

function drawGalaxy() {
    ctxBg.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctxCur.clearRect(0, 0, curCanvas.width, curCanvas.height);
    stars.forEach(st => {
        ctxBg.fillStyle = `rgba(255,255,255,${st.o})`;
        ctxBg.beginPath();
        ctxBg.arc(st.x, st.y, st.s, 0, Math.PI * 2);
        ctxBg.fill();
        st.y -= st.v;
        if(st.y < 0){
            st.y = bgCanvas.height;
            st.x = Math.random() * bgCanvas.width;
        }
        
        if(mouse.isDown && mouse.x != null) {
            let dx = mouse.x - st.x;
            let dy = mouse.y - st.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 150) {
                ctxCur.beginPath();
                ctxCur.strokeStyle = `rgba(0, 229, 255, ${1 - dist/150})`;
                ctxCur.lineWidth = 0.5;
                ctxCur.moveTo(mouse.x, mouse.y);
                ctxCur.lineTo(st.x, st.y);
                ctxCur.stroke();
            }
        }
    });
    requestAnimationFrame(drawGalaxy);
}

// ==================== LOADING SCREEN (7 Detik) ====================
let loadProgress = 0;
const loadInt = setInterval(() => {
    loadProgress += 1;
    document.getElementById('progress-bar').style.width = loadProgress + '%';
    document.getElementById('load-text').innerText = `SYSTEM INITIALIZATION... ${loadProgress}%`;
    
    if (loadProgress >= 100) {
        clearInterval(loadInt);
        const ls = document.getElementById('loading-screen');
        ls.style.opacity = '0';
        setTimeout(() => {
            ls.classList.add('hidden');
            document.getElementById('password-screen').classList.remove('hidden');
        }, 500);
    }
}, 70);

// ==================== PASSWORD CHECK ====================
function checkPassword() {
    if(document.getElementById('pass-input').value === CONFIG.password) {
        document.getElementById('fingerprint-icon').style.color = '#00ffaa';
        document.getElementById('fingerprint-icon').style.textShadow = '0 0 20px #00ffaa';
        const ps = document.getElementById('password-screen');
        setTimeout(() => {
            ps.style.opacity = '0';
            setTimeout(() => {
                ps.classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                initGallery();
                typeWriterQuote();
                document.getElementById('type-title').style.animation = "typing 2s steps(25, end) forwards, blink-caret .75s step-end infinite";
            }, 500);
        }, 500);
    } else {
        document.getElementById('pass-input').value = "";
        document.getElementById('pass-input').placeholder = "AKSES DITOLAK";
        document.getElementById('fingerprint-icon').style.color = '#ff3366';
        setTimeout(() => document.getElementById('fingerprint-icon').style.color = 'rgba(0,229,255,0.3)', 1000);
    }
}

// ==================== GALLERY INITIALIZATION ====================
function initGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    allMediaData = [];
    for (let i = 1; i <= CONFIG.mediaCount; i++) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.id = `card-${i}`;
        container.appendChild(card);
        detectAndLoadMedia(i, card);
    }
}

function detectAndLoadMedia(i, cardElement) {
    const formats = ['jpg', 'png', 'jpeg', 'mp4'];
    let currentFormatIdx = 0;
    
    function tryNextFormat() {
        if (currentFormatIdx >= formats.length) {
            cardElement.remove();
            return;
        }
        const ext = formats[currentFormatIdx];
        const url = `MY/${i}.${ext}`;
        const isVideo = ext === 'mp4';
        
        if (isVideo) {
            const vid = document.createElement('video');
            vid.src = url;
            vid.onloadedmetadata = () => { finalizeMediaLoad(i, url, 'video', cardElement); };
            vid.onerror = () => { currentFormatIdx++; tryNextFormat(); };
        } else {
            const img = new Image();
            img.src = url;
            img.onload = () => { finalizeMediaLoad(i, url, 'image', cardElement); };
            img.onerror = () => { currentFormatIdx++; tryNextFormat(); };
        }
    }
    tryNextFormat();
}

function finalizeMediaLoad(id, url, type, cardElement) {
    allMediaData.push({ id: id, url: url, type: type });
    allMediaData.sort((a, b) => a.id - b.id);
    visibleMedia = [...allMediaData];

    if (type === 'video') {
        cardElement.classList.add('is-video');
        cardElement.innerHTML = `<video src="${url}" muted loop playsinline class="media-backdrop"></video><video src="${url}" muted loop playsinline class="main-media"></video><div class="play-indicator"><i class="fas fa-play"></i></div>`;
    } else {
        cardElement.innerHTML = `<img src="${url}" class="media-backdrop"><img src="${url}" loading="lazy" class="main-media">`;
    }
    cardElement.classList.add('loaded');
    cardElement.onclick = () => {
        const targetIndex = visibleMedia.findIndex(m => m.url === url);
        openLightbox(targetIndex);
    };
}

// ==================== GALLERY FUNCTIONS ====================
function toggleZen() {
    document.body.classList.toggle('zen-mode');
}

function togglePrivacy() {
    document.body.classList.toggle('privacy-mode');
}

function shuffleMemory() {
    let array = [...visibleMedia];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    visibleMedia = array;
    rebuildGrid(visibleMedia);
}

function rebuildGrid(mediaArray) {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    mediaArray.forEach((media) => {
        const card = document.createElement('div');
        card.className = `media-card loaded ${media.type === 'video' ? 'is-video' : ''}`;
        card.innerHTML = media.type === 'video'
            ? `<video src="${media.url}" muted loop playsinline class="media-backdrop"></video><video src="${media.url}" muted loop playsinline class="main-media"></video><div class="play-indicator"><i class="fas fa-play"></i></div>`
            : `<img src="${media.url}" class="media-backdrop"><img src="${media.url}" loading="lazy" class="main-media">`;
        card.addEventListener('click', () => {
            const targetIndex = visibleMedia.findIndex(m => m.url === media.url);
            openLightbox(targetIndex);
        });
        container.appendChild(card);
    });
}

function toggleAutoScroll() {
    const btn = document.getElementById('scroll-btn');
    if(autoScrollInt) {
        clearInterval(autoScrollInt);
        autoScrollInt = null;
        btn.classList.remove('active');
    } else {
        autoScrollInt = setInterval(() => { window.scrollBy(0, 1); }, 30);
        btn.classList.add('active');
    }
}

function filterGallery(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visibleMedia = allMediaData.filter(media => {
        const isFav = localStorage.getItem(media.url) === 'true';
        if (type === 'all') return true;
        if (type === 'photo' && media.type === 'image') return true;
        if (type === 'video' && media.type === 'video') return true;
        if (type === 'favorite' && isFav) return true;
        return false;
    });
    rebuildGrid(visibleMedia);
}

// ==================== LIGHTBOX ====================
function openLightbox(index) {
    if(index === -1) return;
    currentMediaIndex = index;
    updateLightboxView();
    const lb = document.getElementById('lightbox');
    lb.classList.remove('hidden');
    setTimeout(() => lb.classList.add('show'), 10);
}

function updateLightboxView() {
    const media = visibleMedia[currentMediaIndex];
    if(!media) return;
    const cont = document.getElementById('lb-media-container');
    
    currentRotation = 0;
    cont.style.opacity = 0;
    cont.style.transform = 'scale(0.95)';
    document.getElementById('lb-index').innerText = `[ ${currentMediaIndex + 1} / ${visibleMedia.length} ]`;
    document.getElementById('download-btn').href = media.url;
    document.getElementById('lb-stardate').innerText = `MEM-REC: ${(media.url.length * 1337 % 9999).toString().padStart(4, '0')}`;
    
    setTimeout(() => {
        cont.innerHTML = media.type === 'video'
            ? `<video id="lb-video" src="${media.url}" controls playsinline></video>`
            : `<img id="lb-img" src="${media.url}">`;
        checkFavState(media.url);
        cont.style.opacity = 1;
        cont.style.transform = 'scale(1)';
    }, 200);
}

function rotateMedia() {
    currentRotation = (currentRotation + 90) % 360;
    const mediaTag = document.getElementById('lb-img') || document.getElementById('lb-video');
    if(mediaTag) {
        mediaTag.style.transform = `rotate(${currentRotation}deg)`;
    }
}

function navigateMedia(dir, e) {
    if(e) e.stopPropagation();
    currentMediaIndex = (currentMediaIndex + dir + visibleMedia.length) % visibleMedia.length;
    updateLightboxView();
}

function toggleSlideshow() {
    const btn = document.getElementById('slideshow-btn');
    const icon = btn.querySelector('i');
    isPlayingSlide = !isPlayingSlide;
    if (isPlayingSlide) {
        btn.classList.add('active-state');
        icon.className = 'fas fa-pause';
        slideshowInterval = setInterval(() => navigateMedia(1, null), CONFIG.slideshowSpeed);
    } else {
        btn.classList.remove('active-state');
        icon.className = 'fas fa-play';
        clearInterval(slideshowInterval);
    }
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    lb.classList.remove('show');
    if(isPlayingSlide) toggleSlideshow();
    setTimeout(() => {
        lb.classList.add('hidden');
        document.getElementById('lb-media-container').innerHTML = "";
    }, 300);
}

function toggleFavorite() {
    const media = visibleMedia[currentMediaIndex];
    if(!media) return;
    localStorage.setItem(media.url, !(localStorage.getItem(media.url) === 'true'));
    checkFavState(media.url);
}

function checkFavState(url) {
    const btn = document.getElementById('fav-btn');
    if(localStorage.getItem(url) === 'true') {
        btn.classList.add('is-fav');
    } else {
        btn.classList.remove('is-fav');
    }
}

// ==================== SCROLL RING ====================
function updateScrollRing() {
    const st = document.documentElement.scrollHeight - window.innerHeight;
    if(st > 0) {
        circle.style.strokeDashoffset = circumference - ((window.scrollY / st) * circumference);
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== MUSIC CONTROLS ====================
function toggleMusic(e) {
    e.stopPropagation();
    if (audio.paused) {
        audio.play().catch(()=>{});
        mBtn.classList.add('playing');
        viz.classList.add('playing');
    } else {
        audio.pause();
        mBtn.classList.remove('playing');
        viz.classList.remove('playing');
    }
}

// ==================== SWIPE GESTURE ====================
const lbArea = document.getElementById('lb-media-container');
let startX = 0;

lbArea.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
});

lbArea.addEventListener('touchend', e => {
    let endX = e.changedTouches[0].clientX;
    if(startX - endX > 50) navigateMedia(1);
    else if(endX - startX > 50) navigateMedia(-1);
});

// ==================== INITIALIZATION ====================
resizeCanvas();
drawGalaxy();
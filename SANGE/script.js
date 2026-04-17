const FOLDER_PATH = "MY/";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".mp4"];

let allMedia = [];
let currentFiltered = [];
let favs = JSON.parse(localStorage.getItem('my_favs')) || [];
let currentModalMedia = null;
let audioPlayer = null;
let isMusicPlaying = false;
let colorIndex = 0;
const borderClasses = ['purple', 'blue-border', 'white-border'];
let borderInterval = null;
let slideInterval = null;
let currentTypeFilter = "all";

const vibrate = (ms = 40) => { if(navigator.vibrate) navigator.vibrate(ms); };

/* --- THEMES --- */
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        vibrate(30);
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        document.documentElement.style.setProperty('--glow-color', dot.getAttribute('data-glow'));
        document.documentElement.style.setProperty('--border-primary', dot.getAttribute('data-bdr'));
        document.documentElement.style.setProperty('--btn-grad-1', dot.getAttribute('data-g1'));
        document.documentElement.style.setProperty('--btn-grad-2', dot.getAttribute('data-g2'));
    });
});

/* --- MUSIC & MENU ASLI --- */
const musicBtn = document.getElementById('musicBtn');
musicBtn.addEventListener('click', () => {
    vibrate(40);
    if (!audioPlayer) { audioPlayer = new Audio(`${FOLDER_PATH}1.mp3`); audioPlayer.loop = true; }
    if (isMusicPlaying) { audioPlayer.pause(); isMusicPlaying = false; musicBtn.innerHTML = '<i class="fas fa-music"></i> Music'; } 
    else { audioPlayer.play().catch(()=>{}); isMusicPlaying = true; musicBtn.innerHTML = '<i class="fas fa-stop"></i> Stop'; }
});

const toggleDownUpBtn = document.getElementById('toggleDownUpBtn');
const refreshMenu = document.getElementById('refreshMenu');
let menuOpen = false;
toggleDownUpBtn.addEventListener('click', () => {
    vibrate(30); menuOpen = !menuOpen;
    if (menuOpen) { refreshMenu.classList.add('show'); toggleDownUpBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'; } 
    else { refreshMenu.classList.remove('show'); toggleDownUpBtn.innerHTML = '<i class="fas fa-chevron-up"></i>'; }
});

document.getElementById('refreshCollectionBtn').addEventListener('click', async () => {
    vibrate(30); menuOpen = false; refreshMenu.classList.remove('show'); toggleDownUpBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.getElementById('galeriGrid').innerHTML = `<div class="empty-message"><i class="fas fa-spinner fa-pulse"></i><p>Memuat ulang koleksi...</p></div>`;
    await detectAllMediaConcurrently();
    applyFilters();
});

/* --- GO TO TOP --- */
window.addEventListener('scroll', () => {
    if(window.scrollY > 300) document.getElementById('goToTop').classList.add('show');
    else document.getElementById('goToTop').classList.remove('show');
});
document.getElementById('goToTop').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

/* --- TYPING & DATE ASLI --- */
function updateDateTime() {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    document.getElementById('datetimeDisplay').innerHTML = 
        `${wibTime.getUTCHours().toString().padStart(2, '0')}:${wibTime.getUTCMinutes().toString().padStart(2, '0')}:${wibTime.getUTCSeconds().toString().padStart(2, '0')} WIB · ${wibTime.getUTCDate().toString().padStart(2, '0')}/${(wibTime.getUTCMonth() + 1).toString().padStart(2, '0')}/${wibTime.getUTCFullYear()}`;
}
setInterval(updateDateTime, 1000); updateDateTime();

const fullName = "FebryJW🚀"; let currentTyped = ""; let tId = null;
function typeCycle() {
    if(currentTyped.length < fullName.length) {
        currentTyped = fullName.substring(0, currentTyped.length + 1);
        document.getElementById('typingName').innerText = currentTyped;
        tId = setTimeout(typeCycle, 120);
    } else setTimeout(deleteCycle, 3000);
}
function deleteCycle() {
    if(currentTyped.length > 0) {
        currentTyped = currentTyped.substring(0, currentTyped.length - 1);
        document.getElementById('typingName').innerText = currentTyped;
        tId = setTimeout(deleteCycle, 100);
    } else setTimeout(typeCycle, 3000);
}

/* --- LOGIKA DETEKSI FILE (YANG BENAR & TIDAK DOUBLE) --- */
async function fileExists(url) {
    try {
        const res = await fetch(url + `?cb=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        return res.ok;
    } catch(e) { return false; }
}

async function checkExts(i) {
    for (let ext of EXTENSIONS) {
        const url = `${FOLDER_PATH}${i}${ext}`;
        const exists = await fileExists(url);
        if (exists) {
            return { index: i, src: url, type: ext === '.mp4' ? 'video' : 'image' };
        }
    }
    return null;
}

async function detectAllMediaConcurrently() {
    allMedia = [];
    const maxId = 150;
    const batchSize = 10; 
    
    for (let i = 1; i <= maxId; i += batchSize) {
        const promises = [];
        for (let j = i; j < i + batchSize && j <= maxId; j++) {
            promises.push(checkExts(j));
        }
        const results = await Promise.all(promises);
        const validFiles = results.filter(r => r !== null);
        allMedia.push(...validFiles);
        
        if (validFiles.length === 0 && i > 20) break;
    }
    
    allMedia.sort((a, b) => a.index - b.index);
    document.getElementById('dynamicCounter').innerHTML = `Total Koleksi: ${allMedia.length}`;
}

/* --- RENDER GALLERY ASLI --- */
function renderGallery(mediaList) {
    const grid = document.getElementById('galeriGrid');
    grid.innerHTML = '';
    if (mediaList.length === 0) {
        grid.innerHTML = `<div class="empty-message"><i class="fas fa-images"></i><p>Koleksi Tidak Ada</p></div>`;
        return;
    }

    mediaList.forEach(m => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const frame = document.createElement('div');
        frame.className = 'photo-frame';
        
        const isFav = favs.includes(m.index);
        const favBtn = document.createElement('div');
        favBtn.className = `fav-btn ${isFav ? 'active' : ''}`;
        favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        favBtn.onclick = (e) => { e.stopPropagation(); toggleFav(m.index, favBtn); };

        if (m.type === 'video') {
            const vid = document.createElement('video');
            vid.className = 'blur-up';
            vid.muted = true; vid.loop = true; vid.playsInline = true;
            vid.src = m.src;
            vid.onloadeddata = () => vid.classList.add('loaded');
            frame.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.className = 'blur-up';
            img.loading = "lazy";
            img.onload = () => img.classList.add('loaded');
            img.onerror = function() { this.src = 'https://n.uguu.se/ztaVUtjW.jpeg'; this.classList.add('loaded'); };
            img.src = m.src;
            frame.appendChild(img);
        }
        
        frame.appendChild(favBtn);
        frame.onclick = () => openModal(m);
        item.appendChild(frame);
        
        const cap = document.createElement('div');
        cap.className = 'caption-foto';
        cap.innerHTML = `<i class="fas fa-hashtag"></i> SEC_ID: ${m.index}`;
        item.appendChild(cap);
        grid.appendChild(item);
    });

    if (borderInterval) clearInterval(borderInterval);
    borderInterval = setInterval(() => {
        colorIndex = (colorIndex + 1) % borderClasses.length;
        document.querySelectorAll('.photo-frame').forEach(f => {
            f.classList.remove('amoled-blue', 'white-border', 'blue-border', 'purple');
            f.classList.add(borderClasses[colorIndex]);
        });
    }, 3000);
}

function toggleFav(idx, btnEl) {
    vibrate(40);
    if(favs.includes(idx)) {
        favs = favs.filter(x => x !== idx);
        btnEl.classList.remove('active');
        btnEl.innerHTML = '<i class="far fa-heart"></i>';
    } else {
        favs.push(idx);
        btnEl.classList.add('active');
        btnEl.innerHTML = '<i class="fas fa-heart"></i>';
    }
    localStorage.setItem('my_favs', JSON.stringify(favs));
    if(currentTypeFilter === 'fav') applyFilters();
}

/* --- FILTER --- */
function applyFilters() {
    const sVal = document.getElementById('searchInput').value.trim();
    let temp = [...allMedia];
    
    if (sVal !== "" && !isNaN(sVal)) temp = temp.filter(m => m.index === parseInt(sVal, 10));
    
    if (currentTypeFilter === 'image') temp = temp.filter(m => m.type === 'image');
    else if (currentTypeFilter === 'video') temp = temp.filter(m => m.type === 'video');
    else if (currentTypeFilter === 'fav') temp = temp.filter(m => favs.includes(m.index));
    
    currentFiltered = temp;
    renderGallery(currentFiltered);
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        vibrate(30);
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const tBtn = e.target.closest('.filter-btn');
        tBtn.classList.add('active');
        currentTypeFilter = tBtn.getAttribute('data-filter');
        applyFilters();
    });
});

document.getElementById('searchBtn').onclick = () => { vibrate(30); applyFilters(); };
document.getElementById('resetBtn').onclick = () => { vibrate(30); document.getElementById('searchInput').value = ""; applyFilters(); };
document.getElementById('searchInput').onkeypress = (e) => { if(e.key === 'Enter') { vibrate(30); applyFilters(); }};

/* --- MODAL & SWIPE DOWN --- */
const modal = document.getElementById('mediaModal');
const modalMedia = document.getElementById('modalMedia');
const modalWrapper = document.getElementById('modalWrapper');

function openModal(mObj) {
    vibrate(30);
    currentModalMedia = mObj;
    location.hash = "view-" + mObj.index;
    modalMedia.innerHTML = '';
    
    if (mObj.type === 'video') {
        const vid = document.createElement('video');
        vid.src = mObj.src; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
        vid.onplay = () => { if(isMusicPlaying && audioPlayer) audioPlayer.pause(); };
        vid.onpause = () => { if(isMusicPlaying && audioPlayer) audioPlayer.play(); };
        modalMedia.appendChild(vid);
    } else {
        const img = document.createElement('img');
        img.src = mObj.src;
        modalMedia.appendChild(img);
    }
    
    modalWrapper.style.transform = 'translateY(0) scale(1)';
    modal.classList.add('active');
}

function closeModal() {
    vibrate(30);
    location.hash = "";
    modal.classList.remove('active');
    const v = modalMedia.querySelector('video');
    if(v) { v.pause(); v.src=''; }
    if(isMusicPlaying && audioPlayer) audioPlayer.play().catch(()=>{});
    if(slideInterval) setSlideMode('off');
    setTimeout(() => modalMedia.innerHTML='', 300);
}

document.getElementById('modalClose').onclick = closeModal;
window.onhashchange = () => { 
    if(!location.hash) closeModal(); 
    else if(location.hash.includes('view-')) {
        const id = parseInt(location.hash.split('-')[1]);
        const found = allMedia.find(x => x.index === id);
        if(found) openModal(found);
    }
};

function navModal(dir) {
    vibrate(20);
    if(!currentFiltered.length || !currentModalMedia) return;
    let idx = currentFiltered.findIndex(x => x.index === currentModalMedia.index) + dir;
    if(idx < 0) idx = currentFiltered.length - 1;
    if(idx >= currentFiltered.length) idx = 0;
    openModal(currentFiltered[idx]);
}
document.getElementById('modalPrev').onclick = (e) => { e.stopPropagation(); navModal(-1); };
document.getElementById('modalNext').onclick = (e) => { e.stopPropagation(); navModal(1); };

/* PULL DOWN DISMISS */
let startY = 0, currentY = 0, isPulling = false;
modal.addEventListener('touchstart', e => {
    if(e.target.closest('.modal-tools') || e.target.closest('.modal-nav') || e.target.closest('.modal-close') || e.target.closest('.modal-download-btn')) return;
    startY = e.touches[0].clientY;
    isPulling = true;
    modalWrapper.style.transition = 'none';
}, {passive:true});
modal.addEventListener('touchmove', e => {
    if(!isPulling) return;
    currentY = e.touches[0].clientY;
    let dy = currentY - startY;
    if(dy > 0) {
        let scale = Math.max(0.8, 1 - (dy/1000));
        modalWrapper.style.transform = `translateY(${dy}px) scale(${scale})`;
    }
}, {passive:true});
modal.addEventListener('touchend', e => {
    if(!isPulling) return;
    isPulling = false;
    modalWrapper.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    if(currentY - startY > 120) closeModal();
    else modalWrapper.style.transform = 'translateY(0) scale(1)';
});

document.getElementById('modalDownloadBtn').onclick = () => {
    vibrate(40);
    const a = document.createElement('a');
    a.href = currentModalMedia.src;
    a.download = `MY_BEAUTIFUL_${currentModalMedia.index}.${currentModalMedia.type==='video'?'mp4':'jpg'}`;
    a.click();
};

function setSlideMode(mode) {
    vibrate(30);
    if(slideInterval) clearInterval(slideInterval);
    document.querySelectorAll('.slide-btn').forEach(b => b.classList.remove('active'));
    if(mode === '5s') {
        document.getElementById('slide5s').classList.add('active');
        slideInterval = setInterval(()=>navModal(1), 5000);
    } else if(mode === '10s') {
        document.getElementById('slide10s').classList.add('active');
        slideInterval = setInterval(()=>navModal(1), 10000);
    } else {
        document.getElementById('slideOff').classList.add('active');
    }
}
document.getElementById('slideOff').onclick = () => setSlideMode('off');
document.getElementById('slide5s').onclick = () => setSlideMode('5s');
document.getElementById('slide10s').onclick = () => setSlideMode('10s');

/* --- INIT & LOADING ASLI 30 DETIK --- */
async function init() {
    typeCycle();
    
    const fetchTask = detectAllMediaConcurrently();
    
    let el = 0; const totalTime = 30;
    const progressInterval = setInterval(() => {
        el += 0.1;
        let percent = Math.min((el / totalTime) * 100, 100);
        document.getElementById('progressFill').style.width = percent + '%';
        
        let timeLeft = Math.max(0, Math.ceil(totalTime - el));
        document.getElementById('timerText').innerText = `${timeLeft} detik menuju koleksi`;
        
        if (el >= totalTime) {
            clearInterval(progressInterval);
            document.getElementById('timerText').innerText = `Membuka koleksi...`;
            
            fetchTask.then(() => {
                applyFilters();
                document.getElementById('loadingOverlay').classList.add('hide');
            });
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', init);
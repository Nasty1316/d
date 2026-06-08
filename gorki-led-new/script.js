// Мобильное меню
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const isHttpContext = window.location.protocol === 'http:' || window.location.protocol === 'https:';

let currentSiteUser = null;

const FACILITY_DURATIONS = {
    ice: 60,
    gym: 90,
    stadium: 120,
    fitness: 60,
    other: 60
};

const BOOKING_TIME_START = 9 * 60;
const BOOKING_TIME_END = 23 * 60;

function populateBookingTimeOptions() {
    const select = document.getElementById('bookingTimePref');
    if (!select) return;
    const placeholder = tr('booking-time-placeholder');
    const current = select.value;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
    for (let mins = BOOKING_TIME_START; mins <= BOOKING_TIME_END; mins += 30) {
        const h = String(Math.floor(mins / 60)).padStart(2, '0');
        const m = String(mins % 60).padStart(2, '0');
        const val = `${h}:${m}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    }
    if (current && select.querySelector(`option[value="${current}"]`)) {
        select.value = current;
    }
}

function isBookingTimeAllowed(timeStr) {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
    const parts = timeStr.split(':');
    const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return mins >= BOOKING_TIME_START && mins <= BOOKING_TIME_END;
}

async function ensureUserAuth() {
    if (!isHttpContext) return null;
    try {
        const res = await fetch('api/auth.php?action=me', { credentials: 'same-origin' });
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = 'auth.html';
            return null;
        }
        currentSiteUser = data.user;
        setupUserNav();
        return data.user;
    } catch (err) {
        console.warn('Auth check failed', err);
        return null;
    }
}

function setupUserNav() {
    const controls = document.querySelector('.nav-controls');
    if (!controls || !currentSiteUser) return;
    let userBar = document.getElementById('userNavBar');
    if (!userBar) {
        userBar = document.createElement('div');
        userBar.id = 'userNavBar';
        userBar.className = 'user-nav-bar';
        controls.insertBefore(userBar, controls.firstChild);
    }
    const name = currentSiteUser.full_name || currentSiteUser.email || '';
    userBar.innerHTML = `
        <span class="user-nav-name" title="${escapeAttr(name)}"><i class="fas fa-user-circle"></i> ${escapeHtml(name)}</span>
        <button type="button" class="user-logout-btn" id="userLogoutBtn" title="${escapeAttr(tr('auth-logout'))}"><i class="fas fa-sign-out-alt"></i></button>
    `;
    const logoutBtn = document.getElementById('userLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('api/auth.php?action=logout', { method: 'POST', credentials: 'same-origin' });
            } catch (e) {}
            window.location.href = 'auth.html';
        });
    }
}

async function loadBookingAvailability() {
    const facility = document.getElementById('bookingFacility')?.value;
    const date = document.getElementById('bookingDate')?.value;
    const hint = document.getElementById('bookingBusySlots');
    const durationSelect = document.getElementById('bookingDuration');
    if (!hint || !isHttpContext) return;
    if (!facility || !date) {
        hint.textContent = '';
        hint.style.display = 'none';
        return;
    }
    if (durationSelect && FACILITY_DURATIONS[facility]) {
        durationSelect.value = String(FACILITY_DURATIONS[facility]);
    }
    try {
        const res = await fetch(`api/bookings.php?action=availability&facility=${encodeURIComponent(facility)}&date=${encodeURIComponent(date)}`);
        const data = await res.json();
        if (!data.success || !data.busy_slots?.length) {
            hint.textContent = tr('booking-no-conflicts');
            hint.className = 'booking-busy-hint ok';
            hint.style.display = 'block';
            return;
        }
        const parts = data.busy_slots.map(s => `${s.start_time}–${s.end_time}`);
        hint.textContent = tr('booking-busy-slots') + ': ' + parts.join(', ');
        hint.className = 'booking-busy-hint busy';
        hint.style.display = 'block';
    } catch (err) {
        hint.style.display = 'none';
    }
}

function prefillBookingForm(user) {
    if (!user) return;
    const nameEl = document.getElementById('bookingName');
    const phoneEl = document.getElementById('bookingPhone');
    const emailEl = document.getElementById('bookingEmail');
    if (nameEl && user.full_name) nameEl.value = user.full_name;
    if (phoneEl && user.phone) phoneEl.value = user.phone;
    if (emailEl && user.email) emailEl.value = user.email;
}

function tr(key) {
    const lang = localStorage.getItem('selectedLanguage') || 'ru';
    const pack = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : null;
    const fallback = (typeof translations !== 'undefined' && translations.ru) ? translations.ru : {};
    if (pack && pack[key]) return pack[key];
    if (fallback[key]) return fallback[key];
    return key;
}

function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function escapeAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

const EMBEDDED_SCHEDULE_FALLBACK = {
    note: 'Полное расписание подгружается с сервера (файл data/schedule.json). Ориентир по времени — справка 8 (02233) 7-30-11.',
    featured: {
        title: 'МАССОВОЕ КАТАНИЕ 2026',
        period: 'Февраль 2026',
        sessions: [
            { label: '24–27 февраля', time: '20:00' },
            { label: '28 февраля', time: '16:00; 18:00' },
            { label: '1 марта', time: '18:30' }
        ],
        highlight: 'Бесплатное использование беговых дорожек на стадионе ежедневно с 7:00 до 9:00',
        phone: '7-30-11',
        phoneTel: '+375223373011'
    },
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, i) => ({
        label,
        labelFull: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][i],
        items: [
            {
                time: 'уточняйте',
                title: 'Массовое катание, аренда льда и секции — по графику школы',
                place: 'Ледовая арена и другие объекты'
            }
        ]
    }))
};

// Загрузка новостей из localStorage
function loadNewsFromStorage() {
    try {
        const stored = localStorage.getItem('gorkiNews');
        if (stored) {
            const news = JSON.parse(stored);
            if (Array.isArray(news)) {
                console.log(`Загружено ${news.length} новостей`);
                return news;
            } else {
                console.warn('Некорректные данные новостей в localStorage, очищаем');
                localStorage.removeItem('gorkiNews');
                return [];
            }
        }
        return [];
    } catch (error) {
        console.error('Ошибка при загрузке новостей:', error);
        localStorage.removeItem('gorkiNews');
        return [];
    }
}

// Отображение новостей на сайте
function renderSiteNews() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    
    const newsItems = loadNewsFromStorage();
    
    if (newsItems.length === 0) {
        // Если нет новостей, оставляем существующие карточки
        return;
    }
    
    // Очищаем существующие карточки новостей
    newsGrid.innerHTML = '';
    
    // Добавляем новости из localStorage
    newsItems.forEach((news, index) => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        const newsDate = new Date(news.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        newsCard.innerHTML = `
            <div class="news-header">
                <h3>${news.title}</h3>
                <span class="news-date">${newsDate}</span>
            </div>
            <div class="news-content">
                <p>${news.excerpt || news.content.substring(0, 150) + '...'}</p>
                <button class="btn btn-secondary" onclick="showNewsDetails(${index})" style="margin-top: 1rem;">
                    <i class="fas fa-arrow-right"></i> Подробнее
                </button>
            </div>
        `;
        
        newsGrid.appendChild(newsCard);
    });
}

// Показать детали новости
function showNewsDetails(index) {
    const newsItems = loadNewsFromStorage();
    const news = newsItems[index];
    
    if (!news) return;
    
    // Создаем модальное окно для просмотра новости
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${news.title}</h3>
                <button class="modal-close" onclick="closeNewsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="news-meta">
                    <span class="news-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(news.createdAt).toLocaleString('ru-RU')}
                    </span>
                </div>
                <div class="news-full-content">
                    ${news.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeNewsModal()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Закрыть модальное окно новости
function closeNewsModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Блок цен на главной (редактируется в админке, ключ gorkiPrices)
function renderSitePrices() {
    const wrap = document.getElementById('gorkiPricesContainer');
    if (!wrap) return;
    let items;
    try {
        const raw = localStorage.getItem('gorkiPrices');
        if (!raw) {
            wrap.style.display = 'none';
            wrap.innerHTML = '';
            return;
        }
        items = JSON.parse(raw);
    } catch (e) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }
    if (!Array.isArray(items) || items.length === 0) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }
    const valid = items.filter((p) => p && String(p.name || '').trim() && String(p.price || '').trim());
    if (valid.length === 0) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }
    wrap.style.display = 'block';
    wrap.innerHTML = `
        <div class="managed-prices-inner">
            <h3 data-translate="prices-title">Тарифы и услуги</h3>
            <div class="managed-prices-grid">
                ${valid.map((p) => `
                    <div class="managed-price-card">
                        <h4 data-translate="price-name-${p.key}">${escapeHtml(p.name)}</h4>
                        <div class="price-value" data-translate="price-price-${p.key}">${escapeHtml(p.price)}</div>
                        ${p.description ? `<p data-translate="price-desc-${p.key}">${escapeHtml(p.description)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'ru';
    if (typeof applyTranslationsToElements === 'function') {
        applyTranslationsToElements(wrap.querySelectorAll('[data-translate], [data-translate-html]'), savedLanguage);
    }
}

// Загрузка данных "О нас" из localStorage
function loadAboutFromStorage() {
    try {
        const stored = localStorage.getItem('gorkiAbout');
        if (stored) {
            const about = JSON.parse(stored);
            if (about && typeof about === 'object') {
                console.log('Загружены данные "О нас"');
                return about;
            } else {
                console.warn('Некорректные данные "О нас" в localStorage, очищаем');
                localStorage.removeItem('gorkiAbout');
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('Ошибка при загрузке данных "О нас":', error);
        localStorage.removeItem('gorkiAbout');
        return null;
    }
}

// Обновление раздела "О нас" на сайте
function updateAboutSection() {
    const aboutSection = document.querySelector('.about');
    if (!aboutSection) return;
    
    const aboutData = loadAboutFromStorage();
    if (!aboutData) return;
    
    // Обновляем заголовок раздела
    const sectionHeader = aboutSection.querySelector('.section-header h2');
    if (sectionHeader && aboutData.title) {
        sectionHeader.textContent = aboutData.title;
    }
    
    // Обновляем подзаголовок
    const sectionSubtitle = aboutSection.querySelector('.section-header p');
    if (sectionSubtitle && aboutData.subtitle) {
        sectionSubtitle.textContent = aboutData.subtitle;
    }
    
    // Обновляем описание
    const aboutText = aboutSection.querySelector('.about-text h3');
    if (aboutText && aboutData.description) {
        aboutText.nextElementSibling.textContent = aboutData.description;
    }
    
    // Обновляем статистику
    const statsItems = aboutSection.querySelectorAll('.stat-item h4');
    if (statsItems.length >= 3) {
        if (aboutData.years) statsItems[0].textContent = aboutData.years;
        if (aboutData.students) statsItems[1].textContent = aboutData.students;
        if (aboutData.sports) statsItems[2].textContent = aboutData.sports;
    }
}

// Загрузка галереи из localStorage
function loadGalleryFromStorage() {
    try {
        const stored = localStorage.getItem('gorkiGallery');
        if (stored) {
            const images = JSON.parse(stored);
            // Поддерживаем старый формат (data) и серверный формат (url)
            if (Array.isArray(images) && images.every(img => img && (img.data || img.url))) {
                console.log(`Загружено ${images.length} изображений галереи`);
                return images;
            } else {
                console.warn('Некорректные данные галереи в localStorage, очищаем');
                localStorage.removeItem('gorkiGallery');
                return [];
            }
        }
        return [];
    } catch (error) {
        console.error('Ошибка при загрузке галереи:', error);
        localStorage.removeItem('gorkiGallery');
        return [];
    }
}

/** Преобразование файлов из папки images в единый формат */
function mapFolderImageFiles(files) {
    if (!Array.isArray(files)) {
        return [];
    }
    return files.map((f) => ({
        name: f.name,
        url: f.url,
        data: f.url || f.data || '',
        size: f.size || 0,
        type: f.type || 'image/jpeg',
        uploadDate: f.uploadDate || new Date().toISOString()
    }));
}

/** Загрузка изображений из папки images/{type}/ */
async function loadImagesFromFolder(type) {
    if (!isHttpContext) {
        return [];
    }
    try {
        const response = await fetch(`get_images.php?type=${encodeURIComponent(type)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.files)) {
            return mapFolderImageFiles(result.files);
        }
    } catch (error) {
        console.log(`Изображения (${type}) из папки images недоступны:`, error.message);
    }
    return [];
}

/** Загрузка галереи из папки images/gallery */
async function loadGalleryFromImageFolder() {
    return loadImagesFromFolder('gallery');
}

/** Единая загрузка галереи: БД → localStorage → папка images */
async function loadGalleryImages() {
    try {
        const dbImages = await loadFromDatabase('gallery');
        if (dbImages && Array.isArray(dbImages) && dbImages.length > 0) {
            simpleSave('gorkiGallery', dbImages);
            return dbImages;
        }
    } catch (error) {
        console.log('База данных галереи недоступна:', error.message);
    }

    const localImages = loadGalleryFromStorage();
    if (localImages.length > 0) {
        return localImages;
    }

    if (isHttpContext) {
        const folderImages = await loadGalleryFromImageFolder();
        if (folderImages.length > 0) {
            simpleSave('gorkiGallery', folderImages);
            return folderImages;
        }
    }

    return [];
}

// Отображение галереи на сайте
async function renderSiteGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    let uploadedImages = await loadGalleryImages();
    if (!Array.isArray(uploadedImages)) {
        uploadedImages = [];
    }
    
    if (uploadedImages.length === 0) {
        // Если нет загруженных изображений, показываем одно сообщение
        galleryGrid.innerHTML = `
            <div class="gallery-item empty-gallery-message">
                <div class="gallery-image">
                    <i class="fas fa-images"></i>
                </div>
                <div class="gallery-overlay">
                    <h4 data-translate="gallery-title">Фотогалерея</h4>
                    <p data-translate="gallery-description">Фотографии наших объектов и мероприятий</p>
                </div>
            </div>
        `;
        if (typeof switchLanguage === 'function') {
            switchLanguage(localStorage.getItem('selectedLanguage') || 'ru');
        }
        return;
    }

    const uploadedLabel = tr('gallery-uploaded');
    const lang = localStorage.getItem('selectedLanguage') || 'ru';
    const locale = lang === 'en' ? 'en-GB' : (lang === 'be' ? 'be-BY' : 'ru-RU');

    galleryGrid.innerHTML = uploadedImages.map((image, index) => `
        <div class="gallery-item" onclick="openLightbox('${image.data || image.url || ''}', ${JSON.stringify(uploadedImages).replace(/"/g, '&quot;')}, ${index})">
            <div class="gallery-image">
                <img src="${image.data || image.url || ''}" alt="${escapeHtml(image.name || tr('gallery-photo-alt'))}">
            </div>
            <div class="gallery-overlay">
                <h4>${escapeHtml((image.name || tr('gallery-photo-alt')).replace(/\.[^/.]+$/, ''))}</h4>
                <p>${escapeHtml(uploadedLabel)} ${new Date(image.uploadDate || Date.now()).toLocaleDateString(locale)}</p>
            </div>
        </div>
    `).join('');
}

// Загрузка фонового изображения главного экрана из localStorage
function loadHeroImageFromStorage() {
    const stored = localStorage.getItem('gorkiHeroImage');
    if (!stored) {
        return null;
    }
    try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.url || parsed.data)) {
            return parsed;
        }
    } catch (error) {
        localStorage.removeItem('gorkiHeroImage');
    }
    return null;
}

/** Единая загрузка фона главного экрана: БД → localStorage → images/hero */
async function loadHeroImageData() {
    try {
        const response = await fetch('api.php?action=get_hero_images');
        if (response.ok) {
            const result = await response.json();
            if (result && result.success && result.image && (result.image.data || result.image.url)) {
                simpleSave('gorkiHeroImage', result.image);
                return result.image;
            }
        }
    } catch (error) {
        console.log('База данных (hero) недоступна:', error.message);
    }

    const localImage = loadHeroImageFromStorage();
    if (localImage) {
        return localImage;
    }

    if (isHttpContext) {
        const folderImages = await loadImagesFromFolder('hero');
        if (folderImages.length > 0) {
            const heroImage = folderImages[0];
            localStorage.setItem('gorkiHeroImage', JSON.stringify(heroImage));
            return heroImage;
        }
    }

    return null;
}

// Применение фонового изображения главного экрана
async function applyHeroBackground() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const heroImage = await loadHeroImageData();

    if (heroImage) {
        heroSection.style.backgroundImage = `url(${heroImage.url || heroImage.data})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundRepeat = 'no-repeat';
    } else {
        // Если нет загруженного изображения, используем градиент по умолчанию
        heroSection.style.backgroundImage = '';
        heroSection.style.background = 'var(--gradient-sports)';
    }
}

// Удаление фонового изображения главного экрана
function removeHeroBackground() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    localStorage.removeItem('gorkiHeroImage');
    heroSection.style.backgroundImage = '';
    heroSection.style.background = 'var(--gradient-sports)';
}

// Обновление фона в реальном времени (для админ-панели)
function updateHeroBackground() {
    applyHeroBackground();
}

// Загрузка изображений о нас (универсальная система)
async function loadAboutImages() {
    console.log('=== ЗАГРУЗКА ИЗОБРАЖЕНИЙ О НАС ===');
    
    // Сначала пробуем базу данных (работает и локально и на сервере)
    try {
        console.log('Пробуем загрузить из базы данных...');
        const dbImages = await loadFromDatabase('about');
        
        if (dbImages && Array.isArray(dbImages) && dbImages.length > 0) {
            console.log('Изображения загружены из базы данных:', dbImages.length);
            // Сохраняем в localStorage как бэкап
            simpleSave('gorkiAboutImages', dbImages);
            return dbImages;
        }
    } catch (error) {
        console.log('База данных недоступна:', error.message);
    }
    
    // Если база данных не сработала, пробуем localStorage
    console.log('Пробуем localStorage...');
    const localImages = simpleLoad('gorkiAboutImages');
    console.log('Загружено из localStorage:', localImages.length, 'изображений');
    
    if (localImages.length > 0) {
        console.log('Используем изображения из localStorage');
        return localImages;
    }

    if (isHttpContext) {
        const folderImages = await loadImagesFromFolder('about');
        if (folderImages.length > 0) {
            console.log('Изображения загружены из папки images/about:', folderImages.length);
            simpleSave('gorkiAboutImages', folderImages);
            return folderImages;
        }
    }

    console.log('Изображений нет нигде, возвращаем пустой массив');
    return [];
}

// Применение изображений о нас (асинхронное)
async function applyAboutImages() {
    console.log('=== ПРИМЕНЕНИЕ ИЗОБРАЖЕНИЙ О НАС ===');
    
    const sliderTrack = document.getElementById('aboutSliderTrack');
    const prevBtn = document.getElementById('aboutPrevBtn');
    const nextBtn = document.getElementById('aboutNextBtn');
    const dotsContainer = document.getElementById('aboutSliderDots');
    
    console.log('Проверка DOM элементов:');
    console.log('- sliderTrack:', sliderTrack ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    console.log('- prevBtn:', prevBtn ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    console.log('- nextBtn:', nextBtn ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    console.log('- dotsContainer:', dotsContainer ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    
    if (!sliderTrack) {
        console.log('sliderTrack не найден, выходим');
        return;
    }
    
    console.log('Загружаем изображения...');
    const images = await loadAboutImages();
    console.log('Загружено изображений:', images.length);
    
    currentAboutImages = images;
    currentAboutSlide = 0;
    
    if (images.length > 0) {
        console.log('Создаем слайды для', images.length, 'изображений');
        
        // Очищаем слайдер
        sliderTrack.innerHTML = '';
        
        // Добавляем слайды
        images.forEach((image, index) => {
            console.log(`Создаем слайд ${index}:`, image.name);
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `<img src="${image.data || image.url || ''}" alt="Фото ${index + 1}">`;
            sliderTrack.appendChild(slide);
        });
        
        console.log('Слайды созданы, настраиваем навигацию...');
        
        // Показываем навигацию
        if (prevBtn) {
            prevBtn.style.display = 'flex';
            prevBtn.onclick = prevAboutSlide;
        }
        
        if (nextBtn) {
            nextBtn.style.display = 'flex';
            nextBtn.onclick = nextAboutSlide;
        }
        
        if (dotsContainer) {
            dotsContainer.style.display = 'flex';
            dotsContainer.innerHTML = '';
            
            // Создаем точки навигации
            images.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'dot';
                if (index === 0) dot.classList.add('active');
                dot.onclick = () => goToAboutSlide(index);
                dotsContainer.appendChild(dot);
            });
        }
        
        console.log('Обновляем слайдер...');
        updateAboutSlider();
        
        console.log('Применение изображений завершено УСПЕШНО');
    } else {
        console.log('Изображений нет, показываем placeholder');
        
        // Показываем placeholder
        sliderTrack.innerHTML = `
            <div class="slide">
                <div class="image-placeholder">
                    <i class="fas fa-school"></i>
                </div>
            </div>
        `;
        
        // Скрываем навигацию
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (dotsContainer) dotsContainer.style.display = 'none';
        
        console.log('Placeholder установлен');
    }
}

// Обновление слайдера
function updateAboutSlider() {
    const sliderTrack = document.getElementById('aboutSliderTrack');
    const dots = document.querySelectorAll('.dot');
    
    if (sliderTrack && currentAboutImages.length > 0) {
        sliderTrack.style.transform = `translateX(-${currentAboutSlide * 100}%)`;
        
        // Обновляем точки
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentAboutSlide);
        });
    }
}

// Переход к конкретному слайду
function goToAboutSlide(index) {
    if (index >= 0 && index < currentAboutImages.length) {
        currentAboutSlide = index;
        updateAboutSlider();
    }
}

// Следующий слайд
function nextAboutSlide() {
    if (currentAboutImages.length > 0) {
        currentAboutSlide = (currentAboutSlide + 1) % currentAboutImages.length;
        updateAboutSlider();
    }
}

// Предыдущий слайд
function prevAboutSlide() {
    if (currentAboutImages.length > 0) {
        currentAboutSlide = (currentAboutSlide - 1 + currentAboutImages.length) % currentAboutImages.length;
        updateAboutSlider();
    }
}

// Работа с базой данных через API (универсальная)
async function loadFromDatabase(type) {
    // Пробуем разные способы доступа к базе данных
    
    // Способ 1: Основной API (для веб-сервера)
    try {
        const response = await fetch(`api.php?action=get_${type}_images`);
        const result = await response.json();
        
        if (result && result.success) {
            const images = result.images || [];
            console.log(`Загружено ${images.length} изображений из базы данных (основной API)`);
            return images;
        }
    } catch (error) {
        console.log('Основной API недоступен:', error.message);
    }

    // Способ 1b: тот же хост, get_db_data.php (если api.php вернул ошибку, но скрипт доступен)
    try {
        const response = await fetch(`get_db_data.php?type=${encodeURIComponent(type)}`);
        if (response.ok) {
            const result = await response.json();
            if (result && result.success) {
                const images = result.images || [];
                if (images.length > 0) {
                    console.log(`Загружено ${images.length} изображений (get_db_data.php)`);
                    return images;
                }
            }
        }
    } catch (error) {
        console.log('get_db_data.php недоступен:', error.message);
    }
    
    // Способ 2: Локальный сервер (http://localhost:8000)
    try {
        const response = await fetch(`http://localhost:8000/get_db_data.php?type=${type}`);
        const result = await response.json();
        
        if (result && result.success) {
            const images = result.images || [];
            console.log(`Загружено ${images.length} изображений из базы данных (локальный сервер)`);
            return images;
        }
    } catch (error) {
        console.log('Локальный сервер недоступен:', error.message);
    }
    
    // Способ 3: Альтернативный локальный сервер (http://127.0.0.1:8000)
    try {
        const response = await fetch(`http://127.0.0.1:8000/get_db_data.php?type=${type}`);
        const result = await response.json();
        
        if (result && result.success) {
            const images = result.images || [];
            console.log(`Загружено ${images.length} изображений из базы данных (127.0.0.1:8000)`);
            return images;
        }
    } catch (error) {
        console.log('Альтернативный локальный сервер недоступен:', error.message);
    }
    
    console.log('Все способы доступа к базе данных недоступны');
    return [];
}

async function saveToDatabase(type, data) {
    try {
        const response = await fetch(`api.php?action=save_${type}_images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Изображения успешно сохранены в базу данных`);
            return true;
        } else {
            console.error('Ошибка сохранения в базу:', result.message);
            return false;
        }
    } catch (error) {
        console.error('Ошибка запроса к базе данных:', error);
        return false;
    }
}

// Запасные функции для localStorage
function simpleSave(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

function simpleLoad(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function setupAdminAccess() {
    const gear = document.getElementById('siteAdminGear');
    if (gear) {
        gear.classList.remove('admin-btn-hidden');
        gear.setAttribute('aria-hidden', 'false');
    }
}

function isSiteAdminLoggedIn() {
    return typeof GorkiAdminAuth !== 'undefined' && GorkiAdminAuth.isLoggedIn();
}

async function syncAdminContentToServer() {
    if (typeof GorkiSiteCustomization === 'undefined' || !isSiteAdminLoggedIn()) return;
    try {
        const cfg = await GorkiSiteCustomization.loadSiteCustomization('');
        cfg.content = GorkiSiteCustomization.collectContentFromLocalStorage();
        await GorkiSiteCustomization.saveSiteCustomizationToServer(cfg, '');
    } catch (e) {
        console.warn('Синхронизация с сервером', e);
    }
}

function initMobileActionBar() {
    const bar = document.getElementById('mobileActionBar');
    if (!bar) return;
    bar.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
        });
    });
}

function renderFeaturedNews(featured) {
    if (!featured) return;
    const titleEl = document.getElementById('featuredNewsTitle');
    const dateEl = document.getElementById('featuredNewsDate');
    const bodyEl = document.getElementById('featuredNewsBody');
    const highlightEl = document.getElementById('featuredNewsHighlight');
    const phoneEl = document.getElementById('featuredNewsPhone');
    if (!titleEl || !bodyEl) return;

    if (featured.title) titleEl.textContent = featured.title;
    if (featured.period && dateEl) dateEl.textContent = featured.period;

    const sessions = Array.isArray(featured.sessions) ? featured.sessions : [];
    let sessionsHtml = '';
    sessions.forEach((s) => {
        const label = escapeHtml(s.label || '');
        const time = escapeHtml(s.time || '');
        sessionsHtml += `<p><strong>${label}:</strong> ${time}</p>`;
    });

    let highlightHtml = '';
    if (featured.highlight) {
        highlightHtml = `<div class="news-highlight" id="featuredNewsHighlight"><i class="fas fa-running"></i><p>${escapeHtml(featured.highlight)}</p></div>`;
    }

    const phone = featured.phone || '7-30-11';
    const phoneTel = featured.phoneTel || 'tel:+375223373011';
    const phoneLabel = escapeHtml(tr('featured-phone-label'));
    const phoneHtml = `<p id="featuredNewsPhone"><strong data-translate="featured-phone-label">${phoneLabel}</strong> <a href="${escapeAttr(phoneTel)}">${escapeHtml(phone)}</a></p>`;

    bodyEl.innerHTML = sessionsHtml + highlightHtml + phoneHtml;

    if (typeof applyTranslationsToElements === 'function') {
        const lang = localStorage.getItem('selectedLanguage') || 'ru';
        applyTranslationsToElements(bodyEl.querySelectorAll('[data-translate]'), lang);
    }
}

// Асинхронная инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== НАЧАЛО ЗАГРУЗКИ СТРАНИЦЫ ===');

    if (typeof GorkiSiteCustomization !== 'undefined') {
        try {
            const siteCfg = await GorkiSiteCustomization.initSiteCustomization('');
            GorkiSiteCustomization.applySiteCustomization(siteCfg);
            if (typeof switchLanguage === 'function') {
                switchLanguage(localStorage.getItem('selectedLanguage') || 'ru');
            }
        } catch (e) {
            console.warn('Кастомизация сайта:', e);
        }
    }

    await ensureUserAuth();

    setupAdminAccess();
    initMobileActionBar();
    
    await renderSiteGallery();
    renderSiteNews();
    renderSitePrices();
    updateAboutSection();
    await applyHeroBackground();
    await initVisitorHub();
    
    console.log('Вызываем applyAboutImages...');
    await applyAboutImages();
    console.log('applyAboutImages завершен, текущие изображения:', currentAboutImages.length);
    
    setupAdminModal();
    isAdminLoggedIn = isSiteAdminLoggedIn();

    window.addEventListener('gorkiLanguageChanged', (e) => {
        void renderSiteGallery();
        if (typeof GorkiSiteCustomization !== 'undefined') {
            GorkiSiteCustomization.applySiteCustomization(
                GorkiSiteCustomization.getSiteCustomization(),
                e.detail?.lang
            );
            updateAboutSection();
            renderSiteNews();
            renderSitePrices();
        }
    });
    
    // Автопереключение слайдов
    setInterval(() => {
        if (currentAboutImages.length > 1) {
            nextAboutSlide();
        }
    }, 5000);
    
    console.log('=== ЗАГРУЗКА СТРАНИЦЫ ЗАВЕРШЕНА ===');
});

// Управление модальной админ-панелью
let isAdminLoggedIn = false; // синхронизируется с GorkiAdminAuth
let currentHeroImage = null;
let newHeroImage = null;
let currentGalleryImages = [];
let newGalleryImages = [];
let currentAboutImages = [];
let newAboutImages = [];
let currentAboutSlide = 0;

// Инициализация IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        
        const request = indexedDB.open('GorkiImagesDB', 1);
        
        request.onerror = () => {
            console.error('Ошибка открытия IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB успешно инициализирован');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('images')) {
                const objectStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('type', 'type', { unique: false });
                objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            }
        };
    });
}

// Сохранение изображения в IndexedDB
async function saveImageToIndexedDB(imageData, type) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        const record = {
            type: type, // 'hero', 'gallery', 'about'
            data: imageData.data,
            name: imageData.name,
            size: imageData.size,
            uploadDate: imageData.uploadDate || new Date().toISOString()
        };
        
        const request = store.add(record);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(`Изображение сохранено в IndexedDB с ID: ${request.result}`);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('Ошибка сохранения в IndexedDB:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Ошибка при работе с IndexedDB:', error);
        throw error;
    }
}

// Загрузка изображений из IndexedDB
async function loadImagesFromIndexedDB(type) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const index = store.index('type');
        const request = index.getAll(type);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(`Загружено ${request.result.length} изображений типа "${type}" из IndexedDB`);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('Ошибка загрузки из IndexedDB:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Ошибка при работе с IndexedDB:', error);
        return [];
    }
}

// Удаление изображений из IndexedDB по типу
async function deleteImagesFromIndexedDB(type) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const index = store.index('type');
        const request = index.openCursor(IDBKeyRange.only(type));
        
        return new Promise((resolve, reject) => {
            let deletedCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const deleteRequest = cursor.delete();
                    deleteRequest.onsuccess = () => {
                        deletedCount++;
                        cursor.continue();
                    };
                    deleteRequest.onerror = () => {
                        reject(deleteRequest.error);
                    };
                } else {
                    console.log(`Удалено ${deletedCount} изображений типа "${type}" из IndexedDB`);
                    resolve(deletedCount);
                }
            };
            
            request.onerror = () => {
                console.error('Ошибка удаления из IndexedDB:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Ошибка при работе с IndexedDB:', error);
        throw error;
    }
}

// Загрузка изображений на сервер
async function uploadImagesToServer(files, type) {
    const formData = new FormData();
    
    files.forEach(file => {
        formData.append('files[]', file.data, file.name);
    });
    
    formData.append('type', type);
    
    try {
        const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Результат загрузки на сервер:', result);
        
        if (result.success) {
            return result.files;
        } else {
            throw new Error(result.message || 'Ошибка загрузки');
        }
    } catch (error) {
        console.error('Ошибка при загрузке на сервер:', error);
        throw error;
    }
}

// Получение изображений с сервера
async function getImagesFromServer(type) {
    try {
        const response = await fetch(`get_images.php?type=${type}`);
        const result = await response.json();
        
        console.log(`Получено ${result.files.length} изображений типа "${type}" с сервера`);
        
        if (result.success) {
            return result.files;
        } else {
            console.warn('Ошибка получения изображений с сервера:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Ошибка при запросе к серверу:', error);
        return [];
    }
}

// Удаление изображений с сервера (простая реализация)
async function deleteImagesFromServer(type) {
    // Для простоты реализации, пока используем localStorage/IndexedDB как бэкап
    console.log(`Удаление изображений типа "${type}" с сервера (заглушка)`);
    return true;
}

// Открытие модального окна админ-панели
function openAdminModal() {
    document.getElementById('adminModal').classList.add('active');
    checkAdminAuth();
}

// Закрытие модального окна админ-панели
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
}

// Проверка аутентификации администратора
function checkAdminAuth() {
    isAdminLoggedIn = isSiteAdminLoggedIn();
    if (isAdminLoggedIn) {
        showAdminPanel();
    } else {
        showAdminLogin();
    }
}

// Показ формы входа
function showAdminLogin() {
    hideAllSections();
    document.getElementById('adminLogin').style.display = 'block';
}

// Показ панели управления
function showAdminPanel() {
    hideAllSections();
    document.getElementById('adminPanel').style.display = 'block';
}

// Скрыть все секции
function hideAllSections() {
    [
        'adminLogin',
        'adminPanel',
        'heroSection',
        'gallerySection',
        'aboutSection',
        'newsSection',
        'pricesSection',
        'aboutTextSection',
        'contactsSection',
        'scheduleSection',
        'bookingsSection',
        'customizeSection',
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// Вход в админ-панель
function adminLogin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (typeof GorkiAdminAuth === 'undefined') {
        alert('Модуль авторизации не загружен');
        return;
    }

    const result = GorkiAdminAuth.login(username, password);
    if (result.ok) {
        isAdminLoggedIn = true;
        showAdminPanel();
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        if (typeof showNotification === 'function') showNotification('Вход выполнен', 'success');
    } else {
        alert(result.error || 'Неверный логин или пароль');
    }
}

// Выход из админ-панели
function adminLogout() {
    isAdminLoggedIn = false;
    if (typeof GorkiAdminAuth !== 'undefined') GorkiAdminAuth.logout();
    showAdminLogin();
}

// Открытие секции главного экрана
async function openHeroSection() {
    hideAllSections();
    document.getElementById('heroSection').style.display = 'block';
    await loadHeroImage();
    setupHeroDragAndDrop();
}

// Открытие секции галереи
async function openGallerySection() {
    hideAllSections();
    document.getElementById('gallerySection').style.display = 'block';
    await loadGalleryImagesAdmin();
    setupGalleryDragAndDrop();
}

// Открытие секции о нас
async function openAboutSection() {
    hideAllSections();
    document.getElementById('aboutSection').style.display = 'block';
    await loadAboutImagesAdmin();
    setupAboutDragAndDrop();
}

// ——— Новости и цены (встроенная админка на главной странице) ———
let newsAdminItems = [];
let editingNewsIndex = null;
let priceAdminItems = [];
let newsFormHandlerBound = false;

function openNewsSection() {
    if (!document.getElementById('newsSection')) return;
    hideAllSections();
    document.getElementById('newsSection').style.display = 'block';
    newsAdminItems = loadNewsFromStorage();
    renderNewsAdminList();
    cancelEditNews();
}

function renderNewsAdminList() {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;
    if (newsAdminItems.length === 0) {
        newsList.innerHTML = '<p class="schedule-offline" style="text-align:center;padding:2rem;">Новостей пока нет</p>';
        return;
    }
    newsList.innerHTML = newsAdminItems.map((news, index) => {
        const dateSrc = news.createdAt || news.updatedAt || Date.now();
        return `
            <div class="admin-news-item">
                <h5>${escapeHtml(news.title)}</h5>
                <p class="excerpt">${escapeHtml(news.excerpt || 'Нет описания')}</p>
                <div class="meta">
                    <small>${escapeHtml(new Date(dateSrc).toLocaleString('ru-RU'))}</small>
                    <div style="display:flex;gap:0.5rem;">
                        <button type="button" class="admin-btn" style="padding:0.35rem 0.65rem;font-size:0.8rem;" onclick="editNewsAdmin(${index})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button type="button" class="admin-btn secondary" style="padding:0.35rem 0.65rem;font-size:0.8rem;" onclick="deleteNewsAdmin(${index})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function deleteNewsAdmin(index) {
    if (!confirm('Удалить эту новость?')) return;
    newsAdminItems.splice(index, 1);
    try {
        localStorage.setItem('gorkiNews', JSON.stringify(newsAdminItems));
        renderSiteNews();
    } catch (err) {
        console.error(err);
    }
    renderNewsAdminList();
}

function editNewsAdmin(index) {
    editingNewsIndex = index;
    const news = newsAdminItems[index];
    if (!news) return;
    document.getElementById('newsTitle').value = news.title;
    document.getElementById('newsContent').value = news.content;
    document.getElementById('newsExcerpt').value = news.excerpt || '';
    const formTitle = document.getElementById('newsFormSectionTitle');
    if (formTitle) formTitle.textContent = 'Редактировать новость';
    const submitBtn = document.getElementById('newsSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    document.querySelector('.admin-news-form')?.scrollIntoView({ behavior: 'smooth' });
}

function cancelEditNews() {
    editingNewsIndex = null;
    const form = document.getElementById('newsForm');
    if (form) form.reset();
    const formTitle = document.getElementById('newsFormSectionTitle');
    if (formTitle) formTitle.textContent = 'Добавить новость';
    const submitBtn = document.getElementById('newsSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить новость';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function saveAllNewsAdmin() {
    try {
        localStorage.setItem('gorkiNews', JSON.stringify(newsAdminItems));
        renderSiteNews();
        void syncAdminContentToServer();
        showNotification('Новости сохранены на сайте', 'success');
    } catch (e) {
        alert('Не удалось сохранить новости');
    }
}

function onNewsFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const excerptRaw = document.getElementById('newsExcerpt').value.trim();
    if (!title || !content) {
        alert('Заполните заголовок и содержание');
        return;
    }
    const excerpt = excerptRaw || (content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    if (editingNewsIndex !== null && editingNewsIndex >= 0) {
        newsAdminItems[editingNewsIndex] = {
            ...newsAdminItems[editingNewsIndex],
            title,
            content,
            excerpt,
            updatedAt: new Date().toISOString()
        };
        cancelEditNews();
        showNotification('Новость обновлена', 'success');
    } else {
        newsAdminItems.unshift({
            title,
            content,
            excerpt,
            createdAt: new Date().toISOString()
        });
        document.getElementById('newsForm').reset();
        showNotification('Новость добавлена', 'success');
    }
    try {
        localStorage.setItem('gorkiNews', JSON.stringify(newsAdminItems));
        renderSiteNews();
    } catch (err) {
        console.error(err);
        alert('Не удалось записать новости в хранилище браузера');
    }
    renderNewsAdminList();
}

function openPricesSection() {
    if (!document.getElementById('pricesSection')) return;
    hideAllSections();
    document.getElementById('pricesSection').style.display = 'block';
    loadPricesAdminFromStorage();
    renderPricesAdmin();
}

function loadPricesAdminFromStorage() {
    const stored = localStorage.getItem('gorkiPrices');
    if (stored) {
        try {
            priceAdminItems = JSON.parse(stored);
            if (!Array.isArray(priceAdminItems)) priceAdminItems = [];
        } catch {
            priceAdminItems = [];
        }
    } else {
        priceAdminItems = [
            { key: 'monthly', name: 'Абонемент на месяц', price: '50 руб.', description: 'Посещение всех секций' },
            { key: 'individual', name: 'Индивидуальное занятие', price: '15 руб.', description: '1 час с тренером' },
            { key: 'group', name: 'Групповое занятие', price: '8 руб.', description: '1 час в группе' }
        ];
    }
}

function collectPricesFromDom() {
    for (let i = 0; i < priceAdminItems.length; i++) {
        const n = document.getElementById(`price-name-${i}`);
        const pv = document.getElementById(`price-value-${i}`);
        const d = document.getElementById(`price-desc-${i}`);
        if (n && pv) {
            priceAdminItems[i].name = n.value.trim();
            priceAdminItems[i].price = pv.value.trim();
            priceAdminItems[i].description = d ? d.value.trim() : '';
        }
    }
}

function renderPricesAdmin() {
    const pricesList = document.getElementById('pricesList');
    if (!pricesList) return;
    pricesList.innerHTML = priceAdminItems.map((price, index) => `
        <div class="price-edit-row">
            <div class="row-grid">
                <input type="text" id="price-name-${index}" value="${escapeAttr(price.name)}" placeholder="Название" style="padding:0.5rem;border:1px solid var(--border-color);border-radius:8px;">
                <input type="text" id="price-value-${index}" value="${escapeAttr(price.price)}" placeholder="Цена" style="padding:0.5rem;border:1px solid var(--border-color);border-radius:8px;">
                <button type="button" class="admin-btn secondary" style="padding:0.7rem 1.2rem;" onclick="deletePriceAdmin(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <input type="text" id="price-desc-${index}" value="${escapeAttr(price.description || '')}" placeholder="Описание" style="width:100%;margin-top:0.5rem;padding:0.5rem;border:1px solid var(--border-color);border-radius:8px;">
            <div style="display:flex;justify-content:flex-end;margin-top:0.5rem;">
                <button type="button" class="admin-btn" style="min-width:400px;padding:0.7rem 2rem;" onclick="savePriceItemAdmin(${index}, this)">
                    <i class="fas fa-check"></i> Применить строку
                </button>
            </div>
        </div>
    `).join('');
}

function addPriceItem() {
    priceAdminItems.push({ name: '', price: '', description: '' });
    renderPricesAdmin();
}

function savePriceItemAdmin(index, btn) {
    const name = document.getElementById(`price-name-${index}`)?.value.trim() || '';
    const price = document.getElementById(`price-value-${index}`)?.value.trim() || '';
    const description = document.getElementById(`price-desc-${index}`)?.value.trim() || '';
    if (!name || !price) {
        alert('Укажите название и цену');
        return;
    }
    priceAdminItems[index] = { ...priceAdminItems[index], name, price, description, updatedAt: new Date().toISOString() };
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Ок';
        btn.style.background = '#16a34a';
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = '';
        }, 1200);
    }
}

function deletePriceAdmin(index) {
    if (!confirm('Удалить эту позицию?')) return;
    priceAdminItems.splice(index, 1);
    renderPricesAdmin();
}

function savePricesAdmin() {
    collectPricesFromDom();
    priceAdminItems = priceAdminItems.filter((p) => p && String(p.name || '').trim() && String(p.price || '').trim());
    try {
        localStorage.setItem('gorkiPrices', JSON.stringify(priceAdminItems));
        renderPricesAdmin();
        renderSitePrices();
        void syncAdminContentToServer();
        showNotification('Цены сохранены на сайте', 'success');
    } catch (e) {
        alert('Не удалось сохранить цены');
    }
}

// ——— Текст «О нас» ———
function openAboutTextSection() {
    hideAllSections();
    document.getElementById('aboutTextSection').style.display = 'block';
    const data = loadAboutFromStorage();
    const about = document.querySelector('.about');
    document.getElementById('aboutAdminTitle').value = data?.title || about?.querySelector('.section-header h2')?.textContent || '';
    document.getElementById('aboutAdminSubtitle').value = data?.subtitle || about?.querySelector('.section-header p')?.textContent || '';
    const descEl = about?.querySelector('.about-text p');
    document.getElementById('aboutAdminDescription').value = data?.description || descEl?.textContent || '';
    const stats = about?.querySelectorAll('.stat-item h4') || [];
    document.getElementById('aboutAdminYears').value = data?.years || stats[0]?.textContent || '';
    document.getElementById('aboutAdminStudents').value = data?.students || stats[1]?.textContent || '';
    document.getElementById('aboutAdminSports').value = data?.sports || stats[2]?.textContent || '';
}

function saveAboutTextAdmin() {
    const aboutData = {
        title: document.getElementById('aboutAdminTitle').value.trim(),
        subtitle: document.getElementById('aboutAdminSubtitle').value.trim(),
        description: document.getElementById('aboutAdminDescription').value.trim(),
        years: document.getElementById('aboutAdminYears').value.trim(),
        students: document.getElementById('aboutAdminStudents').value.trim(),
        sports: document.getElementById('aboutAdminSports').value.trim(),
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('gorkiAbout', JSON.stringify(aboutData));
    updateAboutSection();
    void syncAdminContentToServer();
    showNotification('Раздел «О нас» обновлён', 'success');
}

// ——— Контакты ———
let contactsAdminItems = [];

function openScheduleSection() {
    hideAllSections();
    document.getElementById('scheduleSection').style.display = 'block';
    if (typeof GorkiAdminSchedule !== 'undefined') {
        GorkiAdminSchedule.openScheduleSection();
    }
}

function openContactsSection() {
    hideAllSections();
    document.getElementById('contactsSection').style.display = 'block';
    loadContactsAdmin();
    renderContactsAdmin();
}

function openBookingsSection() {
    hideAllSections();
    document.getElementById('bookingsSection').style.display = 'block';
    loadBookingsAdmin();
}

async function loadBookingsAdmin() {
    const listEl = document.getElementById('bookingsList');
    const statsEl = document.getElementById('bookingsStats');
    listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:2rem;">Загрузка…</p>';
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-token'
        };
        const [bookingsRes, statsRes] = await Promise.all([
            fetch('api/bookings.php', { headers }),
            fetch('api/bookings.php?action=stats', { headers })
        ]);
        const data = await bookingsRes.json();
        const stats = await statsRes.json();
        if (stats.success && statsEl) {
            statsEl.textContent = `Всего бронирований: ${stats.total_bookings} · Зарегистрировано пользователей: ${stats.registered_users} / ${stats.max_users}`;
        }
        if (!data.success || !Array.isArray(data.bookings)) {
            listEl.innerHTML = '<p style="text-align:center;color:#dc2626;padding:2rem;">Не удалось загрузить бронирования</p>';
            return;
        }
        if (data.bookings.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:2rem;">Записей пока нет</p>';
            return;
        }
        listEl.innerHTML = data.bookings.map(b => {
            const endMin = (() => {
                const p = (b.start_time || '00:00').split(':');
                const start = parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
                const end = start + parseInt(b.duration_minutes || 60, 10);
                return String(Math.floor(end / 60)).padStart(2, '0') + ':' + String(end % 60).padStart(2, '0');
            })();
            return `
                <div style="border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:1rem;">
                    <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                        <div>
                            <strong>${escapeHtml(b.facility_label || b.facility)}</strong>
                            <div style="color:#64748b;font-size:0.875rem;margin-top:0.25rem;">
                                ${escapeHtml(b.booking_date)} · ${escapeHtml((b.start_time || '').slice(0,5))}–${endMin} (${b.duration_minutes} мин)
                            </div>
                        </div>
                        <button type="button" class="admin-btn secondary" style="padding:0.7rem 1.8rem;min-width:140px;border-radius:0;" onclick="deleteBookingAdmin(${b.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                    <div style="margin-top:0.75rem;font-size:0.875rem;display:grid;gap:0.25rem;">
                        <div><strong>Клиент:</strong> ${escapeHtml(b.name)} · ${escapeHtml(b.phone)}</div>
                        <div><strong>Email:</strong> ${escapeHtml(b.email || b.user_email || '—')}</div>
                        <div><strong>Людей:</strong> ${escapeHtml(String(b.people_count || 1))}</div>
                        ${b.comment ? `<div><strong>Комментарий:</strong> ${escapeHtml(b.comment)}</div>` : ''}
                        <div style="color:#94a3b8;">Создано: ${escapeHtml(b.created_at || '')}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listEl.innerHTML = '<p style="text-align:center;color:#dc2626;padding:2rem;">Ошибка сети</p>';
    }
}

async function deleteBookingAdmin(id) {
    if (!confirm('Удалить это бронирование?')) return;
    try {
        const res = await fetch('api/bookings.php?id=' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-token'
            }
        });
        const data = await res.json();
        if (data.success) {
            loadBookingsAdmin();
        } else {
            alert(data.message || 'Не удалось удалить');
        }
    } catch (err) {
        alert('Ошибка сети');
    }
}

function loadContactsAdmin() {
    try {
        const raw = localStorage.getItem('gorkiContacts');
        contactsAdminItems = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(contactsAdminItems)) contactsAdminItems = [];
    } catch {
        contactsAdminItems = [];
    }
    if (contactsAdminItems.length === 0) {
        contactsAdminItems = [
            { type: 'address', title: 'Адрес', content: '213410, ул. Вокзальная, 23, г. Горки', icon: 'map-marker-alt' },
            { type: 'phone', title: 'Телефоны', content: 'Справка: 8 (02233) 73011', icon: 'phone' },
            { type: 'email', title: 'Email', content: 'Ledovaya@gorkiled.by', icon: 'envelope' },
        ];
    }
}

function renderContactsAdmin() {
    const list = document.getElementById('contactsAdminList');
    if (!list) return;
    list.innerHTML = contactsAdminItems
        .map(
            (c, i) => `
        <div class="price-edit-row">
            <div class="row-grid">
                <select id="contact-type-${i}" class="admin-field">
                    <option value="phone" ${c.type === 'phone' ? 'selected' : ''}>Телефон</option>
                    <option value="email" ${c.type === 'email' ? 'selected' : ''}>Email</option>
                    <option value="address" ${c.type === 'address' ? 'selected' : ''}>Адрес</option>
                    <option value="schedule" ${c.type === 'schedule' ? 'selected' : ''}>График</option>
                </select>
                <input type="text" id="contact-title-${i}" class="admin-field" value="${escapeAttr(c.title || '')}" placeholder="Заголовок">
                <button type="button" class="admin-btn secondary" onclick="deleteContactAdmin(${i})"><i class="fas fa-trash"></i></button>
            </div>
            <textarea id="contact-content-${i}" class="admin-field" rows="2" placeholder="Содержание">${escapeHtml(c.content || '')}</textarea>
        </div>`
        )
        .join('');
}

function collectContactsAdminFromDom() {
    const n = contactsAdminItems.length;
    const items = [];
    for (let i = 0; i < n; i++) {
        const type = document.getElementById(`contact-type-${i}`)?.value || 'phone';
        items.push({
            type,
            title: document.getElementById(`contact-title-${i}`)?.value.trim() || '',
            content: document.getElementById(`contact-content-${i}`)?.value.trim() || '',
            icon: { phone: 'phone', email: 'envelope', address: 'map-marker-alt', schedule: 'clock' }[type] || 'info-circle',
        });
    }
    contactsAdminItems = items;
}

function addContactAdmin() {
    contactsAdminItems.push({ type: 'phone', title: '', content: '', icon: 'phone' });
    renderContactsAdmin();
}

function deleteContactAdmin(index) {
    if (!confirm('Удалить контакт?')) return;
    contactsAdminItems.splice(index, 1);
    renderContactsAdmin();
}

function saveContactsAdmin() {
    collectContactsAdminFromDom();
    localStorage.setItem('gorkiContacts', JSON.stringify(contactsAdminItems));
    if (typeof GorkiSiteCustomization !== 'undefined') {
        GorkiSiteCustomization.applySiteCustomization(GorkiSiteCustomization.getSiteCustomization());
    }
    void syncAdminContentToServer();
    showNotification('Контакты сохранены', 'success');
}

function openCustomizeSection() {
    hideAllSections();
    document.getElementById('customizeSection').style.display = 'block';
    if (typeof GorkiAdminCustomize !== 'undefined') {
        void GorkiAdminCustomize.openCustomizeSection();
    }
}

// Возврат к главной панели
function backToAdminPanel() {
    showAdminPanel();
}

window.openAboutTextSection = openAboutTextSection;
window.openContactsSection = openContactsSection;
window.openBookingsSection = openBookingsSection;
window.openCustomizeSection = openCustomizeSection;
window.saveAboutTextAdmin = saveAboutTextAdmin;
window.saveContactsAdmin = saveContactsAdmin;
window.loadBookingsAdmin = loadBookingsAdmin;
window.deleteBookingAdmin = deleteBookingAdmin;
window.addContactAdmin = addContactAdmin;
window.deleteContactAdmin = deleteContactAdmin;

// Загрузка изображения главного экрана (БД → localStorage → images/hero)
async function loadHeroImage() {
    currentHeroImage = await loadHeroImageData();
    renderCurrentHeroImage();
}

// Отображение текущего изображения главного экрана
function renderCurrentHeroImage() {
    const preview = document.getElementById('currentHeroPreview');
    const deleteBtn = document.getElementById('deleteHeroBtn');
    
    if (currentHeroImage) {
        preview.innerHTML = `<img src="${currentHeroImage.data || currentHeroImage.url || ''}" alt="Главный экран">`;
        deleteBtn.style.display = 'inline-flex';
    } else {
        preview.innerHTML = `
            <div class="no-hero-image">
                <i class="fas fa-image"></i>
                <p>Фоновое изображение не установлено</p>
            </div>
        `;
        deleteBtn.style.display = 'none';
    }
}

// Удаление изображения главного экрана
function deleteHeroImage() {
    if (confirm('Вы уверены, что хотите удалить фоновое изображение? Главный экран вернется к стандартному градиенту.')) {
        localStorage.removeItem('gorkiHeroImage');
        currentHeroImage = null;
        renderCurrentHeroImage();
        applyHeroBackground(); // Обновляем фон на сайте
        alert('Фоновое изображение удалено!');
    }
}

// Сохранение изображения главного экрана
function saveHeroImage() {
    if (newHeroImage) {
        currentHeroImage = newHeroImage;
        localStorage.setItem('gorkiHeroImage', JSON.stringify(currentHeroImage));
        applyHeroBackground(); // Обновляем фон на сайте
        alert('Фоновое изображение успешно сохранено!');
        newHeroImage = null;
        document.getElementById('heroPreviewSection').style.display = 'none';
        document.getElementById('heroFileInput').value = '';
        renderCurrentHeroImage();
    } else {
        alert('Пожалуйста, выберите изображение для сохранения');
    }
}

// Drag and Drop для главного экрана
function setupHeroDragAndDrop() {
    const uploadArea = document.getElementById('heroUploadArea');
    const fileInput = document.getElementById('heroFileInput');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    uploadArea.addEventListener('drop', handleHeroDrop, false);
    fileInput.addEventListener('change', handleHeroFileSelect, false);
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleHeroDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleHeroFiles(files);
}

function handleHeroFileSelect(e) {
    const files = e.target.files;
    handleHeroFiles(files);
}

function handleHeroFiles(files) {
    if (files.length > 0) {
        uploadHeroFile(files[0]);
    }
}

function uploadHeroFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите только изображение');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        newHeroImage = {
            name: file.name,
            data: e.target.result,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString()
        };
        
        renderHeroPreview();
    };
    reader.readAsDataURL(file);
}

// Отображение предпросмотра нового изображения
function renderHeroPreview() {
    const previewSection = document.getElementById('heroPreviewSection');
    const preview = document.getElementById('heroPreview');
    
    if (newHeroImage) {
        preview.innerHTML = `<img src="${newHeroImage.data}" alt="Предпросмотр">`;
        previewSection.style.display = 'block';
    } else {
        previewSection.style.display = 'none';
    }
}

function persistGalleryLocal(images) {
    try {
        localStorage.setItem('gorkiGallery', JSON.stringify(images));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения галереи в localStorage', e);
        return false;
    }
}

async function loadGalleryImagesAdmin() {
    currentGalleryImages = await loadGalleryImages();
    newGalleryImages = [];
    renderGalleryCurrent();
    renderGalleryNewPreview();
}

function renderGalleryCurrent() {
    const preview = document.getElementById('galleryCurrentPreview');
    const clearAllBtn = document.getElementById('clearAllGalleryBtn');
    if (!preview) return;

    if (currentGalleryImages.length > 0) {
        preview.classList.add('has-images');
        preview.innerHTML = `
            <div class="about-gallery-grid">
                ${currentGalleryImages.map((image, index) => `
                    <div class="about-gallery-item">
                        <img src="${image.data || image.url || ''}" alt="${image.name || 'Фото'}">
                        <button type="button" class="delete-btn" onclick="deleteGalleryImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        if (clearAllBtn) clearAllBtn.style.display = 'inline-flex';
    } else {
        preview.classList.remove('has-images');
        preview.innerHTML = `
            <div class="no-about-images">
                <i class="fas fa-images"></i>
                <p>В галерее пока нет сохранённых фото</p>
            </div>
        `;
        if (clearAllBtn) clearAllBtn.style.display = 'none';
    }
}

function renderGalleryNewPreview() {
    const section = document.getElementById('galleryNewPreviewSection');
    const grid = document.getElementById('galleryPreviewGrid');
    if (!section || !grid) return;

    if (newGalleryImages.length > 0) {
        grid.innerHTML = newGalleryImages.map((image, index) => `
            <div class="about-preview-item">
                <img src="${image.data || image.url || ''}" alt="Предпросмотр ${index + 1}">
                <button type="button" class="remove-btn" onclick="removeGalleryPreviewImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
        grid.innerHTML = '';
    }
}

async function syncCurrentGalleryToServer() {
    if (!isHttpContext) return;
    try {
        await saveToDatabase('gallery', currentGalleryImages);
        simpleSave('gorkiGallery', currentGalleryImages);
    } catch (e) {
        console.warn('Не удалось синхронизировать галерею с БД', e);
    }
}

function deleteGalleryImage(index) {
    if (!confirm('Удалить это фото из галереи?')) return;
    currentGalleryImages.splice(index, 1);
    persistGalleryLocal(currentGalleryImages);
    renderGalleryCurrent();
    void renderSiteGallery();
    void syncCurrentGalleryToServer();
}

function clearAllGalleryImages() {
    if (!confirm('Удалить все фото из галереи на сайте?')) return;
    currentGalleryImages = [];
    persistGalleryLocal([]);
    renderGalleryCurrent();
    void renderSiteGallery();
    void syncCurrentGalleryToServer();
}

function removeGalleryPreviewImage(index) {
    newGalleryImages.splice(index, 1);
    renderGalleryNewPreview();
}

function clearGalleryPreview() {
    newGalleryImages = [];
    const section = document.getElementById('galleryNewPreviewSection');
    const grid = document.getElementById('galleryPreviewGrid');
    const input = document.getElementById('galleryFileInput');
    if (section) section.style.display = 'none';
    if (grid) grid.innerHTML = '';
    if (input) input.value = '';
}

async function saveGallery() {
    if (newGalleryImages.length === 0) {
        alert('Выберите фото для сохранения');
        return;
    }

    const allImages = [...currentGalleryImages, ...newGalleryImages];
    const dataSize = JSON.stringify(allImages).length;
    if (dataSize > 200 * 1024 * 1024) {
        alert('Слишком большой объём данных. Удалите часть фото или сохраняйте частями.');
        return;
    }

    if (window.location.protocol === 'file:') {
        if (simpleSave('gorkiGallery', allImages)) {
            currentGalleryImages = allImages;
            newGalleryImages = [];
            await renderSiteGallery();
            alert(`Фото добавлены в галерею (локально). Всего: ${currentGalleryImages.length}`);
            clearGalleryPreview();
            renderGalleryCurrent();
        } else {
            alert('Не удалось сохранить (лимит хранилища браузера).');
        }
        return;
    }

    try {
        const dbSuccess = await saveToDatabase('gallery', allImages);
        if (dbSuccess) {
            simpleSave('gorkiGallery', allImages);
            currentGalleryImages = allImages;
            newGalleryImages = [];
            await renderSiteGallery();
            alert('Галерея сохранена в базе данных');
            clearGalleryPreview();
            renderGalleryCurrent();
            return;
        }
        if (simpleSave('gorkiGallery', allImages)) {
            currentGalleryImages = allImages;
            newGalleryImages = [];
            await renderSiteGallery();
            alert('Галерея сохранена');
            clearGalleryPreview();
            renderGalleryCurrent();
        } else {
            alert('Ошибка сохранения');
        }
    } catch (error) {
        console.error('Ошибка при сохранении галереи:', error);
        alert('Ошибка сохранения галереи');
    }
}

let galleryDragDropBound = false;

function setupGalleryDragAndDrop() {
    if (galleryDragDropBound) return;
    const uploadArea = document.getElementById('galleryUploadArea');
    const fileInput = document.getElementById('galleryFileInput');
    if (!uploadArea || !fileInput) return;
    galleryDragDropBound = true;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach((eventName) => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', handleGalleryDrop, false);
    fileInput.addEventListener('change', handleGalleryFileSelect, false);
    uploadArea.addEventListener('click', () => fileInput.click(), false);
}

function handleGalleryDrop(e) {
    handleGalleryFiles(e.dataTransfer.files);
}

function handleGalleryFileSelect(e) {
    handleGalleryFiles(e.target.files);
}

function handleGalleryFiles(files) {
    if (files && files.length) {
        [...files].forEach(uploadGalleryFile);
    }
}

function uploadGalleryFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите только изображения');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert(`Размер файла ${file.name} не должен превышать 10MB`);
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        newGalleryImages.push({
            name: file.name,
            data: e.target.result,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString()
        });
        renderGalleryNewPreview();
    };
    reader.readAsDataURL(file);
}

// Загрузка изображений о нас в админ-панели (асинхронная)
async function loadAboutImagesAdmin() {
    currentAboutImages = await loadAboutImages();
    renderAboutGallery();
}

// Отображение галереи текущих изображений о нас
function renderAboutGallery() {
    const preview = document.getElementById('aboutGalleryPreview');
    const clearAllBtn = document.getElementById('clearAllAboutBtn');
    
    if (currentAboutImages.length > 0) {
        preview.classList.add('has-images');
        preview.innerHTML = `
            <div class="about-gallery-grid">
                ${currentAboutImages.map((image, index) => `
                    <div class="about-gallery-item">
                        <img src="${image.data || image.url || ''}" alt="Фото о нас ${index + 1}">
                        <button class="delete-btn" onclick="deleteAboutImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        clearAllBtn.style.display = 'inline-flex';
    } else {
        preview.classList.remove('has-images');
        preview.innerHTML = `
            <div class="no-about-images">
                <i class="fas fa-building"></i>
                <p>Фото о нас не загружены</p>
            </div>
        `;
        clearAllBtn.style.display = 'none';
    }
}

// Удаление конкретного изображения о нас
function deleteAboutImage(index) {
    if (confirm('Вы уверены, что хотите удалить это фото?')) {
        currentAboutImages.splice(index, 1);
        localStorage.setItem('gorkiAboutImages', JSON.stringify(currentAboutImages));
        renderAboutGallery();
        applyAboutImages(); // Обновляем фото на сайте
        alert('Фото удалено!');
    }
}

// Удаление всех изображений о нас
function clearAllAboutImages() {
    if (confirm('Вы уверены, что хотите удалить все фото о нас?')) {
        currentAboutImages = [];
        localStorage.setItem('gorkiAboutImages', JSON.stringify(currentAboutImages));
        renderAboutGallery();
        applyAboutImages(); // Обновляем фото на сайте
        alert('Все фото о нас удалены!');
    }
}

// Сохранение изображений о нас (адаптивное для локальной работы)
async function saveAboutImages() {
    if (newAboutImages.length === 0) {
        alert('Выберите фото для сохранения');
        return;
    }
    
    // Проверяем если сайт открыт через file:// протокол, сохраняем только в localStorage
    if (window.location.protocol === 'file:') {
        console.log('Сайт открыт локально, сохраняем только в localStorage');
        
        const existingImages = simpleLoad('gorkiAboutImages');
        const allImages = [...existingImages, ...newAboutImages];
        
        if (simpleSave('gorkiAboutImages', allImages)) {
            currentAboutImages = allImages;
            const addedCount = newAboutImages.length;
            newAboutImages = [];
            
            await applyAboutImages();
            alert(`Добавлено ${addedCount} фото!`);
            clearAboutPreview();
            renderAboutGallery();
        } else {
            alert('Ошибка сохранения');
        }
        return;
    }
    
    // Для веб-сервера пробуем базу данных
    try {
        const existingImages = await loadAboutImages();
        const allImages = [...existingImages, ...newAboutImages];
        
        const dbSuccess = await saveToDatabase('about', allImages);
        
        if (dbSuccess) {
            simpleSave('gorkiAboutImages', allImages);
            
            currentAboutImages = allImages;
            const addedCount = newAboutImages.length;
            newAboutImages = [];
            
            await applyAboutImages();
            alert(`Добавлено ${addedCount} фото в базу данных!`);
            clearAboutPreview();
            renderAboutGallery();
        } else {
            if (simpleSave('gorkiAboutImages', allImages)) {
                currentAboutImages = allImages;
                const addedCount = newAboutImages.length;
                newAboutImages = [];
                
                await applyAboutImages();
                alert(`Добавлено ${addedCount} фото (localStorage)!`);
                clearAboutPreview();
                renderAboutGallery();
            } else {
                alert('Ошибка сохранения');
            }
        }
    } catch (error) {
        console.error('Ошибка при сохранении изображений:', error);
        alert('Ошибка сохранения изображений');
    }
}

// Очистка предпросмотра
function clearAboutPreview() {
    newAboutImages = [];
    document.getElementById('aboutPreviewSection').style.display = 'none';
    document.getElementById('aboutFileInput').value = '';
    document.getElementById('aboutPreviewGrid').innerHTML = '';
}

let aboutDragDropBound = false;

// Drag and Drop для фото о нас
function setupAboutDragAndDrop() {
    if (aboutDragDropBound) return;
    const uploadArea = document.getElementById('aboutUploadArea');
    const fileInput = document.getElementById('aboutFileInput');
    if (!uploadArea || !fileInput) return;
    aboutDragDropBound = true;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    uploadArea.addEventListener('drop', handleAboutDrop, false);
    fileInput.addEventListener('change', handleAboutFileSelect, false);
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleAboutDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleAboutFiles(files);
}

function handleAboutFileSelect(e) {
    const files = e.target.files;
    handleAboutFiles(files);
}

function handleAboutFiles(files) {
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            uploadAboutFile(file);
        });
    }
}

function uploadAboutFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите только изображения');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert(`Размер файла ${file.name} не должен превышать 10MB`);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            name: file.name,
            data: e.target.result,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString()
        };
        
        newAboutImages.push(imageData);
        renderAboutPreview();
    };
    reader.readAsDataURL(file);
}

// Отображение предпросмотра новых фото о нас
function renderAboutPreview() {
    const previewSection = document.getElementById('aboutPreviewSection');
    const previewGrid = document.getElementById('aboutPreviewGrid');
    
    if (newAboutImages.length > 0) {
        previewGrid.innerHTML = newAboutImages.map((image, index) => `
            <div class="about-preview-item">
                <img src="${image.data || image.url || ''}" alt="Предпросмотр ${index + 1}">
                <button class="remove-btn" onclick="removeAboutPreviewImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        previewSection.style.display = 'block';
    } else {
        previewSection.style.display = 'none';
    }
}

// Удаление изображения из предпросмотра
function removeAboutPreviewImage(index) {
    newAboutImages.splice(index, 1);
    renderAboutPreview();
}

// Инициализация модального окна
function setupAdminModal() {
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('adminModal');
            if (modal.classList.contains('active')) {
                closeAdminModal();
            }
        }
    });

    const newsForm = document.getElementById('newsForm');
    if (newsForm && !newsFormHandlerBound) {
        newsFormHandlerBound = true;
        newsForm.addEventListener('submit', onNewsFormSubmit);
    }
}

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

let visitorScheduleRedraw = function () {};

async function initVisitorHub() {
    if (window.__gorkiVisitorHubReady) return;
    const noteEl = document.getElementById('scheduleNote');
    const daysEl = document.getElementById('scheduleDays');
    const detailEl = document.getElementById('scheduleDetail');
    if (!noteEl || !daysEl || !detailEl) return;
    window.__gorkiVisitorHubReady = true;

    const offlineHint = document.getElementById('scheduleOfflineHint');

    let scheduleData = null;
    if (isHttpContext) {
        try {
            const response = await fetch('get_schedule.php');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.schedule && Array.isArray(result.schedule.days) && result.schedule.days.length > 0) {
                    scheduleData = result.schedule;
                }
            }
        } catch (err) {
            console.warn('Расписание не загружено', err);
        }
    }
    if (!scheduleData) {
        scheduleData = EMBEDDED_SCHEDULE_FALLBACK;
    }

    renderFeaturedNews(scheduleData.featured || EMBEDDED_SCHEDULE_FALLBACK.featured);

    if (!isHttpContext && offlineHint) {
        offlineHint.style.display = 'block';
    } else if (offlineHint) {
        offlineHint.style.display = 'none';
    }

    let selectedDay = 0;

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function renderScheduleDetail() {
        const day = scheduleData.days[selectedDay];
        if (!day) {
            detailEl.innerHTML = `<p class="schedule-offline">${escapeHtml(tr('visitor-offline-hint'))}</p>`;
            return;
        }
        const rows = day.items && day.items.length ? day.items : [];
        if (rows.length === 0) {
            detailEl.innerHTML = `<p class="schedule-offline">${escapeHtml(tr('schedule-empty-day'))}</p>`;
            return;
        }
        let html = '<table class="schedule-table"><thead><tr>';
        html += `<th class="col-time">${escapeHtml(tr('th-schedule-time'))}</th>`;
        html += `<th>${escapeHtml(tr('th-schedule-title'))}</th>`;
        html += `<th>${escapeHtml(tr('th-schedule-place'))}</th>`;
        html += '</tr></thead><tbody>';
        rows.forEach((row) => {
            html += '<tr>';
            html += `<td class="col-time">${escapeHtml(row.time)}</td>`;
            html += `<td>${escapeHtml(row.title)}</td>`;
            html += `<td>${escapeHtml(row.place)}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        detailEl.innerHTML = html;
    }

    function selectDay(index) {
        selectedDay = index;
        daysEl.querySelectorAll('.schedule-day-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
            btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
        renderScheduleDetail();
    }

    visitorScheduleRedraw = renderScheduleDetail;
    window.addEventListener('gorkiLanguageChanged', visitorScheduleRedraw);

    noteEl.textContent = scheduleData.note || '';
    daysEl.innerHTML = '';
    scheduleData.days.forEach((day, index) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'schedule-day-btn' + (index === 0 ? ' active' : '');
        b.textContent = day.label || day.labelFull || String(index + 1);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        b.addEventListener('click', () => selectDay(index));
        daysEl.appendChild(b);
    });

    selectDay(0);

    window.reloadPublicSchedule = async function () {
        if (!isHttpContext) return;
        try {
            const response = await fetch('get_schedule.php');
            if (!response.ok) return;
            const result = await response.json();
            if (!result.success || !result.schedule || !Array.isArray(result.schedule.days)) return;
            scheduleData = result.schedule;
            noteEl.textContent = scheduleData.note || '';
            daysEl.innerHTML = '';
            scheduleData.days.forEach((day, index) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'schedule-day-btn' + (index === 0 ? ' active' : '');
                b.textContent = day.label || day.labelFull || String(index + 1);
                b.setAttribute('role', 'tab');
                b.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                b.addEventListener('click', () => selectDay(index));
                daysEl.appendChild(b);
            });
            selectDay(0);
            if (scheduleData.featured) renderFeaturedNews(scheduleData.featured);
        } catch (err) {
            console.warn('Не удалось обновить расписание', err);
        }
    };

    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        const t = new Date();
        bookingDate.min = t.toISOString().slice(0, 10);
        const max = new Date(t.getFullYear() + 1, t.getMonth(), t.getDate());
        bookingDate.max = max.toISOString().slice(0, 10);
    }

    populateBookingTimeOptions();
    window.addEventListener('gorkiLanguageChanged', populateBookingTimeOptions);

    prefillBookingForm(currentSiteUser);

    const bookingFacility = document.getElementById('bookingFacility');
    if (bookingFacility) {
        bookingFacility.addEventListener('change', loadBookingAvailability);
    }
    if (bookingDate) {
        bookingDate.addEventListener('change', loadBookingAvailability);
    }

    const bookingForm = document.getElementById('bookingForm');
    const bookingStatus = document.getElementById('bookingFormStatus');
    if (bookingForm && bookingStatus) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            bookingStatus.textContent = '';
            bookingStatus.className = 'form-status';
            if (!isHttpContext) {
                bookingStatus.classList.add('error');
                bookingStatus.textContent = tr('visitor-offline-hint');
                return;
            }
            const fd = new FormData(bookingForm);
            const payload = {
                name: (fd.get('name') || '').toString().trim(),
                phone: (fd.get('phone') || '').toString().trim(),
                email: (fd.get('email') || '').toString().trim(),
                facility: (fd.get('facility') || '').toString(),
                date: (fd.get('date') || '').toString(),
                time_pref: (fd.get('time_pref') || '').toString().trim(),
                duration_minutes: parseInt((fd.get('duration_minutes') || '0').toString(), 10),
                people_count: parseInt((fd.get('people_count') || '0').toString(), 10),
                comment: (fd.get('comment') || '').toString().trim()
            };
            if (!payload.name || !payload.phone || !payload.facility || !payload.date || !payload.time_pref) {
                bookingStatus.classList.add('error');
                bookingStatus.textContent = tr('booking-error-required');
                return;
            }
            if (!isBookingTimeAllowed(payload.time_pref)) {
                bookingStatus.classList.add('error');
                bookingStatus.textContent = tr('booking-error-time-range');
                return;
            }
            if (!payload.people_count || payload.people_count < 1) {
                bookingStatus.classList.add('error');
                bookingStatus.textContent = tr('booking-error-people');
                return;
            }
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const orig = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = tr('form-submitting');
            try {
                const res = await fetch('submit_booking.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    bookingStatus.classList.add('success');
                    bookingStatus.textContent = data.message || tr('booking-success');
                    bookingForm.reset();
                    populateBookingTimeOptions();
                    prefillBookingForm(currentSiteUser);
                    await loadBookingAvailability();
                    showNotification(bookingStatus.textContent, 'success');
                } else {
                    bookingStatus.classList.add('error');
                    bookingStatus.textContent = data.message || tr('error-generic');
                    if (res.status === 401) {
                        setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
                    }
                    showNotification(bookingStatus.textContent, 'error');
                }
            } catch (err) {
                bookingStatus.classList.add('error');
                bookingStatus.textContent = tr('error-network');
                showNotification(bookingStatus.textContent, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = orig;
            }
        });
    }

    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackStatus = document.getElementById('feedbackFormStatus');
    if (feedbackForm && feedbackStatus) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedbackStatus.textContent = '';
            feedbackStatus.className = 'form-status';
            const name = document.getElementById('feedbackName').value.trim();
            const email = document.getElementById('feedbackEmail').value.trim();
            const phone = document.getElementById('feedbackPhone').value.trim();
            const message = document.getElementById('feedbackMessage').value.trim();
            if (!name || !email || !message) {
                feedbackStatus.classList.add('error');
                feedbackStatus.textContent = tr('feedback-error-required');
                showNotification(feedbackStatus.textContent, 'error');
                return;
            }
            if (!isHttpContext) {
                feedbackStatus.classList.add('error');
                feedbackStatus.textContent = tr('visitor-offline-hint');
                showNotification(feedbackStatus.textContent, 'error');
                return;
            }
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const orig = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = tr('form-submitting');
            try {
                const res = await fetch('submit_feedback.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, message })
                });
                const data = await res.json();
                if (data.success) {
                    feedbackStatus.classList.add('success');
                    feedbackStatus.textContent = data.message || tr('feedback-success');
                    feedbackForm.reset();
                    showNotification(feedbackStatus.textContent, 'success');
                } else {
                    feedbackStatus.classList.add('error');
                    feedbackStatus.textContent = data.message || tr('error-generic');
                    showNotification(feedbackStatus.textContent, 'error');
                }
            } catch (err) {
                feedbackStatus.classList.add('error');
                feedbackStatus.textContent = tr('error-network');
                showNotification(feedbackStatus.textContent, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = orig;
            }
        });
    }
}

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Закрываем мобильное меню после клика
            navMenu.classList.remove('active');
        }
    });
});

// Анимация при прокрутке
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Наблюдаем за элементами
document.querySelectorAll('.service-card, .product-card, .advantage-item, .gallery-item, .visitor-panel').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Формы расписания, бронирования и обратной связи — initVisitorHub()
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Цвета в зависимости от типа
    if (type === 'success') {
        notification.style.background = '#10b981';
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
    } else {
        notification.style.background = '#3b82f6';
    }
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Изменение фона навигации при прокрутке
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Параллакс эффект для hero секции
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.3;
    }
    
    if (heroImage && scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Счетчик статистики
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '') + 
                                 (element.textContent.includes('%') ? '%' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '') + 
                                 (element.textContent.includes('%') ? '%' : '');
        }
    }, 16);
}

// Запуск счетчиков при прокрутке
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const statNumbers = entry.target.querySelectorAll('.stat-item h4');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                animateCounter(stat, number);
            });
            entry.target.classList.add('animated');
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Галерея - модальное окно
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
        // Здесь можно добавить логику для открытия модального окна с изображением
        console.log('Gallery item clicked');
    });
});

// Ленивая загрузка изображений (если они будут добавлены)
function lazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    lazyLoad();
    
    // Добавляем плавный переход для всех ссылок
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hostname !== window.location.hostname) {
                // Внешняя ссылка - открываем в новой вкладке
                if (!this.getAttribute('target')) {
                    this.setAttribute('target', '_blank');
                    this.setAttribute('rel', 'noopener noreferrer');
                }
            }
        });
    });
});

// Предотвращение двойного клика на мобильных устройствах
let touchEndTime = 0;
document.addEventListener('touchend', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - touchEndTime;
    if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
    }
    touchEndTime = currentTime;
});

// Lightbox для просмотра фотографий
let currentImageIndex = 0;
let galleryImages = [];

function openLightbox(imgSrc, images, index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');

    galleryImages = images;
    currentImageIndex = index || 0;

    lightboxImg.src = imgSrc;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Обновляем подпись
    if (images && images[currentImageIndex]) {
        lightboxCaption.textContent = images[currentImageIndex].name || '';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showNextImage() {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateLightboxImage();
}

function showPrevImage() {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');

    if (galleryImages[currentImageIndex]) {
        lightboxImg.src = galleryImages[currentImageIndex].data;
        lightboxCaption.textContent = galleryImages[currentImageIndex].name || '';
    }
}

// Инициализация lightbox
document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');

    // Закрытие по клику на крестик
    lightboxClose.addEventListener('click', closeLightbox);

    // Закрытие по клику вне изображения
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Кнопки навигации
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);

    // Навигация клавишами
    document.addEventListener('keydown', function(e) {
        if (lightbox.style.display === 'block') {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        }
    });

    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});

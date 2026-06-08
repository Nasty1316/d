import { readFileSync, writeFileSync } from 'fs';

const path = 'index.html';
let html = readFileSync(path, 'utf8');

const adminIdx = html.indexOf('id="adminModal"');
if (adminIdx === -1) throw new Error('adminModal not found');
const modalComment = html.lastIndexOf('<!--', adminIdx);
const splitAt = modalComment >= 0 ? modalComment : adminIdx;
let pub = html.slice(0, splitAt);
const admin = html.slice(splitAt);

const pairs = [
  ['<h4>Основные услуги:</h4>', '<h4 data-translate="facility-services-h4">Основные услуги:</h4>'],
  ['<p>Современная ледовая арена для занятий хоккеем, фигурным катанием и массового катания. Профессиональное оборудование и комфортные условия.</p>', '<p data-translate="fac-ice-desc">Современная ледовая арена для занятий хоккеем, фигурным катанием и массового катания. Профессиональное оборудование и комфортные условия.</p>'],
  ['<li>Массовое катание: взрослые - 4.50 руб., дети - 4.00 руб.</li>', '<li data-translate="fac-ice-s1">Массовое катание: взрослые - 4.50 руб., дети - 4.00 руб.</li>'],
  ['<li>Аренда ледового поля: 220 руб./час, 110 руб./30 мин</li>', '<li data-translate="fac-ice-s2">Аренда ледового поля: 220 руб./час, 110 руб./30 мин</li>'],
  ['<li>Заточка коньков: 5.80 руб./пара</li>', '<li data-translate="fac-ice-s3">Заточка коньков: 5.80 руб./пара</li>'],
  ['<li>Абонементы на 8/12 посещений</li>', '<li data-translate="fac-ice-s4">Абонементы на 8/12 посещений</li>'],
  ['<li>Тренировки по хоккею: 19.00 руб./час</li>', '<li data-translate="fac-ice-s5">Тренировки по хоккею: 19.00 руб./час</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Электронное табло</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-ice-f1">Электронное табло</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Раздевалки</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-ice-f2">Раздевалки</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Прокат коньков</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-ice-f3">Прокат коньков</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Заточка коньков</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-ice-f4">Заточка коньков</span></span>'],
  ['<p>Универсальный зал для игровых видов спорта - баскетбола, волейбола, футбола. Современное покрытие и оборудование.</p>', '<p data-translate="fac-gym-desc">Универсальный зал для игровых видов спорта - баскетбола, волейбола, футбола. Современное покрытие и оборудование.</p>'],
  ['<h3>Спортивный зал</h3>\n                            <p>г. Горки, ул. Вокзальная, 23</p>', '<h3 data-translate="fac-gym-title">Спортивный зал</h3>\n                            <p data-translate="facility-addr-vokzal23">г. Горки, ул. Вокзальная, 23</p>'],
  ['<li>Аренда зала: 75.00 руб./час</li>', '<li data-translate="fac-gym-s1">Аренда зала: 75.00 руб./час</li>'],
  ['<li>Аренда зала: 37.50 руб./30 мин</li>', '<li data-translate="fac-gym-s2">Аренда зала: 37.50 руб./30 мин</li>'],
  ['<li>Баскетбол, волейбол, футбол</li>', '<li data-translate="fac-gym-s3">Баскетбол, волейбол, футбол</li>'],
  ['<li>Проведение соревнований</li>', '<li data-translate="fac-gym-s4">Проведение соревнований</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Современное покрытие</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-gym-f1">Современное покрытие</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Инвентарь</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-gym-f2">Инвентарь</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Трибуны</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-gym-f3">Трибуны</span></span>'],
  ['<h3>Стадион</h3>\n                            <p>г. Горки, ул. Вокзальная, 21</p>', '<h3 data-translate="fac-stad-title">Стадион</h3>\n                            <p data-translate="facility-addr-vokzal21">г. Горки, ул. Вокзальная, 21</p>'],
  ['<p>Открытый стадион с футбольным полем, теннисными кортами и площадками для мини-футбола. Беговые дорожки для тренировок.</p>', '<p data-translate="fac-stad-desc">Открытый стадион с футбольным полем, теннисными кортами и площадками для мини-футбола. Беговые дорожки для тренировок.</p>'],
  ['<li>Футбольное поле: 70.00 руб./час</li>', '<li data-translate="fac-stad-s1">Футбольное поле: 70.00 руб./час</li>'],
  ['<li>Половина поля: 37.00 руб./час</li>', '<li data-translate="fac-stad-s2">Половина поля: 37.00 руб./час</li>'],
  ['<li>Мини-футбол: 27.00 руб./час</li>', '<li data-translate="fac-stad-s3">Мини-футбол: 27.00 руб./час</li>'],
  ['<li>Беговые дорожки: 2.60 руб./час</li>', '<li data-translate="fac-stad-s4">Беговые дорожки: 2.60 руб./час</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Искусственный газон</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-stad-f1">Искусственный газон</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Теннисные корты</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-stad-f2">Теннисные корты</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Беговые дорожки</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-stad-f3">Беговые дорожки</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Звуковое оборудование</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-stad-f4">Звуковое оборудование</span></span>'],
  ['<h3>Тренажерный зал</h3>\n                            <p>г. Горки, ул. Вокзальная, 23</p>', '<h3 data-translate="fac-fit-title">Тренажерный зал</h3>\n                            <p data-translate="facility-addr-vokzal23">г. Горки, ул. Вокзальная, 23</p>'],
  ['<p>Современный фитнес-центр с профессиональным оборудованием для силовых и кардиотренировок.</p>', '<p data-translate="fac-fit-desc">Современный фитнес-центр с профессиональным оборудованием для силовых и кардиотренировок.</p>'],
  ['<li>Фитнес: 6.50 руб./час</li>', '<li data-translate="fac-fit-s1">Фитнес: 6.50 руб./час</li>'],
  ['<li>Силовая подготовка: 5.50 руб./час</li>', '<li data-translate="fac-fit-s2">Силовая подготовка: 5.50 руб./час</li>'],
  ['<li>Абонемент фитнес 8/12 раз: 46.80/66.30 руб.</li>', '<li data-translate="fac-fit-s3">Абонемент фитнес 8/12 раз: 46.80/66.30 руб.</li>'],
  ['<li>Абонемент сила 8/12 раз: 39.60/56.10 руб.</li>', '<li data-translate="fac-fit-s4">Абонемент сила 8/12 раз: 39.60/56.10 руб.</li>'],
  ['<li>Коврики для йоги: 1.00 руб./час</li>', '<li data-translate="fac-fit-s5">Коврики для йоги: 1.00 руб./час</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Кардиотренажеры</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-fit-f1">Кардиотренажеры</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Силовые тренажеры</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-fit-f2">Силовые тренажеры</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Зал йоги</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-fit-f3">Зал йоги</span></span>'],
  ['<h3>Сауна</h3>\n                            <p>г. Горки, ул. Вокзальная, 23</p>', '<h3 data-translate="fac-sauna-title">Сауна</h3>\n                            <p data-translate="facility-addr-vokzal23">г. Горки, ул. Вокзальная, 23</p>'],
  ['<p>Отдых и восстановление после тренировок в современной сауне с бассейном и комнатой для мероприятий.</p>', '<p data-translate="fac-sauna-desc">Отдых и восстановление после тренировок в современной сауне с бассейном и комнатой для мероприятий.</p>'],
  ['<li>Первый час: 55.00 руб.</li>', '<li data-translate="fac-sauna-s1">Первый час: 55.00 руб.</li>'],
  ['<li>Каждый последующий час: 45.00 руб.</li>', '<li data-translate="fac-sauna-s2">Каждый последующий час: 45.00 руб.</li>'],
  ['<li>Бассейн</li>', '<li data-translate="fac-sauna-s3">Бассейн</li>'],
  ['<li>Комната для мероприятий (до 6 чел.)</li>', '<li data-translate="fac-sauna-s4">Комната для мероприятий (до 6 чел.)</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Бассейн</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-sauna-f1">Бассейн</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Комната отдыха</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-sauna-f2">Комната отдыха</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Макс. 6 человек</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-sauna-f3">Макс. 6 человек</span></span>'],
  ['<h3>Отделение конного спорта</h3>\n                            <p>г. Горки, ул. М. Иванова, 7</p>', '<h3 data-translate="fac-horse-title">Отделение конного спорта</h3>\n                            <p data-translate="facility-addr-ivanova7">г. Горки, ул. М. Иванова, 7</p>'],
  ['<p>Профессиональная конная база для занятий конным спортом и верховой езды под руководством опытных инструкторов.</p>', '<p data-translate="fac-horse-desc">Профессиональная конная база для занятий конным спортом и верховой езды под руководством опытных инструкторов.</p>'],
  ['<li>Содержание лошади: 19.50-24.70 руб./сутки</li>', '<li data-translate="fac-horse-s1">Содержание лошади: 19.50-24.70 руб./сутки</li>'],
  ['<li>Катание в манеже: 4.00 руб./круг</li>', '<li data-translate="fac-horse-s2">Катание в манеже: 4.00 руб./круг</li>'],
  ['<li>Катание на площадке: 3.50 руб./круг</li>', '<li data-translate="fac-horse-s3">Катание на площадке: 3.50 руб./круг</li>'],
  ['<li>Индивидуальное занятие: 23.00 руб./45 мин</li>', '<li data-translate="fac-horse-s4">Индивидуальное занятие: 23.00 руб./45 мин</li>'],
  ['<li>Фото- видеосъемка: 23.00 руб./30 мин</li>', '<li data-translate="fac-horse-s5">Фото- видеосъемка: 23.00 руб./30 мин</li>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Крытый манеж</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-horse-f1">Крытый манеж</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Открытые левады</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-horse-f2">Открытые левады</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Опытные инструкторы</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-horse-f3">Опытные инструкторы</span></span>'],
  ['<span class="feature-tag"><i class="fas fa-check"></i> Прокат экипировки</span>', '<span class="feature-tag"><i class="fas fa-check"></i> <span data-translate="fac-horse-f4">Прокат экипировки</span></span>'],
  ['<h3>Дополнительные услуги</h3>', '<h3 data-translate="add-svc-title">Дополнительные услуги</h3>'],
  ['<h4>Бильярд</h4>\n                        <p>9.00 руб./час</p>', '<h4 data-translate="add-billiard">Бильярд</h4>\n                        <p data-translate="add-billiard-price">9.00 руб./час</p>'],
  ['<h4>Настольный теннис</h4>\n                        <p>2.10 руб./30 мин</p>', '<h4 data-translate="add-tt">Настольный теннис</h4>\n                        <p data-translate="add-tt-price">2.10 руб./30 мин</p>'],
  ['<h4>Настольный футбол</h4>\n                        <p>1.70-3.40 руб.</p>', '<h4 data-translate="add-foosball">Настольный футбол</h4>\n                        <p data-translate="add-foosball-price">1.70-3.40 руб.</p>'],
  ['<h4>Конференц-зал</h4>\n                        <p>17.00 руб./час</p>', '<h4 data-translate="add-conf">Конференц-зал</h4>\n                        <p data-translate="add-conf-price">17.00 руб./час</p>'],
  ['<h4>Услуга автобуса</h4>\n                        <p>39.00 руб./час</p>', '<h4 data-translate="add-bus">Услуга автобуса</h4>\n                        <p data-translate="add-bus-price">39.00 руб./час</p>'],
  ['<h4>Услуга трактора</h4>\n                        <p>55.00 руб./час</p>', '<h4 data-translate="add-tractor">Услуга трактора</h4>\n                        <p data-translate="add-tractor-price">55.00 руб./час</p>'],
  ['<h4>Фото- видеосъемка</h4>\n                        <p>21.00 руб./30 мин</p>', '<h4 data-translate="add-photo">Фото- видеосъемка</h4>\n                        <p data-translate="add-photo-price">21.00 руб./30 мин</p>'],
  ['<h4>Дополнительные помещения</h4>\n                        <p>14.00 руб./час</p>', '<h4 data-translate="add-rooms">Дополнительные помещения</h4>\n                        <p data-translate="add-rooms-price">14.00 руб./час</p>'],
  ['<h3>Профессиональные тренеры</h3>\n                    <p>Опытные специалисты с certificationми</p>', '<h3 data-translate="adv-coaches">Профессиональные тренеры</h3>\n                    <p data-translate="adv-coaches-desc">Опытные специалисты с сертификатами</p>'],
  ['<h3>Достижения</h3>\n                    <p>Победы на республиканских и международных соревнованиях</p>', '<h3 data-translate="adv-achieve">Достижения</h3>\n                    <p data-translate="adv-achieve-desc">Победы на республиканских и международных соревнованиях</p>'],
  ['<h3>Детский спорт</h3>\n                    <p>Специализированные программы для детей и подростков</p>', '<h3 data-translate="adv-kids">Детский спорт</h3>\n                    <p data-translate="adv-kids-desc">Специализированные программы для детей и подростков</p>'],
  ['<h3>Безопасность</h3>\n                    <p>Современное оборудование и безопасные условия тренировок</p>', '<h3 data-translate="adv-safety">Безопасность</h3>\n                    <p data-translate="adv-safety-desc">Современное оборудование и безопасные условия тренировок</p>'],
  ['<h2>Новости и объявления</h2>\n                <p>Актуальная информация о наших услугах и мероприятиях</p>', '<h2 data-translate="news-heading">Новости и объявления</h2>\n                <p data-translate="news-lead">Актуальная информация о наших услугах и мероприятиях</p>'],
  ['<h2>Важная информация о безопасности</h2>', '<h2 data-translate="safety-heading">Важная информация о безопасности</h2>'],
  ['            <div class="section-subheader">\n                <p>Рекомендации по защите от мошенничества</p>\n            </div>', '            <div class="section-subheader">\n                <p data-translate="safety-lead">Рекомендации по защите от мошенничества</p>\n            </div>'],
  ['<h2>Фотогалерея</h2>\n                <p>Наши спортивные объекты и мероприятия</p>', '<h2 data-translate="gallery-heading">Фотогалерея</h2>\n                <p data-translate="gallery-lead">Наши спортивные объекты и мероприятия</p>'],
  ['<h2>Контакты</h2>\n                <p>Свяжитесь с нами для консультации</p>', '<h2 data-translate="contacts-title">Контакты</h2>\n                <p data-translate="contacts-description">Свяжитесь с нами для консультации</p>'],
  ['<h3>Руководство</h3>', '<h3 data-translate="management-title">Руководство</h3>'],
  ['<h3>Банковские реквизиты</h3>', '<h3 data-translate="bank-details-title">Банковские реквизиты</h3>'],
];

let missing = 0;
for (const [a, b] of pairs) {
  if (!pub.includes(a)) {
    console.warn('MISSING:', a.slice(0, 70));
    missing++;
  } else {
    pub = pub.replace(a, b);
  }
}

// First ice card title only
const iceMarker = '                <!-- Ледовая арена -->';
const icePos = pub.indexOf(iceMarker);
if (icePos !== -1) {
  const slice = pub.slice(icePos, icePos + 800);
  if (slice.includes('<h3>Ледовая арена</h3>')) {
    pub = pub.slice(0, icePos) + pub.slice(icePos).replace(
      '<h3>Ледовая арена</h3>\n                            <p>г. Горки, ул. Вокзальная, 23</p>',
      '<h3 data-translate="fac-ice-title">Ледовая арена</h3>\n                            <p data-translate="facility-addr-vokzal23">г. Горки, ул. Вокзальная, 23</p>'
    );
  }
}

writeFileSync(path, pub + admin);
console.log('missing count:', missing);

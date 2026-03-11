/*
// ================ HAMBURGER MENU ================
const headerContainer = document.querySelector(".header__container");
const nav = document.querySelector(".nav");
const menuIcon = document.querySelector(".nav__toggle");

function hideMenu() {
    nav.classList.remove("active");
}

function toggleMenu() {
    // Add show-icon to show and hide the menu icon
    menuIcon.classList.toggle('show-icon');
    const isExpanded = menuIcon.getAttribute('aria-expanded') === 'true';
    menuIcon.setAttribute('aria-expanded', !isExpanded);

    if (!nav.classList.contains("active")) {
        nav.classList.add("active");
    } else {
        hideMenu();
    }
}

// hide menu when clicking on another area of ​​the screen
document.addEventListener("click", function(event) {
    if (!headerContainer.contains(event.target)) {
        menuIcon.classList.remove('show-icon');
        menuIcon.setAttribute('aria-expanded', false);
        hideMenu();
    }
});
*/


/**
 * Класс управления навигационным меню.
 * Реализован с учетом паттерна Singleton (если меню одно) и принципов DRY.
 */
class Navigation {
    constructor(config) {
        this.header = document.querySelector(config.headerSelector);
        this.nav = document.querySelector(config.navSelector);
        this.toggleBtn = document.querySelector(config.toggleSelector);

        // Конфигурируемые классы (с дефолтными значениями)
        this.classes = {
            open: config.openClass || 'is-open',
            active: config.activeClass || 'is-active'
        };
        
        // Ранний выход, если элементы не найдены
        if (!this.header || !this.nav || !this.toggleBtn) {
            console.warn('Navigation: Elements not found. Execution stopped.');
            return;
        }

        // Привязываем контекст один раз, чтобы иметь возможность удалить слушатели
        this._onToggle = this.toggle.bind(this);
        this._onOutsideClick = this.handleOutsideClick.bind(this);
        this._onEscPress = this.handleEscPress.bind(this);

        this.init();
    }

    init() {
        this.toggleBtn.addEventListener('click', this._onToggle);

        document.addEventListener('click', this._onOutsideClick);

        // Закрытие по ESC (стандарт Senior-уровня для доступности)
        document.addEventListener('keydown', this._onEscPress);
    }

    /**
     * Метод уничтожения (Destroy) — маркер Senior кода.
     * Необходим для предотвращения утечек памяти.
     */
    destroy() {
        this.toggleBtn.removeEventListener('click', this._onToggle);
        document.removeEventListener('click', this._onOutsideClick);
        document.removeEventListener('keydown', this._onEscPress);
    }

    toggle() {
        const isOpen = this.nav.classList.contains(this.classes.open);
        isOpen ? this.close() : this.open();
    }

    open() {
        this.nav.classList.add(this.classes.open);
        this.toggleBtn.classList.add(this.classes.active);
        this.toggleBtn.setAttribute('aria-expanded', 'true');
        // Senior-фишка: блокировка скролла body при открытом меню
        document.body.style.overflow = 'hidden';
    }

    close() {
        // Проверка для Esc: если меню уже закрыто, ничего не делаем
        if (!this.nav.classList.contains(this.classes.open)) return;

        this.nav.classList.remove(this.classes.open);
        this.toggleBtn.classList.remove(this.classes.active);
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    handleOutsideClick(event) {
        // Оптимизация: если меню закрыто, функция "умирает" на этой строке
        if (!this.nav.classList.contains(this.classes.open)) return;
        
        if (!this.header.contains(event.target)) {
            this.close();
        }
    }

    handleEscPress(event) {
        if (event.key === 'Escape') this.close();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new Navigation({
        headerSelector: '.header',
        navSelector: '.nav',
        toggleSelector: '.nav__toggle',

        openClass: 'is-open',    // Можно переопределить при необходимости
        activeClass: 'is-active'
    });
});


class Marquee {
    constructor(selector) {
        this.wrappers = document.querySelectorAll(selector);

        if (!this.wrappers.length) return;

        this.init();
        this.initObserver();
        this.initResizeHandler();
    }

    init() {
        this.wrappers.forEach(wrapper => {
            const track = wrapper.querySelector('.trustedby__track');
            if (track) this.setupTrack(wrapper, track);
        });
    }

    setupTrack(wrapper, track) {
        const originalItems = [...track.children];
        const wrapperWidth = wrapper.offsetWidth;

        // Нужно вычесть один gap
        const style = getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap || 0);

        // реальная ширина оригинального набора (используем Math.round() т.к. браузер может вычислить 8vw = 63.428571px)
        const originalWidth = Math.round(track.scrollWidth + gap);

        let trackWidth = track.scrollWidth;

        // Наполняем трек, пока он не станет в 2 раза шире контейнера (это гарантирует отсутствие пустоты при любом разрешении)
        while(trackWidth < wrapperWidth + originalWidth) {
            originalItems.forEach(item => {
                const clone = item.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true'); // Хороший тон для доступности  
                track.appendChild(clone);
            });

            trackWidth = track.scrollWidth; // обновляем ширину после клонирования
        }

        // передаем ширину в CSS (Теперь distance = ширина оригинальной группы а не 50%)
        track.style.setProperty('--marquee-distance', `${originalWidth}px`);

        const speed = 25; // px per second
        const duration = originalWidth / speed;

        wrapper.style.setProperty('--duration', `${duration}s`);
    }

    initObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const track = entry.target.querySelector(".trustedby__track");
                if (!track) return;

                track.style.animationPlayState = 
                    entry.isIntersecting ? '' : 'paused';
            });
        }, { threshold: 0.1 });

        this.wrappers.forEach(wrapper => observer.observe(wrapper));
    }

    initResizeHandler() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                this.wrappers.forEach(wrapper => {
                    const track = wrapper.querySelector('.trustedby__track');
                    if (!track) return;

                    // удаляем clones
                    track.querySelectorAll('[aria-hidden]').forEach(el => el.remove());

                    // пересчёт
                    this.setupTrack(wrapper, track);
                });
            }, 200);
        });
    }
}


// Если картинка еще не загрузилась, ширина будет 0.
// Запускаем инициализацию по window.onload, чтобы браузер уже знал размеры всех логотипов. 
window.addEventListener('load', () => {
    new Marquee('.trustedby__wrapper');
});


/**
 * Tеперь marquee:
 * - бесшовный
 * - pause on hover
 * - pause вне viewport
 * - адаптивный
 * - пересчитывается при resize
 * - не дёргается на 120-144Hz
 * 
 * Это уже настоящий production компонент.
 */


// const wrapper = document.querySelector(".trustedby__wrapper");
// console.log(wrapper.offsetWidth);






// /**
//  * Класс для создания бесконечной бегущей строки (Marquee).
//  * Поддерживает динамическое клонирование элементов и адаптивность.
//  */
// class Marquee {
//     constructor(selector, options = {}) {
//         this.tracks = document.querySelector(selector);

//         if (!this.tracks.length) return;

//         this.options = {
//             cloneMultiplier: options.cloneMultiplier || 2,
//             ...options
//         };

//         this.init();
//     }

//     init() {
//         // Используем ImagesLoaded логику: ждем загрузки картинок для верных расчетов
//         window.addEventListener('load', () => {
//             this.tracks.forEach(track => this.setupTrack(track));
//         });

//         // Опционально: пересчет при ресайзе (с использованием Debounce)
//         window.addEventListener('resize', this.debounce(() => {
//             this.tracks.forEach(track => this.setupTrack(track));
//         }, 250));
//     }

//     /**
//      * Подготовка конкретного трека
//      */
//     setupTrack(track) {
//         const wrapper = track.parentElement;
//         if (!wrapper) return;

//         const items = [...track.children];
//         const wrapperWidth = wrapper.offsetWidth;
//         let trackWidth = track.scrollWidth;

//         // Важное уточнение: если trackWidth 0 (элементы скрыты), выходим
//         if (trackWidth === 0) return;

//         // Заполняем пространство, пока трек не станет больше ширины контейнера * множитель
//         while(trackWidth < wrapperWidth * this.options.cloneMultiplier) {
//             items.forEach(item => {
//                 const clone = item.cloneNode(true);
//                 clone.setAttribute('aria-hidden', 'true'); // Скрываем от скринридеров (Accessibility)
//                 track.appendChild(clone);
//             });
//             trackWidth = track.scrollWidth;
//         }
//     }

//     /**
//      * Вспомогательная функция для оптимизации производительности
//      */
//     debounce(func, wait) {
//         let timeout;
//         return function executedFunction(...args) {
//             const later = () => {
//                 clearTimeout(timeout);
//                 func(...args);
//             };
//             clearTimeout(timeout);
//             timeout = setTimeout(later, wait);
//         };
//     }

// }



/* class Marquee {
    constructor(selector) {
        this.wrappers = document.querySelectorAll(selector);

        if (!this.wrappers.length) return;

        this.init();
    }

    init() {
        this.wrappers.forEach(wrapper => {
            const track = wrapper.querySelector('.trustedby__track');
            if (track) {
                this.setupTrack(wrapper, track)
            }
        });
    }

    setupTrack(wrapper, track) {
        const originalItems = [...track.children];
        const wrapperWidth = wrapper.offsetWidth;

        // 1. Наполняем трек, пока он не станет в 2 раза шире контейнера + запас
        // Это гарантирует отсутствие пустоты при любом разрешении
        while (track.scrollWidth < wrapperWidth * 2) {
            originalItems.forEach(item => {
                const clone = item.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true'); // Хороший тон для доступности
                track.appendChild(clone);
            });
        }

        // 2. Вычисляем точную дистанцию для CSS
        // Нам нужно знать ширину ОДНОГО полного набора логотипов вместе с gap
        const gap = parseInt(window.getComputedStyle(track).gap) || 0;

        // Дистанция = (ширина всего контента / количество повторений)
        // Но проще и точнее: ширина одного оригинального набора + gap
        const itemWidth = originalItems[0].offsetWidth;
        const totalOriginalWidth = (itemWidth * originalItems.length) + (gap * (originalItems.length - 1));

        // Устанавливаем переменную для CSS. 
        // Прибавляем gap, чтобы первый элемент второго набора встал точно на место первого в первом
        wrapper.style.setProperty('--marquee-distance', `${totalOriginalWidth + gap}px`)

        // 3. Устанавливаем направление из data-атрибута (если есть
        const direction = track.dataset.direction || 'left';
        wrapper.setAttribute('data-direction', direction);

        // 4. Финальный штрих — запускаем анимацию
        wrapper.classList.add('is-ready');
    }
} */


// /** 
//  *  Нюанс в JS (для гарантии точности)
//  *  В твоем методе setupTrack есть момент: originalItems[0].offsetWidth. Если картинка еще не загрузилась, ширина будет 0.
//  * 
//  *  Рекомендация Senior-уровня: Запускай инициализацию не просто по DOMContentLoaded, а по window.onload, чтобы браузер уже знал размеры всех логотипов. 
// */

// // В конце файла
// window.addEventListener('load', () => {
//     new Marquee('.trustedby__wrapper');
// });



/* const marquees = document.querySelectorAll(".trustedby__wrapper");

marquees.forEach(wrapper => {

    const track = wrapper.querySelector(".trustedby__track");
    const direction = track.dataset.direction;

    wrapper.dataset.direction = direction;

    const originalItems = [...track.children];

    function setupMarquee() {

        track.innerHTML = "";
        originalItems.forEach(item => track.appendChild(item.cloneNode(true)));

        let contentWidth = track.scrollWidth;
        const wrapperWidth = wrapper.offsetWidth;

        while(contentWidth < wrapperWidth * 2) {
            originalItems.forEach(item => {
                track.appendChild(item.cloneNode(true));
            });

            contentWidth = track.scrollWidth;
        }

        wrapper.style.setProperty("--marquee-distance", contentWidth / 2 + "px");

        const speed = 80; // px per second
        const duration = (contentWidth / 2) / speed;

        wrapper.style.setProperty("--duration", duration + "s");

        wrapper.classList.add("is-ready");
    }

    setupMarquee();

    const resizeObserver = new ResizeObserver(()=>{
        setupMarquee();
    });

    resizeObserver.observe(wrapper);
}); */




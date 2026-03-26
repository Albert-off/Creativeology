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

    new ContactForm('.contact-form');
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






/**
 * Класс управления контактной формой.
 * Ответственность: валидация, обработка состояний полей, сабмит.
 */
/* class ContactForm {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) return;

        // Конфигурация классов, чтобы не хардкодить их в методах
        this.classes = {
            inputError: 'contact-form__input--error',
            errorText: 'contact-form__error'
        };

        this.selectors = {
            field: '.contact-form__field',
            input: 'input, textarea',
            checkbox: 'input[type="checkbox"]'
        };

        this.cacheDOM();
        this.bindEvents();
        this.init();
    }

    // ------------------------
    // INIT
    // ------------------------

    cacheDOM() {
        this.fields = [...this.form.querySelectorAll(this.selectors.input)];
        this.fieldsets = new Map();
        this.conditionals = new Map();

        this.form.querySelectorAll('[data-fieldset]').forEach(el => {
            this.fieldsets.set(el.dataset.fieldset, el);
        });
        
        this.form.querySelectorAll('[data-conditional]').forEach(el => {
            this.conditionals.set(el.dataset.conditional, {
                wrapper: el,
                input: el.querySelector(this.selectors.input)
            });
        });
    }

    bindEvents() {
        this._onInput = this.handleInput.bind(this);
        this._onChange = this.handleChange.bind(this);
        this._onFocusOut = this.handleFocusOut.bind(this);
        this._onSubmit = this.handleSubmit.bind(this);
    }

    init() {
        this.form.addEventListener('input', this._onInput);
        this.form.addEventListener('change', this._onChange); // Для чекбоксов лучше change

        // Используем фазу погружения (capture) для событий, которые не всплывают (blur/focus)
        // Либо используем focusout, который всплывает.
        this.form.addEventListener('focusout', this._onFocusOut);

        this.form.addEventListener('submit', this._onSubmit);
    }

    destroy() {
        this.form.removeEventListener('input', this._onInput);
        this.form.removeEventListener('change', this._onChange);
        this.form.removeEventListener('focusout', this._onFocusOut);
        this.form.removeEventListener('submit', this._onSubmit);
    }

    // ------------------------
    // EVENTS
    // ------------------------

    handleInput(event) {
        const field = event.target;

        // Перевалидируем "на лету" только если уже была показана ошибка
        if (this.isField(field) && field.classList.contains(this.classes.inputError)) {
            this.validateField(field);
        }
    }

    handleChange(event) {
        const el = event.target;

        // toggle fieldset
        if (el.dataset.toggle) {
            this.toggleFieldset(el.dataset.toggle, el.checked);
        }

        // toggle "other" field
        if (el.dataset.other) {
            this.toggleConditional(el.dataset.other, el.checked);
            el.setAttribute('aria-expanded', el.checked);
        }

        // validate checkbox group
        if (el.matches(this.selectors.checkbox)) {
            const fieldset = el.closest('fieldset');
            if (fieldset && !this.isHidden(fieldset)) {
                this.validateCheckboxGroup(fieldset);
            }
        }
    }

    handleFocusOut(event) {
        if (this.isField(event.target)) {
            this.validateField(event.target);
        }
    }

    handleSubmit(event) {
        let valid = true;

        // native validation
        if (!this.form.checkValidity()) {
            valid = false;
        }

        // custom validation
        this.fields.forEach(field => {
            if (!this.validateField(field)) valid = false;
        });

        // Валидация групп чекбоксов
        this.fieldsets.forEach(fs => {
            if (!this.isHidden(fs) && !this.validateCheckboxGroup(fs)) {
                valid = false;
            }
        });

        if (!valid) {
            event.preventDefault();
            this.focusFirstInvalid(); // Фокус на первый невалидный элемент (для A11y)
        }
    }

    // ------------------------
    // CONDITIONAL LOGIC
    // ------------------------

    toggleFieldset(name, visible) {
        const fieldset = this.fieldsets.get(name);
        if (!fieldset) return;

        fieldset.hidden = !visible;

        if (visible) {
            fieldset.querySelectorAll('input').forEach(input => {
                input.checked = false;
                this.clearError(input);
            });
        }
    }

    toggleConditional(name, visible) {
        const item = this.conditionals.get(name);
        if (!item) return;

        const { wrapper, input } = item;

        wrapper.hidden = !visible;

        if (visible) {
            input.disabled = false;
            input.required = true;
            input.focus();
        } else {
            // Когда скрываешь поле, лучше ещё убрать фокус
            if (document.activeElement === input) {
                input.blur();
            }

            input.disabled = true;
            input.required = false;
            input.value = '';
            this.clearError(input);
        }
    }

    // ------------------------
    // VALIDATION
    // ------------------------

    validateField(field) {
        // Senior tip: игнорируем поля, которые отключены или скрыты родителем
        if (field.disabled || this.isHidden(field)) {
            this.clearError(field);
            return true;
        }

        const message = this.getErrorMessage(field);
        
        this.clearError(field);

        if (!message) return;
        
        this.showError(field, message);
        return false;
    }

    // Валидация группы чекбоксов (минимум один выбран)
    validateCheckboxGroup(group) {
        const checkboxes = [...group.querySelectorAll(this.selectors.checkbox)];
        const isChecked = checkboxes.some(cb => cb.checked);

        this.clearGroupError(group);

        if (!isChecked) {
            this.showGroupError(group, 'Please select at least one option.');
            return false;
        }

        return true;
    }

    getErrorMessage(field) {
        const { validity } = field;  // validity = field.validity;

        if (validity.valid) return '';

        if (validity.valueMissing) return 'This field is required.';

        if (validity.typeMismatch || validity.badInput) {
            if (field.type === 'email') return 'Please enter a valid email address.';
            if (field.type === 'url') return 'Please enter a valid URL.';
        }

        if (validity.tooShort) return `Minimum length is ${field.minLength} characters.`;

        return 'Invalid field.';
    }

    // ------------------------
    // UI (ERRORS)
    // ------------------------

    showError(field, message) {
        const wrapper = field.closest(this.selectors.field);
        if (!wrapper) return;

        field.classList.add(this.classes.inputError);
        field.setAttribute('aria-invalid', 'true');

        // Создаем уникальный ID для ошибки для связи с input
        const errorId = `${field.id || 'field'}-error`; // На случай, если у поля нет id

        // Создаем элемент ошибки
        const errorElement = document.createElement('p');
        errorElement.className = this.classes.errorText;
        errorElement.id = errorId;
        errorElement.textContent = message;

        wrapper.appendChild(errorElement);

        // Связываем инпут с текстом ошибки
        const existing = field.getAttribute('aria-describedby');
        const describedby = existing ? `${existing} ${errorId}` : errorId;

        field.setAttribute('aria-describedby', describedby);
    }

    clearError(field) {
        field.classList.remove(this.classes.inputError);
        field.removeAttribute('aria-invalid');

        // field.removeAttribute('aria-describedby');  // мы удаляем hint (message-hint) и любые другие связи - это ломает accessibility
        const describedby = field.getAttribute('aria-describedby') || '';

        const ids = describedby
            .split(' ')
            .filter(id => !id.endsWith('-error'));

        if (ids.length) {
            field.setAttribute('aria-describedby', ids.join(' '));
        } else {
            field.removeAttribute('aria-describedby');
        }


        const wrapper = field.closest(this.selectors.field);

        // const errorElement = wrapper?.querySelector(`.${this.classes.errorText}`);
        // if (errorElement) errorElement.remove();

        wrapper?.querySelectorAll(`.${this.classes.errorText}`)
            .forEach(e => e.remove());
    }

    showGroupError(group, message) {
        const errorId = `${group.dataset.fieldset || 'group'}-error`;

        group.classList.add(this.classes.inputError);
        group.setAttribute('aria-invalid', 'true');
        group.setAttribute('aria-describedby', errorId);

        const errorElement = document.createElement('p');
        errorElement.className = this.classes.errorText;
        errorElement.id = errorId;
        errorElement.textContent = message;
        
        group.appendChild(errorElement);
    }

    clearGroupError(group) {
        group.classList.remove(this.classes.inputError);
        group.removeAttribute('aria-invalid');
        group.removeAttribute('aria-describedby');

        // const error = group.querySelector(`.${this.classes.errorText}`);
        // if (error) error.remove();

        group.querySelectorAll(`.${this.classes.errorText}`)
            .forEach(e => e.remove());
    }
    

    // ------------------------
    // HELPERS
    // ------------------------

    isField(el) {
        // return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
        return el.matches(this.selectors.input);
    }

    isHidden(el) {
        return el.closest('[hidden]');
    }

    focusFirstInvalid() {
        const el = this.form.querySelector(`.${this.classes.errorText}, :invalid`);

        if (!el) return;
        el.focus();
        // or el?.focus();

        // added
        const field = el.closest(this.selectors.field);
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

} */


class ContactForm {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) return;

        this.classes = {
            inputError: 'contact-form__input--error',
            errorText: 'contact-form__error'
        };

        this.selectors = {
            field: '.contact-form__field',
            input: 'input, textarea',
            checkables: 'input[type="checkbox"], input[type="radio"]'
        };

        this.isClickingInteractive = false;
        this.pendingField = null; // Здесь будем хранить поле "А"
        // this.cacheDOM();
        this.bindEvents();
        this.init();
    }

    static VALIDATORS = {
        'first-name': (value) => ContactForm.validateName(value, 'First name'),
        'last-name': (value) => ContactForm.validateName(value, 'Last name'),
        website: (value) => ContactForm.validateWebsite(value),
        'other-service': (value) => ContactForm.validateOtherField(value, 'service'),
        'other-content': (value) => ContactForm.validateOtherField(value, 'content type'),
        message: (value) => ContactForm.validateMessage(value)

        // 'brand-name': (value) => {
        //     return /testing/i.test(value)
        //     ? 'Brand name cannot contain the word "testing".'
        //     : '';
        // },
    };

    static validateName(rawValue, label) {
        const value = rawValue.trim();

        return /^[A-Za-z' -]+$/.test(value)
            ? ''
            : `The "${label}" can only contain letters, spaces, apostrophes, or hyphens.`;
    }

    static validateWebsite(rawValue) {
        const value = rawValue.trim();
        if (!value) return '';

        // Убираем протокол для чистоты проверки, если он есть
        const cleanValue = value.replace(/^https?:\/\//i, '');

        // Регулярка: 
        // 1. Начинается с буквы или цифры
        // 2. Содержит буквы, цифры, дефисы или точки (для поддоменов)
        // 3. Заканчивается точкой и зоной от 2 до 12 символов (бывают длинные зоны типа .photography)
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-.]*\.[a-zA-Z]{2,12}$/;

        if (!domainRegex.test(cleanValue)) {
            return 'Please enter a valid domain (e.g. example.com).';
        }

        // Проверка на "двойные точки" (common mistake: google..com)
        if (cleanValue.includes('..')) {
            return 'Domain cannot contain double dots.';
        }

        try {
            new URL(value.includes('://') ? value : `https://${value}`);
            return '';
        } catch {
            return 'Please enter a valid website address.';
        }
    }

    static validateOtherField(rawValue, label) {
        const value = rawValue.trim();

        if (!value) return 'Please describe the "Other" option or uncheck.';

        return /^[A-Za-z' -]+$/.test(value)
            ? ''
            : `The "${label}" field can only contain letters, spaces, apostrophes, or hyphens.`;
    }

    static validateMessage(rawValue) {
        const value = rawValue.trim();

        // \s* означает "любое количество пробелов (или их отсутствие)"
        // /i в конце делает поиск нечувствительным к регистру (N или n)
        const isNA = /^N\s*\/\s*A$/i.test(value);

        if (isNA) return '';
        if (!value) return `Please fill out this field or enter 'N/A' if you are unsure.`;
    }


    // ------------------------
    // INIT
    // ------------------------

    // cacheDOM() {
    //     this.fields = [...this.form.querySelectorAll(this.selectors.input)];
    //     this.fieldsets = new Map();
    //     this.conditionals = new Map();

    //     this.form.querySelectorAll('[data-fieldset]').forEach(el => {
    //         this.fieldsets.set(el.dataset.fieldset, el);
    //     });
        
    //     this.form.querySelectorAll('[data-conditional]').forEach(el => {
    //         this.conditionals.set(el.dataset.conditional, {
    //             wrapper: el,
    //             input: el.querySelector(this.selectors.input)
    //         });
    //     });
    // }

    bindEvents() {
        this._onMousedown = this.handleMousedown.bind(this);
        this._onInput = this.handleInput.bind(this);
        this._onChange = this.handleChange.bind(this);
        this._onBlur = this.handleBlur.bind(this);
        this._onSubmit = this.handleSubmit.bind(this);
    }

    init() {
        this.form.addEventListener('mousedown', this._onMousedown);
        this.form.addEventListener('input', this._onInput);
        this.form.addEventListener('change', this._onChange);
        this.form.addEventListener('blur', this._onBlur, true);
        this.form.addEventListener('submit', this._onSubmit);
    }

    destroy() {
        this.form.removeEventListener('mousedown', this._onMousedown);
        this.form.removeEventListener('input', this._onInput);
        this.form.removeEventListener('change', this._onChange);
        this.form.removeEventListener('blur', this._onBlur, true);
        this.form.removeEventListener('submit', this._onSubmit);
    }

    // ------------------------
    // EVENTS
    // ------------------------

    handleMousedown(event) {
        // Проверяем, кликнули ли мы в label или в чекбокс/радио
        const label = event.target.closest('label');

        if (label) {
            // Проверяем, есть ли внутри этого label чекбокс или радиокнопка
            const hasCheckable = label.querySelector('input[type="checkbox"], input[type="radio"]');
        
            if (hasCheckable) {
                this.isClickingInteractive = true;
                return;
            }
        }

        // Если кликнули не по лейблу, а напрямую по инпуту (редко, но бывает)
        if (this.isCheckable(event.target)) {
            this.isClickingInteractive = true;
            return;
        }

        // В handleMousedown
        if (event.target.type === 'submit' || event.target.closest('button[type="submit"]')) {
            this.isClickingInteractive = true;
            return;
        }

        // В остальных случаях (клик по пустому месту, текстовому лейблу и т.д.)
        this.isClickingInteractive = false;
    }

    handleInput(event) {
        const field = event.target;

        // 1. Проверяем, текстовое ли это поле
        if (!this.isTextField(field)) return;

        if (field.dataset.purpose === 'message') this.autoResize(field);
        
        // 2. Ключевой момент: валидируем "на лету" ТОЛЬКО если ошибка уже отображена.
        // Если поле "чистое", не пугаем пользователя до того, как он уйдет из поля (blur).
        if (field.classList.contains(this.classes.inputError)) {
            this.validateField(field);
        }
    }

    handleChange(event) {
        this.isClickingInteractive = false; // чтоб

        const el = event.target;

        if (!this.isCheckable(el)) return;

        console.log("Now we clicked to this checkbox:", el);

        // Если у нас есть "зависшее" поле А
        if (this.pendingField) {
            console.log('Выполняем отложенную валидацию для:', this.pendingField);
            this.validateField(this.pendingField);
            this.pendingField = null; // Очищаем память
        }

        // toggle fieldset
        if (el.dataset.logic === 'toggle-section') {
            el.setAttribute('aria-expanded', el.checked);
            const targetId = el.getAttribute('aria-controls');
            const fieldset = document.getElementById(targetId);
            if (!fieldset) return;
            this.toggleFieldset(fieldset, el.checked);
        }

        // toggle other field
        if (el.dataset.logic === 'show-other') {
            el.setAttribute('aria-expanded', el.checked);
            const targetId = el.getAttribute('aria-controls');
            const field = document.getElementById(targetId);
            if (!field) return;
            this.toggleField(field, el.checked);
        }


        // TODO if more than 1 checkbox is not checked -> required
        const fieldset = el.closest('fieldset');

        if (fieldset && !this.isHidden(fieldset)) {
            this.validateFieldset(fieldset);
        }
    }

    handleBlur(event) {
        const field = event.target;

        if (!this.isTextField(field)) {
            const fieldset = field.closest('fieldset');
            if (fieldset) this.validateFieldset(fieldset);
            return;
        }

        const related = event.relatedTarget; // Куда ушел фокус

        // Проверяем relatedTarget на наличие чекбокса внутри лейбла
        const isRelatedCheckableLabel = related &&
            related.tagName === 'LABEL' &&
            related.querySelector('input[type="checkbox"], input[type="radio"]');
        
        const isClickInsideInteractive = 
            (related && (this.isCheckable(related) || isRelatedCheckableLabel)) || 
            this.isClickingInteractive;

        // Сбрасываем флаг сразу после чтения
        this.isClickingInteractive = false;
        
        if (isClickInsideInteractive) console.log("клик внутри label или submit", related);

        // Если фокус ушел на чекбокс или кнопку отправки внутри ЭТОЙ же формы
        if (isClickInsideInteractive) {
            console.log('Blur ждет:', related);
            this.pendingField = field; // Запомнили поле А
            console.log('Валидация поля А отложена');
            return; // Просто не запускаем валидацию сейчас, пусть сработает change или submit
        }

        console.log('Blur event captured on:', event.target); // 1. Проверяем сам факт события
        this.validateField(field);
    }

    handleSubmit(event) {
        // 1. Предотвращаем стандартную отправку формы
        event.preventDefault();

        let isFormValid = true;

        // 2. Получаем все элементы управления формой (input, textarea)
        // Мы исключаем кнопки и fieldset-ы, которые не требуют групповой проверки
        const elements = Array.from(this.form.elements);

        // Список уже проверенных групп (чтобы не проверять один и тот же радио-баттон 5 раз)
        const checkedGroups = new Set();

        elements.forEach(element => {
            // Пропускаем саму кнопку сабмита и скрытые/отключенные поля
            if (element.type === 'submit' || element.disabled || this.isHidden(element)) {
                return;
            }

            // Логика для ГРУПП (Radio и Checkbox в Fieldset)
            const fieldset = element.closest('fieldset[data-fieldset], fieldset.contact-form__field');
            if (fieldset) {
                if (!checkedGroups.has(fieldset)) {
                    const isValid = this.validateFieldset(fieldset);
                    if (!isValid) isFormValid = false;
                    checkedGroups.add(fieldset);
                }
                return;
            }

            // Логика для ОБЫЧНЫХ полей (text, email, textarea)
            if (this.isTextField(element)) {
                const isValid = this.validateField(element);
                if (!isValid) isFormValid = false;
            }
        });

        // 3. Скролл к первой ошибке для удобства пользователя eсли не всё валидно
        if (!isFormValid) {
            this.focusFirstInvalid();
            return;
        }

        // 4. Если всё валидно — можно отправлять данные
        console.log('Форма готова к отправке!');

        this.normalizeWebsiteField();
        // Дальше отправка...

        // 1. Создаем объект FormData из вашей формы
        // 2. Преобразуем в обычный объект для удобного просмотра в консоли
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        console.log('Собранные данные:', data)

        // this.form.submit(); // Раскомментируйте для реальной отправки


        // // Проверяем все поля перед отправкой
        // const fields = Array.from(this.form.elements);
        // const isFormValid = fields.every(field => this.validateField(field));

        // if (!isFormValid) {
        //     event.preventDefault();
        //     this.form.querySelector(`.${this.classes.inputError}`)?.focus();
        //     return;
        // }
    }

    // ------------------------
    // CORE LOGIC
    // ------------------------

    autoResize(textarea) {
        textarea.style.height = "auto"; // Reset
        textarea.style.height = `${textarea.scrollHeight}px`;   // Setting a new height
    }

    toggleFieldset(fieldset, visible) {
        fieldset.hidden = !visible;
        fieldset.disabled = !visible;

        // Важно: отключаем инпут внутри, чтобы не слать лишнее на сервер
        // const inputs = fieldset.querySelectorAll('input[type="checkbox"]');
        // inputs.forEach(input => input.disabled = !visible);
    }

    toggleField(field, visible) {
        field.hidden = !visible;

        const input = field.querySelector('input[type="text"]');
        input.disabled = !visible;
        if (visible) input.focus();
        // else input.blur();
        // else if (document.activeElement === input) input.blur();
    }

    validateField(field) {
        const errorMessage = this.getErrorMessage(field);
        this.toggleError(field, errorMessage);
        return !errorMessage;
    }

    validateFieldset(fieldset) {
        const checkables = [...fieldset.querySelectorAll(this.selectors.checkables)];
        const isAnyChecked = checkables.some(cb => cb.checked);

        let errorMessage = '';

        // Берем первый checkable, если он есть
        const firstInput = checkables[0];
        const defaultMessage = (firstInput && firstInput.type === 'radio') 
            ? 'Please select an option.' 
            : 'Please select at least one option.';

        if (!isAnyChecked) {
            errorMessage = defaultMessage;
        } else {
            // 2. Расширенная проверка: если выбран "Other", заполнен ли текст?
            const otherCheckbox = checkables.find(cb => cb.dataset.logic === 'show-other' && cb.checked);
            if (otherCheckbox) {
                // Ищем текстовое поле, связанное с этим чекбоксом через aria-controls
                const otherInputContainer = document.getElementById(otherCheckbox.getAttribute('aria-controls'));
                const otherTextInput = otherInputContainer?.querySelector('input[type="text"]');

                if (otherTextInput && !otherTextInput.value.trim()) {
                    errorMessage = 'Please describe the "Other" option or uncheck.';
                }
            }
        }

        this.toggleError(fieldset, errorMessage);
        return errorMessage === '';
    }

    getErrorMessage(field) {
        const { validity, value } = field;  // validity = field.validity;
        const purpose = field.dataset.purpose;
        const customValidator = ContactForm.VALIDATORS[purpose];

        // 1. Если поле пустое и НЕ обязательное — ошибок нет
        if (!value.trim() && !validity.valueMissing && !customValidator) {
            return '';
        }

        // 2. Если браузер нашел стандартную ошибку (required, minlength и т.д.)
        if (!validity.valid) {
            if (validity.valueMissing) return 'This field is required.';
            if (validity.tooShort) return `Minimum length is ${field.minLength} characters.`;
            
            // Для email и url браузер сам поймет typeMismatch, 
            // но мы даем более "человечный" текст
            if (field.type === 'email') return 'Please enter a valid email address.';
            
            // // Если это URL и у нас есть кастомный валидатор — отдаем приоритет ему,
            // // так как он умнее стандартной проверки браузера
            // if (field.type === 'url' && customValidator) {
            //     return customValidator(value.trim());
            // }
        }

        // 3. Если браузер считает поле валидным, проверяем наши бизнес-правила (кастомные)
        if (customValidator) return customValidator(value.trim());

        // 4. Финальный штрих: если поле невалидно по какой-то экзотической причине
        return validity.valid ? '' : (field.validationMessage || 'Invalid field.');

        /*         
        typeMismatch: Срабатывает, только если текст не соответствует формату (например, нет @ в email)
        
        badInput стоит проверять только для полей type="number", когда пользователь ввел что-то, 
        что браузер даже не может превратить в число (например, буквы в поле для цифр). 
        Для email и url это свойство почти никогда не пригодится. 
        */
    }

    toggleError(field, message) {
        // 1. Находим общий контейнер (div или fieldset)
        const wrapper = field.closest(this.selectors.field);
        if (!wrapper) return;

        // 2. Ищем ошибку ВНУТРИ этого контейнера
        const existingError = wrapper.querySelector('.' + this.classes.errorText);

        // 3. Убираем старую ошибку
        field.classList.remove(this.classes.inputError);
        if (existingError) existingError.remove();

        // 4. Если есть сообщение — создаем новую ошибку и добавляем в КОНЕЦ контейнера
        if (message) {
            field.classList.add(this.classes.inputError);

            const errorEl =document.createElement('p');
            errorEl.className = this.classes.errorText;
            errorEl.textContent = message;
            errorEl.setAttribute('role', 'alert'); // A11y: для скринридеров

            // Вставляем ошибку в самый конец группы (после всех инпутов/лейблов)
            wrapper.appendChild(errorEl);
        }
    }

    // ------------------------
    // UTILS
    // ------------------------

    isTextField(field) {
        const textTypes = ['text', 'email'];
        return field.tagName === 'TEXTAREA' || (field.tagName === 'INPUT' && textTypes.includes(field.type));
    }

    isCheckable(field) {
        return field.tagName === 'INPUT' && (field.type === 'checkbox' || field.type === 'radio');
    }

    isHidden(field) {
        return field.closest('[hidden]');
    }

    focusFirstInvalid() {
        const firstInvalid = this.form.querySelector(`.${this.classes.inputError}, :invalid`);

        if (!firstInvalid) return;

        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    normalizeWebsiteField() {
        const field = this.form.querySelector('[data-purpose="website"]');
        if (!field || !field.value.trim()) return;

        // если есть ошибка — не нормализуем, пусть браузер покажет ошибку
        if (ContactForm.validateWebsite(field.value)) return;

        let url = field.value.trim();
        // Если нет протокола — добавляем https://
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

        try {
            field.value = new URL(url).href; // нормализуем окончательно
        } catch {
            // если некорректный — оставляем как есть, браузер сам покажет ошибку
        }
    }


    // handleInput(event) {
    //     const field = event.target;

    //     // Перевалидируем "на лету" только если уже была показана ошибка
    //     if (this.isField(field) && field.classList.contains(this.classes.inputError)) {
    //         this.validateField(field);
    //     }
    // }

    // handleChange(event) {
    //     const el = event.target;

    //     // toggle fieldset
    //     if (el.dataset.toggle) {
    //         this.toggleFieldset(el.dataset.toggle, el.checked);
    //     }

    //     // toggle "other" field
    //     if (el.dataset.other) {
    //         this.toggleConditional(el.dataset.other, el.checked);
    //         el.setAttribute('aria-expanded', el.checked);
    //     }

    //     // validate checkbox group
    //     if (el.matches(this.selectors.checkbox)) {
    //         const fieldset = el.closest('fieldset');
    //         if (fieldset && !this.isHidden(fieldset)) {
    //             this.validateCheckboxGroup(fieldset);
    //         }
    //     }
    // }

    // handleFocusOut(event) {
    //     if (this.isField(event.target)) {
    //         this.validateField(event.target);
    //     }
    // }

    // handleSubmit(event) {
    //     let valid = true;

    //     // native validation
    //     if (!this.form.checkValidity()) {
    //         valid = false;
    //     }

    //     // custom validation
    //     this.fields.forEach(field => {
    //         if (!this.validateField(field)) valid = false;
    //     });

    //     // Валидация групп чекбоксов
    //     this.fieldsets.forEach(fs => {
    //         if (!this.isHidden(fs) && !this.validateCheckboxGroup(fs)) {
    //             valid = false;
    //         }
    //     });

    //     if (!valid) {
    //         event.preventDefault();
    //         this.focusFirstInvalid(); // Фокус на первый невалидный элемент (для A11y)
    //     }
    // }
}



const form = document.querySelector('.contact-form');
const fields = Array.from(form.elements);
console.log(fields)



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



/* 
9. Production UX

После отправки:

Loading state
Success message
Error message

Например:

<p class="contact-form__success">
  Thank you! We'll get back to you soon.
</p>
*/


// if (window.location.pathname.endsWith('/contact.html')) {}


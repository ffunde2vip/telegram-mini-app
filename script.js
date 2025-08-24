// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Инициализация приложения
tg.ready();
tg.expand();

// Получение элементов DOM
const userName = document.getElementById('userName');
const userLastName = document.getElementById('userLastName');
const userUsername = document.getElementById('userUsername');
const userId = document.getElementById('userId');
const userLanguage = document.getElementById('userLanguage');
const userPlatform = document.getElementById('userPlatform');
const appVersion = document.getElementById('appVersion');
const themeMode = document.getElementById('themeMode');
const colorScheme = document.getElementById('colorScheme');
const userAvatar = document.getElementById('userAvatar');
const onlineStatus = document.getElementById('onlineStatus');
const shareButton = document.getElementById('shareButton');
const closeButton = document.getElementById('closeButton');

// Функция для отображения данных пользователя
function displayUserInfo() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        // Основная информация о пользователе
        userName.textContent = user.first_name || 'Не указано';
        userLastName.textContent = user.last_name || 'Не указано';
        userUsername.textContent = user.username ? '@' + user.username : 'Не указано';
        userId.textContent = user.id || 'Не указано';
        
        // Аватар пользователя
        if (user.photo_url) {
            userAvatar.src = user.photo_url;
            userAvatar.style.display = 'block';
        } else {
            userAvatar.style.display = 'none';
        }
        
        // Статус онлайн (симуляция)
        onlineStatus.style.display = 'block';
    } else {
        // Если данные пользователя недоступны
        userName.textContent = 'Недоступно';
        userLastName.textContent = 'Недоступно';
        userUsername.textContent = 'Недоступно';
        userId.textContent = 'Недоступно';
        userAvatar.style.display = 'none';
        onlineStatus.style.display = 'none';
    }
    
    // Информация о приложении
    userLanguage.textContent = tg.languageCode || 'Не определен';
    userPlatform.textContent = getPlatformName(tg.platform);
    appVersion.textContent = tg.version || 'Не определена';
    
    // Информация о теме
    themeMode.textContent = getThemeName(tg.colorScheme);
    colorScheme.textContent = tg.colorScheme || 'Не определена';
}

// Функция для получения названия платформы
function getPlatformName(platform) {
    const platforms = {
        'android': 'Android',
        'ios': 'iOS',
        'macos': 'macOS',
        'tdesktop': 'Telegram Desktop',
        'weba': 'Web App',
        'webk': 'Web K',
        'unigram': 'Unigram',
        'unknown': 'Неизвестно'
    };
    return platforms[platform] || platform || 'Не определено';
}

// Функция для получения названия темы
function getThemeName(colorScheme) {
    const themes = {
        'light': 'Светлая',
        'dark': 'Темная'
    };
    return themes[colorScheme] || colorScheme || 'Не определена';
}

// Функция для применения темы
function applyTheme() {
    document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
    document.body.style.color = tg.themeParams.text_color || '#000000';
    
    // Применяем цвета кнопок
    const primaryButtons = document.querySelectorAll('.btn-primary');
    primaryButtons.forEach(btn => {
        btn.style.backgroundColor = tg.themeParams.button_color || '#0088cc';
        btn.style.color = tg.themeParams.button_text_color || '#ffffff';
    });
    
    // Применяем цвета для вторичных элементов
    const secondaryElements = document.querySelectorAll('.user-info, .theme-info');
    secondaryElements.forEach(el => {
        el.style.backgroundColor = tg.themeParams.secondary_bg_color || '#f8f9fa';
    });
}

// Обработчик кнопки "Поделиться"
shareButton.addEventListener('click', () => {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        const shareText = `Пользователь: ${user.first_name || ''} ${user.last_name || ''}\nUsername: ${user.username ? '@' + user.username : 'Не указан'}\nID: ${user.id}`;
        
        // Отправляем данные обратно в бот
        tg.sendData(JSON.stringify({
            action: 'share',
            user: user,
            timestamp: new Date().toISOString()
        }));
        
        // Показываем уведомление
        tg.showAlert('Информация отправлена в чат!');
    }
});

// Обработчик кнопки "Закрыть"
closeButton.addEventListener('click', () => {
    tg.close();
});

// Обработчик изменения темы
tg.onEvent('themeChanged', () => {
    applyTheme();
});

// Обработчик изменения размера окна
tg.onEvent('viewportChanged', () => {
    // Можно добавить логику для адаптации под размер окна
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    displayUserInfo();
    applyTheme();
    
    // Устанавливаем основной цвет кнопки
    tg.MainButton.setParams({
        text: 'Готово',
        color: tg.themeParams.button_color || '#0088cc',
        text_color: tg.themeParams.button_text_color || '#ffffff'
    });
    
    // Показываем основную кнопку
    tg.MainButton.show();
    
    // Обработчик основной кнопки
    tg.MainButton.onClick(() => {
        const user = tg.initDataUnsafe?.user;
        if (user) {
            tg.sendData(JSON.stringify({
                action: 'user_info',
                user: user,
                app_info: {
                    platform: tg.platform,
                    version: tg.version,
                    language: tg.languageCode,
                    theme: tg.colorScheme
                },
                timestamp: new Date().toISOString()
            }));
        }
        tg.close();
    });
});

// Функция для отправки данных в бот
function sendDataToBot(data) {
    if (tg.initData) {
        tg.sendData(JSON.stringify(data));
    }
}

// Экспорт функций для возможного использования
window.TelegramApp = {
    sendData: sendDataToBot,
    getUser: () => tg.initDataUnsafe?.user,
    getAppInfo: () => ({
        platform: tg.platform,
        version: tg.version,
        language: tg.languageCode,
        theme: tg.colorScheme
    })
};

// Конфигурация приложения
const CONFIG = {
    // Список ID администраторов Telegram
    ADMIN_IDS: [
        '1435191157', // ID администратора
        // Добавьте других администраторов
    ],
    
    // Настройки приложения
    APP_NAME: 'Косметология',
    DEFAULT_CITY: 'Москва',
    DEFAULT_STREET: 'ул. Примерная',
    
    // Настройки безопасности
    ENABLE_ADMIN_AUTH: true, // Требовать авторизацию для админов
    AUTO_DETECT_ROLE: true,  // Автоматически определять роль пользователя
};

// Функция для проверки администратора
function isAdmin(userId) {
    return CONFIG.ADMIN_IDS.includes(userId.toString());
}

// Функция для добавления администратора
function addAdmin(userId) {
    if (!CONFIG.ADMIN_IDS.includes(userId.toString())) {
        CONFIG.ADMIN_IDS.push(userId.toString());
        console.log(`Администратор ${userId} добавлен`);
    }
}

// Функция для удаления администратора
function removeAdmin(userId) {
    const index = CONFIG.ADMIN_IDS.indexOf(userId.toString());
    if (index > -1) {
        CONFIG.ADMIN_IDS.splice(index, 1);
        console.log(`Администратор ${userId} удален`);
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, isAdmin, addAdmin, removeAdmin };
}

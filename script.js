// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Инициализация приложения
tg.ready();
tg.expand();

// Глобальные переменные
let currentUser = null;
let currentRole = null;
let procedures = [];
let clients = [];
let currentProcedureId = null;

// Элементы DOM
const loadingScreen = document.getElementById('loadingScreen');
const authScreen = document.getElementById('authScreen');
const userInterface = document.getElementById('userInterface');
const adminInterface = document.getElementById('adminInterface');

// Модальные окна
const addProcedureModal = document.getElementById('addProcedureModal');
const viewProcedureModal = document.getElementById('viewProcedureModal');
const editProcedureModal = document.getElementById('editProcedureModal');
const viewClientModal = document.getElementById('viewClientModal');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Инициализация приложения
function initializeApp() {
    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        currentUser = {
            id: user.id,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            username: user.username || '',
            photoUrl: user.photo_url || '',
            city: 'Москва', // По умолчанию
            street: 'ул. Примерная' // По умолчанию
        };
        
            // Автоматически определяем роль пользователя
    if (isAdmin(currentUser.id)) {
        // Администратор может выбрать роль
        showAuthScreen();
    } else {
        // Обычный пользователь - сразу показываем интерфейс пользователя
        currentRole = 'user';
        showUserInterface();
    }
    } else {
        // Если данные пользователя недоступны, показываем интерфейс пользователя
        currentUser = {
            id: 'unknown',
            firstName: 'Гость',
            lastName: '',
            username: '',
            photoUrl: '',
            city: 'Москва',
            street: 'ул. Примерная'
        };
        showUserInterface();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки ролей
    document.getElementById('userRoleBtn').addEventListener('click', () => {
        currentRole = 'user';
        showUserInterface();
    });
    
    document.getElementById('adminRoleBtn').addEventListener('click', () => {
        currentRole = 'admin';
        showAdminInterface();
    });
    
    // Кнопки выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    
    // Кнопки модальных окон
    document.getElementById('addProcedureBtn').addEventListener('click', showAddProcedureModal);
    document.getElementById('closeAddModal').addEventListener('click', hideAddProcedureModal);
    document.getElementById('cancelAddProcedure').addEventListener('click', hideAddProcedureModal);
    
    document.getElementById('closeViewModal').addEventListener('click', hideViewProcedureModal);
    document.getElementById('closeEditModal').addEventListener('click', hideEditProcedureModal);
    document.getElementById('cancelEditProcedure').addEventListener('click', hideEditProcedureModal);
    
    document.getElementById('closeClientModal').addEventListener('click', hideViewClientModal);
    
    // Формы
    document.getElementById('addProcedureForm').addEventListener('submit', handleAddProcedure);
    document.getElementById('editProcedureForm').addEventListener('submit', handleEditProcedure);
    
    // Кнопки действий
    document.getElementById('editProcedureBtn').addEventListener('click', showEditProcedureModal);
    document.getElementById('deleteProcedureBtn').addEventListener('click', handleDeleteProcedure);
    
    // Поиск клиентов
    document.getElementById('searchClients').addEventListener('input', handleSearchClients);
}

// Проверка является ли пользователь администратором
function isAdmin(userId) {
    return CONFIG.ADMIN_IDS.includes(userId.toString());
}

// Показать экран авторизации
function showAuthScreen() {
    loadingScreen.style.display = 'none';
    authScreen.style.display = 'flex';
    userInterface.style.display = 'none';
    adminInterface.style.display = 'none';
    
    // Если пользователь администратор, показываем кнопку админа
    const adminBtn = document.getElementById('adminRoleBtn');
    if (isAdmin(currentUser.id)) {
        adminBtn.style.display = 'flex';
        adminBtn.disabled = false;
    } else {
        adminBtn.style.display = 'none';
        // Или можно сделать кнопку неактивной
        // adminBtn.disabled = true;
        // adminBtn.style.opacity = '0.5';
    }
}

// Показать интерфейс пользователя
function showUserInterface() {
    loadingScreen.style.display = 'none';
    authScreen.style.display = 'none';
    userInterface.style.display = 'block';
    adminInterface.style.display = 'none';
    
    updateUserInfo();
    loadProcedures();
    renderProcedures();
}

// Показать интерфейс администратора
function showAdminInterface() {
    loadingScreen.style.display = 'none';
    authScreen.style.display = 'none';
    userInterface.style.display = 'none';
    adminInterface.style.display = 'block';
    
    loadClients();
    renderClients();
}

// Обновить информацию о пользователе
function updateUserInfo() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userLocation = document.getElementById('userLocation');
    
    if (currentUser.photoUrl) {
        userAvatar.src = currentUser.photoUrl;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.style.display = 'none';
    }
    
    const roleBadge = isAdmin(currentUser.id) ? ' (Админ)' : '';
    userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Клиент' + roleBadge;
    userLocation.textContent = `${currentUser.city}, ${currentUser.street}`;
}

// Загрузка процедур (симуляция)
function loadProcedures() {
    // В реальном приложении здесь был бы запрос к серверу
    procedures = JSON.parse(localStorage.getItem(`procedures_${currentUser.id}`)) || [];
}

// Сохранение процедур
function saveProcedures() {
    localStorage.setItem(`procedures_${currentUser.id}`, JSON.stringify(procedures));
}

// Отображение процедур
function renderProcedures() {
    const proceduresList = document.getElementById('proceduresList');
    
    if (procedures.length === 0) {
        proceduresList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>У вас пока нет процедур</p>
                <p>Нажмите "Добавить процедуру" чтобы начать</p>
            </div>
        `;
        return;
    }
    
    proceduresList.innerHTML = procedures
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(procedure => `
            <div class="procedure-item" data-id="${procedure.id}">
                <div class="procedure-header">
                    <div class="procedure-title">${procedure.name}</div>
                    <div class="procedure-date">${formatDate(procedure.date)}</div>
                </div>
                <div class="procedure-preview">${procedure.changes.substring(0, 100)}${procedure.changes.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.procedure-item').forEach(item => {
        item.addEventListener('click', () => {
            const procedureId = item.dataset.id;
            showProcedureDetails(procedureId);
        });
    });
}

// Загрузка клиентов (симуляция)
function loadClients() {
    // В реальном приложении здесь был бы запрос к серверу
    const allProcedures = {};
    const allUsers = {};
    
    // Собираем данные всех пользователей
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('procedures_')) {
            const userId = key.replace('procedures_', '');
            const userProcedures = JSON.parse(localStorage.getItem(key)) || [];
            
            if (userProcedures.length > 0) {
                allProcedures[userId] = userProcedures;
                
                // Создаем объект пользователя
                allUsers[userId] = {
                    id: userId,
                    firstName: userProcedures[0]?.userName || 'Клиент',
                    lastName: '',
                    username: '',
                    photoUrl: '',
                    city: 'Москва',
                    street: 'ул. Примерная',
                    proceduresCount: userProcedures.length
                };
            }
        }
    }
    
    clients = Object.values(allUsers);
}

// Отображение клиентов
function renderClients() {
    const clientsList = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Пока нет клиентов</p>
                <p>Клиенты появятся после регистрации</p>
            </div>
        `;
        return;
    }
    
    clientsList.innerHTML = clients.map(client => `
        <div class="client-item" data-id="${client.id}">
            <div class="client-info">
                <img src="${client.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlOWVjZWYiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo='}" alt="Аватар" class="client-avatar">
                <div class="client-details">
                    <h4>${client.firstName} ${client.lastName}</h4>
                    <p>@${client.username || 'без username'}</p>
                </div>
            </div>
            <div class="client-stats">
                <div class="client-stat">
                    <i class="fas fa-clipboard-list"></i>
                    ${client.proceduresCount} процедур
                </div>
                <div class="client-stat">
                    <i class="fas fa-map-marker-alt"></i>
                    ${client.city}, ${client.street}
                </div>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.client-item').forEach(item => {
        item.addEventListener('click', () => {
            const clientId = item.dataset.id;
            showClientDetails(clientId);
        });
    });
}

// Поиск клиентов
function handleSearchClients(event) {
    const searchTerm = event.target.value.toLowerCase();
    const clientItems = document.querySelectorAll('.client-item');
    
    clientItems.forEach(item => {
        const clientName = item.querySelector('h4').textContent.toLowerCase();
        const clientUsername = item.querySelector('p').textContent.toLowerCase();
        
        if (clientName.includes(searchTerm) || clientUsername.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Показать модальное окно добавления процедуры
function showAddProcedureModal() {
    addProcedureModal.style.display = 'flex';
    document.getElementById('procedureDate').value = new Date().toISOString().split('T')[0];
}

// Скрыть модальное окно добавления процедуры
function hideAddProcedureModal() {
    addProcedureModal.style.display = 'none';
    document.getElementById('addProcedureForm').reset();
}

// Обработка добавления процедуры
function handleAddProcedure(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const procedure = {
        id: Date.now().toString(),
        name: formData.get('procedureName') || document.getElementById('procedureName').value,
        date: formData.get('procedureDate') || document.getElementById('procedureDate').value,
        changes: formData.get('procedureChanges') || document.getElementById('procedureChanges').value,
        specialist: formData.get('procedureSpecialist') || document.getElementById('procedureSpecialist').value,
        notes: formData.get('procedureNotes') || document.getElementById('procedureNotes').value,
        userName: currentUser.firstName + ' ' + currentUser.lastName,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
    };
    
    procedures.unshift(procedure);
    saveProcedures();
    renderProcedures();
    hideAddProcedureModal();
    
    // Отправляем данные в бот
    sendDataToBot({
        action: 'add_procedure',
        procedure: procedure,
        user: currentUser
    });
}

// Показать детали процедуры
function showProcedureDetails(procedureId) {
    const procedure = procedures.find(p => p.id === procedureId);
    if (!procedure) return;
    
    currentProcedureId = procedureId;
    
    document.getElementById('viewProcedureTitle').textContent = procedure.name;
    
    const content = document.getElementById('viewProcedureContent');
    content.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Название процедуры</div>
            <div class="detail-value">${procedure.name}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Дата процедуры</div>
            <div class="detail-value">${formatDate(procedure.date)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Что было изменено</div>
            <div class="detail-value">${procedure.changes}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Кто проводил</div>
            <div class="detail-value">${procedure.specialist}</div>
        </div>
        ${procedure.notes ? `
        <div class="detail-item">
            <div class="detail-label">Дополнительные заметки</div>
            <div class="detail-value">${procedure.notes}</div>
        </div>
        ` : ''}
    `;
    
    viewProcedureModal.style.display = 'flex';
}

// Скрыть модальное окно просмотра процедуры
function hideViewProcedureModal() {
    viewProcedureModal.style.display = 'none';
    currentProcedureId = null;
}

// Показать модальное окно редактирования процедуры
function showEditProcedureModal() {
    const procedure = procedures.find(p => p.id === currentProcedureId);
    if (!procedure) return;
    
    document.getElementById('editProcedureName').value = procedure.name;
    document.getElementById('editProcedureDate').value = procedure.date;
    document.getElementById('editProcedureChanges').value = procedure.changes;
    document.getElementById('editProcedureSpecialist').value = procedure.specialist;
    document.getElementById('editProcedureNotes').value = procedure.notes || '';
    
    hideViewProcedureModal();
    editProcedureModal.style.display = 'flex';
}

// Скрыть модальное окно редактирования процедуры
function hideEditProcedureModal() {
    editProcedureModal.style.display = 'none';
}

// Обработка редактирования процедуры
function handleEditProcedure(event) {
    event.preventDefault();
    
    const procedureIndex = procedures.findIndex(p => p.id === currentProcedureId);
    if (procedureIndex === -1) return;
    
    const formData = new FormData(event.target);
    const updatedProcedure = {
        ...procedures[procedureIndex],
        name: formData.get('editProcedureName') || document.getElementById('editProcedureName').value,
        date: formData.get('editProcedureDate') || document.getElementById('editProcedureDate').value,
        changes: formData.get('editProcedureChanges') || document.getElementById('editProcedureChanges').value,
        specialist: formData.get('editProcedureSpecialist') || document.getElementById('editProcedureSpecialist').value,
        notes: formData.get('editProcedureNotes') || document.getElementById('editProcedureNotes').value,
        updatedAt: new Date().toISOString()
    };
    
    procedures[procedureIndex] = updatedProcedure;
    saveProcedures();
    renderProcedures();
    hideEditProcedureModal();
    
    // Отправляем данные в бот
    sendDataToBot({
        action: 'edit_procedure',
        procedure: updatedProcedure,
        user: currentUser
    });
}

// Обработка удаления процедуры
function handleDeleteProcedure() {
    if (!currentProcedureId) return;
    
    if (confirm('Вы уверены, что хотите удалить эту процедуру?')) {
        procedures = procedures.filter(p => p.id !== currentProcedureId);
        saveProcedures();
        renderProcedures();
        hideViewProcedureModal();
        
        // Отправляем данные в бот
        sendDataToBot({
            action: 'delete_procedure',
            procedureId: currentProcedureId,
            user: currentUser
        });
    }
}

// Показать детали клиента
function showClientDetails(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const clientProcedures = JSON.parse(localStorage.getItem(`procedures_${clientId}`)) || [];
    
    document.getElementById('viewClientTitle').textContent = `Процедуры ${client.firstName}`;
    
    const content = document.getElementById('viewClientContent');
    
    if (clientProcedures.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>У клиента пока нет процедур</p>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="client-info-header">
                <img src="${client.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlOWVjZWYiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo='}" alt="Аватар" class="client-avatar">
                <div class="client-details">
                    <h4>${client.firstName} ${client.lastName}</h4>
                    <p>@${client.username || 'без username'}</p>
                    <p>${client.city}, ${client.street}</p>
                </div>
            </div>
            <div class="procedures-list">
                ${clientProcedures
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(procedure => `
                        <div class="procedure-item">
                            <div class="procedure-header">
                                <div class="procedure-title">${procedure.name}</div>
                                <div class="procedure-date">${formatDate(procedure.date)}</div>
                            </div>
                            <div class="procedure-preview">${procedure.changes.substring(0, 100)}${procedure.changes.length > 100 ? '...' : ''}</div>
                            <div class="procedure-specialist">Специалист: ${procedure.specialist}</div>
                        </div>
                    `).join('')}
            </div>
        `;
    }
    
    viewClientModal.style.display = 'flex';
}

// Скрыть модальное окно просмотра клиента
function hideViewClientModal() {
    viewClientModal.style.display = 'none';
}

// Выход из системы
function logout() {
    currentRole = null;
    showAuthScreen();
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Отправка данных в бот
function sendDataToBot(data) {
    if (tg.initData) {
        tg.sendData(JSON.stringify(data));
    }
}

// Применение темы Telegram
function applyTheme() {
    document.body.style.backgroundColor = tg.themeParams.bg_color || '#f8f9fa';
    document.body.style.color = tg.themeParams.text_color || '#333';
}

// Обработчик изменения темы
tg.onEvent('themeChanged', () => {
    applyTheme();
});

// Применяем тему при инициализации
applyTheme();

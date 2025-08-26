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
let firebaseInitialized = false;

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

function setHidden(element, hidden) {
    if (!element) return;
    element.classList.toggle('hidden', !!hidden);
}

function forceShow(element, display = 'block') {
    if (!element) return;
    element.classList.remove('hidden');
    element.style.display = display;
}

function forceHide(element) {
    if (!element) return;
    element.style.display = 'none';
    element.classList.add('hidden');
}

// Инициализация приложения
async function initializeApp() {
    try {
        console.log('🚀 Инициализация приложения...');
        
        // Аутентификация в Firebase (сначала входим, затем проверяем соединение)
        await window.auth.signInAnonymously();
        console.log('✅ Аутентификация в Firebase успешна');
        
        // Проверяем подключение к Firebase после входа
        await checkFirebaseInitialization();
        if (!firebaseInitialized) {
            throw new Error('Firebase не удалось инициализировать');
        }
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            currentUser = {
                id: user.id,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                username: user.username || '',
                photoUrl: user.photo_url || '',
                city: 'Москва',
                street: 'ул. Примерная'
            };
            
            console.log('👤 Данные пользователя получены:', currentUser);
            
            // Создаем или получаем пользователя в Firebase
            await window.firebaseService.createOrGetUser(currentUser.id, currentUser);
            
            // Определяем роль пользователя
            if (window.firebaseService.isAdmin(currentUser.id)) {
                currentRole = 'admin';
                await showAdminInterface();
            } else {
                currentRole = 'user';
                await showUserInterface();
            }
        } else {
            // Гостевой режим
            currentUser = {
                id: 'guest',
                firstName: 'Гость',
                lastName: '',
                username: '',
                photoUrl: '',
                city: 'Москва',
                street: 'ул. Примерная'
            };
            console.log('👤 Используем гостевой режим');
            await showUserInterface();
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        
        // Показываем интерфейс пользователя даже при ошибке
        currentUser = {
            id: 'guest',
            firstName: 'Гость',
            lastName: '',
            username: '',
            photoUrl: '',
            city: 'Москва',
            street: 'ул. Примерная'
        };
        
        await showUserInterface();
    }
}

// Проверка инициализации Firebase
async function checkFirebaseInitialization() {
    try {
        console.log('🔍 Проверка инициализации Firebase...');
        
        // Ждем немного для загрузки Firebase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!window.db || !window.auth) {
            throw new Error('Firebase объекты не найдены');
        }
        
        // Проверяем подключение к Firebase
        const connectionStatus = await window.firebaseService.checkConnection();
        
        if (!connectionStatus.connected) {
            throw new Error(`Ошибка подключения к Firebase: ${connectionStatus.error}`);
        }
        
        firebaseInitialized = true;
        console.log('✅ Firebase успешно инициализирован и подключен');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        firebaseInitialized = false;
        return false;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Выбор роли не используем — интерфейс определяется автоматически
    
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

    // Поиск процедур
    const searchProceduresInput = document.getElementById('searchProcedures');
    if (searchProceduresInput) {
        searchProceduresInput.addEventListener('input', handleSearchProcedures);
    }

    // Кнопка обновления списка клиентов (админ)
    const refreshBtn = document.getElementById('refreshClientsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            const original = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Обновление...';
            await loadClients();
            renderClients();
            refreshBtn.innerHTML = original;
            refreshBtn.disabled = false;
        });
    }
}

// Показать экран авторизации
function showAuthScreen() {
    setHidden(loadingScreen, true);
    setHidden(authScreen, false);
    setHidden(userInterface, true);
    setHidden(adminInterface, true);
}

// Показать интерфейс пользователя
async function showUserInterface() {
    forceHide(loadingScreen);
    forceHide(authScreen);
    forceShow(userInterface, 'block');
    forceHide(adminInterface);
    console.log('[UI] showUserInterface: classes', {
        loading: loadingScreen?.className,
        auth: authScreen?.className,
        user: userInterface?.className,
        admin: adminInterface?.className
    });
    
    updateUserInfo();
    await loadProcedures();
    renderProcedures();
}

// Показать интерфейс администратора
async function showAdminInterface() {
    forceHide(loadingScreen);
    forceHide(authScreen);
    forceHide(userInterface);
    forceShow(adminInterface, 'block');
    console.log('[UI] showAdminInterface: classes', {
        loading: loadingScreen?.className,
        auth: authScreen?.className,
        user: userInterface?.className,
        admin: adminInterface?.className
    });
    
    // Live обновление списка клиентов (авторы процедур)
    if (window._usersUnsub) { try { window._usersUnsub(); } catch (e) {} }
    window._usersUnsub = window.firebaseService.onUsersWithProceduresSnapshot((list) => {
        clients = list;
        renderClients();
    });
}

// Обновить информацию о пользователе
function updateUserInfo() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userTag = document.getElementById('userTag');
    
    if (currentUser.photoUrl) {
        userAvatar.src = currentUser.photoUrl;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.style.display = 'none';
    }
    
    const roleBadge = window.firebaseService.isAdmin(currentUser.id) ? ' (Админ)' : '';
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    userName.textContent = (fullName || 'Клиент') + roleBadge;
    if (userTag) {
        userTag.textContent = currentUser.username ? `@${currentUser.username}` : '@username';
    }
}

// Загрузка процедур из Firebase
async function loadProcedures() {
    try {
        procedures = await window.firebaseService.getUserProcedures(currentUser.id);
        console.log('Процедуры загружены из Firebase:', procedures);
    } catch (error) {
        console.error('Ошибка загрузки процедур:', error);
        procedures = [];
    }
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
    
    const searchTerm = (document.getElementById('searchProcedures')?.value || '').toLowerCase();
    const filtered = procedures.filter(p => (
        p.name?.toLowerCase().includes(searchTerm) ||
        p.changes?.toLowerCase().includes(searchTerm) ||
        p.specialist?.toLowerCase().includes(searchTerm)
    ));
    
    proceduresList.innerHTML = filtered
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

// Поиск по процедурам (пользователь)
function handleSearchProcedures() {
    renderProcedures();
}

// Загрузка клиентов из Firebase
async function loadClients() {
    try {
        clients = await window.firebaseService.getAllUsersWithProcedures();
        console.log('Клиенты загружены из Firebase:', clients);
    } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        clients = [];
    }
}

// Отображение клиентов
function renderClients() {
    const clientsList = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Пока нет клиентов с процедурами</p>
                <p>Клиенты появятся после добавления процедур</p>
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
    setHidden(addProcedureModal, false);
    document.getElementById('procedureDate').value = new Date().toISOString().split('T')[0];
}

// Скрыть модальное окно добавления процедуры
function hideAddProcedureModal() {
    setHidden(addProcedureModal, true);
    document.getElementById('addProcedureForm').reset();
}

// Обработка добавления процедуры
async function handleAddProcedure(event) {
    event.preventDefault();
    
    try {
        console.log('🔄 Начало добавления процедуры...');
        
        // Проверяем инициализацию Firebase
        if (!firebaseInitialized) {
            throw new Error('База данных не инициализирована');
        }
        
        // Получаем данные формы
        const formData = new FormData(event.target);
        const procedureName = formData.get('procedureName') || document.getElementById('procedureName').value;
        const procedureDate = formData.get('procedureDate') || document.getElementById('procedureDate').value;
        const procedureArea = formData.get('procedureArea') || document.getElementById('procedureArea')?.value || '';
        const procedureGoal = formData.get('procedureGoal') || document.getElementById('procedureGoal')?.value || '';
        const procedureChanges = formData.get('procedureChanges') || document.getElementById('procedureChanges').value;
        const procedureSpecialist = formData.get('procedureSpecialist') || document.getElementById('procedureSpecialist').value;
        const procedureNotes = formData.get('procedureNotes') || document.getElementById('procedureNotes').value;
        
        // Валидация данных
        if (!procedureName.trim()) {
            throw new Error('Название процедуры обязательно для заполнения');
        }
        if (!procedureDate) {
            throw new Error('Дата процедуры обязательна для заполнения');
        }
        if (!procedureArea.trim()) {
            throw new Error('Область/часть тела обязательна для заполнения');
        }
        if (!procedureGoal.trim()) {
            throw new Error('Цель/результат обязательна для заполнения');
        }
        if (!procedureChanges.trim()) {
            throw new Error('Описание изменений обязательно для заполнения');
        }
        if (!procedureSpecialist.trim()) {
            throw new Error('Имя специалиста обязательно для заполнения');
        }
        
        const procedure = {
            id: Date.now().toString(),
            name: procedureName.trim(),
            date: procedureDate,
            area: procedureArea.trim(),
            goal: procedureGoal.trim(),
            changes: procedureChanges.trim(),
            specialist: procedureSpecialist.trim(),
            notes: procedureNotes.trim(),
            userName: currentUser.firstName + ' ' + currentUser.lastName,
            userId: currentUser.id,
            createdAt: new Date().toISOString()
        };
        
        console.log('📝 Данные процедуры подготовлены:', procedure);
        
        // Показываем индикатор загрузки
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Сохранение...';
        submitBtn.disabled = true;
        
        // Сохраняем в Firebase
        const success = await window.firebaseService.saveProcedure(currentUser.id, procedure);
        
        if (success) {
            console.log('✅ Процедура успешно сохранена');
            
            // Добавляем в локальный массив
            procedures.unshift(procedure);
            renderProcedures();
            hideAddProcedureModal();
            
            // Показываем уведомление об успехе
            showSuccessMessage('Процедура успешно добавлена!');
            
            // Отправляем данные в бот
            sendDataToBot({
                action: 'add_procedure',
                procedure: procedure,
                user: currentUser
            });

            // Админ увидит изменения мгновенно через live‑слушатель, но на всякий случай мягко обновим список
            if (document.getElementById('adminInterface') && !document.getElementById('adminInterface').classList.contains('hidden')) {
                try {
                    await loadClients();
                    renderClients();
                } catch (e) {}
            }
        } else {
            throw new Error('Не удалось сохранить процедуру в базе данных');
        }
        
    } catch (error) {
        console.error('❌ Ошибка добавления процедуры:', error);
        
        // Показываем ошибку пользователю
        showErrorMessage(error.message || 'Ошибка сохранения процедуры. Попробуйте еще раз.');
        
    } finally {
        // Восстанавливаем кнопку
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Добавить';
            submitBtn.disabled = false;
        }
    }
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
        <div class=\"detail-item\">
            <div class=\"detail-label\">Область/часть тела</div>
            <div class=\"detail-value\">${procedure.area || '-'}</div>
        </div>
        <div class=\"detail-item\">
            <div class=\"detail-label\">Цель/результат</div>
            <div class=\"detail-value\">${procedure.goal || '-'}</div>
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
    
    setHidden(viewProcedureModal, false);
}

// Скрыть модальное окно просмотра процедуры
function hideViewProcedureModal() {
    setHidden(viewProcedureModal, true);
    currentProcedureId = null;
}

// Показать модальное окно редактирования процедуры
function showEditProcedureModal() {
    const procedure = procedures.find(p => p.id === currentProcedureId);
    if (!procedure) return;
    
    document.getElementById('editProcedureName').value = procedure.name;
    document.getElementById('editProcedureDate').value = procedure.date;
    const areaEl = document.getElementById('editProcedureArea');
    const goalEl = document.getElementById('editProcedureGoal');
    if (areaEl) areaEl.value = procedure.area || '';
    if (goalEl) goalEl.value = procedure.goal || '';
    document.getElementById('editProcedureChanges').value = procedure.changes;
    document.getElementById('editProcedureSpecialist').value = procedure.specialist;
    document.getElementById('editProcedureNotes').value = procedure.notes || '';
    
    hideViewProcedureModal();
    setHidden(editProcedureModal, false);
}

// Скрыть модальное окно редактирования процедуры
function hideEditProcedureModal() {
    setHidden(editProcedureModal, true);
}

// Обработка редактирования процедуры
async function handleEditProcedure(event) {
    event.preventDefault();
    
    const procedureIndex = procedures.findIndex(p => p.id === currentProcedureId);
    if (procedureIndex === -1) return;
    
    const formData = new FormData(event.target);
    const updatedData = {
        name: formData.get('editProcedureName') || document.getElementById('editProcedureName').value,
        date: formData.get('editProcedureDate') || document.getElementById('editProcedureDate').value,
        area: formData.get('editProcedureArea') || document.getElementById('editProcedureArea')?.value || '',
        goal: formData.get('editProcedureGoal') || document.getElementById('editProcedureGoal')?.value || '',
        changes: formData.get('editProcedureChanges') || document.getElementById('editProcedureChanges').value,
        specialist: formData.get('editProcedureSpecialist') || document.getElementById('editProcedureSpecialist').value,
        notes: formData.get('editProcedureNotes') || document.getElementById('editProcedureNotes').value,
        updatedAt: new Date().toISOString()
    };
    
    // Обновляем в Firebase
    const success = await window.firebaseService.updateProcedure(currentUser.id, currentProcedureId, updatedData);
    
    if (success) {
        procedures[procedureIndex] = { ...procedures[procedureIndex], ...updatedData };
        renderProcedures();
        hideEditProcedureModal();
        
        // Отправляем данные в бот
        sendDataToBot({
            action: 'edit_procedure',
            procedure: procedures[procedureIndex],
            user: currentUser
        });

        // Обновим список клиентов для админа
        if (window.firebaseService.isAdmin(currentUser.id)) {
            // ничего не делаем, админский список обновится через live‑слушатель
        }
    } else {
        alert('Ошибка обновления процедуры. Попробуйте еще раз.');
    }
}

// Обработка удаления процедуры
async function handleDeleteProcedure() {
    if (!currentProcedureId) return;
    
    if (confirm('Вы уверены, что хотите удалить эту процедуру?')) {
        // Удаляем из Firebase
        const success = await window.firebaseService.deleteProcedure(currentUser.id, currentProcedureId);
        
        if (success) {
            procedures = procedures.filter(p => p.id !== currentProcedureId);
            renderProcedures();
            hideViewProcedureModal();
            
            // Отправляем данные в бот
            sendDataToBot({
                action: 'delete_procedure',
                procedureId: currentProcedureId,
                user: currentUser
            });
        } else {
            alert('Ошибка удаления процедуры. Попробуйте еще раз.');
        }
    }
}

// Показать детали клиента
async function showClientDetails(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    try {
        const clientProcedures = await window.firebaseService.getUserProceduresForAdmin(clientId);
        
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
            const sorted = clientProcedures
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            content.innerHTML = `
                <div class="client-info-header">
                    <img src="${client.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeXg9IjIwIiBjeT0iMjAiIHI9IjIwIiBmaWxsPSIjZTllY2VmIi8+CjxwYXRoIGQ9Ik0yMCAxMEMyMi4yMDkxIDEwIDI0IDExLjc5MDkgMjQgMTRDMjQgMTYuMjA5MSAyMi4yMDkxIDE4IDIwIDE4QzE3Ljc5MDkgMTggMTYgMTYuMjA5MSAxNiAxNEMxNiAxMS43OTA5IDE3Ljc5MDkgMTAgMjAgMTBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMEMyOCAyNi42ODYzIDI0LjQxODMgMjQgMjAgMjRDMTUuNTgxNyAyNCAxMiAyNi42ODYzIDEyIDMwSDI4WiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K'}" alt="Аватар" class="client-avatar">
                    <div class="client-details">
                        <h4>${client.firstName} ${client.lastName}</h4>
                        <p>@${client.username || 'без username'}</p>
                        <p>${client.city}, ${client.street}</p>
                    </div>
                </div>
                <div class="procedures-list">
                    ${sorted
                        .map(procedure => `
                            <div class="procedure-item" data-id="${procedure.id}">
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

            // Обработчики клика по процедурам для показа подробностей (read‑only)
            content.querySelectorAll('.procedure-item').forEach(item => {
                const id = item.getAttribute('data-id');
                const proc = clientProcedures.find(p => p.id === id);
                if (proc) {
                    item.addEventListener('click', () => showProcedureDetailsReadOnly(proc));
                }
            });
        }
        
        setHidden(viewClientModal, false);
    } catch (error) {
        console.error('Ошибка загрузки процедур клиента:', error);
        alert('Ошибка загрузки процедур клиента');
    }
}

// Скрыть модальное окно просмотра клиента
function hideViewClientModal() {
    setHidden(viewClientModal, true);
}

// Просмотр процедуры в режиме только чтение (для админа)
function showProcedureDetailsReadOnly(procedure) {
    if (!procedure) return;
    currentProcedureId = null; // режим чтения
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
            <div class="detail-label">Область/часть тела</div>
            <div class="detail-value">${procedure.area || '-'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Цель/результат</div>
            <div class="detail-value">${procedure.goal || '-'}</div>
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
    // Скрываем кнопки редактирования/удаления
    document.getElementById('editProcedureBtn')?.classList.add('hidden');
    document.getElementById('deleteProcedureBtn')?.classList.add('hidden');
    setHidden(viewProcedureModal, false);
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

// Показ сообщений об ошибках
function showErrorMessage(message) {
    console.error('❌ Ошибка:', message);
    
    // Создаем уведомление об ошибке
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 10 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Показ сообщений об успехе
function showSuccessMessage(message) {
    console.log('✅ Успех:', message);
    
    // Создаем уведомление об успехе
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
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

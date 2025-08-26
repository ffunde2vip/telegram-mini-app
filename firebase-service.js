// Сервис для работы с Firebase Firestore
if (!window.FirebaseService) {
class FirebaseService {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.initializeService();
    }

    // Инициализация сервиса
    initializeService() {
        if (!this.db) {
            console.error('❌ Firebase Firestore не инициализирован');
            return;
        }
        if (!this.auth) {
            console.error('❌ Firebase Auth не инициализирован');
            return;
        }
        console.log('✅ Firebase сервис инициализирован');
    }

    // Создание или получение пользователя по Telegram ID
    async createOrGetUser(telegramId, userInfo) {
        try {
            console.log('🔄 Создание/получение пользователя для Telegram ID:', telegramId);
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            // Документ пользователя — по Telegram ID, чтобы идентификатор не менялся между анонимными сессиями
            const userRef = this.db.collection('users').doc(telegramId.toString());
            const userDoc = await userRef.get();
            // Не назначаем админа по умолчанию — статус админа управляется командами /admin и /unadmin в боте
            
            if (!userDoc.exists) {
                // Создаем нового пользователя
                console.log('👤 Создаем нового пользователя:', telegramId);
                await userRef.set({
                    telegramId: telegramId,
                    ...userInfo,
                    isAdmin: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log('✅ Новый пользователь создан');
            } else {
                // Обновляем время последнего входа
                await userRef.update({
                    lastSeen: new Date(),
                    updatedAt: new Date()
                });
                console.log('✅ Пользователь найден, обновлено время входа');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка создания/получения пользователя:', error);
            return false;
        }
    }

    // Сохранение процедуры
    async saveProcedure(telegramId, procedure) {
        try {
            console.log('🔄 Сохранение процедуры для пользователя:', telegramId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            // Создаем процедуру
            const userRef = this.db.collection('users').doc(telegramId.toString());
            const proceduresRef = userRef.collection('procedures');
            
            const procedureData = {
                ...procedure,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            await proceduresRef.doc(procedure.id).set(procedureData);
            
            console.log('✅ Процедура успешно сохранена');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения процедуры:', error);
            return false;
        }
    }

    // Получение процедур пользователя
    async getUserProcedures(telegramId) {
        try {
            console.log('🔄 Загрузка процедур для пользователя:', telegramId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            const userRef = this.db.collection('users').doc(telegramId.toString());
            const proceduresRef = userRef.collection('procedures');
            const snapshot = await proceduresRef.orderBy('createdAt', 'desc').get();
            
            const procedures = [];
            snapshot.forEach(doc => {
                procedures.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ Загружено ${procedures.length} процедур`);
            return procedures;
        } catch (error) {
            console.error('❌ Ошибка получения процедур:', error);
            return [];
        }
    }

    // Обновление процедуры
    async updateProcedure(telegramId, procedureId, updatedData) {
        try {
            console.log('🔄 Обновление процедуры:', { telegramId, procedureId });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            const userRef = this.db.collection('users').doc(telegramId.toString());
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            const updateData = {
                ...updatedData,
                updatedAt: new Date()
            };
            
            await procedureRef.update(updateData);
            
            console.log('✅ Процедура успешно обновлена');
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления процедуры:', error);
            return false;
        }
    }

    // Удаление процедуры
    async deleteProcedure(telegramId, procedureId) {
        try {
            console.log('🔄 Удаление процедуры:', { telegramId, procedureId });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            const userRef = this.db.collection('users').doc(telegramId.toString());
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            await procedureRef.delete();
            
            console.log('✅ Процедура успешно удалена');
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления процедуры:', error);
            return false;
        }
    }

    // Получение всех пользователей с процедурами (для администратора)
    async getAllUsersWithProcedures() {
        try {
            console.log('🔄 Загрузка всех пользователей с процедурами');
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.get();
            
            const users = [];
            for (const doc of snapshot.docs) {
                const userData = doc.data();
                
                // Получаем количество процедур пользователя
                const proceduresSnapshot = await doc.ref.collection('procedures').get();
                const proceduresCount = proceduresSnapshot.size;
                
                // Добавляем пользователя только если у него есть процедуры
                if (proceduresCount > 0) {
                    users.push({
                        id: doc.id,
                        ...userData,
                        proceduresCount: proceduresCount
                    });
                }
            }
            
            console.log(`✅ Загружено ${users.length} пользователей с процедурами`);
            return users;
        } catch (error) {
            console.error('❌ Ошибка получения пользователей:', error);
            return [];
        }
    }

    // Режим реального времени для списка пользователей с процедурами (для администратора)
    onUsersWithProceduresSnapshot(callback) {
        if (!this.db) return () => {};
        const usersRef = this.db.collection('users');
        const unsubscribe = usersRef.onSnapshot(async (snapshot) => {
            const users = [];
            for (const doc of snapshot.docs) {
                const userData = doc.data();
                const proceduresSnapshot = await doc.ref.collection('procedures').get();
                const proceduresCount = proceduresSnapshot.size;
                if (proceduresCount > 0) {
                    users.push({ id: doc.id, ...userData, proceduresCount });
                }
            }
            callback(users);
        });
        return unsubscribe;
    }

    // Получение процедур конкретного пользователя (для администратора)
    async getUserProceduresForAdmin(userUid) {
        try {
            console.log('🔄 Загрузка процедур пользователя для админа:', userUid);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            const userRef = this.db.collection('users').doc(userUid.toString());
            const proceduresRef = userRef.collection('procedures');
            // createdAt хранится как Date при сохранении через серверное время
            // Если где-то попали строки, просто читаем без orderBy
            let snapshot;
            try {
                snapshot = await proceduresRef.orderBy('createdAt', 'desc').get();
            } catch (e) {
                console.warn('⚠️ orderBy(createdAt) не сработал, читаю без сортировки');
                snapshot = await proceduresRef.get();
            }
            
            const procedures = [];
            snapshot.forEach(doc => {
                procedures.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ Загружено ${procedures.length} процедур для админа`);
            return procedures;
        } catch (error) {
            console.error('❌ Ошибка получения процедур пользователя:', error);
            return [];
        }
    }

    // Получение профиля пользователя по его Telegram ID/UID
    async getUserById(userUid) {
        try {
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            const doc = await this.db.collection('users').doc(userUid.toString()).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (e) {
            console.error('❌ Ошибка получения пользователя:', e);
            return null;
        }
    }

    // Режим реального времени для процедур конкретного пользователя (для админа)
    onUserProceduresSnapshot(userUid, callback) {
        if (!this.db) return () => {};
        const userRef = this.db.collection('users').doc(userUid.toString());
        const proceduresRef = userRef.collection('procedures').orderBy('createdAt', 'desc');
        return proceduresRef.onSnapshot((snap) => {
            const procedures = [];
            snap.forEach(d => procedures.push({ id: d.id, ...d.data() }));
            callback(procedures);
        });
    }

    // Проверка является ли пользователь администратором
    isAdmin(telegramId) {
        const adminIds = ['1435191157']; // ID администратора
        // Локальный флаг (устанавливается после чтения профиля)
        try {
            if (window._userIsAdminFlag && window._currentTelegramId && window._currentTelegramId.toString() === telegramId.toString()) {
                return true;
            }
        } catch (e) {}
        return adminIds.includes(telegramId.toString());
    }

    // Проверка состояния подключения к Firebase
    async checkConnection() {
        try {
            if (!this.db) {
                return { connected: false, error: 'Firebase не инициализирован' };
            }
            if (!this.auth?.currentUser) {
                return { connected: false, error: 'Нет аутентифицированного пользователя' };
            }

            // Безопасная операция в рамках правил: создаем/обновляем собственный документ (merge)
            const uid = this.auth.currentUser.uid;
            const userDocRef = this.db.collection('users').doc(uid);
            await userDocRef.set({ _lastPing: new Date() }, { merge: true });
            
            return { connected: true };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    // Проставить/снять флаг администратора у пользователя
    async setAdminFlag(telegramId, isAdminFlag) {
        try {
            const ref = this.db.collection('users').doc(telegramId.toString());
            await ref.set({ isAdmin: !!isAdminFlag, updatedAt: new Date() }, { merge: true });
            if (window._currentTelegramId && window._currentTelegramId.toString() === telegramId.toString()) {
                window._userIsAdminFlag = !!isAdminFlag;
            }
            return true;
        } catch (e) {
            console.error('❌ Не удалось установить флаг администратора:', e);
            return false;
        }
    }
}

// Экспортируем класс и создаем (или переиспользуем) глобальный экземпляр
window.FirebaseService = FirebaseService;
if (!window.firebaseService) {
    window.firebaseService = new FirebaseService();
}
} else {
    // Если класс уже объявлен (например, скрипт загружен повторно), убедимся, что есть экземпляр
    if (!window.firebaseService) {
        window.firebaseService = new window.FirebaseService();
    }
}

// Сервис для работы с Firebase Firestore
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

    // Получение или создание пользователя по Telegram ID
    async getOrCreateUser(telegramUserId, userInfo) {
        try {
            console.log('🔄 Получение/создание пользователя для Telegram ID:', telegramUserId);
            
            // Ищем пользователя по Telegram ID
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.where('telegramId', '==', telegramUserId).limit(1).get();
            
            if (!snapshot.empty) {
                // Пользователь найден - возвращаем его
                const userDoc = snapshot.docs[0];
                console.log('✅ Пользователь найден:', userDoc.id);
                return {
                    id: userDoc.id, // Firebase UID
                    ...userDoc.data()
                };
            } else {
                // Пользователь не найден - создаем нового
                console.log('👤 Создаем нового пользователя для Telegram ID:', telegramUserId);
                
                const newUserData = {
                    telegramId: telegramUserId,
                    ...userInfo,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                // Создаем документ с автоматически сгенерированным ID
                const newUserRef = await usersRef.add(newUserData);
                
                console.log('✅ Новый пользователь создан с Firebase ID:', newUserRef.id);
                return {
                    id: newUserRef.id,
                    ...newUserData
                };
            }
        } catch (error) {
            console.error('❌ Ошибка получения/создания пользователя:', error);
            throw error;
        }
    }

    // Сохранение процедуры пользователя
    async saveProcedure(telegramUserId, procedure) {
        try {
            console.log('🔄 Попытка сохранения процедуры для Telegram ID:', telegramUserId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            if (!telegramUserId || !procedure.id) {
                throw new Error('Отсутствуют обязательные параметры: telegramUserId или procedure.id');
            }

            // Получаем или создаем пользователя
            const user = await this.getOrCreateUser(telegramUserId, {
                firstName: procedure.userName.split(' ')[0] || 'Пользователь',
                lastName: procedure.userName.split(' ').slice(1).join(' ') || '',
                username: '',
                photoUrl: '',
                city: 'Москва',
                street: 'ул. Примерная'
            });

            const userRef = this.db.collection('users').doc(user.id);
            const proceduresRef = userRef.collection('procedures');
            
            const procedureData = {
                ...procedure,
                telegramUserId: telegramUserId, // Сохраняем связь с Telegram
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            console.log('💾 Сохраняем данные процедуры:', procedureData);
            
            await proceduresRef.doc(procedure.id).set(procedureData);
            
            console.log('✅ Процедура успешно сохранена в Firebase');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения процедуры:', error);
            console.error('🔍 Детали ошибки:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            // Показываем пользователю понятное сообщение об ошибке
            this.showErrorMessage(error);
            return false;
        }
    }

    // Получение всех процедур пользователя
    async getUserProcedures(telegramUserId) {
        try {
            console.log('🔄 Загрузка процедур для Telegram ID:', telegramUserId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            // Получаем пользователя
            const user = await this.getOrCreateUser(telegramUserId, {
                firstName: 'Пользователь',
                lastName: '',
                username: '',
                photoUrl: '',
                city: 'Москва',
                street: 'ул. Примерная'
            });

            const userRef = this.db.collection('users').doc(user.id);
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
            this.showErrorMessage(error);
            return [];
        }
    }

    // Обновление процедуры
    async updateProcedure(telegramUserId, procedureId, updatedData) {
        try {
            console.log('🔄 Обновление процедуры:', { telegramUserId, procedureId, updatedData });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            // Получаем пользователя
            const user = await this.getOrCreateUser(telegramUserId, {
                firstName: 'Пользователь',
                lastName: '',
                username: '',
                photoUrl: '',
                city: 'Москва',
                street: 'ул. Примерная'
            });

            const userRef = this.db.collection('users').doc(user.id);
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            const updateData = {
                ...updatedData,
                updatedAt: new Date()
            };
            
            await procedureRef.update(updateData);
            
            console.log('✅ Процедура успешно обновлена в Firebase');
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления процедуры:', error);
            this.showErrorMessage(error);
            return false;
        }
    }

    // Удаление процедуры
    async deleteProcedure(telegramUserId, procedureId) {
        try {
            console.log('🔄 Удаление процедуры:', { telegramUserId, procedureId });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            // Получаем пользователя
            const user = await this.getOrCreateUser(telegramUserId, {
                firstName: 'Пользователь',
                lastName: '',
                username: '',
                photoUrl: '',
                city: 'Москва',
                street: 'ул. Примерная'
            });

            const userRef = this.db.collection('users').doc(user.id);
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            await procedureRef.delete();
            
            console.log('✅ Процедура успешно удалена из Firebase');
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления процедуры:', error);
            this.showErrorMessage(error);
            return false;
        }
    }

    // Сохранение информации о пользователе
    async saveUserInfo(telegramUserId, userInfo) {
        try {
            console.log('🔄 Сохранение информации о пользователе для Telegram ID:', telegramUserId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            // Получаем или создаем пользователя
            const user = await this.getOrCreateUser(telegramUserId, userInfo);
            
            const userRef = this.db.collection('users').doc(user.id);
            
            const userData = {
                ...userInfo,
                telegramId: telegramUserId,
                lastSeen: new Date(),
                updatedAt: new Date()
            };
            
            await userRef.set(userData, { merge: true });
            
            console.log('✅ Информация о пользователе успешно сохранена');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения информации о пользователе:', error);
            this.showErrorMessage(error);
            return false;
        }
    }

    // Получение всех пользователей (для администратора)
    async getAllUsers() {
        try {
            console.log('🔄 Загрузка всех пользователей');
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.get();
            
            const users = [];
            for (const doc of snapshot.docs) {
                const userData = doc.data();
                const proceduresSnapshot = await doc.ref.collection('procedures').get();
                
                users.push({
                    id: doc.id,
                    ...userData,
                    proceduresCount: proceduresSnapshot.size
                });
            }
            
            console.log(`✅ Загружено ${users.length} пользователей`);
            return users;
        } catch (error) {
            console.error('❌ Ошибка получения пользователей:', error);
            this.showErrorMessage(error);
            return [];
        }
    }

    // Получение процедур конкретного пользователя (для администратора)
    async getUserProceduresForAdmin(telegramUserId) {
        try {
            console.log('🔄 Загрузка процедур пользователя для админа:', telegramUserId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            // Получаем пользователя по Telegram ID
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef.where('telegramId', '==', telegramUserId).limit(1).get();
            
            if (snapshot.empty) {
                console.log('❌ Пользователь не найден');
                return [];
            }
            
            const userDoc = snapshot.docs[0];
            const proceduresRef = userDoc.ref.collection('procedures');
            const proceduresSnapshot = await proceduresRef.orderBy('createdAt', 'desc').get();
            
            const procedures = [];
            proceduresSnapshot.forEach(doc => {
                procedures.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ Загружено ${procedures.length} процедур для админа`);
            return procedures;
        } catch (error) {
            console.error('❌ Ошибка получения процедур пользователя:', error);
            this.showErrorMessage(error);
            return [];
        }
    }

    // Показ сообщений об ошибках пользователю
    showErrorMessage(error) {
        let userMessage = 'Произошла ошибка при работе с базой данных.';
        
        if (error.code === 'permission-denied') {
            userMessage = 'Ошибка доступа к базе данных. Проверьте настройки безопасности Firebase.';
        } else if (error.code === 'unavailable') {
            userMessage = 'База данных временно недоступна. Попробуйте позже.';
        } else if (error.code === 'unauthenticated') {
            userMessage = 'Ошибка аутентификации. Попробуйте перезагрузить страницу.';
        } else if (error.message.includes('Firebase Firestore не инициализирован')) {
            userMessage = 'Ошибка инициализации базы данных. Перезагрузите страницу.';
        }
        
        // Показываем уведомление пользователю
        if (typeof showNotification === 'function') {
            showNotification(userMessage, 'error');
        } else {
            alert(userMessage);
        }
    }

    // Проверка состояния подключения к Firebase
    async checkConnection() {
        try {
            if (!this.db) {
                return { connected: false, error: 'Firebase не инициализирован' };
            }
            
            // Пробуем выполнить простую операцию
            const testRef = this.db.collection('_test_connection');
            await testRef.limit(1).get();
            
            return { connected: true };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }
}

// Создаем глобальный экземпляр сервиса
window.firebaseService = new FirebaseService();

// Функция для показа уведомлений (если не определена)
if (typeof showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    };
}

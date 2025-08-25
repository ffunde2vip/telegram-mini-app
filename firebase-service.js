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

    // Сохранение процедуры пользователя
    async saveProcedure(userId, procedure) {
        try {
            console.log('🔄 Попытка сохранения процедуры для пользователя:', userId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            if (!userId || !procedure.id) {
                throw new Error('Отсутствуют обязательные параметры: userId или procedure.id');
            }

            // Создаем пользователя если не существует
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                console.log('👤 Создаем нового пользователя:', userId);
                await userRef.set({
                    id: userId,
                    firstName: procedure.userName.split(' ')[0] || 'Пользователь',
                    lastName: procedure.userName.split(' ').slice(1).join(' ') || '',
                    username: '',
                    photoUrl: '',
                    city: 'Москва',
                    street: 'ул. Примерная',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Сохраняем процедуру
            const proceduresRef = userRef.collection('procedures');
            
            const procedureData = {
                ...procedure,
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
    async getUserProcedures(userId) {
        try {
            console.log('🔄 Загрузка процедур для пользователя:', userId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const userRef = this.db.collection('users').doc(userId);
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
    async updateProcedure(userId, procedureId, updatedData) {
        try {
            console.log('🔄 Обновление процедуры:', { userId, procedureId, updatedData });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const userRef = this.db.collection('users').doc(userId);
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
    async deleteProcedure(userId, procedureId) {
        try {
            console.log('🔄 Удаление процедуры:', { userId, procedureId });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const userRef = this.db.collection('users').doc(userId);
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
    async saveUserInfo(userId, userInfo) {
        try {
            console.log('🔄 Сохранение информации о пользователе:', { userId, userInfo });
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const userRef = this.db.collection('users').doc(userId);
            
            const userData = {
                ...userInfo,
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
    async getUserProceduresForAdmin(userId) {
        try {
            console.log('🔄 Загрузка процедур пользователя для админа:', userId);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }

            const userRef = this.db.collection('users').doc(userId);
            const proceduresRef = userRef.collection('procedures');
            const snapshot = await proceduresRef.orderBy('createdAt', 'desc').get();
            
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

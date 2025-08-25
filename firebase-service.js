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

    // Создание или получение пользователя по Telegram ID
    async createOrGetUser(telegramId, userInfo) {
        try {
            console.log('🔄 Создание/получение пользователя для Telegram ID:', telegramId);
            if (!this.auth?.currentUser) {
                throw new Error('Пользователь не аутентифицирован');
            }

            const uid = this.auth.currentUser.uid;
            const userRef = this.db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            const isAdmin = this.isAdmin(telegramId);
            
            if (!userDoc.exists) {
                // Создаем нового пользователя
                console.log('👤 Создаем нового пользователя:', telegramId);
                await userRef.set({
                    telegramId: telegramId,
                    ...userInfo,
                    isAdmin: isAdmin,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log('✅ Новый пользователь создан');
            } else {
                // Обновляем время последнего входа
                await userRef.update({
                    lastSeen: new Date(),
                    updatedAt: new Date(),
                    isAdmin: isAdmin
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
            const uid = this.auth.currentUser.uid;
            const userRef = this.db.collection('users').doc(uid);
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

            const uid = this.auth.currentUser.uid;
            const userRef = this.db.collection('users').doc(uid);
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

            const uid = this.auth.currentUser.uid;
            const userRef = this.db.collection('users').doc(uid);
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

            const uid = this.auth.currentUser.uid;
            const userRef = this.db.collection('users').doc(uid);
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

    // Получение процедур конкретного пользователя (для администратора)
    async getUserProceduresForAdmin(userUid) {
        try {
            console.log('🔄 Загрузка процедур пользователя для админа:', userUid);
            
            if (!this.db) {
                throw new Error('Firebase Firestore не инициализирован');
            }
            const userRef = this.db.collection('users').doc(userUid.toString());
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
            return [];
        }
    }

    // Проверка является ли пользователь администратором
    isAdmin(telegramId) {
        const adminIds = ['1435191157']; // ID администратора
        return adminIds.includes(telegramId.toString());
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

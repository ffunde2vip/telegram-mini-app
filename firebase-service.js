// Сервис для работы с Firebase Firestore
class FirebaseService {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
    }

    // Сохранение процедуры пользователя
    async saveProcedure(userId, procedure) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const proceduresRef = userRef.collection('procedures');
            
            await proceduresRef.doc(procedure.id).set({
                ...procedure,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('Процедура сохранена в Firebase');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения процедуры:', error);
            return false;
        }
    }

    // Получение всех процедур пользователя
    async getUserProcedures(userId) {
        try {
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
            
            return procedures;
        } catch (error) {
            console.error('Ошибка получения процедур:', error);
            return [];
        }
    }

    // Обновление процедуры
    async updateProcedure(userId, procedureId, updatedData) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            await procedureRef.update({
                ...updatedData,
                updatedAt: new Date()
            });
            
            console.log('Процедура обновлена в Firebase');
            return true;
        } catch (error) {
            console.error('Ошибка обновления процедуры:', error);
            return false;
        }
    }

    // Удаление процедуры
    async deleteProcedure(userId, procedureId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const procedureRef = userRef.collection('procedures').doc(procedureId);
            
            await procedureRef.delete();
            
            console.log('Процедура удалена из Firebase');
            return true;
        } catch (error) {
            console.error('Ошибка удаления процедуры:', error);
            return false;
        }
    }

    // Сохранение информации о пользователе
    async saveUserInfo(userId, userInfo) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            
            await userRef.set({
                ...userInfo,
                lastSeen: new Date(),
                updatedAt: new Date()
            }, { merge: true });
            
            console.log('Информация о пользователе сохранена');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения информации о пользователе:', error);
            return false;
        }
    }

    // Получение всех пользователей (для администратора)
    async getAllUsers() {
        try {
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
            
            return users;
        } catch (error) {
            console.error('Ошибка получения пользователей:', error);
            return [];
        }
    }

    // Получение процедур конкретного пользователя (для администратора)
    async getUserProceduresForAdmin(userId) {
        try {
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
            
            return procedures;
        } catch (error) {
            console.error('Ошибка получения процедур пользователя:', error);
            return [];
        }
    }
}

// Создаем глобальный экземпляр сервиса
window.firebaseService = new FirebaseService();

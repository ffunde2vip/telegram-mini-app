import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import requests

# Конфиг
FIREBASE_PROJECT_ID = "kosmetolog-de6c1"
FIREBASE_REGION = "us-central1"  # не используется, но оставим для ясности
ADMIN_SHARED_PASSWORD = "adminpassword"  # Задайте ваш пароль здесь

# Инициализация бота
bot = telebot.TeleBot("8222259517:AAHzoORqGx9esgjwHXyfO846K_rOsNi0Gw4")

# Обработчик команды /start
@bot.message_handler(commands=['start'])
def start(message):
    # Создаем клавиатуру с кнопкой для открытия мини-приложения
    markup = InlineKeyboardMarkup()
    
    # Кнопка для открытия мини-приложения
    # URL нужно будет заменить на реальный адрес вашего хостинга
    web_app_button = InlineKeyboardButton(
        text="Открыть приложение",
        web_app=WebAppInfo(url="https://ffunde2vip.github.io/telegram-mini-app/")
    )
    
    markup.add(web_app_button)
    
    bot.send_message(
        message.chat.id,
        "Привет! Нажми на кнопку, чтобы открыть приложение:",
        reply_markup=markup
    )

# Команда для получения ID пользователя
@bot.message_handler(commands=['myid'])
def get_user_id(message):
    bot.send_message(
        message.chat.id,
        f"Ваш ID: {message.from_user.id}\n"
        f"Имя: {message.from_user.first_name}\n"
        f"Username: @{message.from_user.username or 'не указан'}"
    )

# /admin <password> — повышает пользователя до администратора (записывает флаг в Firestore)
@bot.message_handler(commands=['admin'])
def make_admin(message):
    try:
        parts = message.text.split(maxsplit=1)
        provided = parts[1].strip() if len(parts) > 1 else ""
        if provided != ADMIN_SHARED_PASSWORD:
            bot.reply_to(message, "❌ Неверный пароль для администратора.")
            return

        telegram_id = str(message.from_user.id)

        # Обновим профиль пользователя: users/{telegram_id} => isAdmin: true
        # Используем Firestore REST API (без аутентификации, если у вас открытые правила на запись своего документа).
        # Рекомендуется включить защищенный облачный endpoint/CF, но для простоты используем прямой вызов.
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users/{telegram_id}?currentDocument.exists=true"
        payload = {
            "fields": {
                "isAdmin": {"booleanValue": True},
                "updatedAt": {"timestampValue": "2025-01-01T00:00:00Z"}
            }
        }
        # Patch (update mask)
        params = {
            "updateMask.fieldPaths": ["isAdmin", "updatedAt"]
        }
        r = requests.patch(url, json=payload, params=params)
        if r.status_code >= 200 and r.status_code < 300:
            bot.reply_to(message, "✅ Вы повышены до администратора. Перезапустите мини‑приложение.")
        else:
            # Если документ не существует — создадим
            if r.status_code == 404:
                create_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users?documentId={telegram_id}"
                create_payload = {
                    "fields": {
                        "telegramId": {"integerValue": int(telegram_id)},
                        "isAdmin": {"booleanValue": True}
                    }
                }
                cr = requests.post(create_url, json=create_payload)
                if cr.status_code >= 200 and cr.status_code < 300:
                    bot.reply_to(message, "✅ Профиль создан, вы администратор. Перезапустите мини‑приложение.")
                else:
                    bot.reply_to(message, f"❌ Не удалось обновить профиль (код {cr.status_code}).")
            else:
                bot.reply_to(message, f"❌ Не удалось обновить профиль (код {r.status_code}).")
    except Exception as e:
        bot.reply_to(message, f"❌ Ошибка: {e}")

# Обработчик данных от веб-приложения
@bot.message_handler(content_types=['web_app_data'])
def web_app_handler(message):
    # Получаем данные от веб-приложения
    data = message.web_app_data.data
    
    bot.send_message(
        message.chat.id,
        f"Получены данные от приложения: {data}"
    )

# Запуск бота
if __name__ == "__main__":
    print("🤖 Запуск бота...")
    print("📱 URL мини-приложения: https://ffunde2vip.github.io/telegram-mini-app/")
    
    try:
        # Сначала сбрасываем webhook
        bot.delete_webhook()
        print("✅ Webhook сброшен")
        
        # Запускаем polling
        print("🔄 Запуск polling...")
        bot.polling(none_stop=True, timeout=60)
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print("💡 Попробуйте:")
        print("   1. Остановить все процессы Python")
        print("   2. Запустить reset_webhook.py")
        print("   3. Снова запустить bot.py")

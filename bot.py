import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import requests
import os
import json
from google.cloud import firestore
from google.oauth2 import service_account

# Конфиг
FIREBASE_PROJECT_ID = "kosmetolog-de6c1"
FIREBASE_REGION = "us-central1"  # не используется, но оставим для ясности
ADMIN_SHARED_PASSWORD = "adminpassword"  # Задайте ваш пароль здесь
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "service-account.json")

# Инициализируем Firestore c сервисным аккаунтом, если файл присутствует
db = None
if os.path.exists(GOOGLE_CREDENTIALS_PATH):
    try:
        creds = service_account.Credentials.from_service_account_file(GOOGLE_CREDENTIALS_PATH)
        db = firestore.Client(credentials=creds, project=FIREBASE_PROJECT_ID)
        print("✅ Firestore admin SDK инициализирован через сервисный аккаунт")
    except Exception as e:
        print(f"⚠️ Не удалось инициализировать Firestore admin SDK: {e}")

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

        # Если доступен админ SDK — используем его (надёжно и без ограничений правил)
        if db is not None:
            try:
                doc_ref = db.collection('users').document(telegram_id)
                doc_ref.set({
                    'telegramId': int(telegram_id),
                    'isAdmin': True,
                }, merge=True)
                bot.reply_to(message, "✅ Вы повышены до администратора. Перезапустите мини‑приложение.")
                return
            except Exception as e:
                bot.reply_to(message, f"❌ Firestore admin SDK ошибка: {e}")
                return

        # Фолбэк на REST API (требует настроенных правил или ключа/прокси)
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users/{telegram_id}?currentDocument.exists=true"
        payload = {
            "fields": {
                "isAdmin": {"booleanValue": True}
            }
        }
        params = {"updateMask.fieldPaths": ["isAdmin"]}
        r = requests.patch(url, json=payload, params=params)
        if 200 <= r.status_code < 300:
            bot.reply_to(message, "✅ Вы повышены до администратора. Перезапустите мини‑приложение.")
        elif r.status_code == 404:
            create_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users?documentId={telegram_id}"
            create_payload = {"fields": {"telegramId": {"integerValue": int(telegram_id)}, "isAdmin": {"booleanValue": True}}}
            cr = requests.post(create_url, json=create_payload)
            if 200 <= cr.status_code < 300:
                bot.reply_to(message, "✅ Профиль создан, вы администратор. Перезапустите мини‑приложение.")
            else:
                bot.reply_to(message, f"❌ Не удалось обновить профиль (код {cr.status_code}).")
        else:
            bot.reply_to(message, f"❌ Не удалось обновить профиль (код {r.status_code}). Проверьте правила Firestore или используйте service-account.")
    except Exception as e:
        bot.reply_to(message, f"❌ Ошибка: {e}")

# /unadmin <password> — снимает права администратора
@bot.message_handler(commands=['unadmin'])
def remove_admin(message):
    try:
        parts = message.text.split(maxsplit=1)
        provided = parts[1].strip() if len(parts) > 1 else ""
        if provided != ADMIN_SHARED_PASSWORD:
            bot.reply_to(message, "❌ Неверный пароль.")
            return

        telegram_id = str(message.from_user.id)

        if db is not None:
            try:
                doc_ref = db.collection('users').document(telegram_id)
                doc_ref.set({'isAdmin': False}, merge=True)
                bot.reply_to(message, "✅ Права администратора сняты. Перезапустите мини‑приложение.")
                return
            except Exception as e:
                bot.reply_to(message, f"❌ Firestore admin SDK ошибка: {e}")
                return

        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users/{telegram_id}?currentDocument.exists=true"
        payload = {"fields": {"isAdmin": {"booleanValue": False}}}
        params = {"updateMask.fieldPaths": ["isAdmin"]}
        r = requests.patch(url, json=payload, params=params)
        if 200 <= r.status_code < 300:
            bot.reply_to(message, "✅ Права администратора сняты. Перезапустите мини‑приложение.")
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
        # Сначала сбрасываем webhook и удаляем висящие обновления,
        # чтобы другой getUpdates не держал соединение
        bot.delete_webhook(drop_pending_updates=True)
        print("✅ Webhook сброшен (drop_pending_updates=True)")
        
        # Запускаем infinity_polling с пропуском возможных старых апдейтов
        print("🔄 Запуск polling...")
        bot.infinity_polling(timeout=60, long_polling_timeout=60, skip_pending=True)
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print("💡 Попробуйте:")
        print("   1. Остановить все процессы Python")
        print("   2. Запустить reset_webhook.py")
        print("   3. Снова запустить bot.py")


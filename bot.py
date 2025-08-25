import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

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

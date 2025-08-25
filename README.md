# Telegram Mini App - Локальный сервер

## Быстрый старт

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 2. Запуск локального HTTPS сервера
```bash
python server.py
```
или
```bash
start_local_server.bat
```

### 3. Запуск бота для локального тестирования
```bash
python bot_local.py
```

## Файлы проекта

- `server.py` - Локальный HTTPS сервер с SSL
- `bot_local.py` - Бот для локального тестирования
- `index.html` - Главная страница мини-приложения
- `style.css` - Стили
- `script.js` - JavaScript логика
- `bot.py` - Основной бот для продакшена

## Настройка SSL

Сервер автоматически создает самоподписанный SSL сертификат при первом запуске.

**Требования:**
- OpenSSL (для создания сертификата)
- Python 3.6+

## Доступ к приложению

- **Локально:** https://localhost:8443
- **В Telegram:** Используйте ngrok для туннелирования

## Ngrok для тестирования в Telegram

1. Установите ngrok: https://ngrok.com/
2. Запустите локальный сервер: `python server.py`
3. В новом терминале: `ngrok http 8443`
4. Используйте HTTPS URL от ngrok в боте

## Структура проекта

```
manikur/
├── server.py              # Локальный HTTPS сервер
├── bot_local.py           # Бот для локального тестирования
├── bot.py                 # Основной бот
├── index.html             # HTML страница
├── style.css              # CSS стили
├── script.js              # JavaScript
├── requirements.txt       # Зависимости
├── start_local_server.bat # Скрипт запуска сервера
└── run.bat               # Скрипт запуска бота
```

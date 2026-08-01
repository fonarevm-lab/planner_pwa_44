# Planner PWA

**Личный планировщик задач, который работает прямо в браузере телефона. Без бэкенда, без серверов, без облаков.**

## Что это

Progressive Web App — открывается в браузере, ставится на главный экран как обычное приложение. Данные хранятся локально (IndexedDB). Напоминания — через системный календарь Samsung.

## Фичи

- ✅ Задачи с категорией, приоритетом, датой
- 📅 Кнопка «В календарь» — открывает Samsung Calendar с предзаполненным событием
- 🤖 Экспорт планов в JSON для ассистента (Planner Assistant в Mavis)
- 📱 Адаптивный UI, тёмная тема
- 🔌 Работает офлайн (Service Worker)
- 🔐 Данные только на твоём устройстве

## Установка на Samsung S25+

### 1. Собрать

```bash
cd planner-pwa
npm install
npm run build
```

Получится папка `dist/` — это и есть готовое приложение.

### 2. Захостить

PWA требует HTTPS. Варианты:

**Самый простой — GitHub Pages (бесплатно):**
1. Создай репо `fonarevm-lab/planner-pwa` на GitHub
2. Залей туда содержимое `dist/`
3. Settings → Pages → Source: main branch / root
4. Через 1-2 минуты будет доступно по `https://fonarevm-lab.github.io/planner-pwa/`

**Альтернатива — Cloudflare Pages (бесплатно, быстрее):**
1. Зайди на https://pages.cloudflare.com
2. Подключи репо
3. Build command: `npm run build`, Output: `dist`
4. Готово

### 3. Установить на телефон

1. Открой ссылку в **Chrome** на Samsung
2. Появится предложение «Добавить на главный экран» (или через меню Chrome)
3. Иконка 📅 появится среди приложений
4. Открывай — работает как обычное приложение, без адресной строки

## Связь с ассистентом

В PWA есть кнопка **«🤖 Ассистент»** (внизу).

1. Создал задачи в PWA
2. Жмёшь «📋 Скопировать для ассистента»
3. Открываешь чат с **Planner Assistant** в Mavis
4. Вставляешь (Ctrl+V)
5. Ассистент анализирует, задаёт вопросы, помогает

## Архитектура

```
src/
├── main.ts          # точка входа + SW регистрация
├── App.vue
├── router.ts
├── style.css
├── db.ts            # IndexedDB-обёртка
├── calendar.ts      # утилита "В календарь"
├── exporter.ts      # экспорт для ассистента
├── components/
│   ├── BottomNav.vue
│   └── TaskCard.vue
├── views/
│   ├── HomeView.vue       # задачи на сегодня
│   ├── WeekView.vue       # неделя
│   ├── TaskCreateView.vue
│   ├── TaskDetailView.vue
│   ├── AssistantView.vue  # экспорт для ассистента
│   └── SettingsView.vue
└── stores/
    ├── tasks.ts
    └── categories.ts

public/
├── favicon.svg
├── icon-192.png     # для PWA-иконки
├── icon-512.png
├── manifest.webmanifest
└── service-worker.js
```

## Ограничения

- Нет push-уведомлений (браузер не даст без PWA-сервера, а у нас нет сервера)
- Нет кросс-устройства (только на этом телефоне; для бэкапа — экспорт JSON)
- Нет Telegram-бота (напоминания через календарь)
- AI работает только если введён LLM API ключ (опционально, для будущих фич)

## Развитие

Хочешь добавить push-уведомления? Нужен backend (PWA-сервер с VAPID-ключами). Можно использовать мой предыдущий бэкенд из `/workspace/planner/` (FastAPI + aiogram).

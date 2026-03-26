# Brusnika Map — Project Context

## Project Overview

**Brusnika Map** — инструмент для оценки рыночной стоимости недвижимости с визуализацией на карте Екатеринбурга.

### Stack

| Категория        | Технологии                                |
| ---------------- | ----------------------------------------- |
| Framework        | Vue 3 (Composition API, `<script setup>`) |
| Build Tool       | Vite 8                                    |
| Maps             | Yandex Maps API v3 (`vue-yandex-maps`)    |
| State Management | Pinia                                     |
| Routing          | Vue Router 5                              |
| HTTP Client      | Axios                                     |
| Linting          | ESLint 9 + Prettier                       |

### Architecture

```
src/
├── api/                  # API клиенты (axios instances)
│   ├── client.js         # Базовый axios с интерцепторами
│   └── properties.js     # Endpoints для объектов
├── components/
│   ├── map/              # Компоненты карты
│   │   ├── BrusnikaMap.vue
│   │   ├── PropertyMarker.vue
│   │   └── PolygonFeature.vue
│   ├── forms/            # Формы и контролы
│   │   └── DrawingControls.vue
│   └── panels/           # Боковые панели
│       ├── PropertiesPanel.vue
│       └── Drawer.vue
├── composables/          # Vue composables (use*.js)
│   ├── usePointInPolygon.js
│   ├── useMarkerClustering.js
│   └── useFormatters.js
├── router/
│   └── index.js          # Vue Router конфигурация
├── stores/
│   ├── index.js          # Экспорты stores
│   ├── properties.js     # Store объектов недвижимости
│   └── polygons.js       # Store полигонов/геозон
├── utils/
│   ├── geo.js            # Гео-утилиты
│   └── yandexApiKey.js   # Работа с API ключом
├── views/
│   ├── HomeView.vue      # Главная страница
│   ├── MapView.vue       # Страница карты
│   └── PropertiesView.vue # Список объектов
├── App.vue               # Layout-оболочка
├── main.js               # Точка входа
└── style.css             # Глобальные стили
```

### Key Features

- **Визуализация объектов** — маркеры недвижимости на карте
- **Рисование полигонов** — создание геозон кликами по карте
- **Point-in-Polygon** — определение попадания объектов в геозону
- **Кластеризация** — группировка маркеров при малом зуме
- **Фильтрация** — фильтрация объектов по параметрам

### Auth

**Авторизация не требуется.** Система без разделения по ролям, все пользователи имеют одинаковый доступ.

---

## Building and Running

### Environment Setup

```bash
# Скопировать шаблон переменных окружения
cp .env.example .env.local

# Добавить API ключ Яндекс Карт
# VITE_YANDEX_MAPS_API_KEY=ваш-ключ
```

### Commands

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Запуск dev-сервера             |
| `npm run build`        | Сборка production-версии       |
| `npm run preview`      | Preview production-сборки      |
| `npm run lint`         | Проверка ESLint                |
| `npm run lint:fix`     | Исправление ESLint ошибок      |
| `npm run format`       | Форматирование Prettier        |
| `npm run format:check` | Проверка форматирования        |
| `npm run fix:all`      | Lint + Format (перед коммитом) |

### Verification Workflow

После **любого** изменения кода:

```bash
npm run fix:all
npm run dev
npm run build
```

---

## Development Conventions

### Code Style

- **Vue:** `<script setup>` syntax, typed props/emits
- **Variables:** `const` предпочтительнее `let`
- **Strings:** template literals для интерполяции
- **Imports:** деструктуризация props и импортов
- **No unused:** запрещены неиспользуемые импорты/переменные

### Naming Conventions

| Тип         | Стиль           | Пример                         |
| ----------- | --------------- | ------------------------------ |
| Components  | PascalCase      | `PropertyMarker.vue`           |
| Composables | camelCase + use | `usePolygonDrawing.js`         |
| Stores      | camelCase       | `properties.js`, `polygons.js` |
| Utils       | camelCase       | `geo.js`, `formatters.js`      |

### Component Guidelines

1. Один компонент — одна ответственность
2. Props и emits через `defineProps` / `defineEmits`
3. Переиспользуемая логика выносится в composables

### Error Handling

- API вызовы в `try/catch`
- User-friendly ошибки через UI
- Логирование в development

### Security

- **Никогда не коммитить** секреты/API ключи
- Использовать environment variables
- Валидация пользовательского ввода

---

## Git Rules

- Commit messages: русский или английский
- Не коммитить `.env.local` и чувствительные файлы
- Перед коммитом: `npm run build` (убедиться в отсутствии ошибок)

---

## Environment Variables

```env
VITE_YANDEX_MAPS_API_KEY=    # API ключ Яндекс Карт (обязательно)
```

---

## Technical Notes (Yandex Maps)

1. **Нет встроенного инструмента рисования полигонов** — реализуется через `YandexMapListener`
2. **Нет point-in-polygon** — использовать `@turf/boolean-point-in-polygon` или свой алгоритм
3. **Раскраска зданий** — ограничена (только по тегам через Customization или кастомные полигоны)

---

## File Patterns

### Ignored (`.gitignore`)

- `node_modules/`, `dist/`, `dist-ssr/`
- `*.local`, `.env`, `.env.*`
- `logs/`, `*.log`
- `.vscode/*` (кроме `extensions.json`)
- `.idea/`, `*.suo`, `*.ntvs*`

### Source Files

- `**/*.{js,mjs,jsx,vue}` — линтятся ESLint
- `**/*.{js,mjs,jsx,vue,css,md,json}` — форматируются Prettier

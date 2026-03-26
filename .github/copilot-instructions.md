# Copilot Instructions — Brusnika Map Frontend

Эти инструкции дублируют и фиксируют ключевые правила из `CLAUDE.md`.

## Project Overview

Инструмент для оценки рыночной стоимости недвижимости с визуализацией на карте.

**Stack:**

- Vue 3 (Composition API, `<script setup>`)
- Vite 8
- Yandex Maps API v3 (`vue-yandex-maps`)
- Pinia
- Vue Router
- Axios

**Backend:** .NET (в отдельном репозитории)

**Auth:** Не требуется. Система без разделения по ролям, все пользователи имеют одинаковый доступ.

---

## Architecture Rules

### Project Structure

```text
src/
├── api/                  # API clients (axios instances)
├── components/
│   ├── map/              # Map-related components
│   ├── forms/            # Form components
│   └── panels/           # Side panels, lists
├── composables/          # Vue composables (use*.js)
├── stores/               # Pinia stores
├── views/                # Page components
├── router/               # Vue Router config
└── utils/                # Helper functions
```

### Naming Conventions

- Components: PascalCase (`PropertyMarker.vue`, `PolygonDrawer.vue`)
- Composables: camelCase with `use` prefix (`usePolygonDrawing.js`)
- Stores: camelCase (`properties.js`, `polygons.js`)
- Utils: camelCase (`geo.js`, `formatters.js`)

### Component Guidelines

1. Always use `<script setup>` syntax.
2. Props and emits must be typed with `defineProps` and `defineEmits`.
3. Keep components focused (one responsibility per component).
4. Extract reusable logic into composables.

### Map Components (`vue-yandex-maps`)

- Use `YandexMapListener` for custom interactions (polygon drawing)
- Use `YandexMapFeature` for polygons and geo-objects
- Use `YandexMapClusterer` for clustering
- Use `YandexMapPopupMarker` for info windows
- For point-in-polygon checks use `@turf/boolean-point-in-polygon`

### State Management (Pinia)

- One store per domain: `properties`, `polygons`
- Use `storeToRefs` for reactive destructuring
- API calls go into store actions
- Computed state goes into getters

### API Layer

- All API calls must go through `src/api/` modules
- Use axios instances with base URL and interceptors
- Handle errors consistently

---

## Code Quality Rules

### CRITICAL: Verification After Changes

After **ANY** code modification, always run in order:

```bash
npm run fix:all
npm run dev
npm run build
```

If there are any errors or warnings:

1. Fix immediately
2. Do not leave broken code
3. Re-run verification after fixes
4. If lint/format issues appear, re-run `npm run fix:all`

### Uncertainty Rule

If confidence is below 90%, ask clarifying questions before implementation.

Examples:

- unclear target component
- multiple valid approaches
- ambiguous business logic
- undefined API contract
- unspecified UX behavior

### Code Style

- Use ESLint + Prettier
- No unused imports/variables
- Prefer `const` over `let`
- Use template literals for interpolation
- Destructure props/imports where appropriate

### Error Handling

- Handle API calls with `try/catch`
- Show user-friendly errors
- Log errors in development

### Security

- Never commit secrets/API keys
- Use environment variables for sensitive config
- Validate user input before sending to API

---

## Environment Variables

```env
VITE_YANDEX_MAPS_API_KEY=...
```

## Git Rules

- Commit messages can be Russian or English
- Do not commit `.env.local` or sensitive files
- Ensure `npm run build` passes before commit

## Key Technical Notes (Yandex Maps)

1. No built-in polygon drawing tool -> implement manually with `YandexMapListener`
2. No built-in point-in-polygon -> use `@turf/boolean-point-in-polygon`
3. Building coloring is limited (tags via Customization or custom polygon overlays)

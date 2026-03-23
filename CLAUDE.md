# Brusnika Map - Frontend Project Rules

## Project Overview

Инструмент для оценки рыночной стоимости недвижимости с визуализацией на карте.

**Stack:**

- Vue 3 (Composition API, `<script setup>`)
- Vite 8
- Yandex Maps API v3 (vue-yandex-maps)
- PrimeVue (UI components)
- Pinia (state management)
- Vue Router
- Axios (HTTP client)

**Backend:** .NET (отдельный репозиторий)

---

## Architecture Rules

### Project Structure

```
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

- **Components:** PascalCase (`PropertyMarker.vue`, `PolygonDrawer.vue`)
- **Composables:** camelCase with `use` prefix (`usePolygonDrawing.js`)
- **Stores:** camelCase (`properties.js`, `auth.js`)
- **Utils:** camelCase (`geo.js`, `formatters.js`)

### Component Guidelines

1. Always use `<script setup>` syntax
2. Props and emits must be typed with `defineProps` and `defineEmits`
3. Keep components focused - one responsibility per component
4. Extract reusable logic into composables

```vue
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  coordinates: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['update', 'delete']);
</script>
```

### Map Components (vue-yandex-maps)

- Use `YandexMapListener` for custom interactions (drawing polygons)
- Use `YandexMapFeature` for polygons and geo-objects
- Use `YandexMapClusterer` for marker clustering
- Use `YandexMapPopupMarker` for info windows
- Point-in-polygon checks: use `@turf/boolean-point-in-polygon`

### State Management (Pinia)

- One store per domain: `auth`, `properties`, `polygons`, `predictions`
- Use `storeToRefs` for reactive destructuring
- Actions should handle API calls
- Getters for computed state

```js
// stores/properties.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePropertiesStore = defineStore('properties', () => {
  const items = ref([]);
  const loading = ref(false);

  const count = computed(() => items.value.length);

  async function fetchProperties() {
    loading.value = true;
    // API call
    loading.value = false;
  }

  return { items, loading, count, fetchProperties };
});
```

### API Layer

- All API calls go through `src/api/` modules
- Use axios instances with base URL and interceptors
- Handle errors consistently

```js
// api/client.js
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

### UI Components (PrimeVue)

- Import components from `primevue/*`
- Use PrimeVue form components for consistency
- Follow PrimeVue theming system

---

## Code Quality Rules

### CRITICAL: Verification After Changes

After ANY code modification, ALWAYS run:

```bash
npm run fix:all
```

Then run:

```bash
npm run dev
```

Then in a separate terminal or after stopping dev:

```bash
npm run build
```

**If there are ANY errors or warnings:**

1. Fix them IMMEDIATELY before proceeding
2. Do not commit code with errors
3. Re-run verification after fixes
4. If formatting/lint issues appear, re-run `npm run fix:all`

### Uncertainty Rule

**If confidence in the required change is below 90%, ASK clarifying questions BEFORE making changes.**

Examples of when to ask:

- Unclear which component should be modified
- Multiple valid implementation approaches
- Business logic is ambiguous
- API contract is not defined
- UX behavior is not specified

Format: "Before I proceed, I need to clarify: [specific question]"

### Code Style

- Use ESLint + Prettier (if configured)
- No unused imports or variables
- Prefer `const` over `let`
- Use template literals for string interpolation
- Destructure props and imports when possible

### Error Handling

- Always handle API errors in try/catch
- Show user-friendly error messages (PrimeVue Toast)
- Log errors to console in development

### Security

- Never commit API keys or secrets
- Use environment variables for sensitive config
- Validate user input before sending to API

---

## Environment Variables

```env
VITE_YANDEX_MAPS_API_KEY=...
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Git Rules

- Write meaningful commit messages in Russian or English
- Don't commit `.env.local` or sensitive files
- Run `npm run build` before committing to ensure no build errors

---

## Dependencies Reference

```json
{
  "vue": "^3.x",
  "vue-router": "^4.x",
  "pinia": "^2.x",
  "axios": "^1.x",
  "vue-yandex-maps": "^3.x",
  "primevue": "^4.x",
  "@turf/helpers": "^7.x",
  "@turf/boolean-point-in-polygon": "^7.x"
}
```

---

## Key Technical Notes

### Yandex Maps API Limitations

1. **No built-in polygon drawing tool** - implement manually via `YandexMapListener`
2. **No point-in-polygon** - use `@turf/boolean-point-in-polygon`
3. **Building coloring** - only by tags via Customization, or custom polygons overlay

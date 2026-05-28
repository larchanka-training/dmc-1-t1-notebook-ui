# Skill: Добавить новую страницу

Добавить новый маршрут и компонент страницы в notebook UI.

## Шаги

### 1. Создать компонент страницы

Создать новый файл в папке соответствующей feature или в `src/app/`:

```
src/features/<feature-name>/ui/<PageName>Page.tsx
```

Пример структуры:
```tsx
export function SettingsPage() {
  return <div>...</div>;
}
```

### 2. Зарегистрировать маршрут

Открыть `src/app/router/AppRouter.tsx` и добавить новый `<Route>`:

```tsx
import { SettingsPage } from '@/features/settings/ui/SettingsPage';

// внутри <Routes>:
<Route path="/settings" element={<SettingsPage />} />
```

### 3. Добавить навигационную ссылку (если нужно)

Добавить `<Link to="/settings">` в соответствующий навигационный компонент в `src/features/` или `src/shared/ui/`.

## Верификация

```bash
npm run build   # должен пройти без ошибок TypeScript
npm run lint    # должен пройти без предупреждений
```

# Notebook UI — React Frontend

React frontend для JavaScript Notebook платформы. Отображает Markdown и JavaScript ячейки, выполняет JS через Web Worker (fake kernel), поддерживает AI генерацию кода и сбор аналитики.

## Tech Stack

- **Framework:** React 18 + TypeScript 5.6
- **Build:** Vite 7
- **State:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Routing:** React Router DOM 7
- **Editor:** CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-javascript`, `@codemirror/lang-markdown`)
- **Markdown:** `react-markdown` + `remark-gfm`
- **Styles:** Tailwind CSS 4 (через `@tailwindcss/vite`)
- **Testing:** Vitest 3

## Структура проекта

```
src/
├── app/
│   ├── App.tsx              # Корневой компонент
│   ├── router/
│   │   └── AppRouter.tsx    # React Router маршруты
│   └── store/
│       ├── store.ts         # Настройка Redux store
│       └── hooks.ts         # Типизированные useAppDispatch / useAppSelector
├── features/
│   ├── analytics/           # Usage Analytics
│   │   ├── api/             # analyticsService, тесты
│   │   ├── model/           # useAnalytics hook
│   │   └── ui/              # AnalyticsDashboard страница
│   ├── auth/                # Авторизация
│   │   ├── api/             # authService
│   │   ├── model/           # authContext
│   │   └── ui/              # AuthModal
│   ├── help/                # Help страница
│   └── notebook/            # Основная feature
│       ├── api/             # notebookService, aiService
│       ├── lib/             # Чистая логика (fakeKernel, fakeAiCodegen)
│       ├── model/           # notebookContext, useNotebookExecutor, types
│       └── ui/              # NotebookPage, NotebookSidebar, AiPromptModal, Cell
├── shared/
│   ├── api/
│   │   └── apiClient.ts     # Базовый HTTP client (auth, refresh, error handling)
│   ├── lib/
│   │   └── cn.ts            # Утилита для объединения Tailwind классов
│   └── ui/
│       └── Button.tsx       # Переиспользуемые UI компоненты
├── main.tsx                 # Точка входа
└── index.css                # Tailwind директивы
```

## Быстрый старт

```bash
npm install
npm run dev
```

Dev server: `http://localhost:5173` (или `http://localhost:3000` через Docker).

## Команды

```bash
npm run dev        # Dev server на http://localhost:5173
npm run build      # Проверка TypeScript + Vite production build
npm run preview    # Предпросмотр production build локально
npm run lint       # ESLint с политикой нулевых предупреждений
npm run test       # Vitest (однократный запуск)
npm run test:watch # Vitest (режим наблюдения)
```

## Маршруты

| Путь           | Компонент             | Описание                     |
|----------------|-----------------------|------------------------------|
| `/`            | `NotebookPage`        | Список notebook'ов + редактор |
| `/:notebookId` | `NotebookPage`        | Открытый notebook             |
| `/analytics`   | `AnalyticsDashboard`  | Dashboard аналитики           |
| `/help`        | `HelpPage`            | Справка                       |

## Features

### Notebook

- Создание, редактирование, удаление notebook'ов
- Markdown и JavaScript ячейки
- Выполнение JS через Web Worker (fake kernel)
- AI генерация кода по prompt (через backend `/ai/generate`)

### Analytics

- `useAnalytics` hook — трекинг событий с тихой обработкой ошибок
- События: `notebook_created`, `cell_executed`, `ai_request`, `execution_error`
- `AnalyticsDashboard` — карточки статистики, диаграмма, таблица недавних событий

### Auth

- JWT-авторизация через HttpOnly cookies
- `AuthModal` для входа/регистрации
- Автоматический refresh token

## Как расширять

- Новые feature папки в `src/features/` (например `src/features/todos/`)
- Переиспользуемые UI компоненты в `src/shared/ui/`
- API helpers в `src/shared/api/` или `src/features/<feature>/api/`
- Тесты через Vitest (`*.test.ts` / `*.test.tsx` рядом с тестируемым файлом)
- Пошаговые гайды в `.agents/`:
  - [`add-page.md`](.agents/add-page.md) — добавить маршрут и страницу
  - [`add-feature.md`](.agents/add-feature.md) — добавить Redux feature slice

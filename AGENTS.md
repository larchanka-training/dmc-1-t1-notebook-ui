# AGENTS.md — dmc-1-t1-notebook-ui

React frontend для JavaScript Notebook платформы. Отображает Markdown и JavaScript ячейки, выполняет JS через fake kernel, поддерживает AI генерацию кода.

## Tech Stack

- **Framework:** React 18 + TypeScript 5.6
- **Build:** Vite 7
- **State:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Routing:** React Router DOM 7
- **Editor:** CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-javascript`, `@codemirror/lang-markdown`)
- **Markdown:** `react-markdown` + `remark-gfm`
- **Styles:** Tailwind CSS 4 (через `@tailwindcss/vite`)
- **Testing:** Vitest 3

## Структура папок

```
src/
├── app/
│   ├── App.tsx              # Корневой компонент
│   ├── router/AppRouter.tsx # React Router маршруты
│   └── store/
│       ├── store.ts         # Настройка Redux store
│       └── hooks.ts         # Типизированные useAppDispatch / useAppSelector
├── features/
│   └── notebook/            # Основная feature
│       ├── api/             # API вызовы (notebookService.ts)
│       ├── lib/             # Чистая логика (fakeKernel, fakeAiCodegen)
│       ├── model/           # Redux slice, thunks, selectors, types
│       └── ui/              # React компоненты этой feature
└── shared/
    ├── api/apiClient.ts     # Базовый HTTP client
    ├── lib/cn.ts            # Утилита для объединения Tailwind классов
    └── ui/                  # Переиспользуемые UI компоненты (Button и т.д.)
```

## CLI команды

```bash
npm run dev        # Dev server на http://localhost:5173 (http://localhost:3000 через Docker)
npm run build      # Проверка TypeScript + Vite production build
npm run lint       # ESLint с политикой нулевых предупреждений
npm run test       # Vitest (однократный запуск)
npm run test:watch # Vitest (режим наблюдения)
```

## Task Skills

Пошаговые гайды в папке `.agents/`:
- [`add-page.md`](.agents/add-page.md) — добавить новый маршрут и компонент страницы
- [`add-feature.md`](.agents/add-feature.md) — добавить новый Redux feature slice

## Agent Workflow

### 1. Перед выполнением задачи
- Изучи задачу, подготовь план, предоставь пользователю на ревью
- Получи явное одобрение перед началом любых изменений в коде

### 2. Git (после одобрения плана)
```bash
git checkout main
git pull origin main
git checkout -b <тип>/<краткое-описание>   # feat/, fix/, chore/
```

### 3. Тестирование
- Покрыть изменения Vitest unit-тестами
- Для UI-флоу (взаимодействие пользователя) добавить Playwright E2E тесты

### 4. Перед коммитом
- Запроси одобрение у пользователя с кратким summary изменений
- После одобрения запусти тесты — все должны пройти:
```bash
npm run test
npm run lint
npm run build
```

### 5. Формат коммита
```
<Тема: максимум 50 символов>

# Краткое описание
* Что реализовано

# Почему
* Причины выбора подхода

# План тестирования
✅ vitest: X/X пройдены (включая N новых)
```

### 6. Pull Request
```bash
gh pr create --title "<заголовок до 70 символов>" --body "..."
```
Тело PR: краткий Summary + Test plan.

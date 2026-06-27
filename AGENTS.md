# AGENTS.md — dmc-1-t1-notebook-ui

React frontend для JavaScript Notebook платформы. Отображает Markdown и JavaScript ячейки, выполняет JS через Web Worker, поддерживает AI генерацию кода и сбор аналитики.

**Поведенческие гайдлайны:** см. раздел «Поведенческие правила» ниже. Скиллы монорепозитория — в `.agents/skills/` (mono).

## Навигация для агента

`AGENTS.md` — **единая точка входа и источник истины** для всех AI-агентов. Файлы `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `.github/copilot-instructions.md` — относительные symlink'и на этот файл. Меняй правила **здесь** — изменения подхватят все агенты.

Скиллы-дисциплины живут в mono: `.agents/skills/<name>/SKILL.md`. Для задач в `ui/` загружай: `architecture-discipline` → `testing-discipline` → `error-handling-discipline`.

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

## Поведенческие правила

### 1. Сначала думай, потом кодь

**Не додумывай. Не прячь сомнения. Озвучивай развилки.**

- Явно сформулируй свои допущения. Если не уверен — спроси.
- Если возможно несколько интерпретаций задачи — назови их, не выбирай молча.
- Если есть более простой способ — скажи об этом.
- Если что-то непонятно — остановись и задай вопрос.

### 2. Минимализм

**Минимум кода, решающего задачу. Никаких спекуляций.**

- Никаких фич, которых не просили.
- Никаких абстракций ради одного использования.
- Если получилось 200 строк, а хватило бы 50 — перепиши.

### 3. Хирургические правки

**Трогай только то, что необходимо. Прибирай только за собой.**

- Не «улучшай» соседний код, комментарии или форматирование.
- Не рефактори то, что не сломано.
- Сохраняй существующий стиль кода.
- Заметил мёртвый код, не относящийся к задаче — упомяни, **не удаляй**.

### 4. Выполнение от цели

**Определяй критерий успеха. Итеративно проверяй, пока не достигнешь его.**

- «Почини баг» → «Напиши тест, воспроизводящий баг, потом сделай его зелёным».
- «Добавь фичу» → «Напиши тесты, потом сделай их зелёными».

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

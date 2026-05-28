# Skill: Добавить новую feature (Redux Slice)

Добавить новую feature с собственным Redux slice по образцу существующей `features/notebook/`.

## Шаги

### 1. Создать папку feature

```
src/features/<feature-name>/
├── api/          # API вызовы через src/shared/api/apiClient.ts
├── lib/          # Чистая логика (без React, без Redux)
├── model/
│   ├── types.ts        # TypeScript интерфейсы
│   ├── <name>Slice.ts  # Redux slice (createSlice)
│   ├── <name>Thunks.ts # Async thunks (createAsyncThunk)
│   └── selectors.ts    # Selector функции
└── ui/           # React компоненты этой feature
```

### 2. Создать Redux slice

```ts
// src/features/<name>/model/<name>Slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MyState { ... }
const initialState: MyState = { ... };

export const mySlice = createSlice({
  name: '<name>',
  initialState,
  reducers: { ... },
});

export const { ... } = mySlice.actions;
export default mySlice.reducer;
```

### 3. Зарегистрировать reducer в store

Открыть `src/app/store/store.ts` и добавить reducer:

```ts
import myReducer from '@/features/<name>/model/<name>Slice';

export const store = configureStore({
  reducer: {
    // существующие reducers...
    myFeature: myReducer,
  },
});
```

### 4. Использовать типизированные hooks в компонентах

```tsx
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
```

## Верификация

```bash
npm run build   # должен пройти без ошибок TypeScript
npm run test    # должен пройти
npm run lint    # должен пройти без предупреждений
```

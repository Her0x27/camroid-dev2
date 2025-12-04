# TypeScript Project Audit Report

## Summary

This document contains the results of a comprehensive TypeScript project audit covering code duplication, architecture, performance, typing, data handling, async patterns, imports, and code smells.

---

## 1. Дублирование и повторы

### 1.1 Дублирование хуков жестов
**Местоположение:** `client/src/hooks/use-gestures.ts` и `client/src/hooks/use-long-press.ts`

**Проблема:** Оба хука имеют практически идентичную логику для:
- Обработки long press с таймером
- Отслеживания начальной позиции касания
- Обнаружения движения для отмены long press
- Дублированные константы `DEFAULT_LONG_PRESS_DELAY = 500` и `DEFAULT_MOVE_THRESHOLD = 10`

**Предложение:** Извлечь общую логику в базовый хук или объединить функциональность.

```
□ Создать базовый хук useTouchTracking с общей логикой
□ Рефакторить use-gestures.ts для использования базового хука
□ Рефакторить use-long-press.ts для использования базового хука
□ Перенести общие константы в constants.ts
```

### 1.2 Паттерн UI компонентов Radix
**Местоположение:** `client/src/components/ui/` (alert-dialog.tsx, dialog.tsx, drawer.tsx, dropdown-menu.tsx, sheet.tsx, popover.tsx, select.tsx, toast.tsx, tooltip.tsx и др.)

**Проблема:** Все компоненты следуют одинаковому шаблону:
- forwardRef wrapper
- cn() для объединения классов
- displayName присваивание
- Overlay с одинаковыми анимациями `bg-black/80`

**Предложение:** Это стандартный паттерн shadcn/ui, изменения не рекомендуются, так как это упрощает обновление компонентов. Но можно создать helper для повторяющихся стилей overlay.

```
□ [ОПЦИОНАЛЬНО] Создать общий overlayStyles constant для повторяющихся классов анимаций
□ [ОПЦИОНАЛЬНО] Документировать паттерн в README для onboarding новых разработчиков
```

### 1.3 Структура Settings Sections
**Местоположение:** `client/src/pages/settings/sections/*.tsx`

**Проблема:** Секции настроек имеют повторяющуюся структуру:
- CollapsibleCard wrapper
- Label с иконкой
- Switch/Slider компоненты
- Separator между секциями

**Предложение:** Создать общие компоненты для типичных паттернов настроек.

```
□ Создать SettingRow компонент для label + switch/slider
□ Создать SettingSlider компонент с интегрированным label и value display
□ Рефакторить существующие секции для использования новых компонентов
```

---

## 2. Архитектура и структура

### 2.1 Слишком большие компоненты страниц
**Местоположение:** 
- `client/src/pages/gallery/index.tsx` (636 строк)
- `client/src/pages/camera/index.tsx` (401 строка)

**Проблема:** Компоненты страниц содержат слишком много логики и состояний:
- GalleryPage: upload логика, selection, filters, dialogs, mutations
- CameraPage: capture логика, color sampling, orientation, stabilization

**Предложение:** Декомпозиция на более мелкие компоненты и хуки.

```
□ Извлечь useUploadHandler из GalleryPage
□ Извлечь useGalleryDialogs для управления состоянием диалогов
□ Извлечь ColorSamplingProvider или хук из CameraPage
□ Создать CaptureController component для логики съёмки
```

### 2.2 Отсутствие слоя сервисов
**Местоположение:** `client/src/lib/db.ts` (705 строк)

**Проблема:** Файл db.ts содержит и доступ к данным, и бизнес-логику (кеширование, подсчёт статистики). Это нарушает Single Responsibility Principle.

**Предложение:** Разделить на слои.

```
□ Создать client/src/services/photo-service.ts для бизнес-логики фото
□ Создать client/src/services/settings-service.ts для бизнес-логики настроек
□ Оставить в db.ts только низкоуровневые операции с IndexedDB
□ Перенести кеширование в отдельный модуль cache.ts
```

---

## 3. Производительность

### 3.1 Последовательные await вместо параллельных
**Местоположение:** `client/src/pages/camera/index.tsx` строки 78-94

**Проблема:** `getPhotoCounts()` и `getLatestPhoto()` выполняются последовательно, хотя не зависят друг от друга.

```typescript
// Текущий код
const counts = await getPhotoCounts();
setPhotoCount(counts.total);
setCloudCount(counts.cloud);
if (counts.total > 0) {
  const latest = await getLatestPhoto();
  // ...
}
```

**Предложение:**
```typescript
// Оптимизированный код
const [counts, latest] = await Promise.all([
  getPhotoCounts(),
  getLatestPhoto(),
]);
```

```
□ Рефакторить loadPhotos в camera/index.tsx для параллельного выполнения
```

### 3.2 Неоптимальная загрузка файлов для скачивания
**Местоположение:** `client/src/pages/gallery/index.tsx` строки 226-257

**Проблема:** `handleDownloadSelected` обрабатывает фотографии последовательно с искусственной задержкой 100ms.

```typescript
for (const photo of selectedPhotos) {
  const imageData = await getPhotoImageData(photo.id);
  const blob = await createCleanImageBlob(imageData);
  // download logic
  await new Promise(resolve => setTimeout(resolve, 100)); // искусственная задержка
}
```

**Предложение:** Параллельная загрузка данных, последовательное скачивание.

```
□ Предзагрузить imageData для всех фото параллельно через Promise.all
□ Оставить последовательное скачивание для предотвращения блокировки браузера
□ Удалить искусственную задержку или заменить на requestIdleCallback
```

### 3.3 Отсутствие мемоизации в PhotoListItem и PhotoGridCell
**Местоположение:** `client/src/components/virtualized-gallery.tsx`

**Проблема:** Внутренние callback функции `handleLongPress` и `handleClick` создаются заново при каждом рендере, несмотря на memo wrapper.

```
□ Использовать useMemo для стабилизации объекта data в longPressHandlers
□ Проверить, что все зависимости useCallback корректны
```

### 3.4 Отсутствие debounce для color sampling
**Местоположение:** `client/src/pages/camera/index.tsx` строки 128-203

**Проблема:** Color sampling использует requestAnimationFrame с интервалом 100ms, но setReticleColor вызывается на каждом цикле, что может вызывать лишние ререндеры.

**Предложение:** Добавить проверку на изменение цвета перед setState.

```
□ Добавить сравнение нового цвета с предыдущим перед setReticleColor
□ Использовать useRef для хранения предыдущего цвета
```

---

## 4. Типизация

### 4.1 Статус типизации
**Результат проверки:** ✅ Отлично

- Не найдено использования `any` типов
- Не найдено `@ts-ignore` или `@ts-nocheck` директив
- Типы хорошо определены в `shared/schema.ts`

```
□ Нет задач - типизация в хорошем состоянии
```

---

## 5. Обработка данных

### 5.1 Потенциальная оптимизация фильтрации
**Местоположение:** `client/src/lib/db.ts` функция `getFolderStats`

**Проблема:** Проход по всем записям для подсчёта статистики при каждом запросе (с TTL кешем 5 секунд).

**Предложение:** Рассмотреть инкрементальное обновление статистики при мутациях.

```
□ [ОПЦИОНАЛЬНО] Реализовать инкрементальное обновление статистики папок
□ [ОПЦИОНАЛЬНО] Увеличить TTL кеша если статистика редко меняется
```

---

## 6. Асинхронность

### 6.1 Правильное использование AbortController
**Результат проверки:** ✅ Хорошо

Найдено корректное использование AbortController:
- `client/src/hooks/use-photo-navigator.ts` - правильный cleanup
- `client/src/lib/capture-helpers.ts` - проверка signal.aborted
- `client/src/pages/gallery/index.tsx` - upload cancellation

### 6.2 Отсутствие debounce для настроек
**Местоположение:** `client/src/lib/settings-context.tsx`

**Статус:** ✅ Реализовано - debounce уже используется (строка 27)

### 6.3 Throttle для orientation
**Местоположение:** `client/src/hooks/use-orientation.ts`

**Статус:** ✅ Реализовано - throttle уже используется (строки 91-99)

```
□ Нет критичных задач по асинхронности
```

---

## 7. Импорты и бандл

### 7.1 Lazy Loading
**Результат проверки:** ✅ Реализовано

Lazy loading правильно реализован в `client/src/App.tsx`:
- CameraPage, GalleryPage, PhotoDetailPage, SettingsPage, GamePage - все lazy loaded

### 7.2 Virtualization
**Результат проверки:** ✅ Реализовано

Виртуализация реализована в `client/src/components/virtualized-gallery.tsx` с использованием react-window.

```
□ Нет задач - code splitting и virtualization в хорошем состоянии
```

---

## 8. Код-смеллы

### 8.1 Длинные файлы
**Местоположение:**
- `client/src/lib/db.ts` - 705 строк
- `client/src/pages/gallery/index.tsx` - 636 строк
- `client/src/components/virtualized-gallery.tsx` - 467 строк
- `client/src/pages/camera/index.tsx` - 401 строка

```
□ Разбить db.ts на модули (см. раздел 2.2)
□ Разбить gallery/index.tsx (см. раздел 2.1)
□ [ОПЦИОНАЛЬНО] Разбить virtualized-gallery.tsx на VirtualizedList и VirtualizedGrid файлы
```

### 8.2 Магические числа
**Результат проверки:** ✅ Хорошо

Магические числа вынесены в `client/src/lib/constants.ts`:
- TIMING, GESTURE, GAME, UPLOAD, STORAGE_KEYS, PATTERN_LOCK, IMAGE, SENSORS, CAMERA, GALLERY, UI

Исключения найдены в:
- `client/src/pages/camera/index.tsx` строка 155: `20` (sizePercent default) - используется `settings.reticle.size || 20`

```
□ Добавить DEFAULT_RETICLE_SIZE в constants.ts
□ Заменить hardcoded значение на константу
```

### 8.3 Большое количество зависимостей в useCallback
**Местоположение:** `client/src/pages/camera/index.tsx` строка 323

**Проблема:** handleCapture имеет 14 зависимостей в массиве зависимостей.

```typescript
}, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, 
    currentNote, reticleColor, settings.reticle, settings.imgbb, settings.soundEnabled, 
    settings.watermarkScale, settings.stabilization, settings.enhancement, playCapture, 
    waitForStability, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, 
    handleProcessingComplete]);
```

**Предложение:** Группировать связанные данные в объекты или использовать useReducer.

```
□ Создать объект captureConfig для группировки связанных настроек
□ Рассмотреть использование useReducer для состояния съёмки
```

### 8.4 Cleanup функции в useEffect
**Результат проверки:** ✅ Хорошо

Все основные useEffect hooks имеют cleanup функции:
- `use-camera.ts` - stopCamera cleanup
- `use-orientation.ts` - removeEventListener + clearTimeout
- `use-stabilization.ts` - cancelAnimationFrame
- `use-photo-navigator.ts` - AbortController abort
- `use-gestures.ts` - clearLongPressTimer

---

## Чек-лист задач по приоритету

### Высокий приоритет (производительность и архитектура)

```
□ [PERF-1] Параллелизовать getPhotoCounts() и getLatestPhoto() в camera/index.tsx
□ [PERF-2] Оптимизировать handleDownloadSelected для параллельной загрузки данных
□ [PERF-3] Добавить проверку изменения цвета перед setReticleColor
□ [ARCH-1] Разбить db.ts на photo-service.ts, settings-service.ts и db-core.ts
□ [ARCH-2] Извлечь хуки из GalleryPage (useUploadHandler, useGalleryDialogs)
```

### Средний приоритет (дублирование и рефакторинг)

```
□ [DUP-1] Объединить логику use-gestures.ts и use-long-press.ts
□ [DUP-2] Перенести общие константы DEFAULT_LONG_PRESS_DELAY, DEFAULT_MOVE_THRESHOLD в constants.ts
□ [REF-1] Создать общие компоненты SettingRow и SettingSlider
□ [REF-2] Группировать зависимости handleCapture в captureConfig объект
```

### Низкий приоритет (опциональные улучшения)

```
□ [OPT-1] Добавить DEFAULT_RETICLE_SIZE в constants.ts
□ [OPT-2] Рассмотреть инкрементальное обновление статистики папок
□ [OPT-3] Разбить virtualized-gallery.tsx на отдельные файлы
□ [OPT-4] Создать overlayStyles constant для UI компонентов
```

---

## Позитивные аспекты проекта

1. ✅ **Типизация** - Отличное использование TypeScript без any и ts-ignore
2. ✅ **Lazy Loading** - Правильно реализован на уровне страниц
3. ✅ **Virtualization** - Использование react-window для галереи
4. ✅ **Constants** - Магические числа вынесены в constants.ts
5. ✅ **Error Handling** - Корректная обработка ошибок в async операциях
6. ✅ **AbortController** - Правильное использование для отмены операций
7. ✅ **Debounce/Throttle** - Реализовано где необходимо
8. ✅ **Cleanup** - useEffect hooks имеют корректные cleanup функции
9. ✅ **i18n** - Правильная структура локализации
10. ✅ **Memo** - Использование React.memo для оптимизации компонентов

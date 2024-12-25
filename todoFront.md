Collecting workspace information

В вашем проекте возникают несколько предупреждений. Вот их причины и возможные решения:

1. **Предупреждения ESLint**:
   В файле 

Homepage.js

 на первой строке определены, но не используются переменные 

useEffect

 и 

useRef

. Это вызывает предупреждения `no-unused-vars`.

   ```javascript
   import React, { useEffect, useRef } from 'react';
   ```

   Чтобы устранить эти предупреждения, удалите неиспользуемые переменные:

   ```javascript
   import React from 'react';
   ```

2. **DeprecationWarnings**:
   В вашем проекте используются устаревшие опции `onAfterSetupMiddleware` и `onBeforeSetupMiddleware` в Webpack Dev Server. Эти опции заменены на `setupMiddlewares`.

   Чтобы устранить эти предупреждения, обновите конфигурацию Webpack Dev Server, заменив устаревшие опции на `setupMiddlewares`.

3. **Предупреждение о зависимости**:
   Один из ваших зависимостей, `babel-preset-react-app`, использует пакет `@babel/plugin-proposal-private-property-in-object`, не объявляя его в своих зависимостях. Это может привести к сбоям в будущем.

   Чтобы устранить это предупреждение, добавьте `@babel/plugin-proposal-private-property-in-object` в ваши devDependencies:

   ```sh
   npm install --save-dev @babel/plugin-proposal-private-property-in-object
   ```

Эти шаги помогут устранить предупреждения, возникающие при запуске вашего проекта.
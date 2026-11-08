# Tokens JWT en localStorage

Los tokens de autenticación (access token y refresh token) se almacenan en `localStorage` del navegador, no en cookies httpOnly. El access token se incluye como header `Authorization: Bearer <token>` en cada request a la API.

Esto es una decisión consciente de trade-off. localStorage es más simple de implementar y funciona bien con el flujo SPA (no hay problemas de CORS con cookies cross-origin). El riesgo es vulnerabilidad a XSS: si un atacante ejecuta JavaScript en la página, puede robar los tokens.

La mitigación actual es que la app no renderiza HTML sin sanitize del usuario. Una alternativa más segura (cookies httpOnly con SameSite) habría requerido cambios en el backend para setear las cookies, y habría complicado el flujo de autenticación en la SPA.

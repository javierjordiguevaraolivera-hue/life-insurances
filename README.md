# Gastos Finales — Funnel Pay Per Call

Funnel de 4 pasos, HTML estático, reconstruido limpio (sin Convertri) para **Ecomfy Lead**.

```
── Gastos Finales (home /) ──
index.html      → QUIZ (P1 edad · P2 beneficiario)   →  optin.html
optin.html      → Opt-in (Nombre / Email / Teléfono) →  llamada.html
llamada.html    → Página de llamada (video + countdown + botón "Llama ahora")

── Seguro de Vida IUL (/life-insurance/) ──
life-insurance/index.html    → QUIZ 3 preguntas (edad · trabaja · salud)
                               califica → loader "Verificando" → llamada.html
                               NO califica → no-califica.html
life-insurance/llamada.html  → Página de llamada (BUYER distinto → su propio Ringba/número)
life-insurance/no-califica.html → destino de los descalificados
life-insurance/optin.html    → (existe pero NO enlazado en este flujo por ahora)

assets/
  styles.css    → estilos compartidos (quiz, opt-in, llamada)
  app.js        → quiz (con descalificación), validación, params + respuestas, countdown, video
vercel.json     → config de Vercel (caché de assets)
```

### Seguro de Vida — lógica de calificación
- Edad (rangos de Best Life): **25-34, 35-44 y 45-54 PASAN**; 55-65 y 65+ NO.
- Trabajando: **Sí PASA**; No NO.
- Salud: "¿Tiene alguna necesidad urgente de salud?" → **"No, estoy saludable" PASA**;
  "Sí, tengo necesidades de salud" NO (reformulado para que los enfermos se auto-identifiquen).
- Descalificado → `life-insurance/no-califica.html`. Para cambiar quién pasa, edita
  `data-dq="1"` en los botones de `life-insurance/index.html`.

## Flujo
1. El visitante entra en `index.html` (quiz): responde **edad** y **beneficiario**.
2. Va a `optin.html` conservando `?clickid=...&utm_*` **+ las respuestas** (`edad`, `beneficiario`).
3. Llena el opt-in → `llamada.html` (todos los parámetros siguen viajando).
4. Hace tap en **Llama ahora** (`tel:`) → entra la llamada.

> La atribución (params de URL + respuestas del quiz) se traspasa entre páginas por
> query string, con respaldo en `sessionStorage` por si un host borra el query en un redirect.
> Verificado end-to-end en el navegador.

## ⚠️ Qué falta rellenar antes de salir en vivo
Busca los comentarios marcados en el código:

| Dónde | Qué poner |
|---|---|
| `llamada.html` (bloque RINGBA) | El tag de **Ringba** de Ecomfy Lead (call tracking / número dinámico). |
| `llamada.html` botón `.btn-call` | El **número de teléfono real** (`href="tel:..."` + `data-default`). |
| `llamada.html` bloque `.video` | Tu **video/VSL** (MP4/HLS self-hosted o embed). |
| `index.html` + `optin.html` + `llamada.html` footer | Links reales de **Privacidad / Términos / Contacto**. |
| `index.html` / `optin.html` `<head>` | Meta Pixel / GTM si los usan (opcional). |
| `app.js` bloque "CAPTURA DE LEAD" | Webhook (n8n / Supabase / CRM) para guardar el lead (opcional). |

> Con Ringba activo, el número del botón se reemplaza solo (clase `.ringba-number`).

## Deploy por GitHub → Vercel (método elegido; lo hace Antony)
El video (`assets/video.mp4`, 5.3 MB) SÍ se incluye por este método.

**1) Subir a GitHub** (desde `C:\Dev\life-insurances`):
```bash
git init
git add .
git commit -m "Funnel life-insurances (gastos finales + seguro IUL)"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

**2) Conectar en Vercel:**
- vercel.com → **Add New… → Project → Import** el repo de GitHub.
- **Framework Preset: Other** (es HTML estático; no hay build). Root Directory: `/`.
- **Deploy**. El `vercel.json` aplica caché de assets y URLs con `.html`.

**3) Hacer público:** Project → **Settings → Deployment Protection** →
Vercel Authentication = **Disabled** (o "Only Preview Deployments").

**4) Dominio:** Project → **Settings → Domains**.

Rutas: `/` = gastos finales · `/life-insurance/` = Seguro IUL ·
`/privacy.html` · `/terms.html`.

## Prueba local
Config `life-insurances` en `.claude/launch.json` (npx serve, puerto 4610),
o: `npx serve C:/Dev/life-insurances` y abre la URL que imprima.

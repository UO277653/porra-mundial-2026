# ⚽ Porra Mundial 2026

Porra (de mentira, solo por el honor) del Mundial 2026 para jugar con compañeros.
Web estática en **GitHub Pages** + base de datos gratuita en **Supabase** + resultados
automáticos desde **football-data.org** vía GitHub Actions.

## Qué hace

- **Login súper simple**: nombre + PIN de 4-6 dígitos. Nadie puede apostar por otro
  (el PIN se guarda cifrado y todas las escrituras lo validan en el servidor).
- **Apuestas 1X2** en fase de grupos; en eliminatorias apuestas **quién pasa**.
- Las apuestas se **cierran al pitido inicial** y los picks de los demás solo se
  ven cuando el partido ya ha empezado (ni mirando la base de datos se pueden ver antes).
- **Partidos siempre al día**: un workflow de GitHub sincroniza resultados cada 30 min.
  Los cruces de eliminatorias aparecen solos según se van conociendo.
- **Grupos** con clasificación calculada en vivo y **cuadro de eliminatorias**.
- **Dos campeonatos** independientes con podio estilo Kahoot (Supabase Realtime: en
  cuanto acaba un partido, la clasificación se mueve sola en el navegador de todos):
  uno para la **fase de grupos** y otro para la **eliminatoria**, cada uno con su
  propio rey y su propio bocadillo del trono.
- **Puntuación**: 1 punto por acierto en grupos, 2 en eliminatorias
  (se cambia en `src/lib/config.js` → `POINTS`).

## Probar en local (modo demo)

```bash
npm install
npm run dev
```

Sin configurar nada, la app arranca en **modo demo** con datos de ejemplo
(partidos jugados, uno en directo, próximos y jugadores ficticios) para que
veas toda la interfaz. Los datos demo viven solo en tu navegador.

## Puesta en marcha real (≈20 minutos)

### 1. Supabase (base de datos gratis)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo
   (el plan Free sobra de largo).
2. En el menú lateral, abre **SQL Editor**, pega el contenido completo de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. En **Settings → API** copia dos cosas:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key**
   - y también la **service_role key** (esta es secreta, solo para GitHub Actions).

### 2. Token de resultados

1. Regístrate gratis en [football-data.org](https://www.football-data.org/client/register).
2. Te llega un **API token** por email. El tier gratuito incluye el Mundial.

### 3. GitHub

1. Crea un repositorio y sube este proyecto:
   ```bash
   git init
   git add .
   git commit -m "Porra Mundial 2026"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
2. En el repo → **Settings → Secrets and variables → Actions → New repository secret**,
   crea estos 5 secretos:

   | Secreto | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_URL` | la misma Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `FOOTBALL_DATA_TOKEN` | token de football-data.org |

3. En **Settings → Pages**, en *Source* elige **GitHub Actions**.
4. En la pestaña **Actions**:
   - Lanza a mano el workflow **«Sincronizar resultados»** (botón *Run workflow*)
     para cargar todos los partidos por primera vez.
   - Si el deploy no se lanzó solo con el push, lanza también **«Publicar en GitHub Pages»**.

¡Listo! La web queda en `https://TU_USUARIO.github.io/TU_REPO/`.
Pásale el enlace a tus compañeros: cada uno se crea su cuenta con nombre + PIN.

> A partir de ahí no hay que tocar nada: los resultados se sincronizan solos
> cada 30 minutos y los cruces de eliminatorias van apareciendo según avance el torneo.

## Probar la sincronización en local (opcional)

Copia `.env.example` a `.env`, rellena los valores y:

```bash
npm run sync
```

## Estructura

```
src/
  components/     Login, partidos, grupos, cuadro y clasificación
  lib/
    backend.js    capa de datos (Supabase o modo demo)
    scoring.js    puntos, resultados y tablas de grupo
    config.js     fases del torneo y reglas de puntuación
supabase/
  schema.sql      tablas, seguridad (RLS) y funciones — pegar en Supabase una vez
scripts/
  sync.mjs        descarga resultados de football-data.org → Supabase
.github/workflows/
  deploy.yml      publica la web en GitHub Pages con cada push
  sync.yml        sincroniza resultados cada 30 min
```

## Notas

- El cron de GitHub Actions a veces se retrasa unos minutos en horas punta; el
  marcador puede tardar un poco más de 30 min en refrescarse. Para las horas de
  partido puedes lanzar la sincronización a mano desde la pestaña Actions.
- Si en 2027 queréis repetir con otro torneo, basta con cambiar la competición
  (`WC`) en `scripts/sync.mjs` y vaciar las tablas `matches` y `bets`.

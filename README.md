# TalenTree

TalenTree es una plataforma de scouting deportivo para fútbol amateur.
Un **jugador** crea su perfil deportivo (posición, club, estatura, peso,
clubes anteriores, videos de highlights) y gana visibilidad. La app está
preparada desde el modelo de datos hasta los permisos para incorporar, en
próximas etapas, cuentas de **club** que puedan buscar jugadores y
contactarlos por chat.

Este MVP implementa **completamente el flujo del jugador**. El rol CLUB
existe a nivel de base de datos y autorización, pero todavía no tiene
interfaz.

## Tecnologías

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Backend:** Supabase (Authentication, Postgres, Row Level Security)
- **Fuentes:** Barlow Condensed (títulos) + Inter (texto), auto-hosteadas con `@fontsource`

## Estructura del proyecto

```
talentree/
├── src/
│   ├── app/
│   │   ├── login/              # Página + Server Action de login
│   │   ├── register/           # Página + Server Action de registro
│   │   ├── actions/auth.ts     # Server Action de logout
│   │   └── (app)/              # Grupo de rutas protegidas (requieren sesión)
│   │       ├── layout.tsx      # Shell con Navbar + Sidebar
│   │       ├── page.tsx        # Inicio (logo + frase, panel de noticias, grid de jugadores)
│   │       ├── news/           # Noticias y eventos (listado completo)
│   │       ├── profile/        # Mi Perfil (editable) + Server Actions
│   │       ├── player/[id]/    # Perfil público de un jugador (solo lectura)
│   │       ├── chat/           # Chat (estado vacío, preparado a futuro)
│   │       ├── help/           # Ayuda
│   │       └── settings/       # Configuración (tema claro/oscuro)
│   ├── components/             # Navbar, Sidebar, PlayerCard, VideoCard, etc.
│   ├── lib/
│   │   ├── supabase/           # Clientes de Supabase (browser, server, middleware)
│   │   ├── data/players.ts     # Funciones de lectura (server-only)
│   │   ├── types.ts            # Tipos compartidos
│   │   └── utils.ts            # Cálculo de edad, validación de URLs, etc.
│   └── proxy.ts                # Middleware: protege rutas privadas y refresca sesión
├── supabase/
│   ├── migrations/0001_init.sql  # Esquema completo + RLS
│   ├── migrations/0002_news_and_video_upload.sql  # Noticias + videos subidos como archivo
│   ├── migrations/0003_avatars.sql  # Bucket de fotos de perfil
│   ├── migrations/0004_club_features.sql  # Club: responsables, avisos, calificación, chat
│   ├── migrations/0005_security_hardening.sql  # Auditoría de seguridad: cierre de agujeros de RLS
│   └── seed.sql                  # 10 jugadores ficticios de demo
└── public/logo.png              # Logo oficial de TalenTree
```

## Cómo levantar el proyecto localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. Andá a **Project Settings → API** y copiá la **Project URL** y la **anon public key**.
3. Creá el archivo `.env.local` en la raíz del proyecto (podés copiar `.env.local.example`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

### 3. Ejecutar las migraciones

En el panel de Supabase, andá a **SQL Editor** y ejecutá, en este orden:

1. El contenido completo de `supabase/migrations/0001_init.sql` (crea las
   tablas, los tipos, los triggers y las políticas de Row Level Security).
2. El contenido de `supabase/migrations/0002_news_and_video_upload.sql` (tabla `news`,
   columnas nuevas de `highlight_videos` y el bucket de Storage `highlight-videos`).
3. El contenido de `supabase/migrations/0003_avatars.sql` (bucket `avatars` para las fotos de perfil).
4. El contenido de `supabase/migrations/0004_club_features.sql` (nacionalidad y calificación de jugadores,
   responsables y avisos del club, permisos del chat).
5. El contenido de `supabase/migrations/0005_security_hardening.sql` (cierra los
   agujeros de seguridad detallados abajo: nadie puede auto-asignarse el rol
   "club", los datos dejan de ser legibles sin sesión, etc.). **Importante:**
   si el proyecto ya está en producción con usuarios reales, antes de correr
   esta migración revisá en el SQL Editor si ya existe alguna fila en `clubs`
   o algún `profiles.role = 'club'` que no hayan creado ustedes — la migración
   no las borra ni las revierte automáticamente, solo cierra la puerta para
   que no se puedan crear más así de acá en adelante.
6. El contenido de `supabase/seed.sql` (carga los 10 jugadores demo para
   que el Home no se vea vacío).

### Seguridad

El archivo `supabase/migrations/0005_security_hardening.sql` documenta, con
comentarios en español, cada agujero encontrado en una auditoría de
seguridad y cómo se cerró: auto-registro como club, auto-cambio de rol,
auto-inserción en la tabla `clubs`, datos legibles sin sesión, URLs con
esquemas peligrosos (`javascript:`) y suplantación del remitente de un
mensaje de chat. Es imprescindible ejecutarla contra el proyecto real de
Supabase; el código de la app por sí solo no alcanza porque estas políticas
viven en la base de datos.

> Alternativa con la CLI de Supabase, si preferís no usar el SQL Editor:
> `supabase link --project-ref <tu-project-ref>` y después
> `supabase db push`.

### 4. Desactivar la confirmación por email (recomendado para probar el MVP)

En **Authentication → Providers → Email**, desactivá "Confirm email" para
poder registrarte e iniciar sesión al instante durante el desarrollo. Si la
dejás activada, después de registrarte vas a tener que confirmar tu cuenta
desde el mail que te llega antes de poder iniciar sesión (el flujo ya está
contemplado: `/register` te redirige a `/login` con un aviso).

### 5. Correr el proyecto

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir a
`/login`. Desde ahí podés crear una cuenta nueva.

### Otros comandos

```bash
npm run build   # build de producción
npm run start   # levanta el build de producción
npm run lint    # ESLint
```

## Cómo funciona la autenticación

Se usa el sistema de Authentication de Supabase (`@supabase/ssr`). Las
contraseñas nunca se manejan ni se guardan manualmente. Al registrarse, se
llama a `supabase.auth.signUp(...)` pasando `first_name`, `last_name`,
`birth_date` y `role: 'player'` como metadata del usuario. Un **trigger** en
la base de datos (`handle_new_user`, definido en la migración) crea
automáticamente:

- una fila en `profiles` con el rol correspondiente, y
- una fila en `players` con los datos personales cargados.

El middleware (`src/proxy.ts`) refresca la sesión en cada request y
redirige a `/login` a quien no esté autenticado e intente entrar a una ruta
privada (todas excepto `/login` y `/register`).

## Cómo funcionan los roles PLAYER y CLUB

El campo `role` (`player` | `club`) vive en `profiles` desde el día uno.
Row Level Security en `players`, `previous_clubs` y `highlight_videos` deja
la **lectura abierta a cualquiera** (así funciona el scouting) pero
**la escritura restringida al dueño** (`auth.uid() = user_id`, o al jugador
dueño del perfil al que pertenece el recurso). Las tablas `clubs`,
`conversations` y `messages` ya existen con sus propias políticas de RLS,
listas para cuando se construya la interfaz de CLUB.

## Funcionalidades implementadas (Etapa 1 — MVP jugador)

- Registro, login, logout y protección de rutas privadas
- Edad calculada automáticamente desde la fecha de nacimiento (nunca se
  guarda manualmente)
- Inicio con grid de jugadores (10 perfiles demo ficticios)
- Perfil público de jugador de solo lectura para cualquier otro usuario
- "Mi Perfil" editable: datos personales, datos deportivos, club actual
- Clubes anteriores: agregar y eliminar (múltiples por jugador)
- Highlights: agregar y eliminar videos por URL de YouTube o Vimeo, con
  embed sin autoplay; validación de URL
- Chat con estado vacío, preparado para la mensajería CLUB ↔ PLAYER
- Ayuda con contacto de soporte (`support@talentree.app`, fácilmente
  editable en `src/lib/constants.ts`)
- Configuración con modo claro/oscuro persistente
- Menú hamburguesa en mobile, sidebar fija en desktop
- Diseño responsive (mobile, tablet, desktop) en blanco/negro + verde
- Accesibilidad: labels, `aria-*`, estados de foco visibles, navegación por teclado

## Preparado para futuras etapas (no implementado todavía)

**Fase 2** — Registro y perfil institucional de CLUB, búsqueda y filtros de jugadores
**Fase 3** — Contacto CLUB → PLAYER, conversaciones y mensajería en tiempo real, notificaciones
**Fase 4** — Filtros avanzados, favoritos, comparación de jugadores, estadísticas, geolocalización

La base de datos, la autorización (RLS) y las rutas ya están pensadas para
que estas fases se puedan construir sin rehacer la arquitectura existente.

## Decisiones de arquitectura relevantes

- **Server Actions** (no API routes) para todas las mutaciones (login,
  registro, edición de perfil, clubes, highlights): menos código, y
  Supabase valida todo de nuevo vía RLS aunque haya un bug en la validación
  del cliente.
- **Videos por URL, no upload**: se valida que sean de YouTube o Vimeo y se
  convierten a `iframe` de embed. El modelo de datos (`highlight_videos`)
  no ata la app a este approach: cambiar a upload directo en el futuro no
  requiere tocar el resto del esquema.
- **`previous_clubs` es una tabla aparte** (no un array en `players`) para
  poder agregar fechas de inicio/fin sin complejizar la tabla principal.
- **Tema con `next-themes`**: la preferencia persiste en `localStorage`,
  sin necesidad de guardarla en la base de datos para este MVP.

## Nota sobre el logo

El logo que se usa en toda la app (`public/logo.png`) es el archivo
provisto, recortado únicamente para sacarle el margen sobrante del lienzo
original — no se modificó ningún píxel del diseño. Si en algún momento
conseguís una versión con fondo transparente, reemplazá ese archivo y
ajustá `src/components/Logo.tsx` (los comentarios del archivo explican
exactamente qué cambiar).

## Noticias y eventos

El panel del Inicio y la sección **Noticias y eventos** leen la tabla `news`.
Para publicar una noticia: Supabase → **Table Editor → news → Insert row**
(título, tipo, fecha, lugar, descripción). Si la tabla está vacía, el panel
muestra "Próximamente...". El Inicio muestra las primeras 4 (las próximas por
fecha); `/news` las muestra todas.

## Videos: link o archivo

En "Agregar video" el jugador elige entre pegar un link de YouTube/Vimeo o
subir un archivo (MP4, MOV o WebM). Los archivos van al bucket `highlight-videos`
de Supabase Storage, en una carpeta con el id del usuario. El límite es 50 MB
por archivo (tope del plan gratuito de Supabase); en un plan pago se puede subir
`MAX_VIDEO_FILE_MB` en `src/lib/constants.ts` y `file_size_limit` en la migración.

El panel del Inicio es un carrusel: una noticia por slide (máximo `HOME_NEWS_LIMIT` = 4),
con flechas laterales al pasar el cursor y puntos indicadores arriba a la derecha.

## Foto de perfil

En "Perfil", el jugador toca su círculo (con el ícono de cámara) para elegir una foto
JPG, PNG o WebP de hasta 5 MB. Se recorta en cuadrado (512 px) en el navegador y se
sube al bucket `avatars`; la URL queda en `players.avatar_url`. También puede quitarla.
Sin foto se muestran las iniciales. La foto se ve en el perfil y en las tarjetas del Inicio.

## Cuentas de club

Un club entra con el rol `club` y ve un menú distinto: **Buscar jugadores**, **Perfil** (datos del club,
avisos para TalenTree y responsables de la cuenta) y **Chat**.

- **Avisos:** el club envía un aviso (ej. una prueba) desde su Perfil. Queda `pendiente` en la tabla
  `club_announcements`. El equipo lo revisa y, si corresponde, crea la fila en `news` (Noticias y eventos)
  y cambia el estado del aviso a `publicado` (o `rechazado` + `team_note` con el motivo).
- **Responsables:** contactos del club (nombre, cargo, email), tantos como haga falta. Hoy son datos de
  contacto; no tienen un usuario propio para entrar a la app.
- **Buscar jugadores:** barra por nombre + filtros de posición, edad, calificación mínima, nacionalidad y club.
  Los filtros viajan en la URL (`/players?q=...&position=...`).
- **Calificación:** número de 0 a 10 que asigna el equipo (columna `players.rating`). Los usuarios de la app
  no pueden modificarla; se carga desde el Table Editor o el SQL Editor.
- **Chat:** el club toca "Contactar" en el perfil de un jugador y se abre una conversación (una por par
  club-jugador). Los mensajes llegan en tiempo real (Supabase Realtime).
- **Crear cuentas de club:** por ahora se crean a mano desde Supabase → Authentication, con
  `role: club` y `club_name` en los metadatos del usuario.

### Escudo del club

En "Perfil", el club toca su escudo (ícono de cámara) para subirlo: JPG, PNG o WebP de hasta 5 MB.
A diferencia de la foto de un jugador, no se recorta: se achica entero (máx. 512 px) y conserva la
transparencia si es PNG. Se guarda en el bucket `avatars` (carpeta del usuario) y la URL queda en
`clubs.logo_url`. Los jugadores lo ven en su lista de chats y en cada conversación.

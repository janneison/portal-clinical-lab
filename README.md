# Portal Clinical Lab

Plataforma web de visualización y gestión de resultados de laboratorio clínico para médicos, operadores y pacientes.

## Stack

- **Angular 17** — Standalone components, Signals, lazy loading
- **Tailwind CSS** — Diseño responsivo
- **TypeScript 5.4**
- **Devcontainer** — Entorno reproducible sin instalación local

---

## Inicio rápido

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) corriendo
- [VS Code](https://code.visualstudio.com/) + extensión [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Pasos

1. Abre el proyecto en VS Code
2. `Cmd+Shift+P` → **Dev Containers: Reopen in Container**
3. Espera que Docker construya la imagen (primera vez ~2-3 min)
4. En la terminal integrada:

```bash
npm start
```

5. Abre [http://localhost:4200](http://localhost:4200)

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `lab_op` | `lab_op123` | Operador Lab |
| `aliado_norte` | `aliado_norte123` | Operador Aliado (ALIADO-001) |
| `aliado_sur` | `aliado_sur123` | Operador Aliado (ALIADO-002) |
| `viewer` | `viewer123` | Visualizador |

> Configura la URL de la API en `src/environments/environment.ts`

---

## Configuración del proxy

El archivo `proxy.conf.json` redirige las llamadas al backend. Por defecto apunta a `host.docker.internal:8080` (backend corriendo en Docker en la misma máquina).

```json
{
  "/auth":           { "target": "http://host.docker.internal:8080" },
  "/orders":         { "target": "http://host.docker.internal:8080" },
  "/results":        { "target": "http://host.docker.internal:8080" },
  "/aliados":        { "target": "http://host.docker.internal:8080" },
  "/exam-types":     { "target": "http://host.docker.internal:8080" },
  "/health-centers": { "target": "http://host.docker.internal:8080" },
  "/patients":       { "target": "http://host.docker.internal:8080" }
}
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # authGuard / guestGuard
│   │   │   └── admin.guard.ts         # adminGuard / labAdminGuard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts    # JWT automático en cada request
│   │   ├── models/
│   │   │   ├── auth.model.ts          # User, UserRole, JWT
│   │   │   ├── order.model.ts         # LabOrder, OrderListItem, OrderFilters
│   │   │   ├── result.model.ts        # LabResult, ApiResultItem, valuesToRows
│   │   │   ├── patient.model.ts       # Patient, PatientDetail
│   │   │   ├── health-center.model.ts # HealthCenter
│   │   │   ├── exam-catalog.model.ts  # ExamType, ExamParameter, ParameterRange
│   │   │   ├── admin.model.ts         # AdminUser, Aliado, RoleDefinition
│   │   │   └── notification.model.ts  # NotificationConfig
│   │   └── services/
│   │       ├── auth.service.ts        # Login, logout, signals de rol
│   │       ├── orders.service.ts      # GET/POST órdenes, normalización
│   │       ├── results.service.ts     # Resultados, PDF, email
│   │       ├── patient.service.ts     # Listado y detalle de pacientes
│   │       ├── health-center.service.ts # Centros de salud
│   │       ├── exam-catalog.service.ts  # Catálogo, parámetros, rangos
│   │       ├── admin.service.ts       # Usuarios, aliados
│   │       └── notification.service.ts  # Toasts
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/                 # Pantalla de login
│   │   ├── dashboard/                 # Panel principal con stats
│   │   ├── orders/
│   │   │   ├── orders-list/           # Listado con filtros y paginación
│   │   │   └── order-detail/          # Detalle con exámenes y acciones
│   │   ├── results/
│   │   │   ├── results-list/          # Resultados por orden + PDF + email
│   │   │   └── result-detail/         # Detalle de un resultado + PDF + email
│   │   └── admin/
│   │       ├── users/                 # Gestión de usuarios
│   │       ├── labs/                  # Laboratorios aliados
│   │       ├── health-centers/        # Centros de salud + asociación aliados
│   │       ├── patients/              # Búsqueda de pacientes + historial
│   │       ├── roles/                 # Referencia de roles y permisos
│   │       ├── exam-catalog/          # Catálogo de tipos de examen
│   │       ├── exam-parameters/       # Parámetros + rangos por reactivo
│   │       └── orders-create/         # Formulario de nueva orden
│   ├── layout/
│   │   └── shell/                     # Sidebar + topbar
│   └── shared/
│       └── components/
│           ├── status-badge/          # Badge de estado de orden
│           ├── critical-alert/        # Alerta de resultado crítico
│           ├── loading-spinner/       # Spinner de carga
│           ├── empty-state/           # Estado vacío
│           └── toast-container/       # Notificaciones toast
└── environments/
    ├── environment.ts                 # Dev: apiUrl = ''
    └── environment.prod.ts            # Prod: apiUrl = URL real
```

---

## Funcionalidades

### Autenticación
- Login con JWT, logout, guard de rutas
- Interceptor automático agrega `Authorization: Bearer <token>` a cada request
- Sesión persistida en `localStorage`
- Redirección a login con mensaje si la sesión expira

### Órdenes de laboratorio
- Listado paginado con filtros por fecha, estado y código CUPS
- Detalle completo con datos del paciente y exámenes
- Envío al laboratorio aliado (`POST /orders/{id}/send`)
- Creación de nueva orden con exámenes dinámicos
- Normalización automática de campos `snake_case` / `camelCase` del backend

### Resultados
- Búsqueda por ID de solicitud
- Tabla de valores con parámetro, valor, unidad y referencia
- Detección automática de resultados críticos con alertas visuales
- **Ver PDF** — abre el informe en nueva pestaña del browser
- **Enviar por email** — modal con destinatario opcional y mensaje personalizado
- Descarga en `.txt` y compartir (Web Share API / clipboard)
- Notificación al paciente por email/SMS (configurable)

### Administración (solo `admin` / `lab_operator`)

| Pantalla | Ruta | Acceso |
|---|---|---|
| Usuarios | `/dashboard/admin/users` | admin |
| Laboratorios | `/dashboard/admin/labs` | admin |
| Centros de salud | `/dashboard/admin/health-centers` | admin |
| Pacientes | `/dashboard/admin/patients` | admin, lab_operator |
| Roles | `/dashboard/admin/roles` | admin |
| Catálogo de exámenes | `/dashboard/admin/exam-catalog` | admin, lab_operator |
| Parámetros de examen | `/dashboard/admin/exam-catalog/:cups/parameters` | admin, lab_operator |
| Nueva orden | `/dashboard/orders/create` | admin, lab_operator |

#### Centros de salud
- CRUD completo con activar/desactivar
- Asociación/desasociación de laboratorios aliados directamente desde la tabla

#### Pacientes
- Búsqueda por nombre o documento con paginación
- Panel lateral con historial completo de órdenes del paciente

#### Catálogo de exámenes
- Tipos de examen con código CUPS, nombre, descripción y estado
- Parámetros de referencia con tipo (numérico, texto, booleano), rangos, sexo y edad
- Rangos por reactivo (panel lateral) para parámetros numéricos
- Los parámetros configurados calculan flags automáticos al registrar resultados

---

## API

**Base URL:** `http://localhost:8080` (desarrollo)

### Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Autenticación |
| `GET` | `/auth/me` | Perfil del usuario |
| `POST` | `/auth/register` | Crear usuario (admin) |
| `GET` | `/orders` | Listar órdenes (filtros + paginación) |
| `POST` | `/orders` | Crear orden |
| `GET` | `/orders/{id}` | Detalle de orden |
| `POST` | `/orders/{id}/send` | Enviar al laboratorio |
| `GET` | `/orders/{id}/results` | Resultados estructurados con flags |
| `GET` | `/orders/{id}/results/pdf` | PDF del informe |
| `POST` | `/orders/{id}/results/send-email` | Enviar informe por email |
| `POST` | `/orders/{id}/results/attach-pdf` | Adjuntar PDF externo |
| `POST` | `/results` | Registrar resultado |
| `GET` | `/patients` | Listar pacientes |
| `GET` | `/patients/{id}` | Detalle + historial de paciente |
| `GET` | `/health-centers` | Listar centros de salud |
| `POST` | `/health-centers` | Crear centro de salud |
| `PUT` | `/health-centers/{id}` | Actualizar centro |
| `POST` | `/health-centers/{id}/aliados/{aliadoId}` | Asociar aliado |
| `DELETE` | `/health-centers/{id}/aliados/{aliadoId}` | Desasociar aliado |
| `GET` | `/exam-types` | Catálogo de exámenes |
| `POST` | `/exam-types` | Crear tipo de examen |
| `PUT` | `/exam-types/{cups}` | Actualizar tipo de examen |
| `GET` | `/exam-types/{cups}/parameters` | Parámetros de un examen |
| `POST` | `/exam-types/{cups}/parameters` | Crear parámetro |
| `PUT` | `/exam-types/{cups}/parameters/{id}` | Actualizar parámetro |
| `DELETE` | `/exam-types/{cups}/parameters/{id}` | Desactivar parámetro |
| `GET` | `/exam-types/{cups}/parameters/{id}/ranges` | Rangos por reactivo |
| `POST` | `/exam-types/{cups}/parameters/{id}/ranges` | Crear rango |
| `PUT` | `/exam-types/{cups}/parameters/{id}/ranges/{rangeId}` | Actualizar rango |
| `DELETE` | `/exam-types/{cups}/parameters/{id}/ranges/{rangeId}` | Desactivar rango |
| `GET` | `/aliados/{id}/orders/pending` | Órdenes pendientes de un aliado |
| `POST` | `/aliados/{id}/orders/mark-sent` | Marcar órdenes como enviadas (bulk) |

### Roles y permisos

| Rol | Descripción |
|---|---|
| `admin` | Acceso total |
| `lab_operator` | Crea/envía órdenes, registra resultados, ve catálogo y pacientes |
| `aliado_operator` | Ve órdenes de sus aliados, registra resultados |
| `viewer` | Solo lectura de órdenes de sus aliados |

### Configuración de email (backend)

Para habilitar `POST /orders/{id}/results/send-email`, agregar al `docker-compose.yml` del backend:

```yaml
environment:
  MAIL_HOST: smtp.gmail.com
  MAIL_PORT: 587
  MAIL_USERNAME: lab@clinica.com
  MAIL_PASSWORD: tu_app_password
  MAIL_FROM_NAME: "Laboratorio Clínico"
```

---

## Flujo completo

```
1.  Login                          → JWT
2.  Crear orden                    → estado: pending
3.  Ver órdenes pendientes         → GET /orders?estado=pending
4.  Enviar al laboratorio          → POST /orders/{id}/send → estado: sent
5.  Registrar resultado            → POST /results → estado: completed
6.  Ver resultados                 → GET /orders/{id}/results
7.  Ver PDF del informe            → GET /orders/{id}/results/pdf
8.  Enviar por email al paciente   → POST /orders/{id}/results/send-email
```

---

© 2025 Clinical Lab Portal

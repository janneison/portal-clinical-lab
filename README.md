# Portal Clinical Lab

Plataforma web de visualización de resultados de laboratorio clínico para médicos y pacientes.

## Stack

- **Angular 17** — Standalone components, Signals, lazy loading
- **Tailwind CSS** — Diseño responsivo
- **TypeScript 5.4**
- **Devcontainer** — Entorno reproducible sin instalación local

## Funcionalidades

- 🔐 Autenticación JWT con roles (`admin`, `lab_operator`, `aliado_operator`)
- 📋 Consulta de órdenes por ID con filtros (fecha, tipo de examen, estado)
- 🔬 Vista resumida y detallada de resultados por paciente
- 🚨 Detección automática de resultados críticos con alertas visuales
- ⬇️ Descarga y compartir resultados (Web Share API / clipboard)
- 🔔 Notificación al paciente por email/SMS (configurable)
- 📤 Envío de órdenes al laboratorio aliado externo

## Inicio rápido con Devcontainer

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) + extensión [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Pasos

1. Abre el proyecto en VS Code
2. Presiona `Cmd+Shift+P` → **Dev Containers: Reopen in Container**
3. Espera a que el contenedor se construya e instale dependencias (`npm install` corre automáticamente)
4. Inicia el servidor de desarrollo:

```bash
npm start
```

5. Abre [http://localhost:4200](http://localhost:4200)

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `operador1` | `pass1234` | Operador Lab |

> Configura la URL de la API en `src/environments/environment.ts`

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth guard
│   │   ├── interceptors/    # JWT interceptor
│   │   ├── models/          # Interfaces TypeScript
│   │   └── services/        # Auth, Orders, Results, Notifications
│   ├── features/
│   │   ├── auth/            # Login
│   │   ├── dashboard/       # Panel principal
│   │   ├── orders/          # Lista y detalle de órdenes
│   │   └── results/         # Lista y detalle de resultados
│   ├── layout/
│   │   └── shell/           # Sidebar + topbar
│   └── shared/
│       └── components/      # Badge, Alert, Spinner, Toast, etc.
└── environments/
```

## API

Ver [API.md](./API.md) para la documentación completa de endpoints.

**Base URL:** `http://localhost:8080` (desarrollo)

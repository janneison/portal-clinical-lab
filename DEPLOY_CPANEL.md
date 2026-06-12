# Manual de Instalación — Portal Clinical Lab en cPanel

> **Stack:** Angular 17 (SPA estática) + API REST independiente  
> **Resultado:** El frontend queda servido como archivos estáticos en cPanel. La API (backend) debe estar alojada en un servidor separado con acceso HTTPS.

---

## Requisitos previos

| Requisito | Detalle |
|---|---|
| Node.js ≥ 18 | Para compilar en tu máquina local |
| npm ≥ 9 | Incluido con Node |
| Cuenta cPanel | Con acceso al **Administrador de Archivos** o FTP |
| Dominio/subdominio configurado | Ej: `portal.clinica.com` |
| API desplegada y con HTTPS | Ej: `https://api.clinica.com` |

> La compilación se hace **en tu máquina local**, no en cPanel. cPanel solo sirve los archivos estáticos resultantes.

---

## Paso 1 — Configurar la URL de la API

Antes de compilar, actualiza el archivo de entorno de producción con la URL real de tu backend.

Abre `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.clinica.com',   // ← cambia esto
};
```

Reemplaza `https://api.clinica.com` por la URL base real de tu API.  
**No incluyas barra `/` al final.**

---

## Paso 2 — Compilar el proyecto

En tu terminal, desde la raíz del proyecto:

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Compilar para producción
npm run build:prod
```

Este comando ejecuta `ng build --configuration production` y genera la carpeta:

```
dist/
└── portal-clinical-lab/
    └── browser/          ← estos son los archivos que vas a subir
        ├── index.html
        ├── main-XXXXXXXX.js
        ├── styles-XXXXXXXX.css
        ├── assets/
        └── ...
```

> Los nombres de archivo incluyen un hash (ej: `main-ABC123.js`). Esto es normal y esperado — el hash cambia con cada compilación.

---

## Paso 3 — Crear el subdominio o carpeta en cPanel

### Opción A — Dominio raíz (`portal.clinica.com`)

1. En cPanel ve a **Dominios** → **Subdominios**
2. Crea el subdominio `portal` para `clinica.com`
3. Como **Document Root** asigna: `public_html/portal-clinical-lab`
4. Haz clic en **Crear**

### Opción B — Carpeta dentro de un dominio existente

1. En el **Administrador de Archivos** navega a `public_html`
2. Crea una carpeta nueva, por ejemplo `portal`
3. El sitio quedará en: `https://clinica.com/portal`

---

## Paso 4 — Subir los archivos

### Opción A — Administrador de Archivos de cPanel

1. Ve a **Administrador de Archivos**
2. Navega hasta la carpeta que creaste (`public_html/portal-clinical-lab` o `public_html/portal`)
3. Haz clic en **Subir** → arrastra **todo el contenido** de `dist/portal-clinical-lab/browser/`  
   *(sube los archivos que están dentro de `browser/`, no la carpeta `browser/` en sí)*
4. Espera que termine la subida

### Opción B — FTP/SFTP (recomendado para archivos grandes)

Usa FileZilla u otro cliente FTP con las credenciales de tu cuenta cPanel:

```
Host:     ftp.clinica.com  (o la IP del servidor)
Usuario:  tu_usuario_cpanel
Puerto:   21 (FTP) o 22 (SFTP)
```

Sube el contenido de `dist/portal-clinical-lab/browser/` a la carpeta destino.

---

## Paso 5 — Configurar el archivo `.htaccess`

Este paso es **crítico**. Angular es una SPA — todas las rutas deben apuntar a `index.html`, de lo contrario el usuario obtendrá un error 404 al refrescar la página o al acceder directamente a una URL como `/dashboard/orders`.

Crea un archivo `.htaccess` en la raíz de la carpeta donde subiste los archivos (al mismo nivel que `index.html`) con el siguiente contenido:

```apache
Options -MultiViews
RewriteEngine On
RewriteBase /

# Si el archivo existe, servírlo directamente (JS, CSS, imágenes, etc.)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Todo lo demás lo maneja Angular
RewriteRule ^ index.html [L]
```

> Si instalaste en una subcarpeta (ej: `/portal`), cambia `RewriteBase /` por `RewriteBase /portal/`.

### Cómo crear el archivo en cPanel

1. En el **Administrador de Archivos**, navega a la carpeta del portal
2. Haz clic en **+ Archivo**
3. Nombre del archivo: `.htaccess`
4. Pega el contenido de arriba
5. Guarda

---

## Paso 6 — Verificar el despliegue

1. Abre el dominio en el navegador: `https://portal.clinica.com`
2. Deberías ver la pantalla de login del portal
3. Prueba navegar a una ruta protegida y refrescar la página (F5) — debe cargar correctamente sin 404

### Checklist de verificación

- [ ] La página de login carga sin errores
- [ ] El login funciona (llama correctamente a la API)
- [ ] Refrescar en `/dashboard` no da 404
- [ ] Los assets (imágenes, íconos) cargan correctamente
- [ ] La consola del navegador no muestra errores de CORS

---

## Configuración CORS en el backend

Si el frontend está en un dominio diferente al de la API, el backend debe permitir las peticiones desde ese origen.

Ejemplo para Spring Boot:

```java
@CrossOrigin(origins = "https://portal.clinica.com")
```

O en la configuración global:

```java
registry.addMapping("/**")
    .allowedOrigins("https://portal.clinica.com")
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*")
    .allowCredentials(true);
```

---

## Actualizar el portal (nuevas versiones)

Cada vez que el código cambie:

1. En tu máquina local: `npm run build:prod`
2. Elimina los archivos anteriores en cPanel (excepto `.htaccess`)
3. Sube el nuevo contenido de `dist/portal-clinical-lab/browser/`

> Los nombres con hash cambian en cada compilación, por lo que los archivos viejos quedarían huérfanos si no los eliminas primero.

---

## Solución de problemas frecuentes

### Error 404 al refrescar la página

El archivo `.htaccess` no está aplicado o tiene un error. Verifica:
- Que el módulo `mod_rewrite` esté habilitado en el servidor (la mayoría de cPanel lo tiene)
- Que `RewriteBase` coincida con la ruta donde está instalado el portal

### La API no responde (error de red o CORS)

- Verifica que `environment.prod.ts` tenga la URL correcta antes de compilar
- Confirma que la API tiene HTTPS (los navegadores bloquean peticiones HTTP desde páginas HTTPS)
- Revisa la configuración CORS en el backend

### La página carga en blanco

Abre las DevTools del navegador (F12 → Consola). Los errores más comunes son:
- **`Cannot GET /`** → el `.htaccess` no existe o no funciona
- **Failed to load resource** → ruta de assets incorrecta, verifica que `RewriteBase` sea correcto
- **CORS error** → el backend no permite el origen del frontend

### Los estilos no cargan

Verifica que todos los archivos de `dist/portal-clinical-lab/browser/` se hayan subido, incluyendo los archivos `.css` con hash.

---

## Estructura de archivos en el servidor (resultado final)

```
public_html/
└── portal-clinical-lab/          ← document root del dominio
    ├── .htaccess                  ← configuración de rutas SPA
    ├── index.html
    ├── favicon.ico
    ├── main-XXXXXXXX.js
    ├── polyfills-XXXXXXXX.js
    ├── styles-XXXXXXXX.css
    └── assets/
        └── ...
```

---

*Generado para Portal Clinical Lab v1.0.0 — Angular 17*

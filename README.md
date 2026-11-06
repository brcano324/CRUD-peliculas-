# CineFlix - CRUD de Películas con LocalStorage

Proyecto basado en el diseño **CineFlix** entregado por el profesor (`index.html` + `styles.css`).
La lógica completa está implementada en `localstorage.js`.

## Funcionalidades

### Login y registro
- Inicio de sesión con usuarios guardados en `localStorage`.
- Registro de nuevos usuarios con validaciones:
  - Nombre de al menos 3 caracteres.
  - Correo electrónico válido.
  - Usuario de al menos 4 caracteres y sin espacios.
  - Contraseña de al menos 6 caracteres.
  - Confirmación de contraseña.
  - Usuario único.
- Cierre de sesión y restauración automática de la sesión al recargar.
- Botones de la barra superior que cambian según el estado de la sesión.

### CRUD de películas
- **Crear**: botón "Agregar Película" y formulario en modal.
- **Leer**: slider de películas recientes y grid de todas las películas.
- **Actualizar**: botón de edición en cada tarjeta.
- **Eliminar**: botón de eliminación con confirmación.
- Modal de detalles de cada película.
- Buscador en tiempo real por **título o director** (sin distinguir mayúsculas ni tildes).
- Filtro por **género**.
- Mensaje cuando no existen resultados.
- Imagen de respaldo si la URL del póster falla (la URL es opcional).
- Exportación a **PDF** del listado filtrado (bonus 5.0) con jsPDF + AutoTable.
- Cada vez que registras un usuario o guardas/editas/eliminas una película, el dato se guarda en `localStorage`
  y aparece en la **consola del navegador** (F12 → Console).

## Usuarios de prueba

| Usuario | Contraseña |
| --- | --- |
| `admin` | `admin123` |
| `usuario` | `1234` |
| `demo` | `demo` |

También puedes crear una cuenta nueva desde la pestaña **Registro**.

## Cómo ejecutar

1. Abre la carpeta `CRUD-Peliculas-CineFlix` en Visual Studio Code.
2. Abre `index.html` con **Live Server** (recomendado) o con doble clic.
3. Inicia sesión con uno de los usuarios de prueba.
4. Agrega, edita, busca, filtra o elimina películas.

## Estructura

```text
CRUD-Peliculas-CineFlix/
├── index.html        (diseño base del profesor, adaptado)
├── styles.css        (estilos del diseño CineFlix)
├── localstorage.js   (login, CRUD, buscador, filtro y PDF)
└── README.md
```

## Datos guardados

| Clave de localStorage | Contenido |
| --- | --- |
| `cineflix_peliculas` | Arreglo de películas |
| `cineflix_usuarios` | Usuarios registrados y usuarios de prueba |
| `cineflix_sesion` | Usuario con sesión activa |

La primera vez se cargan **8 películas de ejemplo** para que el slider y el grid se vean completos.
Si deseas iniciar con el listado vacío, elimina la clave `cineflix_peliculas` desde las herramientas de desarrollo del navegador (Application / Local Storage).

> Nota: las contraseñas se guardan en texto plano porque es un ejercicio académico de LocalStorage. En un proyecto real se deben almacenar de forma segura en un servidor.

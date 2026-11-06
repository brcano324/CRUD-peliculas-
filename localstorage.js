/* =========================================================
   CineFlix - CRUD de Películas + Login/Registro
   Todo se guarda en localStorage.
   Archivo: localstorage.js
   ========================================================= */

'use strict';

// -------------------------
// Claves de localStorage
// -------------------------
const CLAVE_PELICULAS = 'cineflix_peliculas';
const CLAVE_USUARIOS = 'cineflix_usuarios';
const CLAVE_SESION = 'cineflix_sesion';

const IMAGEN_FALLBACK = 'https://placehold.co/300x450/1f2937/ffffff?text=Sin+Imagen';

// Usuarios de prueba que aparecen en el diseño
const USUARIOS_DEMO = [
    { nombre: 'Administrador', email: 'admin@cineflix.com', usuario: 'admin', password: 'admin123' },
    { nombre: 'Usuario de Prueba', email: 'usuario@cineflix.com', usuario: 'usuario', password: '1234' },
    { nombre: 'Demo', email: 'demo@cineflix.com', usuario: 'demo', password: 'demo' }
];

// -------------------------
// Estado de la aplicación
// -------------------------
let peliculas = [];
let usuarios = [];
let usuarioActual = null;
let modoEdicion = false;
let idEdicion = null;

// -------------------------
// Inicio
// -------------------------
document.addEventListener('DOMContentLoaded', function () {
    cargarUsuarios();
    cargarPeliculas();
    configurarEventos();
    prepararNuevaPelicula();
    restaurarSesion();
    renderizarPeliculas();

    // Datos visibles en la consola del navegador (F12)
    console.log('%cCineFlix iniciado', 'color:#667eea;font-weight:bold;font-size:14px');
    console.log('Películas cargadas desde localStorage:', peliculas);
    console.log('Usuarios registrados en localStorage:', usuarios);
});

function configurarEventos() {
    // Login, registro y sesión
    document.getElementById('formLogin').addEventListener('submit', iniciarSesion);
    document.getElementById('formRegistro').addEventListener('submit', registrarUsuario);
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('btnLogin').addEventListener('click', irAlLogin);
    document.getElementById('linkLogin').addEventListener('click', irAlLogin);

    // Películas
    document.getElementById('btnAgregar').addEventListener('click', prepararNuevaPelicula);
    document.getElementById('btnGuardarPelicula').addEventListener('click', guardarPelicula);
    document.getElementById('formPelicula').addEventListener('submit', function (e) {
        e.preventDefault();
        guardarPelicula();
    });

    // Al cerrar el modal se limpia el formulario
    document.getElementById('modalPelicula').addEventListener('hidden.bs.modal', prepararNuevaPelicula);

    // Buscador, filtro y exportación
    document.getElementById('inputBuscar').addEventListener('input', renderizarPeliculas);
    document.getElementById('selectGenero').addEventListener('change', renderizarPeliculas);
    document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);
}

// -------------------------
// Utilidades de almacenamiento
// -------------------------
function leerJSON(clave, valorPorDefecto) {
    try {
        const valor = localStorage.getItem(clave);
        return valor === null ? valorPorDefecto : JSON.parse(valor);
    } catch (error) {
        console.error('No se pudo leer localStorage:', clave, error);
        return valorPorDefecto;
    }
}

function guardarPeliculas() {
    localStorage.setItem(CLAVE_PELICULAS, JSON.stringify(peliculas));
}

function guardarUsuarios() {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

function cargarUsuarios() {
    usuarios = leerJSON(CLAVE_USUARIOS, []);
    if (!Array.isArray(usuarios)) usuarios = [];

    // Aseguramos que los usuarios de prueba siempre existan
    let huboCambios = false;
    USUARIOS_DEMO.forEach(function (demo) {
        const existe = usuarios.some(function (u) {
            return normalizar(u.usuario) === normalizar(demo.usuario);
        });
        if (!existe) {
            usuarios.push({ ...demo });
            huboCambios = true;
        }
    });

    if (huboCambios || localStorage.getItem(CLAVE_USUARIOS) === null) {
        guardarUsuarios();
    }
}

function cargarPeliculas() {
    const guardadas = leerJSON(CLAVE_PELICULAS, null);

    if (guardadas === null) {
        // Primera vez: cargamos películas de ejemplo para que el diseño se vea completo
        peliculas = crearPeliculasDemo();
        guardarPeliculas();
    } else {
        peliculas = Array.isArray(guardadas) ? guardadas : [];
    }
}

// -------------------------
// Autenticación
// -------------------------
function iniciarSesion(e) {
    e.preventDefault();

    const usuarioIngresado = document.getElementById('inputUser').value.trim();
    const passwordIngresado = document.getElementById('inputPassword').value;

    if (!usuarioIngresado || !passwordIngresado) {
        mostrarMensaje('Ingresa tu usuario y contraseña.', 'warning');
        return;
    }

    const encontrado = usuarios.find(function (u) {
        return normalizar(u.usuario) === normalizar(usuarioIngresado) &&
            String(u.password) === passwordIngresado;
    });

    if (!encontrado) {
        mostrarMensaje('Usuario o contraseña incorrectos.', 'danger');
        document.getElementById('inputPassword').select();
        return;
    }

    usuarioActual = encontrado;
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: encontrado.usuario }));

    document.getElementById('formLogin').reset();
    mostrarAplicacion();
    mostrarMensaje('Bienvenido/a, ' + (encontrado.nombre || encontrado.usuario) + '.', 'success');

    console.log('Sesión iniciada como:', encontrado.usuario);
}

function registrarUsuario(e) {
    e.preventDefault();

    const nombre = document.getElementById('inputNombre').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const usuario = document.getElementById('inputUserReg').value.trim();
    const password = document.getElementById('inputPasswordReg').value;
    const confirmar = document.getElementById('inputConfirmPassword').value;

    if (nombre.length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres.', 'warning');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('Ingresa un correo electrónico válido.', 'warning');
        return;
    }

    if (usuario.length < 4) {
        mostrarMensaje('El usuario debe tener al menos 4 caracteres.', 'warning');
        return;
    }

    if (/\s/.test(usuario)) {
        mostrarMensaje('El usuario no puede contener espacios.', 'warning');
        return;
    }

    if (password.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', 'warning');
        return;
    }

    if (password !== confirmar) {
        mostrarMensaje('Las contraseñas no coinciden.', 'danger');
        return;
    }

    const yaExiste = usuarios.some(function (u) {
        return normalizar(u.usuario) === normalizar(usuario);
    });

    if (yaExiste) {
        mostrarMensaje('Ese nombre de usuario ya está registrado.', 'danger');
        return;
    }

    const nuevoUsuario = {
        nombre: nombre,
        email: email,
        usuario: usuario,
        password: password,
        creado: Date.now()
    };
    usuarios.push(nuevoUsuario);
    guardarUsuarios();

    // El usuario queda guardado en localStorage y visible en la consola (F12)
    console.log('Usuario registrado y guardado en localStorage:', nuevoUsuario);
    console.log('Usuarios en localStorage:', usuarios);

    document.getElementById('formRegistro').reset();
    mostrarMensaje('Cuenta creada correctamente. Ahora puedes iniciar sesión.', 'success');

    // Cambiar a la pestaña de login y dejar el usuario escrito
    const tabLogin = document.getElementById('login-tab');
    bootstrap.Tab.getOrCreateInstance(tabLogin).show();
    document.getElementById('inputUser').value = usuario;
    setTimeout(function () {
        document.getElementById('inputPassword').focus();
    }, 250);
}

function restaurarSesion() {
    const sesion = leerJSON(CLAVE_SESION, null);
    if (sesion && sesion.usuario) {
        const encontrado = usuarios.find(function (u) {
            return normalizar(u.usuario) === normalizar(sesion.usuario);
        });
        if (encontrado) {
            usuarioActual = encontrado;
            mostrarAplicacion();
            return;
        }
    }
    mostrarLogin();
}

function mostrarAplicacion() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('btnAgregar').style.display = 'inline-block';
    document.getElementById('btnLogout').style.display = 'inline-block';
    document.getElementById('btnLogin').style.display = 'none';
    renderizarPeliculas();
}

function mostrarLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('btnAgregar').style.display = 'none';
    document.getElementById('btnLogout').style.display = 'none';
    document.getElementById('btnLogin').style.display = 'inline-block';
}

function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    usuarioActual = null;

    document.getElementById('formLogin').reset();
    document.getElementById('inputBuscar').value = '';
    document.getElementById('selectGenero').value = '';
    prepararNuevaPelicula();
    mostrarLogin();
    mostrarMensaje('Sesión cerrada.', 'secondary');

    console.log('Sesión cerrada.');

    setTimeout(function () {
        document.getElementById('inputUser').focus();
    }, 250);
}

function irAlLogin(e) {
    if (e) e.preventDefault();
    mostrarLogin();
    document.getElementById('loginSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
        document.getElementById('inputUser').focus();
    }, 300);
}

// -------------------------
// CRUD de películas
// -------------------------
function prepararNuevaPelicula() {
    modoEdicion = false;
    idEdicion = null;

    document.getElementById('formPelicula').reset();
    document.getElementById('modalTitulo').textContent = 'Agregar Película';
    document.getElementById('btnGuardarPelicula').innerHTML = '<i class="bi bi-save"></i> Guardar';
}

function abrirModalPelicula() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPelicula')).show();
}

function guardarPelicula() {
    const form = document.getElementById('formPelicula');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const titulo = document.getElementById('inputTitulo').value.trim();
    const genero = document.getElementById('inputGenero').value;
    const director = document.getElementById('inputDirector').value.trim();
    const anio = Number(document.getElementById('inputAno').value);
    const calificacion = Number(document.getElementById('inputCalificacion').value);
    const descripcion = document.getElementById('inputDescripcion').value.trim() || 'Sin descripción.';
    const imagen = document.getElementById('inputImagen').value.trim();

    if (!titulo || !genero || !director) {
        mostrarMensaje('Completa los campos obligatorios (*).', 'warning');
        return;
    }

    if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
        mostrarMensaje('El año debe ser un número entre 1900 y 2100.', 'warning');
        return;
    }

    if (!Number.isFinite(calificacion) || calificacion < 1 || calificacion > 10) {
        mostrarMensaje('La calificación debe estar entre 1 y 10.', 'warning');
        return;
    }

    const pelicula = {
        id: modoEdicion ? idEdicion : generarIdPelicula(),
        titulo: titulo,
        genero: genero,
        director: director,
        anio: anio,
        calificacion: calificacion,
        descripcion: descripcion,
        imagen: imagen || IMAGEN_FALLBACK
    };

    if (modoEdicion) {
        const indice = peliculas.findIndex(function (p) {
            return String(p.id) === String(idEdicion);
        });

        if (indice !== -1) {
            peliculas[indice] = pelicula;
            mostrarMensaje('Película actualizada correctamente.', 'success');
        }
    } else {
        peliculas.push(pelicula);
        mostrarMensaje('Película agregada correctamente.', 'success');
    }

    guardarPeliculas();
    renderizarPeliculas();

    // La película queda guardada en localStorage y visible en la consola (F12)
    console.log(modoEdicion ? 'Película actualizada en localStorage:' : 'Película guardada en localStorage:', pelicula);
    console.log('Listado de películas en localStorage:', peliculas);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPelicula')).hide();
}

function editarPelicula(id) {
    const pelicula = buscarPelicula(id);
    if (!pelicula) return;

    modoEdicion = true;
    idEdicion = pelicula.id;

    document.getElementById('inputTitulo').value = pelicula.titulo;
    document.getElementById('inputGenero').value = pelicula.genero;
    document.getElementById('inputDirector').value = pelicula.director;
    document.getElementById('inputAno').value = pelicula.anio;
    document.getElementById('inputCalificacion').value = pelicula.calificacion;
    document.getElementById('inputDescripcion').value = pelicula.descripcion;
    document.getElementById('inputImagen').value = pelicula.imagen;

    document.getElementById('modalTitulo').textContent = 'Editar Película';
    document.getElementById('btnGuardarPelicula').innerHTML = '<i class="bi bi-check-circle"></i> Actualizar';

    abrirModalPelicula();
}

function eliminarPelicula(id) {
    const pelicula = buscarPelicula(id);
    if (!pelicula) return;

    if (!confirm('¿Eliminar la película "' + pelicula.titulo + '"?')) return;

    peliculas = peliculas.filter(function (p) {
        return String(p.id) !== String(id);
    });

    guardarPeliculas();
    renderizarPeliculas();
    mostrarMensaje('Película eliminada.', 'danger');

    console.log('Película eliminada:', pelicula);
    console.log('Listado de películas en localStorage:', peliculas);
}

function verDetalles(id) {
    const pelicula = buscarPelicula(id);
    if (!pelicula) return;

    const imagen = document.getElementById('detallesImagen');
    imagen.src = pelicula.imagen || IMAGEN_FALLBACK;
    imagen.alt = 'Póster de ' + pelicula.titulo;
    imagen.onerror = function () {
        this.onerror = null;
        this.src = IMAGEN_FALLBACK;
    };

    document.getElementById('detallesTitulo').textContent = pelicula.titulo;
    document.getElementById('detallesGenero').textContent = pelicula.genero;
    document.getElementById('detallesDirector').textContent = pelicula.director;
    document.getElementById('detallesAno').textContent = pelicula.anio;
    document.getElementById('detallesCalificacion').textContent = pelicula.calificacion + '/10';
    document.getElementById('detallesDescripcion').textContent = pelicula.descripcion || 'Sin descripción.';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalles')).show();
}

function buscarPelicula(id) {
    return peliculas.find(function (p) {
        return String(p.id) === String(id);
    });
}

function generarIdPelicula() {
    let id = Date.now();
    while (peliculas.some(function (p) { return String(p.id) === String(id); })) {
        id++;
    }
    return id;
}

// -------------------------
// Renderizado y filtros
// -------------------------
function obtenerPeliculasFiltradas() {
    const texto = normalizar(document.getElementById('inputBuscar').value.trim());
    const genero = document.getElementById('selectGenero').value;

    return peliculas.filter(function (p) {
        const coincideTexto = !texto ||
            normalizar(p.titulo).includes(texto) ||
            normalizar(p.director).includes(texto);
        const coincideGenero = !genero || p.genero === genero;
        return coincideTexto && coincideGenero;
    });
}

function renderizarPeliculas() {
    renderizarSlider();
    renderizarGrid(obtenerPeliculasFiltradas());
}

function renderizarSlider() {
    const contenedor = document.getElementById('carouselMovies');
    const recientes = peliculas.slice().sort(function (a, b) {
        return Number(b.id) - Number(a.id);
    }).slice(0, 10);

    if (recientes.length === 0) {
        contenedor.innerHTML = '<div class="text-muted p-4">Aún no hay películas. Usa el botón "Agregar Película".</div>';
        return;
    }

    contenedor.innerHTML = recientes.map(function (p) {
        const poster = p.imagen || IMAGEN_FALLBACK;
        return '' +
            '<div class="slider-movie-card" onclick="verDetalles(' + p.id + ')">' +
                '<img src="' + escapeHtml(poster) + '" alt="' + escapeHtml(p.titulo) + '" loading="lazy" ' +
                    'onerror="this.onerror=null;this.src=\'' + IMAGEN_FALLBACK + '\'">' +
                '<div class="slider-movie-info">' +
                    '<h6 title="' + escapeHtml(p.titulo) + '">' + escapeHtml(p.titulo) + '</h6>' +
                    '<div class="movie-meta">' + escapeHtml(p.genero) + ' • ' + escapeHtml(p.anio) + '</div>' +
                    '<div class="movie-rating"><i class="bi bi-star-fill"></i> ' + escapeHtml(p.calificacion) + '</div>' +
                '</div>' +
            '</div>';
    }).join('');
}

function renderizarGrid(lista) {
    const grid = document.getElementById('gridPeliculas');
    const sinResultados = document.getElementById('sinResultados');

    grid.innerHTML = '';

    if (peliculas.length === 0) {
        sinResultados.innerHTML = '<i class="bi bi-film"></i> Aún no hay películas registradas. Usa el botón <strong>Agregar Película</strong>.';
        sinResultados.style.display = 'block';
        return;
    }

    if (lista.length === 0) {
        sinResultados.innerHTML = '<i class="bi bi-search"></i> No se encontraron películas con los filtros aplicados.';
        sinResultados.style.display = 'block';
        return;
    }

    sinResultados.style.display = 'none';

    grid.innerHTML = lista.map(function (p) {
        const poster = p.imagen || IMAGEN_FALLBACK;
        return '' +
            '<div class="col-sm-6 col-lg-4 col-xl-3">' +
                '<div class="movie-card">' +
                    '<img src="' + escapeHtml(poster) + '" alt="' + escapeHtml(p.titulo) + '" class="movie-image" loading="lazy" ' +
                        'onerror="this.onerror=null;this.src=\'' + IMAGEN_FALLBACK + '\'">' +
                    '<div class="movie-content">' +
                        '<h5 class="movie-title">' + escapeHtml(p.titulo) + '</h5>' +
                        '<span class="movie-genre">' + escapeHtml(p.genero) + '</span>' +
                        '<p class="movie-meta"><i class="bi bi-person"></i> ' + escapeHtml(p.director) + '</p>' +
                        '<p class="movie-meta"><i class="bi bi-calendar"></i> ' + escapeHtml(p.anio) + '</p>' +
                        '<p class="movie-rating"><i class="bi bi-star-fill"></i> ' + escapeHtml(p.calificacion) + '</p>' +
                        '<p class="movie-description">' + escapeHtml(p.descripcion) + '</p>' +
                        '<div class="movie-actions">' +
                            '<button class="btn btn-info btn-sm" onclick="verDetalles(' + p.id + ')" title="Ver detalles" aria-label="Ver detalles">' +
                                '<i class="bi bi-eye"></i>' +
                            '</button>' +
                            '<button class="btn btn-warning btn-sm" onclick="editarPelicula(' + p.id + ')" title="Editar" aria-label="Editar">' +
                                '<i class="bi bi-pencil"></i>' +
                            '</button>' +
                            '<button class="btn btn-danger btn-sm" onclick="eliminarPelicula(' + p.id + ')" title="Eliminar" aria-label="Eliminar">' +
                                '<i class="bi bi-trash"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }).join('');
}

function scrollSlider(direccion) {
    const carrusel = document.getElementById('carouselMovies');
    const cantidad = Math.max(220, Math.floor(carrusel.clientWidth * 0.8));
    carrusel.scrollBy({ left: direccion * cantidad, behavior: 'smooth' });
}

// -------------------------
// Exportar el listado filtrado a PDF
// -------------------------
function exportarPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarMensaje('No se pudo cargar la librería de PDF. Revisa tu conexión.', 'danger');
        return;
    }

    const datos = obtenerPeliculasFiltradas();
    if (datos.length === 0) {
        mostrarMensaje('No hay películas para exportar con los filtros actuales.', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('CineFlix - Listado de Películas', 14, 20);
    doc.setFontSize(10);

    const busqueda = document.getElementById('inputBuscar').value.trim();
    const genero = document.getElementById('selectGenero').value;
    doc.text('Fecha: ' + new Date().toLocaleString('es-CO'), 14, 27);
    doc.text('Búsqueda: ' + (busqueda || 'Todas') + ' | Género: ' + (genero || 'Todos'), 14, 33);

    doc.autoTable({
        head: [['Título', 'Género', 'Director', 'Año', 'Calificación']],
        body: datos.map(function (p) {
            return [p.titulo, p.genero, p.director, p.anio, p.calificacion];
        }),
        startY: 38,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save('cineflix_peliculas.pdf');
    mostrarMensaje('PDF exportado correctamente.', 'success');
    console.log('PDF exportado con ' + datos.length + ' películas.');
}

// -------------------------
// Mensajes (toast de Bootstrap)
// -------------------------
function mostrarMensaje(mensaje, tipo) {
    tipo = tipo || 'success';

    let contenedor = document.getElementById('contenedorToast');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'contenedorToast';
        contenedor.className = 'toast-container position-fixed top-0 end-0 p-3';
        contenedor.style.zIndex = '1100';
        document.body.appendChild(contenedor);
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-' + tipo + ' border-0';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = '' +
        '<div class="d-flex">' +
            '<div class="toast-body"></div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>' +
        '</div>';

    toastEl.querySelector('.toast-body').textContent = mensaje;
    contenedor.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3200 });
    toastEl.addEventListener('hidden.bs.toast', function () {
        toastEl.remove();
    });
    toast.show();
}

// -------------------------
// Datos de ejemplo (solo la primera vez)
// -------------------------
function crearPeliculasDemo() {
    const ahora = Date.now();

    return [
        {
            id: ahora - 1000,
            titulo: 'Interestelar',
            genero: 'Ciencia Ficción',
            director: 'Christopher Nolan',
            anio: 2014,
            calificacion: 8.7,
            descripcion: 'Un grupo de exploradores usa un agujero de gusano para buscar un nuevo hogar para la humanidad.',
            imagen: 'https://placehold.co/300x450/0f172a/ffffff?text=Interestelar'
        },
        {
            id: ahora - 2000,
            titulo: 'El Caballero Oscuro',
            genero: 'Acción',
            director: 'Christopher Nolan',
            anio: 2008,
            calificacion: 9.0,
            descripcion: 'Batman se enfrenta al Joker, un criminal que siembra el caos en Gotham City.',
            imagen: 'https://placehold.co/300x450/111827/ffffff?text=El+Caballero+Oscuro'
        },
        {
            id: ahora - 3000,
            titulo: 'El Padrino',
            genero: 'Drama',
            director: 'Francis Ford Coppola',
            anio: 1972,
            calificacion: 9.2,
            descripcion: 'La historia de una poderosa familia de la mafia italiana en Nueva York.',
            imagen: 'https://placehold.co/300x450/1c1917/ffffff?text=El+Padrino'
        },
        {
            id: ahora - 4000,
            titulo: 'Dune',
            genero: 'Ciencia Ficción',
            director: 'Denis Villeneuve',
            anio: 2021,
            calificacion: 8.0,
            descripcion: 'Paul Atreides viaja a Arrakis, el planeta más peligroso del universo, para cumplir su destino.',
            imagen: 'https://placehold.co/300x450/b45309/ffffff?text=Dune'
        },
        {
            id: ahora - 5000,
            titulo: 'Gladiador',
            genero: 'Acción',
            director: 'Ridley Scott',
            anio: 2000,
            calificacion: 8.5,
            descripcion: 'Un general romano traicionado busca venganza como gladiador en el Coliseo.',
            imagen: 'https://placehold.co/300x450/78350f/ffffff?text=Gladiador'
        },
        {
            id: ahora - 6000,
            titulo: 'El Conjuro',
            genero: 'Terror',
            director: 'James Wan',
            anio: 2013,
            calificacion: 7.5,
            descripcion: 'Dos investigadores paranormales ayudan a una familia atormentada por una presencia oscura.',
            imagen: 'https://placehold.co/300x450/450a0a/ffffff?text=El+Conjuro'
        },
        {
            id: ahora - 7000,
            titulo: '¿Qué pasó ayer?',
            genero: 'Comedia',
            director: 'Todd Phillips',
            anio: 2009,
            calificacion: 7.7,
            descripcion: 'Tres amigos despiertan en Las Vegas sin recordar nada de una noche de despedida de soltero.',
            imagen: 'https://placehold.co/300x450/065f46/ffffff?text=Que+paso+ayer'
        },
        {
            id: ahora - 8000,
            titulo: 'Jurassic Park',
            genero: 'Aventura',
            director: 'Steven Spielberg',
            anio: 1993,
            calificacion: 8.2,
            descripcion: 'Un parque con dinosaurios clonados se convierte en una trampa mortal para sus visitantes.',
            imagen: 'https://placehold.co/300x450/14532d/ffffff?text=Jurassic+Park'
        }
    ];
}

// -------------------------
// Utilidades
// -------------------------
function normalizar(texto) {
    return String(texto == null ? '' : texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (caracter) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[caracter];
    });
}

// Funciones usadas desde atributos onclick del HTML generado
window.verDetalles = verDetalles;
window.editarPelicula = editarPelicula;
window.eliminarPelicula = eliminarPelicula;
window.scrollSlider = scrollSlider;

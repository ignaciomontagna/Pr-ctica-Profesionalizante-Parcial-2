document.addEventListener('DOMContentLoaded', async () => {
    const URL_CATALOGO = '/static/catalogo.json';
    const CLAVE_VENDIDOS = 'vendidos';
    const STOCK_BAJO = 3;

    const ETIQUETAS_CATEGORIA = {
        'monitor': 'Monitores',
        'placa-de-video': 'Placas de video',
        'gabinete': 'Gabinetes',
        'fuente': 'Fuentes de poder'
    };

    const catalogo = new Map();
    const carrito = new Map();
    let vendidos = leerVendidos();
    let temporizadorAviso;

    const inputBuscador = document.getElementById('input-buscador');
    const btnFiltros = document.getElementById('btn-filtros');
    const panelFiltros = document.getElementById('panel-filtros');
    const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
    const contadorFiltros = document.getElementById('contador-filtros');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroMarca = document.getElementById('filtro-marca');
    const filtroPrecioMin = document.getElementById('filtro-precio-min');
    const filtroPrecioMax = document.getElementById('filtro-precio-max');
    const filtroStock = document.getElementById('filtro-stock');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    const resultadoFiltros = document.getElementById('resultado-filtros');

    const btnCarrito = document.getElementById('btn-carrito');
    const modalCarrito = document.getElementById('modal-carrito');
    const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
    const btnVaciar = document.getElementById('btn-vaciar');
    const btnComprar = document.getElementById('btn-comprar');
    const listaCarrito = document.getElementById('lista-carrito');
    const contadorCarrito = document.getElementById('contador-carrito');
    const totalPrecioElem = document.getElementById('total-precio');
    const avisoCarrito = document.getElementById('aviso-carrito');

    function leerVendidos() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_VENDIDOS)) || {};
        } catch {
            return {};
        }
    }

    function guardarVendidos() {
        try {
            localStorage.setItem(CLAVE_VENDIDOS, JSON.stringify(vendidos));
        } catch {}
    }

    function stockDisponible(id) {
        const producto = catalogo.get(id);
        if (!producto) return 0;
        return Math.max(0, producto.stock - (vendidos[id] || 0));
    }

    function enCarrito(id) {
        return carrito.get(id) || 0;
    }

    function restanteDe(id) {
        return stockDisponible(id) - enCarrito(id);
    }

    function formatearPrecio(numero) {
        return '$' + numero.toLocaleString('es-AR');
    }

    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function etiquetaCategoria(categoria) {
        return ETIQUETAS_CATEGORIA[categoria] || categoria;
    }

    function mostrarAviso(mensaje) {
        if (!avisoCarrito) return;
        avisoCarrito.textContent = mensaje;
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => {
            avisoCarrito.textContent = '';
        }, 3500);
    }

    function crearTarjeta(producto) {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'producto';
        tarjeta.dataset.id = producto.id;

        const contenedorImagen = document.createElement('div');
        contenedorImagen.className = 'producto-imagen';
        const imagen = document.createElement('img');

        // Manejo flexible de rutas para que sirva con o sin '/static/' previo en el JSON
        const rutaImagen = producto.imagen.startsWith('/static/') 
            ? producto.imagen 
            : `/static/${producto.imagen}`;

        imagen.src = rutaImagen;
        imagen.alt = producto.nombre;
        contenedorImagen.appendChild(imagen);

        const info = document.createElement('div');
        info.className = 'producto-info';

        const titulo = document.createElement('h3');
        titulo.textContent = producto.nombre;

        const precio = document.createElement('p');
        precio.className = 'precio';
        precio.textContent = formatearPrecio(producto.precio);

        const stock = document.createElement('p');
        stock.className = 'stock';

        const boton = document.createElement('button');
        boton.className = 'btn-agregar';
        boton.addEventListener('click', () => agregarAlCarrito(producto.id));

        info.append(titulo, precio, stock, boton);
        tarjeta.append(contenedorImagen, info);
        return tarjeta;
    }

    function renderizarCatalogo() {
        catalogo.forEach(producto => {
            producto.secciones.forEach(idSeccion => {
                const contenedor = document.querySelector(`#${idSeccion} .contenedor-productos`);
                if (contenedor) contenedor.appendChild(crearTarjeta(producto));
            });
        });
    }

    function actualizarTarjetas() {
        document.querySelectorAll('.producto').forEach(tarjeta => {
            const id = tarjeta.dataset.id;
            const disponible = stockDisponible(id);
            const restante = restanteDe(id);
            const stockElem = tarjeta.querySelector('.stock');
            const boton = tarjeta.querySelector('.btn-agregar');

            stockElem.textContent = disponible === 0 ? 'Sin stock' : `Stock: ${restante}`;
            stockElem.classList.toggle('sin-stock', disponible === 0);
            stockElem.classList.toggle('poco-stock', restante > 0 && restante <= STOCK_BAJO);

            boton.disabled = restante <= 0;
            if (disponible === 0) {
                boton.textContent = 'Sin stock';
            } else if (restante <= 0) {
                boton.textContent = 'Máximo en carrito';
            } else {
                boton.textContent = 'Agregar al carrito';
            }
        });
    }

    function llenarSelect(select, valores, textoTodas, etiqueta) {
        if (!select) return;
        const seleccionado = select.value;
        select.innerHTML = '';

        const opcionTodas = document.createElement('option');
        opcionTodas.value = '';
        opcionTodas.textContent = textoTodas;
        select.appendChild(opcionTodas);

        valores.forEach(valor => {
            const opcion = document.createElement('option');
            opcion.value = valor;
            opcion.textContent = etiqueta(valor);
            select.appendChild(opcion);
        });

        select.value = valores.includes(seleccionado) ? seleccionado : '';
    }

    function actualizarOpcionesMarca() {
        if (!filtroCategoria) return;
        const categoria = filtroCategoria.value;
        const marcas = [...new Set(
            Array.from(catalogo.values())
                .filter(producto => !categoria || producto.categoria === categoria)
                .map(producto => producto.marca)
        )].sort((a, b) => a.localeCompare(b));

        llenarSelect(filtroMarca, marcas, 'Todas las marcas', marca => marca);
    }

    function cargarOpcionesFiltros() {
        if (!filtroCategoria) return;
        const categorias = [...new Set(Array.from(catalogo.values()).map(producto => producto.categoria))];
        llenarSelect(filtroCategoria, categorias, 'Todas las categorías', etiquetaCategoria);
        actualizarOpcionesMarca();
    }

    function aplicarFiltros() {
        if (!inputBuscador) return;
        const texto = normalizar(inputBuscador.value);
        const categoria = filtroCategoria.value;
        const marca = filtroMarca.value;
        const soloStock = filtroStock.checked;

        let minimo = parseFloat(filtroPrecioMin.value);
        let maximo = parseFloat(filtroPrecioMax.value);
        if (Number.isNaN(minimo)) minimo = 0;
        if (Number.isNaN(maximo)) maximo = Infinity;
        if (minimo > maximo) [minimo, maximo] = [maximo, minimo];

        const filtrosActivos = [
            categoria !== '',
            marca !== '',
            filtroPrecioMin.value !== '',
            filtroPrecioMax.value !== '',
            soloStock
        ].filter(Boolean).length;
        contadorFiltros.textContent = filtrosActivos;
        contadorFiltros.hidden = filtrosActivos === 0;

        const visibles = new Set();

        document.querySelectorAll('.producto').forEach(tarjeta => {
            const producto = catalogo.get(tarjeta.dataset.id);
            const coincide =
                normalizar(producto.nombre).includes(texto) &&
                (!categoria || producto.categoria === categoria) &&
                (!marca || producto.marca === marca) &&
                producto.precio >= minimo &&
                producto.precio <= maximo &&
                (!soloStock || stockDisponible(producto.id) > 0);

            tarjeta.style.display = coincide ? '' : 'none';
            if (coincide) visibles.add(producto.id);
        });

        document.querySelectorAll('main section[id^="productos"]').forEach(seccion => {
            const hayVisibles = Array.from(seccion.querySelectorAll('.producto'))
                .some(tarjeta => tarjeta.style.display !== 'none');
            seccion.style.display = hayVisibles ? '' : 'none';
        });

        if (!resultadoFiltros || catalogo.size === 0) return;

        if (visibles.size === 0) {
            resultadoFiltros.textContent = 'No se encontraron productos con esos filtros.';
        } else if (visibles.size === 1) {
            resultadoFiltros.textContent = '1 producto encontrado.';
        } else {
            resultadoFiltros.textContent = `${visibles.size} productos encontrados.`;
        }
    }

    function limpiarFiltros() {
        if (!inputBuscador) return;
        inputBuscador.value = '';
        filtroCategoria.value = '';
        filtroMarca.value = '';
        actualizarOpcionesMarca();
        filtroPrecioMin.value = '';
        filtroPrecioMax.value = '';
        filtroStock.checked = false;
        aplicarFiltros();
    }

    function agregarAlCarrito(id) {
        if (restanteDe(id) <= 0) {
            mostrarAviso('No hay más stock de este producto.');
            return;
        }
        carrito.set(id, enCarrito(id) + 1);
        actualizarUI();
    }

    function actualizarCarritoUI() {
        if (!listaCarrito) return;
        listaCarrito.innerHTML = '';
        let total = 0;
        let cantidadTotal = 0;

        carrito.forEach((cantidad, id) => {
            const producto = catalogo.get(id);
            const subtotal = producto.precio * cantidad;
            total += subtotal;
            cantidadTotal += cantidad;

            const li = document.createElement('li');
            li.className = 'item-carrito';

            const nombre = document.createElement('span');
            nombre.textContent = `${producto.nombre} (x${cantidad})`;

            const precio = document.createElement('span');
            precio.textContent = formatearPrecio(subtotal);

            const eliminar = document.createElement('button');
            eliminar.className = 'btn-eliminar-item';
            eliminar.dataset.id = id;
            eliminar.textContent = '❌';

            li.append(nombre, precio, eliminar);
            listaCarrito.appendChild(li);
        });

        contadorCarrito.textContent = cantidadTotal;
        totalPrecioElem.textContent = formatearPrecio(total);
    }

    function actualizarUI() {
        actualizarCarritoUI();
        actualizarTarjetas();
        aplicarFiltros();
    }

    function finalizarCompra() {
        if (carrito.size === 0) {
            mostrarAviso('El carrito está vacío.');
            return;
        }

        vendidos = leerVendidos();

        let huboAjuste = false;
        carrito.forEach((cantidad, id) => {
            const disponible = stockDisponible(id);
            if (cantidad > disponible) {
                huboAjuste = true;
                if (disponible === 0) {
                    carrito.delete(id);
                } else {
                    carrito.set(id, disponible);
                }
            }
        });

        if (huboAjuste) {
            actualizarUI();
            mostrarAviso('El stock cambió: ajustamos tu carrito a lo disponible.');
            return;
        }

        carrito.forEach((cantidad, id) => {
            vendidos[id] = (vendidos[id] || 0) + cantidad;
        });
        guardarVendidos();
        carrito.clear();
        actualizarUI();
        mostrarAviso('¡Compra realizada! El stock se actualizó.');
    }

    function mostrarErrorCatalogo() {
        document.querySelectorAll('.contenedor-productos').forEach(contenedor => {
            const mensaje = document.createElement('p');
            mensaje.className = 'error-catalogo';
            mensaje.textContent = 'No se pudo cargar el catálogo.';
            contenedor.appendChild(mensaje);
        });
    }

    if (inputBuscador) {
        inputBuscador.addEventListener('input', aplicarFiltros);
        panelFiltros.addEventListener('input', aplicarFiltros);
        filtroCategoria.addEventListener('change', () => {
            actualizarOpcionesMarca();
            aplicarFiltros();
        });
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
        btnFiltros.addEventListener('click', () => {
            panelFiltros.classList.toggle('oculto');
            modalCarrito.classList.add('oculto');
        });
        btnCerrarFiltros.addEventListener('click', () => {
            panelFiltros.classList.add('oculto');
        });
    }

    if (listaCarrito) {
        listaCarrito.addEventListener('click', (e) => {
            const boton = e.target.closest('.btn-eliminar-item');
            if (!boton) return;
            carrito.delete(boton.dataset.id);
            actualizarUI();
        });
        btnVaciar.addEventListener('click', () => {
            carrito.clear();
            actualizarUI();
        });
        btnComprar.addEventListener('click', finalizarCompra);
        btnCarrito.addEventListener('click', () => {
            modalCarrito.classList.toggle('oculto');
            panelFiltros.classList.add('oculto');
        });
        btnCerrarCarrito.addEventListener('click', () => {
            modalCarrito.classList.add('oculto');
        });
    }

    try {
        const respuesta = await fetch(URL_CATALOGO);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        const datos = await respuesta.json();
        datos.productos.forEach(producto => catalogo.set(producto.id, producto));
        renderizarCatalogo();
        cargarOpcionesFiltros();
        actualizarUI();
    } catch (error) {
        mostrarErrorCatalogo();
    }
});
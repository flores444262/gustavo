document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    //  1. ESTADO GLOBAL DE LA APLICACIÓN
    // ===================================================================================
    let estado = {
        lotes: {},
        plagas: [],
        loteActivo: null,
        valvulaActivaId: null,
        fechaUltimaLimpieza: null
    };

    // ===================================================================================
    //  2. SELECTORES DE ELEMENTOS DEL DOM
    // ===================================================================================
    const vistas = document.querySelectorAll('.view');
    const bienvenida = {
        vista: document.getElementById('vista-bienvenida'),
        listaLotes: document.getElementById('lista-seleccion-lotes'),
        btnCrear: document.getElementById('btn-crear-nuevo-lote'),
        btnResultados: document.getElementById('btn-ver-resultados'),
        btnGestionPlagas: document.getElementById('btn-ir-a-gestion-plagas'),
        btnConfigCalculo: document.getElementById('btn-ir-a-config-calculo'),
    };
    const evaluacion = {
        vista: document.getElementById('vista-evaluacion'),
        titulo: document.getElementById('evaluacion-titulo-lote'),
        btnVolver: document.getElementById('btn-volver-inicio'),
        navValvulas: document.getElementById('nav-valvulas'),
        btnAgregarValvula: document.getElementById('btn-agregar-valvula'),
        puntosInput: document.getElementById('puntos-evaluados'),
        racimosContenedor: document.getElementById('contenedor-racimos'),
        conteosContenedor: document.getElementById('contenedor-conteos'),
    };
    const gestionPlagas = {
        vista: document.getElementById('vista-gestion-plagas'),
        inputNueva: document.getElementById('input-nueva-plaga-gestion'),
        btnAgregar: document.getElementById('btn-agregar-plaga-gestion'),
        lista: document.getElementById('lista-plagas-gestion'),
        btnVolver: document.getElementById('btn-volver-inicio-desde-plagas'),
    };
    const resultados = {
        vista: document.getElementById('vista-resultados'),
        listaLotes: document.getElementById('lista-seleccion-lotes-resultados'),
        contenido: document.getElementById('contenido-resultados'),
        tituloLote: document.getElementById('titulo-resultados-lote'),
        btnExportar: document.getElementById('btn-exportar-excel'),
        tablaGeneral: document.getElementById('tabla-promedio-general'),
        tablasValvulas: document.getElementById('tablas-por-valvula'),
        btnVolver: document.getElementById('btn-volver-inicio-desde-resultados'),
    };
    const configCalculo = {
        vista: document.getElementById('vista-config-calculo'),
        contenedorFormulas: document.getElementById('contenedor-formulas'),
        btnGuardar: document.getElementById('btn-guardar-formulas'),
        btnVolver: document.getElementById('btn-volver-inicio-desde-config'),
    };

    // ===================================================================================
    //  3. PERSISTENCIA DE DATOS (localStorage)
    // ===================================================================================
    const guardarEstado = () => localStorage.setItem('estadoAppAgricola', JSON.stringify(estado));
    const cargarEstado = () => {
        const estadoGuardado = localStorage.getItem('estadoAppAgricola');
        if (estadoGuardado) {
            estado = JSON.parse(estadoGuardado);
        }
    };

    // ===================================================================================
    //  4. LÓGICA DE NAVEGACIÓN ENTRE VISTAS
    // ===================================================================================
    const mostrarVista = (idVista) => {
        vistas.forEach(vista => vista.classList.add('hidden'));
        document.getElementById(idVista).classList.remove('hidden');
    };

    // ===================================================================================
    //  5. FUNCIONES DE RENDERIZADO (DIBUJAR LA INTERFAZ)
    // ===================================================================================
    
    // *** FUNCIÓN CORREGIDA: Usa document.createElement para crear los botones ***
    const renderBienvenida = () => {
        // Limpiamos el contenedor
        bienvenida.listaLotes.innerHTML = '<h3>Selecciona un Lote:</h3>';
        
        const nombresLotes = Object.keys(estado.lotes);
        if (nombresLotes.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No hay lotes creados.';
            bienvenida.listaLotes.appendChild(p);
        } else {
            nombresLotes.forEach(nombreLote => {
                const button = document.createElement('button');
                button.className = 'btn lote-select-btn';
                button.dataset.lote = nombreLote;
                button.textContent = nombreLote;
                bienvenida.listaLotes.appendChild(button);
            });
        }
    };

    const renderEvaluacion = () => {
        if (!estado.loteActivo || !estado.lotes[estado.loteActivo]) return;
        
        const lote = estado.lotes[estado.loteActivo];
        evaluacion.titulo.textContent = `Evaluando: ${estado.loteActivo}`;

        evaluacion.navValvulas.innerHTML = '';
        lote.valvulas.forEach(valvula => {
            const tab = document.createElement('div');
            tab.className = 'tab-item';
            tab.dataset.id = valvula.id;
            
            const nombreSpan = document.createElement('span');
            nombreSpan.textContent = valvula.nombre;
            nombreSpan.className = 'valvula-nombre';
            
            const editBtn = document.createElement('span');
            editBtn.textContent = ' ✏️';
            editBtn.className = 'edit-valvula-btn';
            editBtn.title = 'Editar nombre';

            tab.appendChild(nombreSpan);
            tab.appendChild(editBtn);

            if (valvula.id == estado.valvulaActivaId) tab.classList.add('active');
            evaluacion.navValvulas.appendChild(tab);
        });

        renderContenidoValvula();
    };
    
    const renderContenidoValvula = () => {
        const valvula = estado.lotes[estado.loteActivo]?.valvulas.find(v => v.id == estado.valvulaActivaId);
        if (!valvula) {
            evaluacion.puntosInput.value = 1;
            evaluacion.racimosContenedor.innerHTML = '';
            evaluacion.conteosContenedor.innerHTML = '';
            return;
        };

        evaluacion.puntosInput.value = valvula.puntosEvaluados;

        evaluacion.racimosContenedor.innerHTML = '';
        for (let i = 0; i < valvula.puntosEvaluados; i++) {
            evaluacion.racimosContenedor.innerHTML += `
                <label>Racimos Punto ${i + 1}:</label>
                <input type="number" class="racimo-input" data-punto="${i}" value="${valvula.racimos[i] || ''}">
            `;
        }
        
        evaluacion.conteosContenedor.innerHTML = '';
        estado.plagas.forEach(plaga => {
            const conteo = valvula.conteos[plaga.nombre] || [];
            evaluacion.conteosContenedor.innerHTML += `
                <div>
                    <h4>${plaga.nombre}</h4>
                    <input type="number" class="conteo-input" data-plaga="${plaga.nombre}" placeholder="Agregar conteo...">
                    <p>Registrados: ${conteo.join(', ')} | <strong>Total: ${conteo.reduce((a, b) => a + b, 0)}</strong></p>
                </div>
            `;
        });
    };
    
    const renderGestionPlagas = () => {
        gestionPlagas.lista.innerHTML = '';
        estado.plagas.forEach(plaga => {
            gestionPlagas.lista.innerHTML += `
                <li>
                    <span>${plaga.nombre}</span>
                    <button class="delete-btn" data-plaga="${plaga.nombre}">Eliminar</button>
                </li>
            `;
        });
    };
    
    const renderConfigCalculo = () => {
        configCalculo.contenedorFormulas.innerHTML = '<h3>Fórmulas por Plaga</h3>';
        estado.plagas.forEach(plaga => {
            configCalculo.contenedorFormulas.innerHTML += `
                <div>
                    <label for="formula-${plaga.nombre}">${plaga.nombre}:</label>
                    <input type="text" id="formula-${plaga.nombre}" class="formula-input" data-plaga="${plaga.nombre}" value="${plaga.formula}">
                    <small>Variables: I (Individuos), P (Puntos), R (Suma de Racimos)</small>
                </div>
            `;
        });
    };

    // *** FUNCIÓN CORREGIDA: También usa document.createElement para los botones ***
    const renderResultados = () => {
        resultados.listaLotes.innerHTML = '<h3>Selecciona un Lote:</h3>';
        const lotesModificadosHoy = Object.keys(estado.lotes).filter(nombreLote => {
             const lote = estado.lotes[nombreLote];
             return lote.ultimaModificacion && new Date(lote.ultimaModificacion).toDateString() === new Date().toDateString();
        });

        if (lotesModificadosHoy.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Ningún lote ha sido modificado hoy.';
            resultados.listaLotes.appendChild(p);
        } else {
            lotesModificadosHoy.forEach(nombreLote => {
                 const button = document.createElement('button');
                 button.className = 'btn lote-select-resultados-btn';
                 button.dataset.lote = nombreLote;
                 button.textContent = nombreLote;
                 resultados.listaLotes.appendChild(button);
            });
        }
        resultados.contenido.classList.add('hidden');
    };
    
    const renderTablaResultados = (nombreLote) => {
        const lote = estado.lotes[nombreLote];
        if (!lote) return;

        resultados.tituloLote.textContent = `Resultados para: ${nombreLote}`;
        
        let totalPuntos = 0;
        let totalRacimos = 0;
        const totalIndividuos = {}; 

        lote.valvulas.forEach(valvula => {
            totalPuntos += valvula.puntosEvaluados;
            totalRacimos += valvula.racimos.reduce((a, b) => a + b, 0);
            for (const pNombre in valvula.conteos) {
                const sumaConteo = valvula.conteos[pNombre].reduce((a, b) => a + b, 0);
                totalIndividuos[pNombre] = (totalIndividuos[pNombre] || 0) + sumaConteo;
            }
        });
        
        let tablaGeneralHTML = `<thead><tr><th>Plaga</th><th>Total Individuos</th><th>Promedio General</th></tr></thead><tbody>`;
        estado.plagas.forEach(plaga => {
            const I = totalIndividuos[plaga.nombre] || 0;
            const P = totalPuntos;
            const R = totalRacimos;
            let promedio = 0;
            try {
                 promedio = new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R);
            } catch (e) { console.error('Error en formula:', e); }

            tablaGeneralHTML += `<tr><td>${plaga.nombre}</td><td>${I}</td><td>${promedio.toFixed(4)}</td></tr>`;
        });
        resultados.tablaGeneral.innerHTML = tablaGeneralHTML + '</tbody>';

        let tablasValvulasHTML = '';
        lote.valvulas.forEach(valvula => {
            tablasValvulasHTML += `<h4>${valvula.nombre}</h4><table><thead><tr><th>Plaga</th><th>Total Individuos</th><th>Promedio</th></tr></thead><tbody>`;
            estado.plagas.forEach(plaga => {
                const I = (valvula.conteos[plaga.nombre] || []).reduce((a,b) => a+b, 0);
                const P = valvula.puntosEvaluados;
                const R = valvula.racimos.reduce((a, b) => a+b, 0);
                let promedio = 0;
                try {
                    promedio = new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R);
                } catch (e) { console.error('Error en formula:', e); }

                tablasValvulasHTML += `<tr><td>${plaga.nombre}</td><td>${I}</td><td>${promedio.toFixed(4)}</td></tr>`;
            });
            tablasValvulasHTML += `</tbody></table>`;
        });
        resultados.tablasValvulas.innerHTML = tablasValvulasHTML;
        resultados.contenido.classList.remove('hidden');
    };

    // ===================================================================================
    //  6. LÓGICA DE LA APLICACIÓN Y MANEJADORES DE EVENTOS
    // ===================================================================================

    // --- Navegación ---
    bienvenida.btnGestionPlagas.addEventListener('click', () => { renderGestionPlagas(); mostrarVista('vista-gestion-plagas'); });
    bienvenida.btnConfigCalculo.addEventListener('click', () => { renderConfigCalculo(); mostrarVista('vista-config-calculo'); });
    bienvenida.btnResultados.addEventListener('click', () => { renderResultados(); mostrarVista('vista-resultados'); });
    evaluacion.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));
    gestionPlagas.btnVolver.addEventListener('click', () => { guardarEstado(); mostrarVista('vista-bienvenida'); });
    configCalculo.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));
    resultados.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));

    // --- Lógica de Bienvenida ---
    bienvenida.btnCrear.addEventListener('click', () => {
        const nombreLote = prompt('Ingrese el nombre del nuevo lote:');
        if (nombreLote && !estado.lotes[nombreLote]) {
            estado.lotes[nombreLote] = { valvulas: [], ultimaModificacion: null };
            renderBienvenida();
            guardarEstado();
        } else if (estado.lotes[nombreLote]) {
            alert('El lote ya existe.');
        }
    });

    bienvenida.listaLotes.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.lote-select-btn');
        if (targetButton) {
            estado.loteActivo = targetButton.dataset.lote;
            const lote = estado.lotes[estado.loteActivo];
            if (lote.valvulas.length === 0) {
                 const idUnico = Date.now();
                 lote.valvulas.push({ id: idUnico, nombre: "Válvula 1", puntosEvaluados: 7, racimos: [], conteos: {} });
                 estado.valvulaActivaId = idUnico;
            } else {
                estado.valvulaActivaId = lote.valvulas[0].id;
            }
            renderEvaluacion();
            mostrarVista('vista-evaluacion');
        }
    });

    // --- Lógica de Evaluación ---
    evaluacion.btnAgregarValvula.addEventListener('click', () => {
        const nombreValvula = prompt("Ingrese el nombre para la nueva válvula:", `Válvula ${estado.lotes[estado.loteActivo].valvulas.length + 1}`);
        if (!nombreValvula) return;

        const idUnico = Date.now();
        estado.lotes[estado.loteActivo].valvulas.push({ id: idUnico, nombre: nombreValvula, puntosEvaluados: 7, racimos: [], conteos: {} });
        estado.valvulaActivaId = idUnico;
        renderEvaluacion();
        guardarEstado();
    });

    evaluacion.navValvulas.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (!tab) return;

        if (e.target.matches('.edit-valvula-btn')) {
            const valvulaId = tab.dataset.id;
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == valvulaId);
            const nuevoNombre = prompt(`Editar nombre de "${valvula.nombre}":`, valvula.nombre);
            if (nuevoNombre) {
                valvula.nombre = nuevoNombre;
                renderEvaluacion();
                guardarEstado();
            }
        } else {
            estado.valvulaActivaId = tab.dataset.id;
            renderEvaluacion();
        }
    });
    
    evaluacion.puntosInput.addEventListener('change', (e) => {
        const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
        if(!valvula) return;
        valvula.puntosEvaluados = parseInt(e.target.value) || 1;
        estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
        renderContenidoValvula();
        guardarEstado();
    });

    evaluacion.racimosContenedor.addEventListener('change', (e) => {
        if (e.target.matches('.racimo-input')) {
            const punto = parseInt(e.target.dataset.punto);
            const valor = parseInt(e.target.value) || 0;
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
            if(!valvula) return;
            valvula.racimos[punto] = valor;
            estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
            guardarEstado();
        }
    });

    evaluacion.conteosContenedor.addEventListener('change', (e) => {
        if (e.target.matches('.conteo-input') && e.target.value) {
            const plaga = e.target.dataset.plaga;
            const valor = parseInt(e.target.value);
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
            if(!valvula) return;
            if (!valvula.conteos[plaga]) valvula.conteos[plaga] = [];
            valvula.conteos[plaga].push(valor);
            estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
            renderContenidoValvula();
            guardarEstado();
        }
    });

    // --- Lógica de Gestión de Plagas ---
    gestionPlagas.btnAgregar.addEventListener('click', () => {
        const nombrePlaga = gestionPlagas.inputNueva.value.trim();
        if (nombrePlaga && !estado.plagas.some(p => p.nombre === nombrePlaga)) {
            estado.plagas.push({ nombre: nombrePlaga, formula: "I / (P * 4)" });
            renderGestionPlagas();
            gestionPlagas.inputNueva.value = '';
        }
    });

    gestionPlagas.lista.addEventListener('click', (e) => {
        if (e.target.matches('.delete-btn')) {
            const nombrePlaga = e.target.dataset.plaga;
            estado.plagas = estado.plagas.filter(p => p.nombre !== nombrePlaga);
            renderGestionPlagas();
        }
    });

    // --- Lógica de Configuración de Cálculos ---
    configCalculo.btnGuardar.addEventListener('click', () => {
        document.querySelectorAll('.formula-input').forEach(input => {
            const nombrePlaga = input.dataset.plaga;
            const plaga = estado.plagas.find(p => p.nombre === nombrePlaga);
            if (plaga) plaga.formula = input.value;
        });
        guardarEstado();
        alert('Fórmulas guardadas.');
        mostrarVista('vista-bienvenida');
    });
    
    // --- Lógica de Resultados ---
    resultados.listaLotes.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.lote-select-resultados-btn');
        if (targetButton) {
            renderTablaResultados(targetButton.dataset.lote);
        }
    });

    resultados.btnExportar.addEventListener('click', () => {
        const nombreLote = resultados.tituloLote.textContent.replace('Resultados para: ', '');
        if (!nombreLote) return;
        
        let csvRows = [];
        const escapeCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;

        csvRows.push([`Resultados para Lote: ${nombreLote}`]);
        csvRows.push([]); 

        csvRows.push(["Promedio General del Lote"]);
        const generalTable = resultados.tablaGeneral.querySelectorAll('tr');
        generalTable.forEach(row => {
            const rowData = Array.from(row.querySelectorAll('th, td')).map(cell => escapeCell(cell.innerText));
            csvRows.push(rowData);
        });
        
        const valvulasData = resultados.tablasValvulas.children;
        Array.from(valvulasData).forEach(element => {
            csvRows.push([]); 
            if (element.tagName === 'H4') {
                csvRows.push([escapeCell(element.innerText)]);
            } else if (element.tagName === 'TABLE') {
                element.querySelectorAll('tr').forEach(row => {
                    const rowData = Array.from(row.querySelectorAll('th, td')).map(cell => escapeCell(cell.innerText));
                    csvRows.push(rowData);
                });
            }
        });

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `resultados_${nombreLote}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // ===================================================================================
    //  7. INICIALIZACIÓN DE LA APLICACIÓN
    // ===================================================================================
    const inicializarApp = () => {
        cargarEstado();
        
        const hoy = new Date().toDateString();
        if (estado.fechaUltimaLimpieza !== hoy) {
            for (const nombreLote in estado.lotes) {
                estado.lotes[nombreLote].valvulas.forEach(valvula => {
                    valvula.conteos = {};
                    valvula.racimos = [];
                });
            }
            estado.fechaUltimaLimpieza = hoy;
            guardarEstado();
            console.log('Limpieza diaria de conteos y racimos realizada.');
        }

        renderBienvenida();
        mostrarVista('vista-bienvenida');
    };

    inicializarApp();
});
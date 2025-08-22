document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    //  1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
    // ===================================================================================
    const firebaseConfig = {
        apiKey: "TU_API_KEY",
        authDomain: "TU_AUTH_DOMAIN",
        projectId: "TU_PROJECT_ID",
        storageBucket: "TU_STORAGE_BUCKET",
        messagingSenderId: "TU_MESSAGING_SENDER_ID",
        appId: "TU_APP_ID"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    let unsubscribe;

    // ===================================================================================
    //  2. ESTADO GLOBAL DE LA APLICACIÓN
    // ===================================================================================
    let estado = {}; 
    let usuarioActivo = null;
    let vistaActiva = 'vista-login'; // Rastreador de la vista actual

    // ===================================================================================
    //  3. SELECTORES DEL DOM
    // ===================================================================================
    const vistas = document.querySelectorAll('.view');
    const login = {
        vista: document.getElementById('vista-login'),
        formLogin: document.getElementById('login-form'),
        inputEmailLogin: document.getElementById('login-email'),
        inputPasswordLogin: document.getElementById('login-password'),
        btnLogin: document.getElementById('btn-login'),
        linkRegistro: document.getElementById('link-a-registro'),
        formRegistro: document.getElementById('registro-form'),
        inputEmailRegistro: document.getElementById('registro-email'),
        inputPasswordRegistro: document.getElementById('registro-password'),
        btnRegistro: document.getElementById('btn-registro'),
        linkLogin: document.getElementById('link-a-login'),
    };
    const bienvenida = {
        vista: document.getElementById('vista-bienvenida'),
        titulo: document.getElementById('titulo-bienvenida'),
        btnLogout: document.getElementById('btn-logout'),
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
        btnExportarPC: document.getElementById('btn-exportar-pc'),
        btnExportarMovil: document.getElementById('btn-exportar-movil'),
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
    //  4. PERSISTENCIA DE DATOS (FIREBASE)
    // ===================================================================================
    const guardarEstadoEnFirebase = () => {
        if (usuarioActivo) {
            db.collection('usuarios').doc(usuarioActivo.uid).set(estado, { merge: true })
                .catch(error => console.error("Error al guardar datos:", error));
        }
    };

    // ===================================================================================
    //  5. LÓGICA DE NAVEGACIÓN
    // ===================================================================================
    const mostrarVista = (idVista) => {
        vistaActiva = idVista;
        vistas.forEach(vista => vista.classList.add('hidden'));
        document.getElementById(idVista).classList.remove('hidden');
    };

    // ===================================================================================
    //  6. FUNCIONES DE RENDERIZADO
    // ===================================================================================
    const renderBienvenida = () => {
        bienvenida.listaLotes.innerHTML = '<h3>Selecciona un Lote:</h3>';
        const nombresLotes = (estado && estado.lotes) ? Object.keys(estado.lotes) : [];
        if (nombresLotes.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No hay lotes creados.';
            bienvenida.listaLotes.appendChild(p);
        } else {
            nombresLotes.forEach(nombreLote => {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'lote-button-container';
                const button = document.createElement('button');
                button.className = 'btn lote-select-btn';
                button.dataset.lote = nombreLote;
                button.textContent = nombreLote;
                const editBtn = document.createElement('span');
                editBtn.className = 'edit-lote-btn';
                editBtn.dataset.lote = nombreLote;
                editBtn.textContent = '✏️';
                editBtn.title = 'Editar nombre del lote';
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-lote-btn';
                deleteBtn.dataset.lote = nombreLote;
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = 'Eliminar lote';
                buttonContainer.appendChild(button);
                buttonContainer.appendChild(editBtn);
                buttonContainer.appendChild(deleteBtn);
                bienvenida.listaLotes.appendChild(buttonContainer);
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
            const editBtn = document.createElement('span');
            editBtn.textContent = ' ✏️';
            editBtn.className = 'edit-valvula-btn';
            editBtn.title = 'Editar nombre';
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-valvula-btn';
            deleteBtn.title = 'Eliminar válvula';
            tab.appendChild(nombreSpan);
            tab.appendChild(editBtn);
            tab.appendChild(deleteBtn);
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
            evaluacion.racimosContenedor.innerHTML += `<label>Racimos Punto ${i + 1}:</label><input type="number" class="racimo-input" data-punto="${i}" value="${valvula.racimos[i] || ''}">`;
        }
        evaluacion.conteosContenedor.innerHTML = '';
        (estado.plagas || []).forEach(plaga => {
            const conteos = valvula.conteos[plaga.nombre] || [];
            let conteosHtml = '<div class="conteos-registrados">';
            conteos.forEach((numero, index) => {
                conteosHtml += `<span class="conteo-tag">${numero}<button class="delete-conteo-btn" data-plaga="${plaga.nombre}" data-index="${index}">❌</button></span>`;
            });
            conteosHtml += '</div>';
            evaluacion.conteosContenedor.innerHTML += `<div><h4>${plaga.nombre}</h4><input type="number" class="conteo-input" data-plaga="${plaga.nombre}" placeholder="Agregar conteo..."><p><strong>Total: ${conteos.reduce((a, b) => a + b, 0)}</strong></p><p>Registrados:</p>${conteosHtml}</div>`;
        });
    };
    const renderGestionPlagas = () => {
        gestionPlagas.lista.innerHTML = '';
        (estado.plagas || []).forEach(plaga => {
            gestionPlagas.lista.innerHTML += `<li><span>${plaga.nombre}</span><button class="delete-btn" data-plaga="${plaga.nombre}">Eliminar</button></li>`;
        });
    };
    const renderConfigCalculo = () => {
        configCalculo.contenedorFormulas.innerHTML = '<h3>Fórmulas por Plaga</h3>';
        (estado.plagas || []).forEach(plaga => {
            configCalculo.contenedorFormulas.innerHTML += `<div><label for="formula-${plaga.nombre}">${plaga.nombre}:</label><input type="text" id="formula-${plaga.nombre}" class="formula-input" data-plaga="${plaga.nombre}" value="${plaga.formula}"><small>Variables: I (Individuos), P (Puntos), R (Suma de Racimos)</small></div>`;
        });
    };
    const renderResultados = () => {
        resultados.listaLotes.innerHTML = '<h3>Selecciona un Lote:</h3>';
        const lotesModificadosHoy = Object.keys(estado.lotes || {}).filter(nombreLote => {
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
        (estado.plagas || []).forEach(plaga => {
            const I = totalIndividuos[plaga.nombre] || 0;
            const P = totalPuntos;
            const R = totalRacimos;
            let promedio = 0;
            try { promedio = new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R); } catch (e) { console.error('Error en formula:', e); }
            tablaGeneralHTML += `<tr><td>${plaga.nombre}</td><td>${I}</td><td>${promedio.toFixed(4)}</td></tr>`;
        });
        resultados.tablaGeneral.innerHTML = tablaGeneralHTML + '</tbody>';
        let tablasValvulasHTML = '';
        lote.valvulas.forEach(valvula => {
            tablasValvulasHTML += `<h4>${valvula.nombre}</h4><table><thead><tr><th>Plaga</th><th>Total Individuos</th><th>Promedio</th></tr></thead><tbody>`;
            (estado.plagas || []).forEach(plaga => {
                const I = (valvula.conteos[plaga.nombre] || []).reduce((a, b) => a + b, 0);
                const P = valvula.puntosEvaluados;
                const R = valvula.racimos.reduce((a, b) => a + b, 0);
                let promedio = 0;
                try { promedio = new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R); } catch (e) { console.error('Error en formula:', e); }
                tablasValvulasHTML += `<tr><td>${plaga.nombre}</td><td>${I}</td><td>${promedio.toFixed(4)}</td></tr>`;
            });
            tablasValvulasHTML += `</tbody></table>`;
        });
        resultados.tablasValvulas.innerHTML = tablasValvulasHTML;
        resultados.contenido.classList.remove('hidden');
    };

    // ===================================================================================
    //  7. LÓGICA DE LA APLICACIÓN Y MANEJADORES DE EVENTOS
    // ===================================================================================

    // --- Lógica de Autenticación ---
    login.linkRegistro.addEventListener('click', (e) => { e.preventDefault(); login.formLogin.classList.add('hidden'); login.formRegistro.classList.remove('hidden'); });
    login.linkLogin.addEventListener('click', (e) => { e.preventDefault(); login.formRegistro.classList.add('hidden'); login.formLogin.classList.remove('hidden'); });
    login.btnRegistro.addEventListener('click', () => {
        const email = login.inputEmailRegistro.value;
        const password = login.inputPasswordRegistro.value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
                login.linkLogin.click();
            })
            .catch(error => alert(`Error al registrar: ${error.message}`));
    });
    login.btnLogin.addEventListener('click', () => {
        const email = login.inputEmailLogin.value;
        const password = login.inputPasswordLogin.value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => alert(`Error al iniciar sesión: ${error.message}`));
    });
    bienvenida.btnLogout.addEventListener('click', () => auth.signOut());

    // --- Navegación ---
    bienvenida.btnGestionPlagas.addEventListener('click', () => mostrarVista('vista-gestion-plagas'));
    bienvenida.btnConfigCalculo.addEventListener('click', () => mostrarVista('vista-config-calculo'));
    bienvenida.btnResultados.addEventListener('click', () => mostrarVista('vista-resultados'));
    evaluacion.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));
    gestionPlagas.btnVolver.addEventListener('click', () => { guardarEstadoEnFirebase(); mostrarVista('vista-bienvenida'); });
    configCalculo.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));
    resultados.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));

    // --- Lógica de Bienvenida ---
    bienvenida.btnCrear.addEventListener('click', () => {
        const nombreLote = prompt('Ingrese el nombre del nuevo lote:');
        if (nombreLote && !estado.lotes[nombreLote]) {
            estado.lotes[nombreLote] = { valvulas: [], ultimaModificacion: null };
            guardarEstadoEnFirebase();
        } else if (estado.lotes[nombreLote]) {
            alert('El lote ya existe.');
        }
    });
    bienvenida.listaLotes.addEventListener('click', (e) => {
        const selectBtn = e.target.closest('.lote-select-btn');
        const editBtn = e.target.closest('.edit-lote-btn');
        const deleteBtn = e.target.closest('.delete-lote-btn');
        if (selectBtn) {
            estado.loteActivo = selectBtn.dataset.lote;
            const lote = estado.lotes[estado.loteActivo];
            if (lote.valvulas.length === 0) {
                const idUnico = Date.now();
                lote.valvulas.push({ id: idUnico, nombre: "Válvula 1", puntosEvaluados: 7, racimos: [], conteos: {} });
                estado.valvulaActivaId = idUnico;
                guardarEstadoEnFirebase();
            } else {
                estado.valvulaActivaId = lote.valvulas[0].id;
            }
            mostrarVista('vista-evaluacion');
        } else if (editBtn) {
            const nombreAntiguo = editBtn.dataset.lote;
            const nuevoNombre = prompt(`Ingrese el nuevo nombre para el lote "${nombreAntiguo}":`, nombreAntiguo);
            if (nuevoNombre && nuevoNombre !== nombreAntiguo) {
                if (estado.lotes[nuevoNombre]) return alert('Error: Ya existe un lote con ese nombre.');
                estado.lotes[nuevoNombre] = estado.lotes[nombreAntiguo];
                delete estado.lotes[nombreAntiguo];
                if (estado.loteActivo === nombreAntiguo) estado.loteActivo = nuevoNombre;
                guardarEstadoEnFirebase();
            }
        } else if (deleteBtn) {
            const nombreLote = deleteBtn.dataset.lote;
            if (confirm(`¿Estás seguro de que quieres eliminar el lote "${nombreLote}"?`)) {
                delete estado.lotes[nombreLote];
                if (estado.loteActivo === nombreLote) estado.loteActivo = null;
                guardarEstadoEnFirebase();
            }
        }
    });

    // --- Lógica de Evaluación ---
    evaluacion.btnAgregarValvula.addEventListener('click', () => {
        const nombreValvula = prompt("Nombre para la nueva válvula:", `Válvula ${estado.lotes[estado.loteActivo].valvulas.length + 1}`);
        if (!nombreValvula) return;
        const idUnico = Date.now();
        estado.lotes[estado.loteActivo].valvulas.push({ id: idUnico, nombre: nombreValvula, puntosEvaluados: 7, racimos: [], conteos: {} });
        estado.valvulaActivaId = idUnico;
        guardarEstadoEnFirebase();
    });
    evaluacion.navValvulas.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (!tab) return;
        const valvulaId = tab.dataset.id;
        if (e.target.matches('.edit-valvula-btn')) {
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == valvulaId);
            const nuevoNombre = prompt(`Editar nombre de "${valvula.nombre}":`, valvula.nombre);
            if (nuevoNombre) {
                valvula.nombre = nuevoNombre;
                guardarEstadoEnFirebase();
            }
        } else if (e.target.matches('.delete-valvula-btn')) {
            if (confirm('¿Seguro que quieres eliminar esta válvula?')) {
                estado.lotes[estado.loteActivo].valvulas = estado.lotes[estado.loteActivo].valvulas.filter(v => v.id != valvulaId);
                if (estado.valvulaActivaId == valvulaId) {
                    estado.valvulaActivaId = estado.lotes[estado.loteActivo].valvulas[0]?.id || null;
                }
                guardarEstadoEnFirebase();
            }
        } else {
            estado.valvulaActivaId = valvulaId;
            renderEvaluacion();
        }
    });
    evaluacion.puntosInput.addEventListener('change', (e) => {
        const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
        if(!valvula) return;
        valvula.puntosEvaluados = parseInt(e.target.value) || 1;
        estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
        guardarEstadoEnFirebase();
    });
    evaluacion.racimosContenedor.addEventListener('change', (e) => {
        if (e.target.matches('.racimo-input')) {
            const punto = parseInt(e.target.dataset.punto);
            const valor = parseInt(e.target.value) || 0;
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
            if(!valvula) return;
            valvula.racimos[punto] = valor;
            estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
            guardarEstadoEnFirebase();
        }
    });
    evaluacion.conteosContenedor.addEventListener('click', (e) => {
        if (e.target.matches('.delete-conteo-btn')) {
            const plaga = e.target.dataset.plaga;
            const index = parseInt(e.target.dataset.index);
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
            if (valvula && valvula.conteos[plaga]) {
                valvula.conteos[plaga].splice(index, 1);
                estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
                guardarEstadoEnFirebase();
            }
        }
    });
    evaluacion.conteosContenedor.addEventListener('change', (e) => {
        if (e.target.matches('.conteo-input') && e.target.value) {
            const plaga = e.target.dataset.plaga;
            const valor = parseInt(e.target.value);
            const valvula = estado.lotes[estado.loteActivo].valvulas.find(v => v.id == estado.valvulaActivaId);
            if (!valvula) return;
            if (!valvula.conteos[plaga]) valvula.conteos[plaga] = [];
            valvula.conteos[plaga].push(valor);
            estado.lotes[estado.loteActivo].ultimaModificacion = new Date().toISOString();
            guardarEstadoEnFirebase();
        }
    });

    // --- Lógica de Gestión de Plagas ---
    gestionPlagas.btnAgregar.addEventListener('click', () => {
        const nombrePlaga = gestionPlagas.inputNueva.value.trim();
        if (nombrePlaga && !estado.plagas.some(p => p.nombre === nombrePlaga)) {
            estado.plagas.push({ nombre: nombrePlaga, formula: "I / (P * 4)" });
            guardarEstadoEnFirebase();
        }
    });
    gestionPlagas.lista.addEventListener('click', (e) => {
        if (e.target.matches('.delete-btn')) {
            const nombrePlaga = e.target.dataset.plaga;
            estado.plagas = estado.plagas.filter(p => p.nombre !== nombrePlaga);
            guardarEstadoEnFirebase();
        }
    });

    // --- Lógica de Configuración de Cálculos ---
    configCalculo.btnGuardar.addEventListener('click', () => {
        document.querySelectorAll('.formula-input').forEach(input => {
            const nombrePlaga = input.dataset.plaga;
            const plaga = estado.plagas.find(p => p.nombre === nombrePlaga);
            if (plaga) plaga.formula = input.value;
        });
        guardarEstadoEnFirebase();
        alert('Fórmulas guardadas.');
        mostrarVista('vista-bienvenida');
    });
    
    // --- Lógica de Resultados y Exportación ---
    resultados.listaLotes.addEventListener('click', (e) => { const targetButton = e.target.closest('.lote-select-resultados-btn'); if (targetButton) { renderTablaResultados(targetButton.dataset.lote); } });
    const exportarDatos = (separador) => {
        const nombreLote = resultados.tituloLote.textContent.replace('Resultados para: ', '');
        const lote = estado.lotes[nombreLote];
        if (!lote) return alert('No hay un lote seleccionado para exportar.');
        const getWeekNumber = (d) => { d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil((((d - yearStart) / 86400000) + 1) / 7); };
        const calcularPromedio = (plaga, valvula) => { const I = (valvula.conteos[plaga.nombre] || []).reduce((a, b) => a + b, 0); const P = valvula.puntosEvaluados; const R = valvula.racimos.reduce((a, b) => a + b, 0); try { return new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R) || 0; } catch (e) { console.error(`Error en la fórmula para ${plaga.nombre}:`, e); return 0; } };
        let dataRows = [];
        const hoy = new Date();
        const semana = getWeekNumber(hoy);
        const fecha = hoy.toLocaleDateString('es-ES');
        dataRows.push(['Semana', semana, 'Lote', nombreLote, 'Fecha', fecha]);
        const nombresValvulas = lote.valvulas.map(v => v.nombre);
        dataRows.push(['', ...nombresValvulas]);
        estado.plagas.forEach(plaga => {
            const fila = [plaga.nombre];
            lote.valvulas.forEach(valvula => {
                const promedio = calcularPromedio(plaga, valvula);
                if (separador === ';') {
                    fila.push(promedio.toLocaleString('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
                } else {
                    fila.push(promedio.toFixed(4));
                }
            });
            dataRows.push(fila);
        });
        const content = dataRows.map(row => row.join(separador)).join("\n");
        const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `informe_${nombreLote}_${fecha.replace(/\//g, '-')}.csv`);
    };
    resultados.btnExportarPC.addEventListener('click', () => exportarDatos(';'));
    resultados.btnExportarMovil.addEventListener('click', () => exportarDatos(','));

    // ===================================================================================
    //  8. INICIALIZACIÓN DE LA APLICACIÓN Y ESTADO DE AUTENTICACIÓN
    // ===================================================================================
    auth.onAuthStateChanged(user => {
        if (user) {
            usuarioActivo = user;
            if (unsubscribe) unsubscribe();
            unsubscribe = db.collection('usuarios').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    estado = doc.data();
                } else {
                    estado = { lotes: {}, plagas: [], loteActivo: null, valvulaActivaId: null, fechaUltimaLimpieza: null };
                    guardarEstadoEnFirebase();
                }
                
                // Actualiza la vista actual con los nuevos datos de la nube
                switch (vistaActiva) {
                    case 'vista-bienvenida': renderBienvenida(); break;
                    case 'vista-evaluacion': renderEvaluacion(); break;
                    case 'vista-gestion-plagas': renderGestionPlagas(); break;
                    case 'vista-config-calculo': renderConfigCalculo(); break;
                    case 'vista-resultados': renderResultados(); break;
                }
            }, error => {
                console.error("Error al escuchar los datos:", error);
            });
            iniciarAppParaUsuario();
        } else {
            usuarioActivo = null;
            estado = {};
            if (unsubscribe) unsubscribe();
            mostrarVista('vista-login');
        }
    });

    const iniciarAppParaUsuario = () => {
        const hoy = new Date().toDateString();
        if (estado.fechaUltimaLimpieza !== hoy) {
            for (const nombreLote in estado.lotes) {
                estado.lotes[nombreLote].valvulas.forEach(valvula => {
                    valvula.conteos = {};
                });
            }
            estado.fechaUltimaLimpieza = hoy;
            guardarEstadoEnFirebase();
        }
        bienvenida.titulo.textContent = `Bienvenido, ${usuarioActivo.email}`;
        mostrarVista('vista-bienvenida');
    };
});

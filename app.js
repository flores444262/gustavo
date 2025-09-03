document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    //  1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
    // ===================================================================================
    const firebaseConfig = {

        apiKey: "AIzaSyCHlOlmsXUpun9G0Foa2KlA33chjYg0VLs",
        authDomain: "beta-pro-d511e.firebaseapp.com",
        projectId: "beta-pro-d511e",
        storageBucket: "beta-pro-d511e.firebasestorage.app",
        messagingSenderId: "549720320374",
        appId: "1:549720320374:web:6594b3d1c797817a387257",
        measurementId: "G-E384DM924T"
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
    let appInicializada = false;

    // ===================================================================================
    //  3. SELECTORES DEL DOM
    // ===================================================================================
    const vistas = document.querySelectorAll('.view');
    const welcomeOverlay = {
        overlay: document.getElementById('welcome-overlay'),
        message: document.getElementById('welcome-message'),
    };
    const login = {
        vista: document.getElementById('vista-login'),
        formLogin: document.getElementById('login-form'),
        inputEmailLogin: document.getElementById('login-email'),
        inputPasswordLogin: document.getElementById('login-password'),
        btnLogin: document.getElementById('btn-login'),
        linkRegistro: document.getElementById('link-a-registro'),
        formRegistro: document.getElementById('registro-form'),
        inputNombreRegistro: document.getElementById('registro-nombre'),
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
            db.collection('datos_usuarios').doc(usuarioActivo.uid).set(estado, { merge: true })
                .catch(error => console.error("Error al guardar datos:", error));
        }
    };

    // ===================================================================================
    //  5. LÓGICA DE NAVEGACIÓN Y VISTAS
    // ===================================================================================
    const mostrarVista = (idVista) => {
        vistas.forEach(vista => vista.classList.add('hidden'));
        document.getElementById(idVista).classList.remove('hidden');
    };
    const mostrarAnimacionBienvenida = (nombre) => {
        welcomeOverlay.message.textContent = `Hola, ${nombre}`;
        welcomeOverlay.overlay.classList.remove('hidden');
        welcomeOverlay.overlay.classList.add('visible');
        setTimeout(() => {
            welcomeOverlay.overlay.classList.remove('visible');
            setTimeout(() => {
                welcomeOverlay.overlay.classList.add('hidden');
                mostrarVista('vista-bienvenida');
            }, 500);
        }, 2500);
    };

    // ===================================================================================
    //  6. FUNCIONES DE RENDERIZADO
    // ===================================================================================
    const renderizarVistaActual = () => {
        const vistaVisible = document.querySelector('.view:not(.hidden):not(#welcome-overlay)');
        if (!vistaVisible) {
            renderBienvenida();
            return;
        };
        switch (vistaVisible.id) {
            case 'vista-bienvenida': renderBienvenida(); break;
            case 'vista-evaluacion': renderEvaluacion(); break;
            case 'vista-gestion-plagas': renderGestionPlagas(); break;
            case 'vista-config-calculo': renderConfigCalculo(); break;
            case 'vista-resultados': renderResultados(); break;
        }
    };
    const renderBienvenida = () => {
        const nombresLotes = (estado && estado.lotes) ? Object.keys(estado.lotes) : [];
        bienvenida.listaLotes.innerHTML = '<h3>Selecciona un Lote:</h3>';
        if (nombresLotes.length === 0) {
            bienvenida.listaLotes.innerHTML += '<p>No hay lotes creados.</p>';
        } else {
            nombresLotes.forEach(nombreLote => {
                bienvenida.listaLotes.innerHTML += `
                    <div class="lote-button-container">
                        <button class="btn lote-select-btn" data-lote="${nombreLote}">${nombreLote}</button>
                        <span class="edit-lote-btn" data-lote="${nombreLote}" title="Editar nombre">✏️</span>
                        <span class="delete-lote-btn" data-lote="${nombreLote}" title="Eliminar lote">🗑️</span>
                    </div>`;
            });
        }
    };
    const renderEvaluacion = () => {
        if (!estado.loteActivo || !estado.lotes[estado.loteActivo]) {
            mostrarVista('vista-bienvenida');
            renderBienvenida();
            return;
        }
        const lote = estado.lotes[estado.loteActivo];
        evaluacion.titulo.textContent = `Evaluando: ${estado.loteActivo}`;
        evaluacion.navValvulas.innerHTML = '';
        (lote.valvulas || []).forEach(valvula => {
            evaluacion.navValvulas.innerHTML += `
                <div class="tab-item ${valvula.id == estado.valvulaActivaId ? 'active' : ''}" data-id="${valvula.id}">
                    <span>${valvula.nombre}</span>
                    <span class="edit-valvula-btn" title="Editar nombre">✏️</span>
                    <span class="delete-valvula-btn" title="Eliminar válvula">🗑️</span>
                </div>`;
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
        
        renderRacimos(valvula);

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
    
    const renderRacimos = (valvula) => {
        const racimos = valvula.racimos || [];
        const puntosTotales = valvula.puntosEvaluados;
        const proximoPuntoIndex = racimos.findIndex(r => r === null || r === undefined);
        const puntoActual = proximoPuntoIndex === -1 ? racimos.length : proximoPuntoIndex;

        let html = '<div class="racimo-container">';

        if (puntoActual < puntosTotales) {
            html += `
                <div class="racimo-progress">Ingresando Racimos: <strong>Punto ${puntoActual + 1} de ${puntosTotales}</strong></div>
                <div class="racimo-input-wrapper">
                    <input type="number" id="racimo-input-actual" placeholder="N° de racimos...">
                    <button class="btn btn-primary" id="btn-guardar-racimo" data-punto="${puntoActual}">Guardar</button>
                </div>
            `;
        } else {
            html += '<div class="racimo-completo">✅ Todos los puntos de racimos han sido registrados.</div>';
        }

        if (racimos.length > 0) {
            html += '<h4>Racimos Ingresados:</h4><div class="racimo-list">';
            racimos.forEach((valor, index) => {
                if (valor !== null && valor !== undefined) {
                    html += `
                        <div class="racimo-list-item">
                            <span>Punto ${index + 1}: <strong>${valor}</strong></span>
                            <span class="delete-racimo-btn" data-punto="${index}" title="Eliminar este punto">❌</span>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }
        
        html += '</div>';
        evaluacion.racimosContenedor.innerHTML = html;
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
            resultados.listaLotes.innerHTML += '<p>Ningún lote ha sido modificado hoy.</p>';
        } else {
            lotesModificadosHoy.forEach(nombreLote => {
                resultados.listaLotes.innerHTML += `<button class="btn lote-select-resultados-btn" data-lote="${nombreLote}">${nombreLote}</button>`;
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
            totalRacimos += (valvula.racimos || []).reduce((a, b) => a + b, 0);
            for (const pNombre in valvula.conteos) {
                totalIndividuos[pNombre] = (totalIndividuos[pNombre] || 0) + valvula.conteos[pNombre].reduce((a, b) => a + b, 0);
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
                const R = (valvula.racimos || []).reduce((a, b) => a + b, 0);
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
        const nombre = login.inputNombreRegistro.value.trim();
        const email = login.inputEmailRegistro.value.trim();
        const password = login.inputPasswordRegistro.value.trim();
        if (!nombre || !email || !password) return alert('Todos los campos son obligatorios.');
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => db.collection('perfiles_usuarios').doc(userCredential.user.uid).set({ nombre, email }))
            .then(() => { alert('¡Usuario registrado con éxito!'); login.linkLogin.click(); })
            .catch(error => alert(`Error al registrar: ${error.message}`));
    });
    login.btnLogin.addEventListener('click', () => {
        const email = login.inputEmailLogin.value;
        const password = login.inputPasswordLogin.value;
        auth.signInWithEmailAndPassword(email, password).catch(error => alert(`Error al iniciar sesión: ${error.message}`));
    });
    bienvenida.btnLogout.addEventListener('click', () => auth.signOut());

    // --- Navegación ---
    bienvenida.btnGestionPlagas.addEventListener('click', () => { mostrarVista('vista-gestion-plagas'); renderGestionPlagas(); });
    bienvenida.btnConfigCalculo.addEventListener('click', () => { mostrarVista('vista-config-calculo'); renderConfigCalculo(); });
    bienvenida.btnResultados.addEventListener('click', () => { mostrarVista('vista-resultados'); renderResultados(); });
    evaluacion.btnVolver.addEventListener('click', () => {
        const updates = { loteActivo: null, valvulaActivaId: null };
        db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
        mostrarVista('vista-bienvenida');
    });
    gestionPlagas.btnVolver.addEventListener('click', () => { guardarEstadoEnFirebase(); mostrarVista('vista-bienvenida'); });
    configCalculo.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));
    resultados.btnVolver.addEventListener('click', () => mostrarVista('vista-bienvenida'));

    // --- Lógica de Bienvenida ---
    bienvenida.btnCrear.addEventListener('click', () => {
        const nombreLote = prompt('Ingrese el nombre del nuevo lote:');
        if (nombreLote && !(estado.lotes && estado.lotes[nombreLote])) {
            const loteKey = `lotes.${nombreLote}`;
            const newLote = { valvulas: [], ultimaModificacion: null };
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({ [loteKey]: newLote });
        } else if (estado.lotes && estado.lotes[nombreLote]) {
            alert('El lote ya existe.');
        }
    });
    bienvenida.listaLotes.addEventListener('click', (e) => {
        const selectBtn = e.target.closest('.lote-select-btn');
        const editBtn = e.target.closest('.edit-lote-btn');
        const deleteBtn = e.target.closest('.delete-lote-btn');
        if (selectBtn) {
            const nombreLote = selectBtn.dataset.lote;
            const lote = estado.lotes[nombreLote];
            let updates = { loteActivo: nombreLote };
            if ((lote.valvulas || []).length === 0) {
                const idUnico = Date.now();
                const nuevaValvula = { id: idUnico, nombre: "Válvula 1", puntosEvaluados: 7, racimos: [], conteos: {} };
                updates[`lotes.${nombreLote}.valvulas`] = [nuevaValvula];
                updates.valvulaActivaId = idUnico;
            } else {
                updates.valvulaActivaId = lote.valvulas[0].id;
            }
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
            mostrarVista('vista-evaluacion');
        } else if (editBtn) {
            const nombreAntiguo = editBtn.dataset.lote;
            const nuevoNombre = prompt(`Ingrese el nuevo nombre para el lote "${nombreAntiguo}":`, nombreAntiguo);
            if (nuevoNombre && nuevoNombre !== nombreAntiguo) {
                if (estado.lotes[nuevoNombre]) return alert('Error: Ya existe un lote con ese nombre.');
                const loteData = estado.lotes[nombreAntiguo];
                let updates = {};
                updates[`lotes.${nombreAntiguo}`] = firebase.firestore.FieldValue.delete();
                updates[`lotes.${nuevoNombre}`] = loteData;
                if (estado.loteActivo === nombreAntiguo) updates.loteActivo = nuevoNombre;
                db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
            }
        } else if (deleteBtn) {
            const nombreLote = deleteBtn.dataset.lote;
            if (confirm(`¿Estás seguro de que quieres eliminar el lote "${nombreLote}"?`)) {
                let updates = { [`lotes.${nombreLote}`]: firebase.firestore.FieldValue.delete() };
                if (estado.loteActivo === nombreLote) updates.loteActivo = null;
                db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
            }
        }
    });

    // --- Lógica de Evaluación ---
    evaluacion.btnAgregarValvula.addEventListener('click', () => {
        const nombreValvula = prompt("Nombre para la nueva válvula:", `Válvula ${estado.lotes[estado.loteActivo].valvulas.length + 1}`);
        if (!nombreValvula) return;
        const idUnico = Date.now();
        const nuevaValvula = { id: idUnico, nombre: nombreValvula, puntosEvaluados: 7, racimos: [], conteos: {} };
        const updates = {
            [`lotes.${estado.loteActivo}.valvulas`]: firebase.firestore.FieldValue.arrayUnion(nuevaValvula),
            valvulaActivaId: idUnico
        };
        db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
    });
    evaluacion.navValvulas.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (!tab) return;
        const valvulaId = tab.dataset.id;
        if (e.target.matches('.edit-valvula-btn')) {
            const valvulas = estado.lotes[estado.loteActivo].valvulas;
            const valvulaIndex = valvulas.findIndex(v => v.id == valvulaId);
            const valvula = valvulas[valvulaIndex];
            const nuevoNombre = prompt(`Editar nombre de "${valvula.nombre}":`, valvula.nombre);
            if (nuevoNombre) {
                valvulas[valvulaIndex].nombre = nuevoNombre;
                db.collection('datos_usuarios').doc(usuarioActivo.uid).update({ [`lotes.${estado.loteActivo}.valvulas`]: valvulas });
            }
        } else if (e.target.matches('.delete-valvula-btn')) {
            if (confirm('¿Seguro que quieres eliminar esta válvula?')) {
                const nuevasValvulas = estado.lotes[estado.loteActivo].valvulas.filter(v => v.id != valvulaId);
                let nuevaValvulaActivaId = estado.valvulaActivaId;
                if (estado.valvulaActivaId == valvulaId) {
                    nuevaValvulaActivaId = nuevasValvulas[0]?.id || null;
                }
                db.collection('datos_usuarios').doc(usuarioActivo.uid).update({ 
                    [`lotes.${estado.loteActivo}.valvulas`]: nuevasValvulas,
                    valvulaActivaId: nuevaValvulaActivaId
                });
            }
        } else {
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({ valvulaActivaId: valvulaId });
        }
    });
    evaluacion.puntosInput.addEventListener('change', (e) => {
        const valvulas = estado.lotes[estado.loteActivo].valvulas;
        const valvulaIndex = valvulas.findIndex(v => v.id == estado.valvulaActivaId);
        if (valvulaIndex === -1) return;
        valvulas[valvulaIndex].puntosEvaluados = parseInt(e.target.value) || 1;
        db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
            [`lotes.${estado.loteActivo}.valvulas`]: valvulas,
            [`lotes.${estado.loteActivo}.ultimaModificacion`]: new Date().toISOString()
        });
    });
    
    // *** MANEJADOR DE EVENTOS PARA RACIMOS CORREGIDO Y MEJORADO ***
    evaluacion.racimosContenedor.addEventListener('click', (e) => {
        const valvulas = estado.lotes[estado.loteActivo]?.valvulas;
        if (!valvulas) return;
        const valvulaIndex = valvulas.findIndex(v => v.id == estado.valvulaActivaId);
        if (valvulaIndex === -1) return;

        let shouldUpdate = false;

        // Lógica para guardar un nuevo racimo
        if (e.target.matches('#btn-guardar-racimo')) {
            const input = document.getElementById('racimo-input-actual');
            if (!input || input.value === '') return;

            const punto = parseInt(e.target.dataset.punto);
            const valor = parseInt(input.value);

            if (!isNaN(valor)) {
                if (!valvulas[valvulaIndex].racimos) valvulas[valvulaIndex].racimos = [];
                
                while(valvulas[valvulaIndex].racimos.length <= punto) {
                    valvulas[valvulaIndex].racimos.push(null);
                }
                valvulas[valvulaIndex].racimos[punto] = valor;
                shouldUpdate = true;
            }
        }

        // Lógica para eliminar un racimo existente
        if (e.target.matches('.delete-racimo-btn')) {
            const punto = parseInt(e.target.dataset.punto);
            if (valvulas[valvulaIndex].racimos && valvulas[valvulaIndex].racimos[punto] !== undefined) {
                valvulas[valvulaIndex].racimos[punto] = null;
                shouldUpdate = true;
            }
        }
        
        if (shouldUpdate) {
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
                [`lotes.${estado.loteActivo}.valvulas`]: valvulas,
                [`lotes.${estado.loteActivo}.ultimaModificacion`]: new Date().toISOString()
            });
        }
    });

    evaluacion.conteosContenedor.addEventListener('click', (e) => {
        if (e.target.matches('.delete-conteo-btn')) {
            const plaga = e.target.dataset.plaga;
            const index = parseInt(e.target.dataset.index);
            const valvulas = estado.lotes[estado.loteActivo].valvulas;
            const valvulaIndex = valvulas.findIndex(v => v.id == estado.valvulaActivaId);
            if (valvulaIndex === -1 || !valvulas[valvulaIndex].conteos[plaga]) return;
            valvulas[valvulaIndex].conteos[plaga].splice(index, 1);
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
                [`lotes.${estado.loteActivo}.valvulas`]: valvulas,
                [`lotes.${estado.loteActivo}.ultimaModificacion`]: new Date().toISOString()
            });
        }
    });
    evaluacion.conteosContenedor.addEventListener('change', (e) => {
        if (e.target.matches('.conteo-input') && e.target.value) {
            const plaga = e.target.dataset.plaga;
            const valor = parseInt(e.target.value);
            const valvulas = estado.lotes[estado.loteActivo].valvulas;
            const valvulaIndex = valvulas.findIndex(v => v.id == estado.valvulaActivaId);
            if (valvulaIndex === -1) return;
            const valvula = valvulas[valvulaIndex];
            if (!valvula.conteos) valvula.conteos = {};
            if (!valvula.conteos[plaga]) valvula.conteos[plaga] = [];
            valvula.conteos[plaga].push(valor);
            e.target.value = '';
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
                [`lotes.${estado.loteActivo}.valvulas`]: valvulas,
                [`lotes.${estado.loteActivo}.ultimaModificacion`]: new Date().toISOString()
            });
        }
    });

    // --- Lógica de Gestión de Plagas ---
    gestionPlagas.btnAgregar.addEventListener('click', () => {
        const nombrePlaga = gestionPlagas.inputNueva.value.trim();
        if (nombrePlaga && !(estado.plagas || []).some(p => p.nombre === nombrePlaga)) {
            const nuevaPlaga = { nombre: nombrePlaga, formula: "I / (P * 4)" };
            gestionPlagas.inputNueva.value = '';
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
                plagas: firebase.firestore.FieldValue.arrayUnion(nuevaPlaga)
            });
        }
    });
    gestionPlagas.lista.addEventListener('click', (e) => {
        if (e.target.matches('.delete-btn')) {
            const nombrePlaga = e.target.dataset.plaga;
            const plagaAEliminar = estado.plagas.find(p => p.nombre === nombrePlaga);
            if (plagaAEliminar) {
                db.collection('datos_usuarios').doc(usuarioActivo.uid).update({
                    plagas: firebase.firestore.FieldValue.arrayRemove(plagaAEliminar)
                });
            }
        }
    });

    // --- Lógica de Configuración de Cálculos ---
    configCalculo.btnGuardar.addEventListener('click', () => {
        const nuevasPlagas = [...estado.plagas];
        document.querySelectorAll('.formula-input').forEach(input => {
            const nombrePlaga = input.dataset.plaga;
            const plagaIndex = nuevasPlagas.findIndex(p => p.nombre === nombrePlaga);
            if (plagaIndex > -1) nuevasPlagas[plagaIndex].formula = input.value;
        });
        db.collection('datos_usuarios').doc(usuarioActivo.uid).update({ plagas: nuevasPlagas });
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
        const calcularPromedio = (plaga, valvula) => { const I = (valvula.conteos[plaga.nombre] || []).reduce((a, b) => a + b, 0); const P = valvula.puntosEvaluados; const R = (valvula.racimos || []).reduce((a, b) => a + b, 0); try { return new Function('I', 'P', 'R', `return ${plaga.formula}`)(I, P, R) || 0; } catch (e) { console.error(`Error en la fórmula para ${plaga.nombre}:`, e); return 0; } };
        let dataRows = [];
        const hoy = new Date();
        const semana = getWeekNumber(hoy);
        const fecha = hoy.toLocaleDateString('es-ES');
        dataRows.push(['Semana', semana, 'Lote', nombreLote, 'Fecha', fecha]);
        const nombresValvulas = lote.valvulas.map(v => v.nombre);
        dataRows.push(['', ...nombresValvulas]);
        (estado.plagas || []).forEach(plaga => {
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
            unsubscribe = db.collection('datos_usuarios').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    estado = doc.data();
                } else {
                    estado = { lotes: {}, plagas: [], loteActivo: null, valvulaActivaId: null, fechaUltimaLimpieza: null };
                    guardarEstadoEnFirebase();
                }
                if (appInicializada) {
                    renderizarVistaActual();
                }
            }, error => console.error("Error al escuchar los datos:", error));

            db.collection('perfiles_usuarios').doc(user.uid).get().then(profileDoc => {
                const nombreUsuario = profileDoc.exists ? profileDoc.data().nombre : user.email;
                if (!appInicializada) {
                    iniciarAppParaUsuario(nombreUsuario);
                    appInicializada = true;
                }
            });
        } else {
            usuarioActivo = null;
            estado = {};
            if (unsubscribe) unsubscribe();
            appInicializada = false;
            sessionStorage.removeItem('welcomeShown');
            mostrarVista('vista-login');
        }
    });

    const iniciarAppParaUsuario = (nombre) => {
        const hoy = new Date().toDateString();
        if (estado.fechaUltimaLimpieza !== hoy) {
            const updates = {};
            for (const nombreLote in estado.lotes) {
                const valvulasLimpias = (estado.lotes[nombreLote].valvulas || []).map(v => ({ ...v, conteos: {} }));
                updates[`lotes.${nombreLote}.valvulas`] = valvulasLimpias;
            }
            updates.fechaUltimaLimpieza = hoy;
            db.collection('datos_usuarios').doc(usuarioActivo.uid).update(updates);
        }
        bienvenida.titulo.textContent = `Hola, ${nombre}`;
        if (!sessionStorage.getItem('welcomeShown')) {
            mostrarAnimacionBienvenida(nombre);
            sessionStorage.setItem('welcomeShown', 'true');
        } else {
            mostrarVista('vista-bienvenida');
            renderBienvenida();
        }
    };
});


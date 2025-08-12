document.addEventListener('DOMContentLoaded', () => {
    // Estado de la aplicación
    const state = {
        lotes: [],
        currentLoteId: null,
        currentValvulaId: null,
        currentView: 'lote',
        conteos: {},
        configs: {},
        navOpen: false
    };

    // Elementos del DOM
    const elements = {
        lotesList: document.getElementById('lotes-list'),
        resultsList: document.getElementById('results-list'),
        addLoteBtn: document.getElementById('add-lote-btn'),
        loteContent: document.getElementById('lote-content'),
        resultsContent: document.getElementById('results-content'),
        resultsContainer: document.getElementById('results-container'),
        exportExcelBtn: document.getElementById('export-excel'),
        configContainer: document.getElementById('config-container'),
        mobileNavToggle: document.getElementById('mobile-nav-toggle'),
        mainNav: document.getElementById('main-nav')
    };

    // Funciones auxiliares
    const helpers = {
        generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
        
        getCurrentLote: () => state.lotes.find(lote => lote.id === state.currentLoteId),
        
        getCurrentValvula: () => {
            const lote = helpers.getCurrentLote();
            return lote?.valvulas.find(v => v.id === state.currentValvulaId);
        },
        
        calculateAverage: (individuos, puntos, plagaId) => {
            const config = state.configs[plagaId] || {
                multiplier: 4,
                useMultiplier: true,
                showPercentage: false
            };
            
            const divisor = config.useMultiplier ? puntos * config.multiplier : puntos;
            if (divisor <= 0) return config.showPercentage ? '0%' : '0';
            
            const average = individuos / divisor;
            return config.showPercentage ? (average * 100).toFixed(2) + '%' : average.toFixed(4);
        },
        
        getTotalIndividuos: (lote) => {
            return lote.valvulas.reduce((total, valvula) => {
                return total + lote.plagas.reduce((sum, plaga) => {
                    return sum + (state.conteos[lote.id]?.[valvula.id]?.[plaga.id] || 0);
                }, 0);
            }, 0);
        },
        
        getTotalPuntos: (lote) => {
            return lote.valvulas.reduce((sum, valvula) => sum + valvula.valor, 0);
        },
        
        addPlagaToAllValvulas: (plaga) => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            lote.valvulas.forEach(valvula => {
                if (!state.conteos[lote.id]) state.conteos[lote.id] = {};
                if (!state.conteos[lote.id][valvula.id]) state.conteos[lote.id][valvula.id] = {};
                state.conteos[lote.id][valvula.id][plaga.id] = 0;
            });
        },
        
        exportToExcel: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const data = [];
            
            // Encabezados
            data.push(['Válvula', 'Plaga', 'Individuos', 'Puntos', 'Multiplicador', 'Promedio']);
            
            // Datos
            lote.valvulas.forEach(valvula => {
                lote.plagas.forEach(plaga => {
                    const conteo = state.conteos[lote.id]?.[valvula.id]?.[plaga.id] || 0;
                    const config = state.configs[plaga.id] || {};
                    const promedio = helpers.calculateAverage(conteo, valvula.valor, plaga.id);
                    
                    data.push([
                        `Válvula ${valvula.numero}`,
                        plaga.nombre,
                        conteo,
                        valvula.valor,
                        config.useMultiplier ? config.multiplier : 'No',
                        promedio
                    ]);
                });
            });
            
            // Totales
            data.push([]);
            data.push(['TOTAL LOTE', '', helpers.getTotalIndividuos(lote), helpers.getTotalPuntos(lote), '', helpers.calculateLoteAverage(lote)]);
            
            // Crear libro Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Resultados");
            
            // Exportar
            XLSX.writeFile(wb, `Resultados_${lote.nombre}.xlsx`);
        },
        
        calculateLoteAverage: (lote) => {
            const totalIndividuos = helpers.getTotalIndividuos(lote);
            const totalPuntos = helpers.getTotalPuntos(lote);
            return totalPuntos > 0 ? (totalIndividuos / totalPuntos).toFixed(4) : '0';
        }
    };

    // Renderizado
    const render = {
        initMobileNav: () => {
            elements.mobileNavToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                state.navOpen = !state.navOpen;
                elements.mainNav.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (state.navOpen && 
                    !e.target.closest('#main-nav') && 
                    e.target !== elements.mobileNavToggle) {
                    state.navOpen = false;
                    elements.mainNav.classList.remove('active');
                }
            });
        },
        
        updateNav: () => {
            elements.lotesList.innerHTML = '';
            elements.resultsList.innerHTML = '';
            
            state.lotes.forEach(lote => {
                // Lista de lotes
                const liLote = document.createElement('li');
                liLote.textContent = lote.nombre;
                liLote.classList.toggle('active', lote.id === state.currentLoteId && state.currentView === 'lote');
                liLote.addEventListener('click', () => {
                    state.currentLoteId = lote.id;
                    state.currentView = 'lote';
                    render.showView();
                    render.loteContent();
                    if (window.innerWidth <= 768) {
                        state.navOpen = false;
                        elements.mainNav.classList.remove('active');
                    }
                });
                elements.lotesList.appendChild(liLote);
                
                // Lista de resultados
                const liResult = document.createElement('li');
                liResult.textContent = lote.nombre;
                liResult.classList.toggle('active', lote.id === state.currentLoteId && state.currentView === 'results');
                liResult.addEventListener('click', () => {
                    state.currentLoteId = lote.id;
                    state.currentView = 'results';
                    render.showView();
                    render.resultsContent();
                    if (window.innerWidth <= 768) {
                        state.navOpen = false;
                        elements.mainNav.classList.remove('active');
                    }
                });
                elements.resultsList.appendChild(liResult);
            });
        },
        
        showView: () => {
            elements.loteContent.style.display = state.currentView === 'lote' ? 'block' : 'none';
            elements.resultsContent.style.display = state.currentView === 'results' ? 'block' : 'none';
            
            if (state.currentView === 'results') {
                render.resultsContent();
            }
        },
        
        loteContent: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) {
                elements.loteContent.innerHTML = '<p>Seleccione un lote</p>';
                return;
            }
            
            let html = `
                <div class="lote-header">
                    <h3>${lote.nombre}</h3>
                </div>
            `;
            
            if (lote.valvulas.length > 0) {
                html += `<div class="valvulas-nav" id="valvulas-nav"></div>`;
            }
            
            html += `
                <div id="valvulas-content"></div>
                <button id="add-valvula-btn" class="big-button">+ Agregar Válvula</button>
            `;
            
            elements.loteContent.innerHTML = html;
            
            if (lote.valvulas.length > 0) {
                render.valvulasNav();
                render.valvulasContent();
                
                if (!state.currentValvulaId) {
                    state.currentValvulaId = lote.valvulas[0].id;
                    render.valvulasNav();
                    render.valvulasContent();
                }
            }
            
            document.getElementById('add-valvula-btn')?.addEventListener('click', handlers.addValvula);
        },
        
        valvulasNav: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const nav = document.getElementById('valvulas-nav');
            if (!nav) return;
            
            nav.innerHTML = '';
            
            lote.valvulas.forEach(valvula => {
                const tab = document.createElement('div');
                tab.className = `valvula-tab ${valvula.id === state.currentValvulaId ? 'active' : ''}`;
                tab.textContent = `Válvula ${valvula.numero}`;
                tab.addEventListener('click', () => {
                    state.currentValvulaId = valvula.id;
                    render.valvulasNav();
                    render.valvulasContent();
                });
                nav.appendChild(tab);
            });
        },
        
        valvulasContent: () => {
            const lote = helpers.getCurrentLote();
            const valvula = helpers.getCurrentValvula();
            if (!lote || !valvula) return;
            
            const container = document.getElementById('valvulas-content');
            if (!container) return;
            
            let html = `
                <div class="valvula-content active">
                    <div class="config-section">
                        <h4>Configuración de Válvula ${valvula.numero}</h4>
                        <div class="config-item">
                            <label>Puntos evaluados:</label>
                            <input type="number" id="valvula-puntos" value="${valvula.valor}" min="0" step="0.1">
                        </div>
                    </div>
                    
                    <div class="plagas-section">
                        <h4>Plagas</h4>
                        <div class="plaga-list" id="plaga-list"></div>
                        <div class="add-plaga-container">
                            <input type="text" id="new-plaga-nombre" placeholder="Nombre de plaga">
                            <button id="add-plaga-btn" class="big-button">Agregar Plaga</button>
                            <button id="add-plaga-all-btn" class="big-button add-to-all-btn">Agregar a todas</button>
                        </div>
                    </div>
                    
                    <div class="conteos-section">
                        <h4>Conteos</h4>
                        <div id="conteos-container"></div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Event listeners
            document.getElementById('valvula-puntos')?.addEventListener('input', (e) => {
                valvula.valor = parseFloat(e.target.value) || 0;
            });
            
            document.getElementById('add-plaga-btn')?.addEventListener('click', handlers.addPlaga);
            document.getElementById('add-plaga-all-btn')?.addEventListener('click', handlers.addPlagaToAll);
            
            render.plagasList();
            render.conteosContainer();
        },
        
        plagasList: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const container = document.getElementById('plaga-list');
            if (!container) return;
            
            container.innerHTML = '';
            
            lote.plagas.forEach(plaga => {
                const plagaItem = document.createElement('div');
                plagaItem.className = 'plaga-item';
                plagaItem.innerHTML = `
                    <div class="plaga-info">
                        <h5>${plaga.nombre}</h5>
                    </div>
                    <div class="plaga-controls">
                        <button class="delete-btn delete-plaga" data-plaga="${plaga.id}">✕</button>
                    </div>
                `;
                
                // Eliminar plaga
                plagaItem.querySelector('.delete-plaga')?.addEventListener('click', (e) => {
                    handlers.deletePlaga(e.target.dataset.plaga);
                });
                
                container.appendChild(plagaItem);
            });
        },
        
        conteosContainer: () => {
            const lote = helpers.getCurrentLote();
            const valvula = helpers.getCurrentValvula();
            if (!lote || !valvula) return;
            
            const container = document.getElementById('conteos-container');
            if (!container) return;
            
            // Inicializar conteos si no existen
            if (!state.conteos[lote.id]) state.conteos[lote.id] = {};
            if (!state.conteos[lote.id][valvula.id]) state.conteos[lote.id][valvula.id] = {};
            
            container.innerHTML = '';
            
            lote.plagas.forEach(plaga => {
                if (!state.conteos[lote.id][valvula.id][plaga.id]) {
                    state.conteos[lote.id][valvula.id][plaga.id] = 0;
                }
                
                const conteoDiv = document.createElement('div');
                conteoDiv.className = 'conteo-item';
                
                const conteoId = `conteo-${valvula.id}-${plaga.id}`;
                const currentTotal = state.conteos[lote.id][valvula.id][plaga.id] || 0;
                
                conteoDiv.innerHTML = `
                    <label>${plaga.nombre}</label>
                    <div class="conteo-controls">
                        <input type="number" id="${conteoId}" min="0" placeholder="0">
                        <button class="add-conteo big-button" data-plaga="${plaga.id}">Agregar</button>
                        <span class="conteo-total">Total: ${currentTotal}</span>
                    </div>
                `;
                
                // Event listener para agregar conteo
                conteoDiv.querySelector('.add-conteo')?.addEventListener('click', (e) => {
                    const input = document.getElementById(`conteo-${valvula.id}-${e.target.dataset.plaga}`);
                    const cantidad = parseInt(input.value) || 0;
                    
                    if (cantidad > 0) {
                        state.conteos[lote.id][valvula.id][e.target.dataset.plaga] += cantidad;
                        input.value = '';
                        render.conteosContainer();
                    }
                });
                
                container.appendChild(conteoDiv);
            });
        },
        
        configContent: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            elements.configContainer.innerHTML = '';
            
            if (lote.plagas.length === 0) {
                elements.configContainer.innerHTML = '<p>No hay plagas configuradas</p>';
                return;
            }
            
            const configDiv = document.createElement('div');
            configDiv.className = 'config-section';
            configDiv.innerHTML = '<h4>Configuración de Cálculos</h4>';
            
            lote.plagas.forEach(plaga => {
                if (!state.configs[plaga.id]) {
                    state.configs[plaga.id] = {
                        multiplier: 4,
                        useMultiplier: true,
                        showPercentage: false
                    };
                }
                
                const config = state.configs[plaga.id];
                const configId = `config-${plaga.id}`;
                
                const plagaConfig = document.createElement('div');
                plagaConfig.className = 'config-item';
                plagaConfig.innerHTML = `
                    <h5>${plaga.nombre}</h5>
                    <div class="config-grid">
                        <div class="config-item">
                            <label>Multiplicador:</label>
                            <input type="number" id="${configId}-multiplier" value="${config.multiplier}" min="1">
                        </div>
                        <div class="config-item">
                            <label>
                                <input type="checkbox" id="${configId}-use-multiplier" ${config.useMultiplier ? 'checked' : ''}>
                                Usar multiplicador
                            </label>
                        </div>
                        <div class="config-item">
                            <label>
                                <input type="checkbox" id="${configId}-show-percentage" ${config.showPercentage ? 'checked' : ''}>
                                Mostrar porcentaje
                            </label>
                        </div>
                    </div>
                `;
                
                // Configuración
                plagaConfig.querySelector(`#${configId}-multiplier`)?.addEventListener('change', (e) => {
                    config.multiplier = parseInt(e.target.value) || 1;
                    render.resultsContainerContent();
                });
                
                plagaConfig.querySelector(`#${configId}-use-multiplier`)?.addEventListener('change', (e) => {
                    config.useMultiplier = e.target.checked;
                    render.resultsContainerContent();
                });
                
                plagaConfig.querySelector(`#${configId}-show-percentage`)?.addEventListener('change', (e) => {
                    config.showPercentage = e.target.checked;
                    render.resultsContainerContent();
                });
                
                configDiv.appendChild(plagaConfig);
            });
            
            elements.configContainer.appendChild(configDiv);
        },
        
        resultsContainerContent: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) {
                elements.resultsContainer.innerHTML = '<p>Seleccione un lote para ver resultados</p>';
                return;
            }
            
            let html = `
                <table class="results-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Válvula</th>
                            <th rowspan="2">Plaga</th>
                            <th rowspan="2">Individuos</th>
                            <th rowspan="2">Puntos</th>
                            <th colspan="2">Cálculo</th>
                            <th rowspan="2">Promedio</th>
                        </tr>
                        <tr>
                            <th>Multiplicador</th>
                            <th>Fórmula</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Datos por válvula
            lote.valvulas.forEach(valvula => {
                let valvulaTotal = 0;
                let isFirstPlaga = true;
                
                lote.plagas.forEach(plaga => {
                    const conteo = state.conteos[lote.id]?.[valvula.id]?.[plaga.id] || 0;
                    valvulaTotal += conteo;
                    const config = state.configs[plaga.id] || {};
                    const promedio = helpers.calculateAverage(conteo, valvula.valor, plaga.id);
                    
                    html += `
                        <tr>
                            ${isFirstPlaga ? `<td rowspan="${lote.plagas.length}">Válvula ${valvula.numero}</td>` : ''}
                            <td>${plaga.nombre}</td>
                            <td>${conteo}</td>
                            <td>${valvula.valor}</td>
                            <td>${config.useMultiplier ? config.multiplier : 'No'}</td>
                            <td>${conteo} / ${config.useMultiplier ? `(${valvula.valor} × ${config.multiplier})` : valvula.valor}</td>
                            <td class="${config.showPercentage ? 'percentage' : ''}">${promedio}</td>
                        </tr>
                    `;
                    
                    isFirstPlaga = false;
                });
                
                // Total por válvula
                html += `
                    <tr class="total-row">
                        <td colspan="2">Total Válvula ${valvula.numero}</td>
                        <td>${valvulaTotal}</td>
                        <td>${valvula.valor}</td>
                        <td colspan="3"></td>
                    </tr>
                `;
            });
            
            // Total general
            const totalGeneral = helpers.getTotalIndividuos(lote);
            const totalPuntos = helpers.getTotalPuntos(lote);
            
            html += `
                    <tr class="lote-total">
                        <td colspan="2">Total Lote</td>
                        <td>${totalGeneral}</td>
                        <td>${totalPuntos}</td>
                        <td colspan="2">${totalGeneral} / ${totalPuntos}</td>
                        <td>${(totalGeneral / totalPuntos).toFixed(4)}</td>
                    </tr>
                </tbody>
                </table>
            `;
            
            elements.resultsContainer.innerHTML = html;
        },
        
        resultsContent: () => {
            document.getElementById('results-title').textContent = `Resultados: ${helpers.getCurrentLote()?.nombre || ''}`;
            render.configContent();
            render.resultsContainerContent();
        }
    };

    // Manejadores de eventos
    const handlers = {
        addLote: () => {
            const nombre = prompt('Ingrese el nombre del nuevo lote (ej: LOTE-2709-A):');
            if (nombre) {
                const nuevoLote = {
                    id: helpers.generateId(),
                    nombre,
                    valvulas: [],
                    plagas: []
                };
                state.lotes.push(nuevoLote);
                state.currentLoteId = nuevoLote.id;
                state.currentView = 'lote';
                render.updateNav();
                render.showView();
                render.loteContent();
            }
        },
        
        addValvula: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const numero = parseInt(prompt('Número de la válvula:', lote.valvulas.length + 1)) || 1;
            const nuevaValvula = {
                id: helpers.generateId(),
                numero,
                valor: 0
            };
            
            lote.valvulas.push(nuevaValvula);
            state.currentValvulaId = nuevaValvula.id;
            
            // Inicializar conteos para todas las plagas en esta válvula
            lote.plagas.forEach(plaga => {
                if (!state.conteos[lote.id]) state.conteos[lote.id] = {};
                if (!state.conteos[lote.id][nuevaValvula.id]) state.conteos[lote.id][nuevaValvula.id] = {};
                state.conteos[lote.id][nuevaValvula.id][plaga.id] = 0;
            });
            
            render.loteContent();
        },
        
        addPlaga: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const nombre = document.getElementById('new-plaga-nombre')?.value.trim();
            if (!nombre) return;
            
            const nuevaPlaga = {
                id: helpers.generateId(),
                nombre
            };
            
            lote.plagas.push(nuevaPlaga);
            state.configs[nuevaPlaga.id] = {
                multiplier: 4,
                useMultiplier: true,
                showPercentage: false
            };
            
            // Inicializar conteos para esta plaga en la válvula actual
            const valvula = helpers.getCurrentValvula();
            if (valvula) {
                if (!state.conteos[lote.id]) state.conteos[lote.id] = {};
                if (!state.conteos[lote.id][valvula.id]) state.conteos[lote.id][valvula.id] = {};
                state.conteos[lote.id][valvula.id][nuevaPlaga.id] = 0;
            }
            
            document.getElementById('new-plaga-nombre').value = '';
            render.plagasList();
            render.conteosContainer();
            render.resultsContent();
        },
        
        addPlagaToAll: () => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            const nombre = document.getElementById('new-plaga-nombre')?.value.trim();
            if (!nombre) return;
            
            const nuevaPlaga = {
                id: helpers.generateId(),
                nombre
            };
            
            lote.plagas.push(nuevaPlaga);
            state.configs[nuevaPlaga.id] = {
                multiplier: 4,
                useMultiplier: true,
                showPercentage: false
            };
            
            // Inicializar conteos para esta plaga en todas las válvulas
            helpers.addPlagaToAllValvulas(nuevaPlaga);
            
            document.getElementById('new-plaga-nombre').value = '';
            render.plagasList();
            render.conteosContainer();
            render.resultsContent();
        },
        
        deletePlaga: (plagaId) => {
            const lote = helpers.getCurrentLote();
            if (!lote) return;
            
            lote.plagas = lote.plagas.filter(p => p.id !== plagaId);
            delete state.configs[plagaId];
            
            lote.valvulas.forEach(valvula => {
                if (state.conteos[lote.id]?.[valvula.id]) {
                    delete state.conteos[lote.id][valvula.id][plagaId];
                }
            });
            
            render.plagasList();
            render.conteosContainer();
            render.resultsContent();
        }
    };

    // Inicialización
    elements.addLoteBtn.addEventListener('click', handlers.addLote);
    elements.exportExcelBtn?.addEventListener('click', helpers.exportToExcel);
    
    // Lote de ejemplo
    const loteEjemplo = {
        id: helpers.generateId(),
        nombre: 'LOTE-2709-A',
        valvulas: [
            { id: helpers.generateId(), numero: 1, valor: 35 },
            { id: helpers.generateId(), numero: 2, valor: 40 }
        ],
        plagas: [
            { id: helpers.generateId(), nombre: 'Trips occidentalis' },
            { id: helpers.generateId(), nombre: 'Mosca blanca' }
        ]
    };
    
    state.lotes.push(loteEjemplo);
    state.currentLoteId = loteEjemplo.id;
    state.currentValvulaId = loteEjemplo.valvulas[0].id;
    
    // Configuración inicial
    loteEjemplo.plagas.forEach(plaga => {
        state.configs[plaga.id] = {
            multiplier: 4,
            useMultiplier: true,
            showPercentage: false
        };
    });
    
    // Conteos iniciales
    state.conteos[loteEjemplo.id] = {};
    loteEjemplo.valvulas.forEach(valvula => {
        state.conteos[loteEjemplo.id][valvula.id] = {};
        loteEjemplo.plagas.forEach(plaga => {
            state.conteos[loteEjemplo.id][valvula.id][plaga.id] = 0;
        });
    });
    
    // Inicializar navegación responsive
    render.initMobileNav();
    
    // Manejar cambios de tamaño de pantalla
    window.addEventListener('resize', () => {
        render.initMobileNav();
    });
    
    render.updateNav();
    render.showView();
    render.loteContent();
});
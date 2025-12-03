let cuentas = [];
const VERSION = "20251209"; // Versión actualizada para forzar recarga

// Convierte un valor con signo al final en número decimal
function parseMonto(valor) {
    if (!valor) return NaN;
    const s = String(valor).trim();

    const last = s[s.length - 1];
    let signo = 1;
    let cuerpo = s;

    if (last === '-' || last === '+') {
        signo = (last === '-') ? -1 : 1;
        cuerpo = s.slice(0, -1); 
    }

    const entero = parseInt(cuerpo, 10);
    if (isNaN(entero)) return NaN;

    return signo * (entero / 100); 
}

// Da formato de moneda (es-VE) y color
function pintar(valorRaw) {
    const num = parseMonto(valorRaw);
    if (isNaN(num) || num === 0) return '<span>0,00</span>'; 
    const color = num >= 0 ? 'black' : 'red';
    return `<span style="color:${color}">${num.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}</span>`;
}

/**
 * Función que genera el HTML del encabezado (Compañía y Mes/Año de Proceso).
 */
function generarHeaderPrincipal(cuentas) {
    if (!cuentas || cuentas.length === 0) return '';
    
    const infoHeader = cuentas[0]; 
    const nombreCia = infoHeader.NOMBRE;
    
    // Extracción y Formato de Mes/Año de Proceso
    const saldoAnteriorHeader = String(infoHeader.SALDO_ANTERIOR).replace(/[^0-9]/g, ''); 
    const mesYearStr = saldoAnteriorHeader.length >= 4 ? saldoAnteriorHeader.slice(-4) : '??/??';
    
    let mes = '??';
    let anio = '??';
    
    if (mesYearStr.length === 4) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthIndex = parseInt(mesYearStr.slice(0, 2), 10) - 1;
        
        mes = (monthIndex >= 0 && monthIndex < 12) ? monthNames[monthIndex] : `Mes ${mesYearStr.slice(0, 2)}`;
        anio = `20${mesYearStr.slice(2, 4)}`;
    }
    
    const mesAnioProceso = `${mes}/${anio}`;

    // 3. Crear el HTML
    return `
        <div class="consulta-info-header">
            <div><strong>CIA:</strong> ${nombreCia}</div>
            <div><strong>MES/AÑO PROCESO:</strong> ${mesAnioProceso}</div>
        </div>`;
}


/**
 * Función que carga los datos de cgcodigos.json y muestra el encabezado inicial.
 */
async function cargarPlanDeCuentas() {
    try {
        const response = await fetch('cgcodigos.json');
        
        if (!response.ok) {
            throw new Error(`Error de red o archivo no encontrado: ${response.status}`);
        }
        
        cuentas = await response.json();

        // ----------------------------------------------------
        // **AJUSTE:** 1. Mostrar el Encabezado Principal al inicio
        // ----------------------------------------------------
        const headerPrincipalHtml = generarHeaderPrincipal(cuentas);
        
        // Obtenemos una referencia al elemento <select id="codigo">
        const selectElement = document.getElementById('codigo');
        
        // Insertamos el encabezado principal justo antes del <select>
        if (selectElement) {
             selectElement.insertAdjacentHTML('beforebegin', headerPrincipalHtml);
        }

        // 2. Filtrar solo las cuentas de 'NIVEL': '0' para el selector
        const cuentasDetalle = cuentas.filter(c => c.NIVEL === '0');

        // 3. Llenar el <select> con las cuentas de detalle
        cuentasDetalle.forEach(cuenta => {
            const option = document.createElement('option');
            option.value = cuenta.CODIGO;
            option.textContent = `${cuenta.CODIGO} - ${cuenta.NOMBRE}`;
            selectElement.appendChild(option);
        });

        console.log(`Plan de cuentas cargado. Se encontraron ${cuentasDetalle.length} cuentas de detalle.`);

    } catch (error) {
        console.error("Error al cargar el plan de cuentas:", error);
        alert(`No se pudo cargar el plan de cuentas. Verifique la consola para más detalles. Error: ${error.message}`);
        
        const select = document.getElementById('codigo');
        if (select) {
            select.innerHTML = '<option value="">-- Error al cargar datos --</option>';
        }
    }
}


function consultar() {
    const codigo_cuenta = document.getElementById('codigo').value;
    const resultado = document.getElementById('resultado');
    
    // Título de consulta (Se genera sin la CIA/Mes/Año que ya se muestran arriba)
    const headerTituloHtml = `
        <div class="consulta-info-header" style="border-bottom: none; margin: 0 auto 10px auto;">
            <div class="consulta-cuenta-title" style="margin-top: 0;">CONSULTA DE CUENTA</div>
        </div>`;

    if (!codigo_cuenta) {
        resultado.innerHTML = `
            ${headerTituloHtml}
            <p style="color:red; margin-top: 10px;">Por favor, seleccione un código de cuenta.</p>`;
        return;
    }

    const cuenta = cuentas.find(c => c.CODIGO === codigo_cuenta);

    if (!cuenta) {
        resultado.innerHTML = `
            ${headerTituloHtml}
            <p style="color:red; margin-top: 10px;">No se encontró la cuenta con código ${codigo_cuenta}.</p>`;
        return;
    }

    // Lógica de cálculo 
    const saldo_anterior = parseMonto(cuenta.SALDO_ANTERIOR);
    const debitos = parseMonto(cuenta.DEBITOS_MES);
    const creditos = parseMonto(cuenta.CREDITOS_MES);
    const saldo_calculado_num = saldo_anterior + debitos - creditos;

    let saldo_calculado_span = '<span>0,00</span>';
    if (!isNaN(saldo_calculado_num) && saldo_calculado_num !== 0) {
        const color = saldo_calculado_num >= 0 ? 'black' : 'red';
        saldo_calculado_span = `<span style="color:${color}">${saldo_calculado_num.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}</span>`;
    }

    // ESTRUCTURA HTML FINAL
    resultado.innerHTML = `
        ${headerTituloHtml}
        
        <div class="consulta-detalle-box">
            <div class="consulta-header">
                <div><strong>CÓDIGO:</strong> ${cuenta.CODIGO}</div>
                <div><strong>NOMBRE:</strong> ${cuenta.NOMBRE}</div>
            </div>
            
            <div class="movimientos-grid">
                <div><strong>SALDO ANTERIOR:</strong> ${pintar(cuenta.SALDO_ANTERIOR)}</div>
                <div><strong>DÉBITOS DEL MES:</strong> ${pintar(cuenta.DEBITOS_MES)}</div>
                <div><strong>CRÉDITOS DEL MES:</strong> ${pintar(cuenta.CREDITOS_MES)}</div>
            </div>
            
            <hr style="border-top: 1px dashed #aaa; margin: 8px 0;">
            
            <div class="saldo-calculado-row">
                <div><strong>SALDO ACTUAL:</strong></div>
                <div class="valor-calculado">${saldo_calculado_span}</div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', cargarPlanDeCuentas);
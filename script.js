let cuentas = [];
const VERSION = "20251203"; 

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
 * Función que carga los datos de cgcodigos.json
 */
async function cargarPlanDeCuentas() {
    try {
        const response = await fetch('cgcodigos.json');
        
        if (!response.ok) {
            throw new Error(`Error de red o archivo no encontrado: ${response.status}`);
        }
        
        cuentas = await response.json();

        // 1. Filtrar solo las cuentas de 'NIVEL': '0' para el selector
        const cuentasDetalle = cuentas.filter(c => c.NIVEL === '0');

        const select = document.getElementById('codigo');
        
        // 2. Llenar el <select> con las cuentas de detalle
        cuentasDetalle.forEach(cuenta => {
            const option = document.createElement('option');
            option.value = cuenta.CODIGO;
            option.textContent = `${cuenta.CODIGO} - ${cuenta.NOMBRE}`;
            select.appendChild(option);
        });

        console.log(`Plan de cuentas cargado. Se encontraron ${cuentasDetalle.length} cuentas de detalle.`);

    } catch (error) {
        console.error("Error al cargar el plan de cuentas:", error);
        alert(`No se pudo cargar el plan de cuentas. Verifique la consola para más detalles. Error: ${error.message}`);
        
        const select = document.getElementById('codigo');
        select.innerHTML = '<option value="">-- Error al cargar datos --</option>';
    }
}


function consultar() {
    const codigo_cuenta = document.getElementById('codigo').value;
    const resultado = document.getElementById('resultado');
    
    // --- LÓGICA PARA EXTRAER EL ENCABEZADO DE LA COMPAÑÍA Y FECHA ---
    const infoHeader = cuentas[0]; // Primer registro del JSON

    // 1. Nombre de la Compañía
    const nombreCia = infoHeader.NOMBRE;

    // 2. Extraer y Formatear Mes/Año de Proceso (asume MMYY en los últimos 4 dígitos antes del signo)
    const saldoAnteriorHeader = String(infoHeader.SALDO_ANTERIOR).replace(/[^0-9]/g, ''); // Quita signo
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

    // 3. Crear el nuevo encabezado de información
    const headerHtml = `
        <div class="consulta-info-header">
            <div><strong>CIA:</strong> ${nombreCia}</div>
            <div><strong>MES/AÑO PROCESO:</strong> ${mesAnioProceso}</div>
            <div class="consulta-cuenta-title">CONSULTA DE CUENTA</div>
        </div>
        <br>`;
    // ----------------------------------------------------------------------


    if (!codigo_cuenta) {
        // Muestra el encabezado incluso si falta la cuenta
        resultado.innerHTML = `
            ${headerHtml}
            <p style="color:red;">Por favor, seleccione un código de cuenta.</p>`;
        return;
    }

    const cuenta = cuentas.find(c => c.CODIGO === codigo_cuenta);

    if (!cuenta) {
        resultado.innerHTML = `
            ${headerHtml}
            <p style="color:red;">No se encontró la cuenta con código ${codigo_cuenta}.</p>`;
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

    // Estructura HTML final
    resultado.innerHTML = `
        ${headerHtml}
        
        <div class="consulta-header">
            <div><strong>CÓDIGO:</strong> ${cuenta.CODIGO}</div>
            <div><strong>NOMBRE:</strong> ${cuenta.NOMBRE}</div>
        </div>
        
        <div class="movimientos-grid">
            <div><strong>SALDO ANTERIOR:</strong> ${pintar(cuenta.SALDO_ANTERIOR)}</div>
            <div><strong>DÉBITOS DEL MES:</strong> ${pintar(cuenta.DEBITOS_MES)}</div>
            <div><strong>CRÉDITOS DEL MES:</strong> ${pintar(cuenta.CREDITOS_MES)}</div>
        </div>
        
        <hr style="border-top: 1px dashed #aaa; margin: 15px 0;">
        
        <div class="saldo-calculado-row">
            <div><strong>SALDO ACTUAL:</strong></div>
            <div class="valor-calculado">${saldo_calculado_span}</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', cargarPlanDeCuentas);
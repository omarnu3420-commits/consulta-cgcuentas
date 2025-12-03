let cuentas = [];
const VERSION = "20251202"; // Versión fija para consistencia

// Convierte un valor con signo al final en número decimal
// Ejemplo: "000024307-" → -243.07
function parseMonto(valor) {
    if (!valor) return NaN;
    const s = String(valor).trim();

    const last = s[s.length - 1];
    let signo = 1;
    let cuerpo = s;

    if (last === '-' || last === '+') {
        signo = (last === '-') ? -1 : 1;
        cuerpo = s.slice(0, -1); // quitar el signo final
    }

    const entero = parseInt(cuerpo, 10);
    if (isNaN(entero)) return NaN;

    return signo * (entero / 100); // dividir por 100 una sola vez
}

// Da formato de moneda (es-VE) y color (rojo si es negativo)
function pintar(valorRaw) {
    const num = parseMonto(valorRaw);
    if (isNaN(num) || num === 0) return '<span>0,00</span>'; // Mostrar 0,00
    const color = num >= 0 ? 'black' : 'red';
    return `<span style="color:${color}">${num.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}</span>`;
}

/**
 * Función que carga los datos de cgcodigos.json, filtra las cuentas de detalle (Nivel 0)
 * y llena el selector.
 */
async function cargarPlanDeCuentas() {
    try {
        // CORRECCIÓN: Usar fetch() para cargar el JSON
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
        
        // Mensaje de error visible
        const select = document.getElementById('codigo');
        select.innerHTML = '<option value="">-- Error al cargar datos --</option>';
    }
}


function consultar() {
    const codigo_cuenta = document.getElementById('codigo').value;
    const resultado = document.getElementById('resultado');

    if (!codigo_cuenta) {
        resultado.innerHTML = '<p style="color:red;">Por favor, seleccione un código de cuenta.</p>';
        return;
    }

    const cuenta = cuentas.find(c => c.CODIGO === codigo_cuenta);

    if (!cuenta) {
        resultado.innerHTML = `<p style="color:red;">No se encontró la cuenta con código ${codigo_cuenta}.</p>`;
        return;
    }

    // 1. Obtener valores como números
    const saldo_anterior = parseMonto(cuenta.SALDO_ANTERIOR);
    const debitos = parseMonto(cuenta.DEBITOS_MES);
    const creditos = parseMonto(cuenta.CREDITOS_MES);

    // 2. Calcular el Saldo (FÓRMULA: Saldo Anterior + Débitos - Créditos)
    const saldo_calculado_num = saldo_anterior + debitos - creditos;

    // 3. Formatear el saldo calculado (misma lógica que pintar)
    let saldo_calculado_span = '<span>0,00</span>';
    if (!isNaN(saldo_calculado_num) && saldo_calculado_num !== 0) {
        const color = saldo_calculado_num >= 0 ? 'black' : 'red';
        saldo_calculado_span = `<span style="color:${color}">${saldo_calculado_num.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}</span>`;
    }

    // ESTRUCTURA HTML ACTUALIZADA
    // Se ha quitado la comparación con SALDO EN JSON y se renombra a SALDO ACTUAL.
    resultado.innerHTML = `
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

// Asegurar que la función de carga se ejecute automáticamente al iniciar la app
document.addEventListener('DOMContentLoaded', cargarPlanDeCuentas);
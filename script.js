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
    if (isNaN(num) || num === 0) return '<span>0,00</span>'; // Mostrar 0,00 en lugar de —
    const color = num >= 0 ? 'black' : 'red';
    return `<span style="color:${color}">${num.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}</span>`;
}

// 1. Cargar el JSON y poblar el selector (dropdown)
fetch(`cgcodigos.json?v=${VERSION}`, { cache: 'no-store' })
    .then(response => response.json())
    .then(data => {
        cuentas = data;
        const select = document.getElementById("codigo");
        
        // 🔹 MEJORA: Solo mostrar las cuentas de detalle (NIVEL: "0") en el selector.
        data.filter(cuenta => cuenta.NIVEL === "0").forEach(cuenta => {
            const opcion = document.createElement("option");
            opcion.value = cuenta.CODIGO;
            opcion.textContent = `${cuenta.CODIGO} - ${cuenta.NOMBRE}`;
            select.appendChild(opcion);
        });
    });

// 2. Función principal para realizar la consulta
function consultar() {
    const codigo = document.getElementById("codigo").value;
    const resultado = document.getElementById("resultado");
    const cuenta = cuentas.find(c => c.CODIGO === codigo);

    if (!cuenta) {
        resultado.innerHTML = "<h3>Seleccione un código de cuenta válido.</h3>";
        return;
    }

    // 1. Parsear todos los montos a números
    const saldo_anterior = parseMonto(cuenta.SALDO_ANTERIOR);
    const debitos = parseMonto(cuenta.DEBITOS_MES);
    const creditos = parseMonto(cuenta.CREDITOS_MES);

    // 2. Calcular el saldo (Número)
    // ⚠️ CORRECCIÓN CRÍTICA: Se calcula el saldo numérico y se formatea por separado.
    // FÓRMULA: Saldo Anterior + Débitos - Créditos
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
        
        <div class="saldos-finales">
            <div><strong>SALDO ACTUAL (Según JSON):</strong> ${pintar(cuenta.SALDO_ACTUAL)}</div>
            <div class="calculated-saldo"><strong>SALDO CALCULADO:</strong> ${saldo_calculado_span}</div>
        </div>
    `;
}
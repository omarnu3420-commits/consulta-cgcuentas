// ... (código JavaScript anterior, sin cambios) ...

    // ... (código para calcular saldo_calculado_num y saldo_calculado_span, sin cambios) ...

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
            <div><strong>SALDO CALCULADO:</strong></div>
            <div class="valor-calculado">${saldo_calculado_span}</div>
        </div>
        
        <div class="saldo-json-row">
            <div><strong>SALDO EN JSON:</strong></div>
            <div class="valor-json">${pintar(cuenta.SALDO_ACTUAL)}</div>
        </div>
    `;
}

// ... (resto del código JavaScript, sin cambios) ...
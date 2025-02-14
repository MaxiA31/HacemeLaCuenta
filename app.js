// Obtener elementos del formulario
const form = document.getElementById('gastos-form');
const nombreInput = document.getElementById('nombre');
const aportoSelect = document.getElementById('aporto');
const tipoAportoSelect = document.getElementById('tipo-aporto');
const asistioDespuesDeComerSelect = document.getElementById('asisitio-despues-de-comer');
const montoInput = document.getElementById('monto');
const gastosTbody = document.getElementById('gastos-tbody');
const calcularGastosBtn = document.getElementById('calcular-gastos-btn');
const detallePagoTable = document.getElementById('detalle-pago-table');
const detallePagoTbody = document.getElementById('detalle-pago-tbody');

// Función para agregar un gasto a la tabla
function agregarGasto(gasto) {
  const gastoRow = document.createElement('tr');
  gastoRow.innerHTML = `
    <td>${gasto.nombre}</td>
    <td>${gasto.aporto}</td>
    <td>${gasto.tipoAporto}</td>
    <td>${gasto.asistioDespuesDeComer}</td>
    <td>${gasto.monto.toFixed(2)}</td>
  `;
  gastosTbody.appendChild(gastoRow);
}

// Evento de envío del formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const gasto = {
    nombre: nombreInput.value.trim(),
    aporto: aportoSelect.value,
    tipoAporto: tipoAportoSelect.value,
    asistioDespuesDeComer: asistioDespuesDeComerSelect.value || 'no',
    monto: parseFloat(montoInput.value) || 0
  };

  // Validaciones
  if (gasto.aporto === 'si') {
    if (!gasto.tipoAporto) {
      alert("Debe seleccionar un tipo de aporte");
      return;
    }
    if (gasto.monto <= 0) {
      alert("Debe ingresar un monto válido");
      return;
    }
  } else {
    gasto.tipoAporto = '';
    gasto.monto = 0;
  }

  agregarGasto(gasto);
  calcularTotal();
  
  // Resetear campos
  nombreInput.value = '';
  aportoSelect.value = '';
  tipoAportoSelect.value = 'comida';
  asistioDespuesDeComerSelect.value = '';
  montoInput.value = '';
});

// Habilitar/deshabilitar tipo de aporte
aportoSelect.addEventListener('change', (e) => {
  tipoAportoSelect.disabled = e.target.value !== 'si';
});

// Calcular total general
function calcularTotal() {
  const total = Array.from(gastosTbody.children).reduce(
    (sum, row) => sum + parseFloat(row.cells[4].textContent),
    0
  );
  document.getElementById('total-span').textContent = total.toFixed(2);
}

// Calcular detalles de pagos
calcularGastosBtn.addEventListener('click', () => {
  if (!gastosTbody.children.length) {
    alert('No hay gastos para calcular');
    return;
  }

  // Obtener participantes
  const todosParticipantes = Array.from(gastosTbody.children).map(
    row => row.cells[0].textContent.toLowerCase()
  );
  const participantesComida = Array.from(gastosTbody.children)
    .filter(row => row.cells[3].textContent === 'no')
    .map(row => row.cells[0].textContent.toLowerCase());

  const participantesUnicos = [...new Set(todosParticipantes)];
  const participantesComidaUnicos = [...new Set(participantesComida)];
  
  // Calcular totales por categoría
  let totalComida = 0, totalBebida = 0;
  Array.from(gastosTbody.children).forEach(row => {
    const monto = parseFloat(row.cells[4].textContent);
    if (row.cells[2].textContent === 'comida') totalComida += monto;
    if (row.cells[2].textContent === 'bebida') totalBebida += monto;
  });

  // Costos individuales
  const costoPorComida = participantesComidaUnicos.length > 0 
    ? totalComida / participantesComidaUnicos.length 
    : 0;
  const costoPorBebida = participantesUnicos.length > 0 
    ? totalBebida / participantesUnicos.length 
    : 0;

  // Calcular deudas
  const balances = {};
  participantesUnicos.forEach(nombre => {
    const aportes = Array.from(gastosTbody.children).filter(
      row => row.cells[0].textContent.toLowerCase() === nombre
    );

    // Determinar asistencia
    const asistioAComer = participantesComidaUnicos.includes(nombre);

    // Inicializar balance
    balances[nombre] = {
      debeComida: asistioAComer ? costoPorComida : 0,
      debeBebida: costoPorBebida,
      aportoComida: 0,
      aportoBebida: 0
    };

    // Aplicar aportes
    aportes.forEach(aporte => {
      const monto = parseFloat(aporte.cells[4].textContent);
      if (aporte.cells[2].textContent === 'comida') {
        balances[nombre].aportoComida += monto;
      } else if (aporte.cells[2].textContent === 'bebida') {
        balances[nombre].aportoBebida += monto;
      }
    });
  });

  // Generar resultados
  detallePagoTbody.innerHTML = '';
  Object.entries(balances).forEach(([nombre, balance]) => {
    const netoComida = balance.debeComida - balance.aportoComida;
    const netoBebida = balance.debeBebida - balance.aportoBebida;
    const total = netoComida + netoBebida;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${nombre.charAt(0).toUpperCase() + nombre.slice(1)}</td>
      <td>${total > 0 ? 'Debe pagar' : total < 0 ? 'Debe recibir' : 'Nada'}</td>
      <td>${Math.abs(total).toFixed(2)}</td>
    `;
    detallePagoTbody.appendChild(row);
  });

  detallePagoTable.style.display = 'table';
});
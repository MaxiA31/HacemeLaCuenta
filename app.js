// Obtener elementos del formulario
const form = document.getElementById('gastos-form');
const nombreInput = document.getElementById('nombre');
const aportoSelect = document.getElementById('aporto');
const tipoAportoSelect = document.getElementById('tipo-aporto');
const asisitioDespuesDeComerSelect = document.getElementById('asisitio-despues-de-comer');
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
    <td>${gasto.asisitioDespuesDeComer}</td>
    <td>${gasto.monto}</td>
  `;
  gastosTbody.appendChild(gastoRow);
}

// Evento de envío del formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const gasto = {
    nombre: nombreInput.value,
    aporto: aportoSelect.value,
    tipoAporto: tipoAportoSelect.value,
    asisitioDespuesDeComer: asisitioDespuesDeComerSelect.value,
    monto: parseFloat(montoInput.value) || 0
  };
  if (gasto.aporto === 'no') {
    gasto.tipoAporto = '';
    gasto.monto = 0;
    tipoAportoSelect.disabled = true;
  } else {
    tipoAportoSelect.disabled = false;
  }
  if (gasto.asisitioDespuesDeComer === '') {
    asisitioDespuesDeComer:'no';
}
  if (gasto.tipoAporto === "" && gasto.aporto === 'si') {
    alert("Debe seleccionar un tipo de aporte");
    return;
  }
  if (gasto.monto === 0 && gasto.aporto === 'si') {
    alert("Debe ingresar un monto");
    return;
  }

  agregarGasto(gasto);
  calcularTotal();
  //vacio campos
  nombreInput.value = '';
  aportoSelect.value = 'no';
  tipoAportoSelect.value = 'comida';
  asisitioDespuesDeComerSelect.value = 'no';
  montoInput.value = 0;
}
);

// Evento de cambio en el select de aporte
aportoSelect.addEventListener('change', (e) => {
  if (e.target.value === 'no') {
    tipoAportoSelect.disabled = true;
  } else {
    tipoAportoSelect.disabled = false;
  }
});

// Función para calcular el total de los gastos
function calcularTotal() {
  const gastosRows = gastosTbody.children;
  const total = Array.from(gastosRows).reduce((acum, gastoRow) => acum + parseFloat(gastoRow.cells[4].textContent), 0);
  const totalSpan = document.getElementById('total-span');
  totalSpan.textContent = `${total.toFixed(2)}`;
}

// Evento de clic en el botón de calcular gastos
calcularGastosBtn.addEventListener('click', () => {
  if (gastosTbody.children.length === 0) {
    alert('No hay gastos para calcular');
    return;
  }

  console.log('Calculando gastos... cantidad de gastos: ', gastosTbody.children.length);
  detallePagoTable.style.display = 'block';

  // Clear existing rows in detallePagoTbody
  detallePagoTbody.innerHTML = '';

  const participantes = [...new Set(Array.from(gastosTbody.children).map(gastoRow => gastoRow.cells[0].textContent.toLowerCase()))].length;
  const total = parseFloat(document.getElementById('total-span').textContent.split(': ')[1]);

  let totalComida = 0;
  let totalBebida = 0;
  Array.from(gastosTbody.children).forEach((gastoRow) => {
    const tipoAporto = gastoRow.cells[2].textContent;
    const monto = parseFloat(gastoRow.cells[4].textContent);
    if (tipoAporto === 'comida') {
      totalComida += monto;
    } else if (tipoAporto === 'bebida') {
      totalBebida += monto;
    }
  });

  const totalComidaSinDespuesDeComer = totalComida - Array.from(gastosTbody.children).filter((gastoRow) => gastoRow.cells[3].textContent === 'Sí').reduce((acum, gastoRow) => acum + parseFloat(gastoRow.cells[4].textContent), 0);

  const rowsPorNombre = {};
  Array.from(gastosTbody.children).forEach((gastoRow) => {
    const nombre = gastoRow.cells[0].textContent.toLowerCase();
    const tipoAporto = gastoRow.cells[2].textContent;
    const monto = parseFloat(gastoRow.cells[4].textContent);
    const asisitioDespuesDeComer = gastoRow.cells[3].textContent === 'Sí';

    let debePagarComida=0;
    let  debePagarBebida=0;
    if (tipoAporto === 'comida' && !asisitioDespuesDeComer) {
      debePagarComida = (totalComidaSinDespuesDeComer / participantes) - monto;
    } else if (tipoAporto === 'bebida') {
      debePagarBebida = (totalBebida / participantes) - monto;
    } else if (asisitioDespuesDeComer) {
      debePagarComida = 0;
    } else {
      debePagarComida = totalComidaSinDespuesDeComer / participantes;
      debePagarBebida = totalBebida / participantes;
    }
    let debePagar = debePagarComida + debePagarBebida;
    if (!rowsPorNombre[nombre]) {
      rowsPorNombre[nombre] = {
        debePagarComida: 0,
        debePagarBebida: 0,
        debePagar: 0
      };
    }
    rowsPorNombre[nombre].debePagarComida += debePagarComida;
    rowsPorNombre[nombre].debePagarBebida += debePagarBebida;
    rowsPorNombre[nombre].debePagar += debePagar;
  });

  Object.entries(rowsPorNombre).forEach(([nombre, {debePagarComida, debePagarBebida, debePagar}]) => {
    let debePagarTxt;
    if (debePagar > 0) {
      debePagarTxt = debePagar.toFixed(2);
    } else {
      debePagarTxt = (-debePagar).toFixed(2);
    }
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${nombre.charAt(0).toUpperCase() + nombre.slice(1)}</td>
      <td>${debePagar > 0 ? 'Debe pagar' : 'Debe recibir'}</td>
      <td>${debePagarTxt}</td>
    `;

    detallePagoTbody.appendChild(row);
  });

});




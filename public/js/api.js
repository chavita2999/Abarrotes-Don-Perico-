// api.js - Cliente API para conectar frontend con backend
// Abarrotes Don Perico

const API_URL = 'http://localhost:3001/api';

// ============================================
// FUNCIONES PARA EMPLEADOS
// ============================================

async function obtenerEmpleados() {
  try {
    const response = await fetch(`${API_URL}/empleados`);
    const empleados = await response.json();
    return empleados;
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    return [];
  }
}

async function obtenerEmpleado(id) {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`);
    const empleado = await response.json();
    return empleado;
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    return null;
  }
}

async function crearEmpleado(empleado) {
  try {
    const response = await fetch(`${API_URL}/empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empleado)
    });
    const nuevoEmpleado = await response.json();
    return nuevoEmpleado;
  } catch (error) {
    console.error('Error al crear empleado:', error);
    return null;
  }
}

async function actualizarEmpleado(id, empleado) {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empleado)
    });
    const empleadoActualizado = await response.json();
    return empleadoActualizado;
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    return null;
  }
}

async function eliminarEmpleado(id) {
  try {
    const response = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'DELETE'
    });
    const resultado = await response.json();
    return resultado;
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    return null;
  }
}

// ============================================
// FUNCIONES PARA ASISTENCIAS
// ============================================

async function obtenerAsistencias(filtros = {}) {
  try {
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${API_URL}/asistencias?${params}`);
    const asistencias = await response.json();
    return asistencias;
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return [];
  }
}

async function obtenerAsistenciasHoy() {
  try {
    const response = await fetch(`${API_URL}/asistencias/hoy`);
    const asistencias = await response.json();
    return asistencias;
  } catch (error) {
    console.error('Error al obtener asistencias de hoy:', error);
    return [];
  }
}

async function registrarEntrada(id_empleado, fecha, hora_entrada) {
  try {
    const response = await fetch(`${API_URL}/asistencias/entrada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_empleado, fecha, hora_entrada })
    });
    const asistencia = await response.json();
    return asistencia;
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    return null;
  }
}

async function registrarSalida(id_registro, hora_salida) {
  try {
    const response = await fetch(`${API_URL}/asistencias/salida/${id_registro}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora_salida })
    });
    const asistencia = await response.json();
    return asistencia;
  } catch (error) {
    console.error('Error al registrar salida:', error);
    return null;
  }
}

// ============================================
// FUNCIONES PARA NÓMINAS
// ============================================

async function obtenerNominas() {
  try {
    const response = await fetch(`${API_URL}/nominas`);
    const nominas = await response.json();
    return nominas;
  } catch (error) {
    console.error('Error al obtener nóminas:', error);
    return [];
  }
}

async function obtenerNomina(id) {
  try {
    const response = await fetch(`${API_URL}/nominas/${id}`);
    const nomina = await response.json();
    return nomina;
  } catch (error) {
    console.error('Error al obtener nómina:', error);
    return null;
  }
}

async function generarNomina(periodo_inicio, periodo_fin) {
  try {
    const response = await fetch(`${API_URL}/nominas/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodo_inicio, periodo_fin })
    });
    const nomina = await response.json();
    return nomina;
  } catch (error) {
    console.error('Error al generar nómina:', error);
    return null;
  }
}

// ============================================
// FUNCIONES PARA REPORTES
// ============================================

async function obtenerReportes() {
  try {
    const response = await fetch(`${API_URL}/reportes`);
    const reportes = await response.json();
    return reportes;
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return [];
  }
}

async function crearReporte(id_nomina, tipo, rango_inicio, rango_fin) {
  try {
    const response = await fetch(`${API_URL}/reportes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_nomina, tipo, rango_inicio, rango_fin })
    });
    const reporte = await response.json();
    return reporte;
  } catch (error) {
    console.error('Error al crear reporte:', error);
    return null;
  }
}

// ============================================
// FUNCIONES PARA DASHBOARD
// ============================================

async function obtenerEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return null;
  }
}

async function obtenerUsuarios() {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    const usuarios = await response.json();
    return usuarios;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

// ============================================
// UTILIDADES
// ============================================

function formatearFecha(fecha) {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const año = d.getFullYear();
  return `${dia}/${mes}/${año}`;
}

function formatearHora(hora) {
  if (!hora) return 'Sin registro';
  return hora.substring(0, 5); // HH:MM
}

function formatearMoneda(monto) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
}

// ============================================
// EJEMPLOS DE USO EN HTML
// ============================================

// EJEMPLO 1: Cargar tabla de empleados
async function cargarTablaEmpleados() {
  const empleados = await obtenerEmpleados();
  const tbody = document.getElementById('tabla-empleados-body');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (empleados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay empleados registrados</td></tr>';
    return;
  }
  
  empleados.forEach(emp => {
    const fila = `
      <tr>
        <td>${emp.id_empleado}</td>
        <td>${emp.nombre} ${emp.apellido}</td>
        <td>${emp.puesto || 'N/A'}</td>
        <td>${formatearMoneda(emp.pago_x_hora)}</td>
        <td>${emp.telefono || 'N/A'}</td>
        <td>${formatearHora(emp.horario_entrada)} - ${formatearHora(emp.horario_salida)}</td>
        <td>
          <span class="badge ${emp.estado === 'Activo' ? 'bg-success' : 'bg-danger'}">
            ${emp.estado}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editarEmpleado(${emp.id_empleado})">
            Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="confirmarEliminarEmpleado(${emp.id_empleado})">
            Eliminar
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += fila;
  });
}

// EJEMPLO 2: Cargar asistencias del día
async function cargarAsistenciasHoy() {
  const asistencias = await obtenerAsistenciasHoy();
  const contenedor = document.getElementById('lista-asistencias-hoy');
  
  if (!contenedor) return;
  
  contenedor.innerHTML = '';
  
  if (asistencias.length === 0) {
    contenedor.innerHTML = '<p class="text-muted">No hay asistencias registradas hoy</p>';
    return;
  }
  
  asistencias.forEach(asist => {
    const card = `
      <div class="card mb-2">
        <div class="card-body">
          <h6>${asist.nombre} ${asist.apellido}</h6>
          <div class="d-flex justify-content-between">
            <span>Entrada: <strong>${formatearHora(asist.hora_entrada)}</strong></span>
            <span>Salida: <strong>${formatearHora(asist.hora_salida)}</strong></span>
          </div>
          ${asist.es_retardo ? '<span class="badge bg-warning">Retardo</span>' : ''}
          ${asist.horas_trabajadas ? `<p class="mb-0 mt-2">Horas: ${asist.horas_trabajadas.toFixed(2)}h</p>` : ''}
        </div>
      </div>
    `;
    contenedor.innerHTML += card;
  });
}

// EJEMPLO 3: Cargar estadísticas del dashboard
async function cargarDashboard() {
  const stats = await obtenerEstadisticas();
  
  if (!stats) return;
  
  if (document.getElementById('stat-empleados')) {
    document.getElementById('stat-empleados').textContent = stats.empleados_activos;
  }
  
  if (document.getElementById('stat-asistencias')) {
    document.getElementById('stat-asistencias').textContent = stats.asistencias_hoy;
  }
  
  if (document.getElementById('stat-horas')) {
    document.getElementById('stat-horas').textContent = stats.horas_semanales;
  }
  
  if (document.getElementById('stat-retardos')) {
    document.getElementById('stat-retardos').textContent = stats.retardos_hoy;
  }
}

// EJEMPLO 4: Cargar nóminas
async function cargarNominas() {
  const nominas = await obtenerNominas();
  const tbody = document.getElementById('tabla-nominas-body');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (nominas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay nóminas generadas</td></tr>';
    return;
  }
  
  nominas.forEach(nom => {
    const fila = `
      <tr>
        <td>${nom.id_nomina}</td>
        <td>${formatearFecha(nom.periodo_inicio)}</td>
        <td>${formatearFecha(nom.periodo_fin)}</td>
        <td>${nom.total_horas_semanal.toFixed(2)}h</td>
        <td>${formatearMoneda(nom.total_pago_semanal)}</td>
        <td>${formatearFecha(nom.fecha_generacion)}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="verDetalleNomina(${nom.id_nomina})">
            Ver Detalle
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += fila;
  });
}

// EJEMPLO 5: Formulario para crear empleado
async function guardarEmpleado(event) {
  event.preventDefault();
  
  const empleado = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    telefono: document.getElementById('telefono').value,
    pago_x_hora: parseFloat(document.getElementById('pago_x_hora').value),
    horario_entrada: document.getElementById('horario_entrada').value,
    horario_salida: document.getElementById('horario_salida').value
  };
  
  const resultado = await crearEmpleado(empleado);
  
  if (resultado) {
    alert('Empleado creado exitosamente');
    window.location.reload();
  } else {
    alert('Error al crear empleado');
  }
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Detectar qué página estamos viendo y cargar datos correspondientes
  
  // Dashboard
  if (document.getElementById('stat-empleados')) {
    cargarDashboard();
  }
  
  // Empleados
  if (document.getElementById('tabla-empleados-body')) {
    cargarTablaEmpleados();
  }
  
  // Asistencias
  if (document.getElementById('lista-asistencias-hoy')) {
    cargarAsistenciasHoy();
  }
  
  // Nóminas
  if (document.getElementById('tabla-nominas-body')) {
    cargarNominas();
  }
});
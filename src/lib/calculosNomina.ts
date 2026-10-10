// =====================================================
// LIBRERÍA DE CÁLCULOS DE NÓMINA COLOMBIANA
// Cumplimiento legal: Código Sustantivo del Trabajo
// Actualizado 2026
// =====================================================

export interface ConfigNomina {
  salario_minimo: number;
  auxilio_transporte: number;
  porcentaje_cesantias: number;
  porcentaje_intereses_cesantias: number;
  porcentaje_prima: number;
  porcentaje_vacaciones: number;
  porcentaje_salud_empleador: number;
  porcentaje_pension_empleador: number;
  porcentaje_arl_riesgo_i: number;
  porcentaje_arl_riesgo_ii: number;
  porcentaje_arl_riesgo_iii: number;
  porcentaje_arl_riesgo_iv: number;
  porcentaje_arl_riesgo_v: number;
  recargo_hora_extra_diurna: number;
  recargo_hora_extra_nocturna: number;
  recargo_dominical_festivo: number;
  recargo_nocturno_dominical: number;
  tope_salario_integral: number;
}

export const CONFIG_DEFAULT: ConfigNomina = {
  salario_minimo: 1300000,
  auxilio_transporte: 162000,
  porcentaje_cesantias: 0.0833,
  porcentaje_intereses_cesantias: 0.12,
  porcentaje_prima: 0.0833,
  porcentaje_vacaciones: 0.0417,
  porcentaje_salud_empleador: 0.085,
  porcentaje_pension_empleador: 0.12,
  porcentaje_arl_riesgo_i: 0.00522,
  porcentaje_arl_riesgo_ii: 0.01044,
  porcentaje_arl_riesgo_iii: 0.02436,
  porcentaje_arl_riesgo_iv: 0.04350,
  porcentaje_arl_riesgo_v: 0.06960,
  recargo_hora_extra_diurna: 0.25,
  recargo_hora_extra_nocturna: 0.75,
  recargo_dominical_festivo: 0.75,
  recargo_nocturno_dominical: 1.50,
  tope_salario_integral: 16958360,
};

// =====================================================
// CÁLCULO DE PRESTACIONES SOCIALES
// =====================================================

export function calcularPrestaciones(
  salarioBase: number,
  diasTrabajados: number,
  config: ConfigNomina = CONFIG_DEFAULT,
  esSalarioIntegral: boolean = false,
  riesgoARL: string = 'I'
) {
  const salarioDiario = salarioBase / 30;
  const salarioPeriodo = salarioDiario * diasTrabajados;

  // Base para prestaciones: si es salario integral, se usa el 70% (factor prestacional)
  // y con tope de 13 SMMLV
  let basePrestaciones = salarioPeriodo;
  let baseSeguridadSocial = salarioPeriodo;

  if (esSalarioIntegral) {
    const topeMensual = config.tope_salario_integral;
    const baseMensualInt = Math.min(salarioBase, topeMensual) * 0.7;
    basePrestaciones = (baseMensualInt / 30) * diasTrabajados;
    baseSeguridadSocial = basePrestaciones;
  }

  // Prestaciones sociales (empleador paga)
  const cesantias = basePrestaciones * config.porcentaje_cesantias;
  const interesesCesantias = cesantias * config.porcentaje_intereses_cesantias * (diasTrabajados / 360);
  const prima = basePrestaciones * config.porcentaje_prima;
  const vacaciones = basePrestaciones * config.porcentaje_vacaciones;

  // Seguridad social (empleador paga)
  const saludEmpleador = baseSeguridadSocial * config.porcentaje_salud_empleador;
  const pensionEmpleador = baseSeguridadSocial * config.porcentaje_pension_empleador;
  
  const porcentajeARL = 
    riesgoARL === 'V' ? config.porcentaje_arl_riesgo_v :
    riesgoARL === 'IV' ? config.porcentaje_arl_riesgo_iv :
    riesgoARL === 'III' ? config.porcentaje_arl_riesgo_iii :
    riesgoARL === 'II' ? config.porcentaje_arl_riesgo_ii :
    config.porcentaje_arl_riesgo_i;
  const arl = baseSeguridadSocial * porcentajeARL;

  // Deducciones del empleado
  const saludEmpleado = salarioPeriodo * 0.04; // 4%
  const pensionEmpleado = salarioPeriodo * 0.04; // 4%

  // Auxilio de transporte (solo si gana menos de 2 SMMLV y NO es salario integral)
  const auxilioTransporteDiario = config.auxilio_transporte / 30;
  const aplicaAuxilio = !esSalarioIntegral && salarioBase <= config.salario_minimo * 2;
  const auxilioTransporte = aplicaAuxilio ? auxilioTransporteDiario * diasTrabajados : 0;

  // Totales
  const totalPrestacionesEmpleador = cesantias + interesesCesantias + prima + vacaciones + saludEmpleador + pensionEmpleador + arl;
  const totalDeduccionesEmpleado = saludEmpleado + pensionEmpleado;
  const costoTotalEmpleador = salarioPeriodo + auxilioTransporte + totalPrestacionesEmpleador;

  return {
    // Prestaciones sociales
    cesantias: Math.round(cesantias),
    intereses_cesantias: Math.round(interesesCesantias),
    prima: Math.round(prima),
    vacaciones: Math.round(vacaciones),
    // Seguridad social empleador
    salud_empleador: Math.round(saludEmpleador),
    pension_empleador: Math.round(pensionEmpleador),
    arl: Math.round(arl),
    riesgo_arl_aplicado: porcentajeARL,
    // Deducciones empleado
    salud_empleado: Math.round(saludEmpleado),
    pension_empleado: Math.round(pensionEmpleado),
    // Auxilio transporte
    auxilio_transporte: Math.round(auxilioTransporte),
    aplica_auxilio: aplicaAuxilio,
    // Totales
    salario_periodo: Math.round(salarioPeriodo),
    total_prestaciones_empleador: Math.round(totalPrestacionesEmpleador),
    total_deducciones_empleado: Math.round(totalDeduccionesEmpleado),
    costo_total_empleador: Math.round(costoTotalEmpleador),
    neto_a_pagar: Math.round(salarioPeriodo + auxilioTransporte - totalDeduccionesEmpleado),
  };
}

// =====================================================
// CÁLCULO DE HORAS EXTRA
// =====================================================

export function calcularHorasExtra(
  salarioBase: number,
  horasExtraDiurnas: number = 0,
  horasExtraNocturnas: number = 0,
  horasExtraDominicales: number = 0,
  config: ConfigNomina = CONFIG_DEFAULT
) {
  // Valor hora ordinaria: salario mensual / 240 horas (30 días × 8 horas)
  const valorHoraBase = salarioBase / 240;

  const valorExtraDiurna = valorHoraBase * (1 + config.recargo_hora_extra_diurna);
  const valorExtraNocturna = valorHoraBase * (1 + config.recargo_hora_extra_nocturna);
  const valorExtraDominical = valorHoraBase * (1 + config.recargo_dominical_festivo);

  const totalDiurnas = horasExtraDiurnas * valorExtraDiurna;
  const totalNocturnas = horasExtraNocturnas * valorExtraNocturna;
  const totalDominicales = horasExtraDominicales * valorExtraDominical;
  const totalHorasExtra = totalDiurnas + totalNocturnas + totalDominicales;

  return {
    valor_hora_base: Math.round(valorHoraBase),
    valor_hora_extra_diurna: Math.round(valorExtraDiurna),
    valor_hora_extra_nocturna: Math.round(valorExtraNocturna),
    valor_hora_extra_dominical: Math.round(valorExtraDominical),
    horas_diurnas: horasExtraDiurnas,
    horas_nocturnas: horasExtraNocturnas,
    horas_dominicales: horasExtraDominicales,
    total_diurnas: Math.round(totalDiurnas),
    total_nocturnas: Math.round(totalNocturnas),
    total_dominicales: Math.round(totalDominicales),
    total_horas_extra: Math.round(totalHorasExtra),
  };
}

// =====================================================
// CÁLCULO DE COMISIONES POR VENTAS
// =====================================================

export function calcularComision(
  totalVentas: number,
  porcentajeComision: number
) {
  if (!porcentajeComision || porcentajeComision <= 0) {
    return { total_ventas: totalVentas, porcentaje: 0, comision: 0 };
  }
  const comision = totalVentas * (porcentajeComision / 100);
  return {
    total_ventas: totalVentas,
    porcentaje: porcentajeComision,
    comision: Math.round(comision),
  };
}

// =====================================================
// DETECCIÓN AUTOMÁTICA: nocturno, dominical, festivo
// =====================================================

export function detectarTipoHora(fecha: string, hora: string): {
  esNocturno: boolean;
  esDominical: boolean;
} {
  const fechaObj = new Date(`${fecha}T${hora}:00`);
  const diaSemana = fechaObj.getDay(); // 0=Domingo, 6=Sábado
  const horaNum = parseInt(hora.split(':')[0], 10);

  // Nocturno: entre 9PM (21) y 6AM (6)
  const esNocturno = horaNum >= 21 || horaNum < 6;
  // Dominical: día 0 (domingo)
  const esDominical = diaSemana === 0;

  return { esNocturno, esDominical };
}

// =====================================================
// CÁLCULO DE DISTANCIA ENTRE COORDENADAS (Haversine)
// =====================================================

export function calcularDistanciaMetros(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Radio tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =====================================================
// CÁLCULO DE DÍAS HÁBILES (excluye domingos y festivos Colombia)
// =====================================================

// Festivos Colombia 2026 (lista básica - se puede extender)
export const FESTIVOS_COLOMBIA_2026: string[] = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-03-29',
  '2026-03-30', '2026-05-01', '2026-05-14', '2026-06-04',
  '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
  '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
  '2026-12-08', '2026-12-25'
];

export function calcularDiasHabiles(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  let diasHabiles = 0;
  const actual = new Date(inicio);

  while (actual <= fin) {
    const diaSemana = actual.getDay();
    const fechaStr = actual.toISOString().split('T')[0];
    const esFestivo = FESTIVOS_COLOMBIA_2026.includes(fechaStr);
    const esDomingo = diaSemana === 0;

    if (!esDomingo && !esFestivo) {
      diasHabiles++;
    }
    actual.setDate(actual.getDate() + 1);
  }

  return diasHabiles;
}
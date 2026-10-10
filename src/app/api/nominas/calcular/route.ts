export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularPrestaciones, calcularHorasExtra, calcularComision, CONFIG_DEFAULT, ConfigNomina } from '@/lib/calculosNomina';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Calcular nómina completa para un periodo
// URL: /api/nominas/calcular?tenant=UUID&start=2026-10-01&end=2026-10-15
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const fechaInicio = url.searchParams.get('start');
    const fechaFin = url.searchParams.get('end');

    if (!tenantId || !fechaInicio || !fechaFin) {
      return NextResponse.json({
        success: false,
        error: 'Faltan: tenant, start, end'
      }, { status: 400 });
    }

    // 1. Obtener configuración de nómina del tenant
    let config: ConfigNomina = CONFIG_DEFAULT;
    const { data: configBD } = await supabase
      .from('configuracion_nomina')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (configBD) {
      config = { ...CONFIG_DEFAULT, ...configBD };
    }

    // 2. Obtener empleados activos
    const { data: empleados, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('activo', true);

    if (empErr) throw empErr;
    if (!empleados || empleados.length === 0) {
      return NextResponse.json({
        success: true,
        periodo: { inicio: fechaInicio, fin: fechaFin },
        resultados: [],
        totales: null,
        mensaje: 'No hay empleados activos'
      });
    }

    // 3. Para cada empleado: calcular nómina completa
    const resultados = [];

    for (const emp of empleados) {
      // 3.1 Obtener asistencias del periodo (para días y horas extra)
      const { data: asistencias } = await supabase
        .from('asistencias')
        .select('fecha, valor_horas_extra, horas_extra_diurnas, horas_extra_nocturnas, horas_extra_dominicales')
        .eq('empleado_id', emp.id)
        .eq('tenant_id', tenantId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      const diasTrabajados = new Set((asistencias || []).map((a: any) => a.fecha)).size;
      const totalHorasExtra = (asistencias || []).reduce((sum: number, a: any) => sum + Number(a.valor_horas_extra || 0), 0);
      const horasDiurnas = (asistencias || []).reduce((sum: number, a: any) => sum + Number(a.horas_extra_diurnas || 0), 0);
      const horasNocturnas = (asistencias || []).reduce((sum: number, a: any) => sum + Number(a.horas_extra_nocturnas || 0), 0);
      const horasDominicales = (asistencias || []).reduce((sum: number, a: any) => sum + Number(a.horas_extra_dominicales || 0), 0);

      // 3.2 Obtener ventas atribuidas al empleado (para comisiones)
      let totalVentas = 0;
      let comision = 0;
      if (emp.aplica_comision && emp.porcentaje_comision > 0) {
        const { data: ventas } = await supabase
          .from('ventas')
          .select('total')
          .eq('tenant_id', tenantId)
          .eq('empleado_id', emp.id)
          .gte('created_at', fechaInicio)
          .lte('created_at', fechaFin);

        totalVentas = (ventas || []).reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
        const calcComision = calcularComision(totalVentas, Number(emp.porcentaje_comision));
        comision = calcComision.comision;
      }

      // 3.3 Obtener vacaciones/permisos no remunerados del periodo
      const { data: permisos } = await supabase
        .from('vacaciones_permisos')
        .select('dias_habiles, tipo')
        .eq('empleado_id', emp.id)
        .eq('tenant_id', tenantId)
        .eq('estado', 'aprobado')
        .lte('fecha_inicio', fechaFin)
        .gte('fecha_fin', fechaInicio);

      const diasNoRemunerados = (permisos || [])
        .filter((p: any) => p.tipo === 'permiso_no_remunerado')
        .reduce((sum: number, p: any) => sum + (p.dias_habiles || 0), 0);

      // 3.4 Calcular prestaciones sociales
      const prestaciones = calcularPrestaciones(
        Number(emp.salario_base || 0),
        diasTrabajados,
        config,
        emp.salario_integral === true,
        emp.riesgo_arl || 'I'
      );

      // 3.5 Calcular horas extra (recargos)
      const horasExtra = calcularHorasExtra(
        Number(emp.salario_base || 0),
        horasDiurnas,
        horasNocturnas,
        horasDominicales,
        config
      );

      // 3.6 Calcular neto a pagar
      const salarioPeriodo = prestaciones.salario_periodo - (diasNoRemunerados * (Number(emp.salario_base || 0) / 30));
      const totalDevengado = salarioPeriodo + prestaciones.auxilio_transporte + totalHorasExtra + comision;
      const totalDeducciones = prestaciones.salud_empleado + prestaciones.pension_empleado;
      const netoAPagar = totalDevengado - totalDeducciones;
      const costoTotalEmpleador = netoAPagar + prestaciones.total_prestaciones_empleador;

      resultados.push({
        empleado_id: emp.id,
        nombre: emp.nombre,
        apellido: emp.apellido || '',
        rol: emp.rol,
        documento_identidad: emp.documento_identidad || '',
        cuenta_bancaria: emp.cuenta_bancaria || null,
        banco: emp.banco || null,
        salario_base: Number(emp.salario_base || 0),
        dias_trabajados: diasTrabajados,
        dias_no_remunerados: diasNoRemunerados,
        // Salario
        salario_periodo: Math.round(salarioPeriodo),
        auxilio_transporte: prestaciones.auxilio_transporte,
        aplica_auxilio: prestaciones.aplica_auxilio,
        // Horas extra
        horas_extra: {
          diurnas: horasDiurnas,
          nocturnas: horasNocturnas,
          dominicales: horasDominicales,
          total_horas: horasDiurnas + horasNocturnas + horasDominicales,
          valor_total: Math.round(totalHorasExtra),
        },
        // Comisiones
        comisiones: {
          total_ventas: totalVentas,
          porcentaje: Number(emp.porcentaje_comision || 0),
          valor: comision,
        },
        // Prestaciones sociales (empleador paga)
        prestaciones: {
          cesantias: prestaciones.cesantias,
          intereses_cesantias: prestaciones.intereses_cesantias,
          prima: prestaciones.prima,
          vacaciones: prestaciones.vacaciones,
          salud_empleador: prestaciones.salud_empleador,
          pension_empleador: prestaciones.pension_empleador,
          arl: prestaciones.arl,
          total: prestaciones.total_prestaciones_empleador,
        },
        // Deducciones (empleado paga)
        deducciones: {
          salud_empleado: prestaciones.salud_empleado,
          pension_empleado: prestaciones.pension_empleado,
          total: prestaciones.total_deducciones_empleado,
        },
        // Totales
        total_devengado: Math.round(totalDevengado),
        total_deducciones: Math.round(totalDeducciones),
        neto_a_pagar: Math.round(netoAPagar),
        costo_total_empleador: Math.round(costoTotalEmpleador),
      });
    }

    // 4. Totales consolidados
    const totales = resultados.reduce((acc, r) => {
      acc.salario_periodo += r.salario_periodo;
      acc.auxilio_transporte += r.auxilio_transporte;
      acc.horas_extra += r.horas_extra.valor_total;
      acc.comisiones += r.comisiones.valor;
      acc.prestaciones += r.prestaciones.total;
      acc.deducciones += r.deducciones.total;
      acc.total_devengado += r.total_devengado;
      acc.neto_total += r.neto_a_pagar;
      acc.costo_total += r.costo_total_empleador;
      return acc;
    }, {
      salario_periodo: 0, auxilio_transporte: 0, horas_extra: 0,
      comisiones: 0, prestaciones: 0, deducciones: 0,
      total_devengado: 0, neto_total: 0, costo_total: 0
    });

    return NextResponse.json({
      success: true,
      periodo: { inicio: fechaInicio, fin: fechaFin },
      empleados_count: resultados.length,
      resultados,
      totales,
      config_usada: {
        salario_minimo: config.salario_minimo,
        auxilio_transporte: config.auxilio_transporte,
      },
    });
  } catch (error: any) {
    console.error('Error GET calcular nomina:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
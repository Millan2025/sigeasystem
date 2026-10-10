export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcularPrestaciones, CONFIG_DEFAULT } from '@/lib/calculosNomina';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Obtener configuración de nómina del tenant y calcular prestaciones preview
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const empleadoId = url.searchParams.get('empleado_id');
    const diasStr = url.searchParams.get('dias');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 });
    }

    // Obtener configuración del tenant (o usar default)
    let config = CONFIG_DEFAULT;
    const { data: configBD } = await supabase
      .from('configuracion_nomina')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (configBD) {
      config = { ...CONFIG_DEFAULT, ...configBD };
    }

    // Si piden preview de un empleado específico
    if (empleadoId && diasStr) {
      const diasTrabajados = parseInt(diasStr, 10);
      const { data: empleado, error: empErr } = await supabase
        .from('employees')
        .select('*')
        .eq('id', empleadoId)
        .eq('tenant_id', tenantId)
        .single();

      if (empErr || !empleado) {
        return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 });
      }

      const prestaciones = calcularPrestaciones(
        Number(empleado.salario_base || 0),
        diasTrabajados,
        config,
        empleado.salario_integral === true,
        empleado.riesgo_arl || 'I'
      );

      return NextResponse.json({
        success: true,
        empleado: {
          id: empleado.id,
          nombre: empleado.nombre,
          salario_base: empleado.salario_base,
          tipo_contrato: empleado.tipo_contrato,
          salario_integral: empleado.salario_integral,
          riesgo_arl: empleado.riesgo_arl,
        },
        dias_trabajados: diasTrabajados,
        prestaciones,
        config_usada: config,
      });
    }

    // Si solo piden la configuración
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de nómina obtenida',
    });
  } catch (error: any) {
    console.error('Error GET prestaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Calcular prestaciones para múltiples empleados (bulk para nómina)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, periodo_inicio, periodo_fin, empleados_ids } = body;

    if (!tenant_id || !periodo_inicio || !periodo_fin) {
      return NextResponse.json({
        success: false,
        error: 'Faltan: tenant_id, periodo_inicio, periodo_fin'
      }, { status: 400 });
    }

    // Obtener configuración
    let config = CONFIG_DEFAULT;
    const { data: configBD } = await supabase
      .from('configuracion_nomina')
      .select('*')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (configBD) {
      config = { ...CONFIG_DEFAULT, ...configBD };
    }

    // Obtener empleados
    let query = supabase.from('employees').select('*').eq('tenant_id', tenant_id);
    if (empleados_ids && empleados_ids.length > 0) {
      query = query.in('id', empleados_ids);
    } else {
      query = query.eq('activo', true);
    }

    const { data: empleados, error: empErr } = await query;
    if (empErr) throw empErr;

    // Para cada empleado: contar días trabajados y calcular prestaciones
    const resultados = [];
    for (const emp of empleados || []) {
      const { data: asistencias } = await supabase
        .from('asistencias')
        .select('fecha, valor_horas_extra, horas_extra_diurnas, horas_extra_nocturnas, horas_extra_dominicales')
        .eq('empleado_id', emp.id)
        .eq('tenant_id', tenant_id)
        .gte('fecha', periodo_inicio)
        .lte('fecha', periodo_fin);

      const diasTrabajados = new Set((asistencias || []).map((a: any) => a.fecha)).size;
      const totalHorasExtra = (asistencias || []).reduce((sum: number, a: any) => sum + Number(a.valor_horas_extra || 0), 0);

      const prestaciones = calcularPrestaciones(
        Number(emp.salario_base || 0),
        diasTrabajados,
        config,
        emp.salario_integral === true,
        emp.riesgo_arl || 'I'
      );

      resultados.push({
        empleado_id: emp.id,
        nombre: emp.nombre,
        rol: emp.rol,
        salario_base: Number(emp.salario_base || 0),
        dias_trabajados: diasTrabajados,
        salario_periodo: prestaciones.salario_periodo,
        auxilio_transporte: prestaciones.auxilio_transporte,
        total_horas_extra: Math.round(totalHorasExtra),
        prestaciones: {
          cesantias: prestaciones.cesantias,
          intereses_cesantias: prestaciones.intereses_cesantias,
          prima: prestaciones.prima,
          vacaciones: prestaciones.vacaciones,
          salud_empleador: prestaciones.salud_empleador,
          pension_empleador: prestaciones.pension_empleador,
          arl: prestaciones.arl,
        },
        deducciones_empleado: {
          salud: prestaciones.salud_empleado,
          pension: prestaciones.pension_empleado,
          total: prestaciones.total_deducciones_empleado,
        },
        neto_a_pagar: prestaciones.neto_a_pagar,
        costo_total_empleador: prestaciones.costo_total_empleador,
      });
    }

    // Totales consolidados
    const totales = resultados.reduce((acc, r) => {
      acc.salario_periodo += r.salario_periodo;
      acc.auxilio_transporte += r.auxilio_transporte;
      acc.horas_extra += r.total_horas_extra;
      acc.cesantias += r.prestaciones.cesantias;
      acc.intereses_cesantias += r.prestaciones.intereses_cesantias;
      acc.prima += r.prestaciones.prima;
      acc.vacaciones += r.prestaciones.vacaciones;
      acc.salud_empleador += r.prestaciones.salud_empleador;
      acc.pension_empleador += r.prestaciones.pension_empleador;
      acc.arl += r.prestaciones.arl;
      acc.deducciones_empleado += r.deducciones_empleado.total;
      acc.neto_total += r.neto_a_pagar;
      acc.costo_total += r.costo_total_empleador;
      return acc;
    }, {
      salario_periodo: 0, auxilio_transporte: 0, horas_extra: 0,
      cesantias: 0, intereses_cesantias: 0, prima: 0, vacaciones: 0,
      salud_empleador: 0, pension_empleador: 0, arl: 0,
      deducciones_empleado: 0, neto_total: 0, costo_total: 0
    });

    return NextResponse.json({
      success: true,
      periodo: { inicio: periodo_inicio, fin: periodo_fin },
      empleados_count: resultados.length,
      resultados,
      totales,
      config_usada: config,
    });
  } catch (error: any) {
    console.error('Error POST prestaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
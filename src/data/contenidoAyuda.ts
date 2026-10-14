export interface ModuloAyuda {
  id: string;
  nombre: string;
  color: string;
  queEs: string;
  paraQueSirve: string;
  pasos: string[];
  tips: string[];
  errores: string[];
  ejemplo: string;
}

export const MODULOS_AYUDA: ModuloAyuda[] = [
  {
    id: "dashboard",
    nombre: "Panel Principal",
    color: "from-stone-600 to-stone-800",
    queEs: "El tablero de mando de tu negocio: lo primero que ves al entrar.",
    paraQueSirve: "Para saber en 5 segundos como va el dia y llegar a cualquier modulo con un solo toque.",
    pasos: [
      "Mira la tarjeta dorada arriba: cuanto has vendido hoy y cuantas ventas llevas.",
      "Revisa el desglose por metodo de pago (Efectivo, Nequi, Daviplata): te dice si necesitas cambio para la caja.",
      "Toca cualquier tarjeta de color para entrar a ese modulo.",
      "Usa los botones Copiar enlace para compartir el POS con tus cajeros o la Tienda con tus clientes.",
      "Arriba a la derecha tienes Ayuda (este centro) y Cerrar Sesion."
    ],
    tips: [
      "Miralo al abrir y al cerrar el negocio: 10 segundos en la manana y 10 en la noche te mantienen dueno de tu caja.",
      "Si ves ventas en cero y ya vendiste, revisa tu conexion: el dato se actualiza solo al recargar."
    ],
    errores: [
      "No compartir el link del POS con el cajero nuevo: con ese link vende el mismo dia sin crear usuarios extra.",
      "Ignorar el desglose de metodos de pago: es el que te avisa cuanto cambio necesitas."
    ],
    ejemplo: "Abres a las 7:00 am y ves: $120.000 en 8 ventas (75% efectivo). Sabes que necesitas cambio antes del mediodia."
  },
  {
    id: "pos",
    nombre: "POS (Ventas)",
    color: "from-emerald-500 to-emerald-600",
    queEs: "Tu caja registradora virtual: la pantalla donde cobras.",
    paraQueSirve: "Para cobrar en segundos, que el inventario se descuente solo, que el dinero quede registrado en Finanzas y que el cliente acumule sellos si das su telefono.",
    pasos: [
      "Entra a Nueva Venta desde el panel.",
      "Toca los productos que el cliente pide (como marcar en el celular).",
      "Si vendes por peso (queso, jamon), el sistema te pregunta los gramos.",
      "Revisa el carrito abajo: ahi ves el total en vivo.",
      "Toca el boton verde COBRAR.",
      "Elige como paga: Efectivo, Nequi, Daviplata, tarjeta... o Credito si es un cliente de confianza (fiado).",
      "Listo: mensaje verde de confirmacion y recibo listo para descargar."
    ],
    tips: [
      "Pide SIEMPRE el telefono: el cliente gana sellos (10 sellos = 1 premio) y tu construyes tu base de clientes sin esfuerzo.",
      "No toques COBRAR dos veces: el boton se bloquea solo mientras procesa para que no se duplique la venta.",
      "Si se va el internet, sigue vendiendo: SIGEA guarda las ventas y las sincroniza cuando vuelve la conexion."
    ],
    errores: [
      "Prometer un producto sin mirar stock: si no hay, el sistema no te deja vender (mejor saberlo antes que quedar mal con el cliente).",
      "No emitir el recibo: pierdes respaldo legal y sellos del cliente."
    ],
    ejemplo: "Dona Maria lleva 2 perros y 2 gaseosas ($22.000). Tocas los 4 productos, COBRAR, Efectivo, emites recibo con su telefono y Maria gana su primer sello. Tiempo total: 15 segundos."
  },
  {
    id: "inventario",
    nombre: "Inventario",
    color: "from-blue-500 to-blue-600",
    queEs: "Tu bodega digital: la lista de todo lo que tienes, con cantidades.",
    paraQueSirve: "Para saber de un vistazo que hay, que se esta acabando y que se perdio o dano.",
    pasos: [
      "Entra a Inventario.",
      "Para crear un producto: toca + Producto y escribe nombre, categoria, precio de venta y cuanto te cuesta.",
      "Ponle stock inicial y minimo: el minimo es la linea donde SIGEA te avisa que te estas quedando sin eso.",
      "Subele foto si la tienes: se ve mejor en el POS y en la tienda online.",
      "Guarda: desde ahi, cada venta o compra actualiza la cantidad sola.",
      "Si algo se dana, se rompe o lo regalas: toca Registrar Movimiento, elige Salida y escribe el motivo (Merma por rotura)."
    ],
    tips: [
      "Configura el minimo en TODO lo que venda: es tu alarma temprana.",
      "Registra el precio de compra: sin ese dato SIGEA no puede decirte cuanto ganas por producto.",
      "Haz conteo fisico una vez al mes: si el sistema dice 100 y cuentas 95, registra un Ajuste de -5 y queda documentado."
    ],
    errores: [
      "Eliminar productos que ya tuvieron ventas: no los borres, archivalos (borrarlos rompe tu historial y tus reportes).",
      "No registrar mermas: plata que se va sin dejar rastro."
    ],
    ejemplo: "Pan de Sal con minimo 10. Cuando el stock baja a 8, la fila se pinta roja, aparece en Stock bajo del panel y Compras lo sugiere para reorden."
  },
  {
    id: "compras",
    nombre: "Compras",
    color: "from-indigo-500 to-indigo-600",
    queEs: "La lista de mercado que SIGEA arma por ti.",
    paraQueSirve: "Para comprar lo que falta, en la cantidad correcta, al proveedor correcto, y que entre solo a inventario y a cuentas.",
    pasos: [
      "Entra a Compras: veras resaltados en rojo los productos con stock bajo.",
      "Marca los que vas a comprar: SIGEA te sugiere cantidad (si el minimo es 20 y tienes 5, sugiere 15).",
      "Ajusta la cantidad si compras mayorista y elige el proveedor de cada producto.",
      "Revisa impuestos (IVA) y como pagaras: contado, credito o transferencia.",
      "Toca Registrar Compra: el stock sube solo y el gasto aparece en Finanzas."
    ],
    tips: [
      "Deja que SIGEA sugiera y ajusta con tu experiencia: el hace la matematica, tu pones el conocimiento del mercado.",
      "Escribe observaciones como Compra promo diciembre: tu yo del futuro te lo agradecera."
    ],
    errores: [
      "Comprar sin mirar lo que ya hay en bodega: plata parada en estantes.",
      "No registrar la compra: inventario miente y Finanzas no refleja tu gasto real."
    ],
    ejemplo: "Harina en 5 bultos (minimo 20). SIGEA sugiere 15; ajustas a 50 porque hay descuento. Registras: harina sube a 55 y el gasto queda en Finanzas con su categoria contable."
  },
  {
    id: "facturacion",
    nombre: "Facturacion y Recibos",
    color: "from-teal-500 to-teal-600",
    queEs: "El sello y papel de tu negocio: recibos con consecutivo, tus datos y resolucion DIAN si la tienes.",
    paraQueSirve: "Para entregar recibos legales y profesionales sin complicarte, con numeracion automatica que nunca se repite.",
    pasos: [
      "Entra una sola vez a Facturacion y llena tus datos: razon social, NIT, direccion, telefono.",
      "Si tienes resolucion DIAN, escribe numero y fechas; si no, dejalo vacio (el recibo sale igual, valido para regimen simple).",
      "Desde entonces, cada venta en POS abre sola la ventana de recibo.",
      "Escribe nombre y telefono del cliente (opcional, pero recomendado).",
      "Toca Emitir y Descargar PDF: baja tu recibo FV-000001, FV-000002... en orden automatico."
    ],
    tips: [
      "Personaliza el mensaje del pie: Gracias por su compra, siguenos en redes.",
      "Revisa el historial de vez en cuando: todos tus recibos quedan ahi, en orden."
    ],
    errores: [
      "Emitir recibos sin configurar datos primero: salen sin NIT ni nombre.",
      "No pedir el telefono del cliente: pierdes sellos y fidelizacion."
    ],
    ejemplo: "Primera venta del dia: baja el recibo FV-000001 con tu logo, NIT, los 4 productos y el total. Profesional, legal y con tu marca."
  },
  {
    id: "finanzas",
    nombre: "Finanzas",
    color: "from-green-600 to-green-700",
    queEs: "La libreta de bolsillo que se escribe sola: todo lo que entra y sale, en un solo lugar.",
    paraQueSirve: "Para saber cuanto entro, cuanto salio, cuanto te queda de utilidad REAL, y quien te debe o a quien le debes.",
    pasos: [
      "Entra a Finanzas: arriba ves Ingresos, Gastos y Utilidad del periodo.",
      "Ventas y compras ya aparecen solas: no las registras tu.",
      "Para gastos que no pasan por el sistema (arriendo, servicios): toca + Transaccion, elige Gasto, monto, categoria (ej. Arriendo) y guarda.",
      "Usa los filtros (fechas, categoria, periodo) para ver exactamente lo que buscas.",
      "Revisa Cuentas por cobrar (fiados de clientes) y Cuentas por pagar (compras a credito)."
    ],
    tips: [
      "Registra el gasto el mismo dia: la memoria falla, Finanzas no.",
      "Cierra el periodo al terminar el mes: nadie mueve numeros pasados y entregas info limpia al contador."
    ],
    errores: [
      "Mezclar gastos personales con los del negocio: el mercado de tu casa no es gasto del negocio.",
      "No registrar gastos pequenos: el goteo de $5.000 diarios son $150.000 al mes."
    ],
    ejemplo: "Cierras octubre y ves: Ingresos $12.500.000, Gastos $4.500.000, Utilidad $8.000.000 y te deben $850.000 en fiados. Todo en una pantalla, sin cuadernos."
  },
  {
    id: "domicilios",
    nombre: "Domicilios (Pedidos)",
    color: "from-violet-500 to-violet-600",
    queEs: "La torre de control de tus entregas.",
    paraQueSirve: "Para que ningun pedido se pierda: sabes que esta en cocina, que va en camino y que se entrego, y tu repartidor ve sus rutas en el celular.",
    pasos: [
      "Entra a Pedidos: los pedidos nuevos aparecen solos (la pantalla se actualiza cada 10 segundos).",
      "Revisa cliente, direccion, telefono y productos.",
      "Toca Confirmar para mandarlo a cocina, o Cancelar con motivo si hay problema.",
      "Avanza el estado segun la realidad: Preparando, En camino, Entregado.",
      "Cuando este En camino, tu repartidor lo ve en su celular con direccion y telefono, y marca Entregado al llegar."
    ],
    tips: [
      "Confirma rapido: cliente esperando confirmacion es cliente que cancela.",
      "Manten los estados al dia: el cliente y el repartidor ven lo mismo que tu."
    ],
    errores: [
      "Dejar pedidos en pendiente mucho tiempo: cocina no se entera.",
      "Cancelar sin escribir el motivo: sin motivo no puedes corregir lo que falla."
    ],
    ejemplo: "7:15 pm entra pedido de 2 pizzas. Confirmas 7:17, preparando 7:20, en camino 7:35 (repartidor lo ve en su celular), entregado 7:52. Trazabilidad completa sin una sola llamada interna."
  },
  {
    id: "mesas",
    nombre: "Mesas y Menu Digital QR",
    color: "from-amber-500 to-amber-600",
    queEs: "Un sticker con codigo QR en cada mesa para que el cliente pida desde su celular.",
    paraQueSirve: "Para que el pedido llegue directo a cocina sin errores de toma, con menos meseros corriendo y cliente mas feliz.",
    pasos: [
      "Entra a Mesas y genera tus mesas de una: prefijo M, del 1 al 12, y quedan 12 mesas creadas en 1 segundo.",
      "Toca Imprimir Hoja A4: sale la hoja con todos los QR, tu logo y telefono.",
      "Recorta, plastifica y pega cada QR en su mesa.",
      "El cliente escanea: ve el menu con fotos y stock en vivo, arma su pedido y lo envia.",
      "Tu ves el pedido llegar a Pedidos marcado como MESA A1."
    ],
    tips: [
      "Pega el QR visible: en la esquina de la mesa, no debajo del plato.",
      "Ensena la frase a tu equipo: escanea el codigo y pide desde tu celular, llega directo a cocina."
    ],
    errores: [
      "No tener el inventario al dia: el menu muestra agotado solo si tu stock esta actualizado.",
      "No mirar el panel de pedidos: el pedido llega, pero si nadie lo ve, es como si no llegara."
    ],
    ejemplo: "Mesa A1, 4 comensales. Cada uno escanea, agrega lo suyo con notas (sin cebolla) y envia. Cocina recibe: MESA A1: 2 perros sin cebolla, 2 gaseosas, 1 ensalada. Cero malentendidos, cero libretas."
  },
  {
    id: "creditos",
    nombre: "Creditos (Fiado)",
    color: "from-red-500 to-red-600",
    queEs: "La libreta de fiados de toda la vida, pero digital y con memoria perfecta.",
    paraQueSirve: "Para venderle a tu cliente de confianza sin perder el control: quien te debe, cuanto, desde cuando y cuanto ha abonado.",
    pasos: [
      "En el POS, al cobrar, elige Credito: escribes nombre, telefono y direccion del cliente.",
      "La deuda aparece en Creditos con monto y fecha de vencimiento (30 dias por defecto).",
      "Cuando el cliente abone: entra a Creditos, busca su nombre, escribe el monto en Abono y toca Abonar.",
      "El saldo baja solo; cuando llega a cero, el credito se marca PAGADO en verde."
    ],
    tips: [
      "Define un tope por cliente (ej. $100.000): el total pendiente lo ves consolidado arriba.",
      "Acepta abonos parciales: mejor $20.000 hoy que una promesa de $50.000 el otro mes.",
      "Usa las observaciones: paga los sabados vale oro al cobrar."
    ],
    errores: [
      "Fiar sin telefono: si no paga, no como buscarlo.",
      "Registrar abonos dias despues: la libreta que se actualiza tarde, miente."
    ],
    ejemplo: "Don Jose fia $50.000 el lunes. Miercoles abona $20.000 (saldo $30.000). Sabado abona $30.000 y el credito queda en verde PAGADO, con cada ingreso registrado en Finanzas."
  },
  {
    id: "produccion",
    nombre: "Produccion (Food Cost)",
    color: "from-orange-500 to-orange-600",
    queEs: "Tu cocina en el sistema: le dices que lleva cada plato y SIGEA calcula cuanto te cuesta hacerlo.",
    paraQueSirve: "Para saber el costo REAL de cada plato, descontar ingredientes del inventario al cocinar y conocer tu margen verdadero.",
    pasos: [
      "Primero clasifica en Inventario: lo que preparas es tipo producido (perro, pizza); lo que usas para preparar es insumo (pan, salchicha, queso).",
      "Entra a Produccion y toca + Nueva Orden: elige que producir (ej. 20 perros).",
      "Agrega los ingredientes de la receta con cantidades: 20 panes, 20 salchichas, 400 g de queso.",
      "SIGEA te muestra el costo total y el costo por unidad ANTES de empezar.",
      "Crea la orden; cuando cocina termine, toca Finalizar: los ingredientes bajan del inventario y los 20 perros entran al stock listos para vender."
    ],
    tips: [
      "Produce por lotes segun lo que vendes: si vendes 15 perros al dia, no produzcas 40 (lo sobrante es plata botada).",
      "Revisa el costo por plato cada mes: si el queso sube, tu food cost sube, y debes notarlo antes de perder margen."
    ],
    errores: [
      "No marcar los ingredientes como insumo: no aparecen en la receta y el costo sale en $0.",
      "No finalizar las ordenes: el stock no se mueve y el POS vende aire."
    ],
    ejemplo: "20 perros: insumos $41.600, cada perro te cuesta $2.080. Lo vendes a $8.000 y ganas $5.920 por perro (74% de margen). Ahora si sabes que plato te da plata."
  },
  {
    id: "reportes",
    nombre: "Reportes",
    color: "from-cyan-500 to-cyan-600",
    queEs: "La radiografia del negocio: graficas y rankings que te cuentan que esta pasando.",
    paraQueSirve: "Para decidir con datos y no con pulso: que vende, que no, que dias son fuertes y quienes son tus mejores clientes.",
    pasos: [
      "Entra a Reportes y elige el periodo (este mes, mes pasado o fechas tuyas).",
      "Mira el resumen: Ventas, Compras, Ingresos, Egresos y credito pendiente.",
      "Revisa las graficas: ingresos por categoria y tendencia de ventas por dia.",
      "Mira los rankings: Top 10 productos mas vendidos y tus mejores clientes.",
      "Si quieres profundizar, toca Exportar para IA: baja un archivo con todos tus datos organizados."
    ],
    tips: [
      "Compara meses: septiembre vs agosto te dice si creces o te estancas.",
      "Mira ventas por dia de la semana: si viernes y sabado son pico, programa mas personal esos dias."
    ],
    errores: [
      "Mirar reportes solo cuando algo huele mal: el valor esta en verlos semanalmente.",
      "No actuar: saber tu top seller y no tenerlo en stock es igual a no saberlo."
    ],
    ejemplo: "El reporte muestra que viernes y sabado concentran el 45% de la semana y que la Hamburguesa Doble es numero 1 en margen. Decision: refuerzas personal de fin de semana y la doble pasa a la vitrina principal."
  },
  {
    id: "personal",
    nombre: "Personal (Nomina)",
    color: "from-lime-600 to-lime-700",
    queEs: "Tu oficina de recursos humanos: empleados, asistencia con hora y ubicacion, y nomina con toda la ley colombiana calculada sola.",
    paraQueSirve: "Para pagar justo y legal sin contador: cesantias, prima, vacaciones, salud, pension, horas extra con recargo... todo automatico.",
    pasos: [
      "Entra a Personal y crea el empleado: nombre, documento, cargo, salario, tipo de contrato y riesgo ARL.",
      "Cada dia: toca Marcar Entrada al llegar y Marcar Salida al irse (el sistema verifica que este en el local, maximo 200 metros).",
      "Al cierre del periodo (quincena o mes): toca Calcular Nomina.",
      "Revisa la vista previa: dias trabajados, horas extra, comisiones, prestaciones, deducciones y neto a pagar de cada uno.",
      "Toca Procesar Pago y descarga el recibo PDF por empleado. El gasto queda solo en Finanzas."
    ],
    tips: [
      "Entrega siempre el recibo PDF: es el respaldo legal tuyo y del empleado.",
      "Revisa horas extra cada semana: mejor ajustar turnos que pagar recargos del 75% por costumbre.",
      "Actualiza salario y riesgo ARL cuando cambie el cargo: la nomina depende de eso."
    ],
    errores: [
      "No marcar asistencias: la nomina se calcula con dias reales; sin asistencias, paga mal.",
      "Procesar sin revisar la vista previa: un minuto de revision evita un mal pago."
    ],
    ejemplo: "Quincena de Maria (mesera, $1.300.000): 14 dias, 8 horas extra, 5% de comision. SIGEA calcula cesantias, prima, vacaciones, salud, pension y deducciones. Neto: $876.488. Recibo PDF listo. Sin contador."
  },
  {
    id: "clientes",
    nombre: "Clientes y Fidelizacion",
    color: "from-pink-500 to-pink-600",
    queEs: "La memoria de tu negocio: recuerda cada cliente, cuanto gasta, cada cuanto viene y cuando fue la ultima vez.",
    paraQueSirve: "Para saber quien es quien sin preguntar: el sistema los clasifica solo en Nuevo, Activo, En Riesgo, Inactivo o VIP, y se los entrega a Marketing listos para la oferta correcta.",
    pasos: [
      "No haces nada: cada venta con telefono crea o actualiza al cliente solo.",
      "Entra a Clientes para ver la lista: sellos, visitas, total gastado y ticket promedio.",
      "Toca un cliente para ver su historia completa: que compro, cuando y cuanto.",
      "Usa los segmentos (VIP, inactivos, cumpleanos) en Marketing para enviar campanas."
    ],
    tips: [
      "El telefono es la llave de todo: sin telefono no hay cliente, no hay sellos, no hay campanas.",
      "Mira tus VIP una vez por semana: son los que sostienen el negocio y merecen un detalle antes de que la competencia los enamore."
    ],
    errores: [
      "No pedir el telefono para no molestar: lo que molesta es el olvido; un buen mensaje a tiempo se agradece.",
      "Dejar inactivos sin contactar: un inactivo con cupon del 20% es una venta que regresa."
    ],
    ejemplo: "Juan compro 12 veces y gasto $350.000 en 3 meses. SIGEA lo volvio VIP solo. Le escribes: Juan, esta semana tu postre va por cuenta de la casa. Juan vuelve y trae a su esposa."
  },
  {
    id: "marketing",
    nombre: "Marketing",
    color: "from-fuchsia-500 to-fuchsia-600",
    queEs: "Tu megafono con punteria: mensajes al cliente correcto, con cupones que se pueden rastrear.",
    paraQueSirve: "Para reactivar al que no viene, premiar al que viene mucho, y saber EXACTAMENTE cuanta plata genero cada campana.",
    pasos: [
      "Entra a Marketing y toca Nueva Campana.",
      "Elige a quien escribirle: ej. Inactivos (+30 dias); SIGEA te dice cuantos son antes de enviar.",
      "Escribe el mensaje corto y con gancho: Te extranamos, vuelve hoy con 20% OFF.",
      "Crea el cupon: codigo (ej. VUELVE20), descuento y vencimiento corto (48-72 horas funciona mejor).",
      "Envia o programa. Cuando el cliente redima en el POS, SIGEA marca el cupon usado y suma esa venta a la campana."
    ],
    tips: [
      "Cupones cortos (48-72 h) se redimen hasta 3 veces mas que los mensuales: la urgencia mueve pies.",
      "Mide antes de repetir: campana que genero $320.000 con 8 cupones es campana para repetir el otro mes."
    ],
    errores: [
      "Mandar el mismo mensaje a todos: no es lo mismo un VIP que un inactivo de 2 meses.",
      "Cupones sin vencimiento: sin urgencia nadie corre a usarlos."
    ],
    ejemplo: "Campana Te extranamos a 45 inactivos: 8 redimen el cupon. Ventas generadas: $320.000. Lo ves en el panel de la campana: ROI positivo, se repite."
  },
  {
    id: "conecta",
    nombre: "Conecta (Juego de Mesa)",
    color: "from-purple-500 to-purple-600",
    queEs: "El juego de la mesa: tus clientes escanean el QR, juegan en pareja o grupo, se rien y ganan un cupon.",
    paraQueSirve: "Para convertir la espera aburrida en un momento memorable, capturar el WhatsApp del cliente sin pedirselo en frio, y generar ventas inmediatas con el cupon de premio.",
    pasos: [
      "El cliente escanea el QR de la mesa y entra a Conecta (sin registros ni contrasenas).",
      "Elige un juego: Sincronia (preguntas de pareja), Termometro (debates divertidos) o DJ de la Mesa (votan musica).",
      "Juega en su celular; cuando el acompanante responde, llega la revelacion con confeti.",
      "El sistema les da un cupon unico (ej. CONECTA-A1X9).",
      "Se lo muestran al mesero; lo ingresas en el POS, se aplica el descuento y SIGEA registra que esa venta vino de Conecta."
    ],
    tips: [
      "Que el mesero lo anuncie: mientras esperan, jueguen y ganen un premio duplica la participacion.",
      "Revisa cupones generados vs redimidos: ese es el pulso del juego."
    ],
    errores: [
      "No contarle al cliente que existe: el QR solo no juega; la frase del mesero lo activa.",
      "No honrar el cupon: un cliente que gano y no pudo redimir no vuelve y lo cuenta."
    ],
    ejemplo: "Pareja en primera cita juega Sincronia: responden igual, confeti, risas y cupon de bebida de cortesia. Lo usan esa noche y dejan su telefono para reclamar el premio. Cliente nuevo capturado sonriendo."
  }
];

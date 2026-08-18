# ROADMAP MARKETING SIGEA - EJECUCION

**Creado:** 2026-08-18
**Objetivo:** Implementar marketing enfocado en WhatsApp grupos de barrio
**Estado:** EN EJECUCION

---

## 🎯 FASE 1: WHATSAPP GRUPOS (PRIORIDAD ALTA - INMEDIATA)

### Alcance
- Cargar pieza publicitaria (imagen/video)
- Texto del mensaje + hashtags
- Número/ID del grupo de WhatsApp
- Cronograma de publicación (fecha + hora)
- Notificación de confirmación de envío

### URLs de Implementacion
- **DEMO:** `/demo/[slug]/marketing` (validación)
- **PRODUCCION:** `/la-casa-del-pan/marketing` y `/pollo-broster/marketing`

### Criterios de Exito
- [x] Pieza cargada en Supabase
- [x] Publicación programada guardada
- [x] Web Share API abre WhatsApp con contenido
- [x] Notificación de éxito mostrada al usuario
- [x] Registro de publicación en BD con estado

### Tecnología
- Web Share API nativa (navigator.share)
- Supabase para persistencia
- Upload de imágenes a Supabase Storage

### Entregables
- [ ] SQL tabla `publicaciones_whatsapp`
- [ ] Componente WhatsAppMarketing.tsx
- [ ] Integración en MarketingModule.tsx
- [ ] Validación en demo
- [ ] Deploy a producción

---

## 🔜 FASE 2: OTRAS REDES (EN DESARROLLO)

| Red | Estado | Prioridad |
|-----|--------|-----------|
| Facebook | 🟡 En desarrollo | Media |
| Instagram | 🟡 En desarrollo | Media |
| TikTok | 🟡 En desarrollo | Baja |

**Mensaje mostrado:** "Próximamente: integración con [Red Social]"

---

## 📊 METRICAS DE EXITO (Fase 1)

- Publicaciones exitosas por semana
- Tasa de apertura (tracking de clicks)
- Leads generados desde WhatsApp
- ROI por campaña

---

## 🗓️ CRONOGRAMA

| Día | Hito | Estado |
|-----|------|--------|
| 2026-08-18 | Documento + SQL | 🟡 En progreso |
| 2026-08-18 | Componente WhatsApp | ⏳ Pendiente |
| 2026-08-18 | Validación demo | ⏳ Pendiente |
| 2026-08-18 | Deploy producción | ⏳ Pendiente |

---

## 📝 NOTAS TECNICAS

### Web Share API
- Funciona en Chrome Android/iOS, Safari iOS
- Requiere HTTPS (Vercel lo provee)
- Permite compartir a WhatsApp grupos directamente
- Devuelve success/cancel para tracking

### Fallback para Desktop
- Si Web Share API no disponible, abrir `wa.me` con texto
- El usuario copia el enlace y pega en grupo manualmente

---

## 🔄 LOG DE CAMBIOS

- **2026-08-18:** Inicio de Fase 1 (WhatsApp grupos)

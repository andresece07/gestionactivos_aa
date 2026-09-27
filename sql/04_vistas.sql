DROP VIEW IF EXISTS vw_baterias_estado;

CREATE OR REPLACE VIEW vw_baterias_estado AS SELECT b.id, b.sku_dynamics, b.codigo_unico, p.nombre as piscina, p.zona, b.finca, b.zona as zona_bateria, b.tolva, b.fecha_instalacion, b.voltaje_nominal, b.amperios, b.capacidad_kwh_legacy, b.estado, calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion, calcular_ciclos_bateria(b.id) as ciclos_totales, calcular_capacidad_residual(b.id) as capacidad_residual_pct, obtener_estado_vida_util(b.id) as estado_vida_util, AGE(CURRENT_DATE, b.fecha_instalacion) as tiempo_operacion, b.created_at, b.updated_at FROM baterias b LEFT JOIN piscinas p ON b.piscina_id = p.id ORDER BY b.created_at DESC;

CREATE OR REPLACE VIEW vw_baterias_vida_util_cumplida AS SELECT b.id, b.sku_dynamics, b.codigo_unico, p.nombre as piscina, p.zona, b.finca, b.tolva, b.fecha_instalacion, b.voltaje_nominal, b.amperios, b.estado, calcular_dias_desde_instalacion(b.id) as dias_desde_instalacion, ROUND((calcular_dias_desde_instalacion(b.id) / 365.25)::numeric, 1) as años_operacion, calcular_capacidad_residual(b.id) as capacidad_residual_pct, b.created_at, b.updated_at FROM baterias b LEFT JOIN piscinas p ON b.piscina_id = p.id WHERE verificar_vida_util_cumplida(b.id) = true ORDER BY calcular_dias_desde_instalacion(b.id) DESC;

CREATE INDEX IF NOT EXISTS idx_baterias_estado_vida_util ON baterias(estado_vida_util);
CREATE INDEX IF NOT EXISTS idx_baterias_dias_operacion ON baterias(dias_operacion);

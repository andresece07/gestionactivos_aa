import { supabase } from './supabaseClient'

export const movimientosQueries = {
  // Obtener todos los movimientos de una batería
  getByBateria: async (bateriaId) => {
    return supabase
      .from('movimientos_baterias')
      .select(`
        *,
        baterias(codigo_unico, estado),
        piscinas(nombre)
      `)
      .eq('bateria_id', bateriaId)
      .order('fecha_movimiento', { ascending: false })
  },

  // Obtener todos los movimientos con filtros
  getAll: async (filters = {}) => {
    let query = supabase
      .from('movimientos_baterias')
      .select(`
        *,
        baterias(codigo_unico, estado),
        piscinas(nombre)
      `)

    if (filters.bateriaId) {
      query = query.eq('bateria_id', filters.bateriaId)
    }

    if (filters.piscinaId) {
      query = query.eq('piscina_id', filters.piscinaId)
    }

    if (filters.tipo) {
      query = query.eq('tipo_movimiento', filters.tipo)
    }

    if (filters.estado) {
      query = query.eq('estado_bateria', filters.estado)
    }

    if (filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId)
    }

    if (filters.fechaInicio) {
      query = query.gte('fecha_movimiento', filters.fechaInicio)
    }

    if (filters.fechaFin) {
      query = query.lte('fecha_movimiento', filters.fechaFin)
    }

    return query.order('fecha_movimiento', { ascending: false })
  },

  // Obtener un movimiento específico
  getById: async (id) => {
    return supabase
      .from('movimientos_baterias')
      .select(`
        *,
        baterias(codigo_unico, estado),
        piscinas(nombre)
      `)
      .eq('id', id)
      .single()
  },

  // Crear nuevo movimiento
  create: async (movimiento) => {
    return supabase
      .from('movimientos_baterias')
      .insert([movimiento])
      .select()
  },

  // Actualizar movimiento
  update: async (id, updates) => {
    return supabase
      .from('movimientos_baterias')
      .update(updates)
      .eq('id', id)
      .select()
  },

  // Eliminar movimiento
  delete: async (id) => {
    return supabase
      .from('movimientos_baterias')
      .delete()
      .eq('id', id)
  },

  // Obtener estadísticas de una batería
  getEstadisticas: async (bateriaId) => {
    return supabase
      .from('movimientos_baterias')
      .select('*')
      .eq('bateria_id', bateriaId)
  },

  // Buscar por código único de batería (para QR)
  getByCodigoUnico: async (codigoUnico) => {
    return supabase
      .from('baterias')
      .select('id')
      .eq('codigo_unico', codigoUnico)
      .single()
  }
}

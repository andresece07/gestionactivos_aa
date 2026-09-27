import { createClient } from '@supabase/supabase-js'

// Usar variables de entorno (configuradas en .env o Cloudflare Pages)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Check .env file or Cloudflare Pages settings.')
}

// Crear cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Funciones auxiliares para autenticación
export const supabaseAuth = {
  // Registrar nuevo usuario
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Cerrar sesión
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obtener usuario actual
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Obtener sesión actual
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
}

// Funciones para baterías
export const batteryQueries = {
  // Obtener todas las baterías con info de piscina y ciclos
  getAll: async () => {
    const { data, error } = await supabase
      .from('baterias')
      .select(`
        id,
        sku_dynamics,
        codigo_unico,
        lote,
        proveedor_id,
        piscina_id,
        finca,
        zona,
        tolva,
        piscinas!inner (
          id,
          nombre,
          zona
        ),
        proveedores (
          id,
          nombre
        ),
        fecha_compra,
        fecha_instalacion,
        voltaje_nominal,
        amperios,
        capacidad_kwh_legacy,
        estado,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Obtener batería por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('baterias')
      .select(`
        id,
        sku_dynamics,
        codigo_unico,
        lote,
        proveedor_id,
        piscina_id,
        finca,
        zona,
        tolva,
        piscinas!inner (
          id,
          nombre,
          zona
        ),
        proveedores (
          id,
          nombre
        ),
        fecha_compra,
        fecha_instalacion,
        voltaje_nominal,
        amperios,
        capacidad_kwh_legacy,
        estado,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Crear nueva batería
  create: async (batteryData) => {
    const { data, error } = await supabase
      .from('baterias')
      .insert([batteryData])
      .select()

    return { data, error }
  },

  // Calcular ciclos de una batería (llamar función SQL)
  calculateCycles: async (batteryId) => {
    const { data, error } = await supabase
      .rpc('calcular_ciclos_bateria', { bateria_id: batteryId })

    return { data, error }
  },

  // Calcular capacidad residual de una batería
  calculateResidualCapacity: async (batteryId) => {
    const { data, error } = await supabase
      .rpc('calcular_capacidad_residual', { bateria_id: batteryId })

    return { data, error }
  },

  // Calcular días desde instalación
  calculateDaysFromInstallation: async (batteryId) => {
    const { data, error } = await supabase
      .rpc('calcular_dias_desde_instalacion', { bateria_id: batteryId })

    return { data, error }
  },

  // Obtener estado de vida útil
  getLifeUtilStatus: async (batteryId) => {
    const { data, error } = await supabase
      .rpc('obtener_estado_vida_util', { bateria_id: batteryId })

    return { data, error }
  },

  // Obtener todas las baterías con vida útil cumplida (para reporte)
  getWithLifeUtilExpired: async () => {
    const { data, error } = await supabase
      .from('vw_baterias_vida_util_cumplida')
      .select('*')
      .order('dias_desde_instalacion', { ascending: false })

    return { data, error }
  },

  // Actualizar estado de una batería
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('baterias')
      .update(updates)
      .eq('id', id)
      .select()

    return { data, error }
  },
}

// Funciones para paros de piscina
export const stoppageQueries = {
  // Obtener todos los paros
  getAll: async () => {
    const { data, error } = await supabase
      .from('paros_piscina')
      .select(`
        id,
        piscina_id,
        piscinas!inner (
          id,
          nombre,
          zona
        ),
        fecha_inicio,
        fecha_fin,
        motivo,
        tiempo_espera_dias,
        created_at,
        created_by
      `)
      .order('fecha_inicio', { ascending: false })

    return { data, error }
  },

  // Obtener paros de una piscina
  getByPiscina: async (piscina_id) => {
    const { data, error } = await supabase
      .from('paros_piscina')
      .select(`
        id,
        piscina_id,
        fecha_inicio,
        fecha_fin,
        motivo,
        tiempo_espera_dias,
        created_at,
        created_by
      `)
      .eq('piscina_id', piscina_id)
      .order('fecha_inicio', { ascending: false })

    return { data, error }
  },

  // Crear nuevo paro
  create: async (stopageData) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('paros_piscina')
      .insert([{
        ...stopageData,
        created_by: user?.id,
      }])
      .select()

    return { data, error }
  },

  // Verificar solapamiento de paros
  checkOverlap: async (piscina_id, fecha_inicio, fecha_fin) => {
    const { data, error } = await supabase
      .rpc('verificar_paros_solapados', {
        piscina_id,
        fecha_inicio,
        fecha_fin,
      })

    return { data, error }
  },
}

// Funciones para comentarios
export const commentQueries = {
  // Obtener comentarios de una batería
  getByBattery: async (bateria_id) => {
    const { data, error } = await supabase
      .from('comentarios_bateria')
      .select('*')
      .eq('bateria_id', bateria_id)
      .order('fecha_creacion', { ascending: false })

    return { data, error }
  },

  // Crear comentario
  create: async (bateria_id, contenido) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('comentarios_bateria')
      .insert([{
        bateria_id,
        contenido,
        usuario_id: user?.id,
      }])
      .select()

    return { data, error }
  },
}

// Funciones para piscinas
export const poolQueries = {
  // Obtener todas las piscinas
  getAll: async () => {
    const { data, error } = await supabase
      .from('piscinas')
      .select('*')
      .order('nombre', { ascending: true })

    return { data, error }
  },

  // Obtener piscina por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('piscinas')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },
}

// Funciones para proveedores
export const supplierQueries = {
  // Obtener todos los proveedores
  getAll: async () => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    return { data, error }
  },

  // Obtener proveedor por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Crear nuevo proveedor
  create: async (supplier) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('proveedores')
      .insert([{
        nombre: supplier.nombre,
        contacto: supplier.contacto,
        email: supplier.email,
        telefono: supplier.telefono,
        direccion: supplier.direccion,
        activo: true,
        created_by: user?.id,
      }])
      .select()

    return { data, error }
  },

  // Actualizar proveedor
  update: async (id, supplier) => {
    const { data, error } = await supabase
      .from('proveedores')
      .update({
        nombre: supplier.nombre,
        contacto: supplier.contacto,
        email: supplier.email,
        telefono: supplier.telefono,
        direccion: supplier.direccion,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()

    return { data, error }
  },

  // Desactivar proveedor
  deactivate: async (id) => {
    const { data, error } = await supabase
      .from('proveedores')
      .update({ activo: false })
      .eq('id', id)
      .select()

    return { data, error }
  },
}

// Funciones para empleados
export const employeeQueries = {
  // Obtener todos los empleados
  getAll: async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    return { data, error }
  },

  // Obtener empleado por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },
}

// Funciones para cronograma
export const scheduleQueries = {
  // Obtener cronograma para un rango de fechas
  getRange: async (startDate, endDate) => {
    const { data, error } = await supabase
      .from('cronograma_personal')
      .select(`
        id,
        empleado_id,
        empleados (
          id,
          nombre,
          cargo,
          color
        ),
        fecha,
        estado,
        motivo
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })

    return { data, error }
  },

  // Obtener cronograma de un empleado
  getByEmployee: async (employeeId, startDate, endDate) => {
    const { data, error } = await supabase
      .from('cronograma_personal')
      .select('*')
      .eq('empleado_id', employeeId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })

    return { data, error }
  },

  // Crear o actualizar registro de cronograma
  upsert: async (scheduleData) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('cronograma_personal')
      .upsert([{
        ...scheduleData,
        creado_por: user?.id,
      }], { onConflict: 'empleado_id,fecha' })
      .select()

    return { data, error }
  },

  // Actualizar rango de fechas
  updateRange: async (employeeId, startDate, endDate, estado, motivo) => {
    const user = await supabaseAuth.getUser()
    const dates = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    const records = dates.map(date => ({
      empleado_id: employeeId,
      fecha: date,
      estado,
      motivo,
      creado_por: user?.id,
    }))

    const { data, error } = await supabase
      .from('cronograma_personal')
      .upsert(records, { onConflict: 'empleado_id,fecha' })
      .select()

    return { data, error }
  },
}

// Funciones para movimientos de baterías
export const movimientosQueries = {
  // Obtener todos los movimientos de una batería
  getByBateria: async (bateriaId) => {
    const { data, error } = await supabase
      .from('movimientos_baterias')
      .select(`
        *,
        baterias(codigo_unico, estado),
        piscinas(nombre)
      `)
      .eq('bateria_id', bateriaId)
      .order('fecha_movimiento', { ascending: false })

    return { data, error }
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

    const result = await query.order('fecha_movimiento', { ascending: false })
    return result
  },

  // Obtener un movimiento específico
  getById: async (id) => {
    const { data, error } = await supabase
      .from('movimientos_baterias')
      .select(`
        *,
        baterias(codigo_unico, estado),
        piscinas(nombre)
      `)
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Crear nuevo movimiento
  create: async (movimiento) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('movimientos_baterias')
      .insert([{
        ...movimiento,
        usuario_id: user?.id,
        usuario_nombre: user?.email,
      }])
      .select()

    return { data, error }
  },

  // Actualizar movimiento
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('movimientos_baterias')
      .update(updates)
      .eq('id', id)
      .select()

    return { data, error }
  },

  // Eliminar movimiento
  delete: async (id) => {
    const { error } = await supabase
      .from('movimientos_baterias')
      .delete()
      .eq('id', id)

    return { error }
  },

  // Buscar por código único de batería (para QR)
  getByCodigoUnico: async (codigoUnico) => {
    const { data, error } = await supabase
      .from('baterias')
      .select('id')
      .eq('codigo_unico', codigoUnico)
      .single()

    return { data, error }
  }
}

// ============================================================
// NUEVAS QUERIES - CATÁLOGO DE ACTIVOS GENÉRICO
// ============================================================

// Categorías de producto
export const categoryQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .eq('activo', true)
      .order('codigo', { ascending: true })
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (category) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('categorias_producto')
      .insert([{ ...category, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('categorias_producto')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Marcas
export const brandQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (brand) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('marcas')
      .insert([{ ...brand, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('marcas')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Productos (SKUs)
export const productQueries = {
  getAll: async (filters = {}) => {
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias_producto (codigo, nombre, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida),
        marcas (codigo, nombre)
      `)
      .eq('activo', true)
      .order('sku', { ascending: true })

    if (filters.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id)
    }
    if (filters.marca_id) {
      query = query.eq('marca_id', filters.marca_id)
    }

    const { data, error } = await query
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias_producto (codigo, nombre, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida),
        marcas (codigo, nombre)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (product) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('productos')
      .insert([{ ...product, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('productos')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Fincas
export const farmQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('fincas')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('fincas')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (farm) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('fincas')
      .insert([{ ...farm, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('fincas')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Zonas
export const zoneQueries = {
  getAll: async (fincaId) => {
    let query = supabase
      .from('zonas')
      .select(`
        *,
        fincas (codigo, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (fincaId) {
      query = query.eq('finca_id', fincaId)
    }

    const { data, error } = await query
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('zonas')
      .select(`
        *,
        fincas (codigo, nombre)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (zone) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('zonas')
      .insert([{ ...zone, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('zonas')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Tolvas
export const hopperQueries = {
  getAll: async (zonaId) => {
    let query = supabase
      .from('tolvas')
      .select(`
        *,
        zonas (codigo, nombre, fincas (codigo, nombre))
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (zonaId) {
      query = query.eq('zona_id', zonaId)
    }

    const { data, error } = await query
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('tolvas')
      .select(`
        *,
        zonas (codigo, nombre, fincas (codigo, nombre))
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (hopper) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('tolvas')
      .insert([{ ...hopper, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('tolvas')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Activos (reemplaza baterías)
export const assetQueries = {
  getAll: async (filters = {}) => {
    let query = supabase
      .from('activos')
      .select(`
        *,
        productos (
          sku, nombre, marca, modelo, voltaje_nominal,
          categorias_producto (codigo, nombre, tipo_obsolescencia, vida_util_anos),
          marcas (codigo, nombre)
        ),
        fincas (codigo, nombre),
        zonas (codigo, nombre),
        tolvas (codigo, nombre),
        piscinas (nombre),
        proveedores (nombre)
      `)
      .order('created_at', { ascending: false })

    if (filters.producto_id) query = query.eq('producto_id', filters.producto_id)
    if (filters.finca_id) query = query.eq('finca_id', filters.finca_id)
    if (filters.zona_id) query = query.eq('zona_id', filters.zona_id)
    if (filters.tolva_id) query = query.eq('tolva_id', filters.tolva_id)
    if (filters.piscina_id) query = query.eq('piscina_id', filters.piscina_id)
    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.proveedor_id) query = query.eq('proveedor_id', filters.proveedor_id)

    const { data, error } = await query
    return { data, error }
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('activos')
      .select(`
        *,
        productos (
          sku, nombre, marca, modelo, voltaje_nominal, especificaciones,
          categorias_producto (codigo, nombre, tipo_obsolescencia, vida_util_anos, factor_degradacion, unidad_medida_vida),
          marcas (codigo, nombre)
        ),
        fincas (codigo, nombre),
        zonas (codigo, nombre),
        tolvas (codigo, nombre),
        piscinas (nombre, zona),
        proveedores (nombre, contacto, email, telefono)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },
  create: async (asset) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('activos')
      .insert([{ ...asset, created_by: user?.id }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('activos')
      .update({ ...updates, updated_at: new Date(), updated_by: user?.id })
      .eq('id', id)
      .select()
    return { data, error }
  },
  // Calcular obsolescencia
  calculateObsolescence: async (assetId) => {
    const { data, error } = await supabase
      .rpc('calcular_obsolescencia_activo', { activo_id: assetId })
    return { data, error }
  },
  // Calcular vida útil restante
  calculateRemainingLife: async (assetId) => {
    const { data, error } = await supabase
      .rpc('calcular_vida_util_restante', { activo_id: assetId })
    return { data, error }
  },
  // Obtener activos con obsolescencia crítica
  getCriticalObsolescence: async () => {
    const { data, error } = await supabase
      .from('vw_activos_obsolescencia_critica')
      .select('*')
    return { data, error }
  },
}

// Movimientos de activos
export const assetMovementQueries = {
  getByAsset: async (assetId) => {
    const { data, error } = await supabase
      .from('movimientos_activos')
      .select(`
        *,
        fincas!finca_id_origen (codigo, nombre),
        zonas!zona_id_origen (codigo, nombre),
        tolvas!tolva_id_origen (codigo, nombre),
        piscinas!piscina_id_origen (nombre),
        fincas!finca_id_destino (codigo, nombre),
        zonas!zona_id_destino (codigo, nombre),
        tolvas!tolva_id_destino (codigo, nombre),
        piscinas!piscina_id_destino (nombre)
      `)
      .eq('activo_id', assetId)
      .order('fecha_movimiento', { ascending: false })
    return { data, error }
  },
  getAll: async (filters = {}) => {
    let query = supabase
      .from('movimientos_activos')
      .select(`
        *,
        activos (codigo_unico, productos (sku, nombre)),
        fincas!finca_id_origen (codigo, nombre),
        zonas!zona_id_origen (codigo, nombre),
        tolvas!tolva_id_origen (codigo, nombre)
      `)
      .order('fecha_movimiento', { ascending: false })

    if (filters.activo_id) query = query.eq('activo_id', filters.activo_id)
    if (filters.tipo_movimiento) query = query.eq('tipo_movimiento', filters.tipo_movimiento)
    if (filters.fechaInicio) query = query.gte('fecha_movimiento', filters.fechaInicio)
    if (filters.fechaFin) query = query.lte('fecha_movimiento', filters.fechaFin)

    const { data, error } = await query
    return { data, error }
  },
  create: async (movement) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('movimientos_activos')
      .insert([{ ...movement, usuario_id: user?.id, usuario_nombre: user?.email }])
      .select()
    return { data, error }
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('movimientos_activos')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },
  delete: async (id) => {
    const { error } = await supabase
      .from('movimientos_activos')
      .delete()
      .eq('id', id)
    return { error }
  },
}

// Comentarios de activos
export const assetCommentQueries = {
  getByAsset: async (assetId) => {
    const { data, error } = await supabase
      .from('comentarios_activo')
      .select('*')
      .eq('activo_id', assetId)
      .order('fecha_creacion', { ascending: false })
    return { data, error }
  },
  create: async (assetId, contenido) => {
    const user = await supabaseAuth.getUser()
    const { data, error } = await supabase
      .from('comentarios_activo')
      .insert([{ activo_id: assetId, contenido, usuario_id: user?.id }])
      .select()
    return { data, error }
  },
}

// Función para escuchar cambios en tiempo real
export const subscribeToChanges = (table, callback) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()

  return subscription
}

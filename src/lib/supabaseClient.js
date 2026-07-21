import { createClient } from '@supabase/supabase-js'

// Credenciales Supabase - TEMPORAL (mover a env vars en producción)
const SUPABASE_URL = 'https://radggsmuvtalwwktljfu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_'

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
        capacidad_kwh,
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
        capacidad_kwh,
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
    const { data, error } = await supabase
      .from('proveedores')
      .insert([{
        nombre: supplier.nombre,
        contacto: supplier.contacto,
        email: supplier.email,
        telefono: supplier.telefono,
        direccion: supplier.direccion,
        activo: true,
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

// Función para escuchar cambios en tiempo real
export const subscribeToChanges = (table, callback) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()

  return subscription
}

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
        piscina_id,
        piscinas!inner (
          id,
          nombre,
          zona
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
        piscina_id,
        piscinas!inner (
          id,
          nombre,
          zona
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

// Función para escuchar cambios en tiempo real
export const subscribeToChanges = (table, callback) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()

  return subscription
}

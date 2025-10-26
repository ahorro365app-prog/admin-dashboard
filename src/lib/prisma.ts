import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para Prisma
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cliente Prisma simulado usando Supabase
export const prisma = {
  // Usuarios
  usuario: {
    async findMany(options: any = {}) {
      const { take = 50, skip = 0, select, where } = options
      
      let query = supabase.from('usuarios').select(select ? Object.keys(select).join(', ') : '*')
      
      if (where) {
        // Aplicar filtros avanzados
        Object.keys(where).forEach(key => {
          if (where[key] !== undefined) {
            if (typeof where[key] === 'object' && where[key] !== null) {
              // Manejar filtros complejos como { contains: '...', mode: 'insensitive' }
              if (where[key].contains) {
                query = query.ilike(key, `%${where[key].contains}%`)
              }
            } else {
              query = query.eq(key, where[key])
            }
          }
        })
      }
      
      if (skip) {
        query = query.range(skip, skip + take - 1)
      } else if (take) {
        query = query.limit(take)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },

    async findUnique(options: any) {
      const { where, select } = options
      
      let query = supabase.from('usuarios').select(select ? Object.keys(select).join(', ') : '*')
      
      if (where.id) {
        query = query.eq('id', where.id)
      } else if (where.correo) {
        query = query.eq('correo', where.correo)
      }
      
      const { data, error } = await query.single()
      
      if (error) throw error
      return data
    },

    async update(options: any) {
      const { where, data: updateData } = options
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', where.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(options: any) {
      const { where } = options
      
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', where.id)
      
      if (error) throw error
      return { id: where.id }
    },

    async count(options: any = {}) {
      const { where } = options
      
      let query = supabase.from('usuarios').select('*', { count: 'exact', head: true })
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (where[key] !== undefined) {
            query = query.eq(key, where[key])
          }
        })
      }
      
      const { count, error } = await query
      
      if (error) throw error
      return count || 0
    }
  },

  // Transacciones
  transaccion: {
    async findMany(options: any = {}) {
      const { take = 50, select, where } = options
      
      let query = supabase.from('transacciones').select(select ? Object.keys(select).join(', ') : '*')
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (where[key] !== undefined) {
            query = query.eq(key, where[key])
          }
        })
      }
      
      if (take) {
        query = query.limit(take)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },

    async count(options: any = {}) {
      const { where } = options
      
      let query = supabase.from('transacciones').select('*', { count: 'exact', head: true })
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (where[key] !== undefined) {
            if (typeof where[key] === 'object' && where[key] !== null) {
              // Manejar filtros de fecha como { gte: '...', lte: '...' }
              if (where[key].gte) {
                query = query.gte(key, where[key].gte)
              }
              if (where[key].lte) {
                query = query.lte(key, where[key].lte)
              }
            } else {
              query = query.eq(key, where[key])
            }
          }
        })
      }
      
      const { count, error } = await query
      
      if (error) throw error
      return count || 0
    }
  },

  // Deudas
  deuda: {
    async findMany(options: any = {}) {
      const { take = 50, select, where } = options
      
      let query = supabase.from('deudas').select(select ? Object.keys(select).join(', ') : '*')
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (where[key] !== undefined) {
            query = query.eq(key, where[key])
          }
        })
      }
      
      if (take) {
        query = query.limit(take)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    }
  },

  // Métodos de conexión simulados
  async $connect() {
    console.log('✅ Prisma conectado (usando Supabase como backend)')
  },

  async $disconnect() {
    console.log('✅ Prisma desconectado')
  },

  async $queryRaw(query: string) {
    console.log('🔍 Query raw:', query)
    return [{ result: 'OK' }]
  }
}

// Función para verificar la conexión
export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('usuarios').select('id').limit(1)
    if (error) throw error
    console.log('✅ Conexión a la base de datos verificada')
    return true
  } catch (error) {
    console.error('❌ Error verificando conexión:', error)
    return false
  }
}


import { createClient } from '@supabase/supabase-js'

/**
 * Obtiene el cliente de Supabase de forma lazy
 * Solo se crea cuando se necesita, evitando errores durante el build
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// El cliente se obtiene de forma lazy en cada método

// Cliente Prisma simulado usando Supabase
export const prisma = {
  // Usuarios
  usuario: {
    async findMany(options: any = {}) {
      try {
        const { take = 50, skip = 0, select, where } = options
        
        // Handle select field properly for Supabase
        let selectFields = '*'
        if (select) {
          if (typeof select === 'string') {
            selectFields = select
          } else if (typeof select === 'object') {
            selectFields = Object.keys(select).join(', ')
          }
        }
        
        const client = getSupabaseClient();
        let query = client.from('usuarios').select(selectFields)
        
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
        
        if (error) {
          console.error('Prisma findMany error:', error)
          throw error
        }
        return data || []
      } catch (error: any) {
        console.error('Error in prisma.usuario.findMany:', error)
        return []
      }
    },

    async findUnique(options: any) {
      const { where, select } = options
      
      const client = getSupabaseClient();
      let query = client.from('usuarios').select(select ? Object.keys(select).join(', ') : '*')
      
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
      
      const client = getSupabaseClient();
      const { data, error } = await client
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
      
      const client = getSupabaseClient();
      const { error } = await client
        .from('usuarios')
        .delete()
        .eq('id', where.id)
      
      if (error) throw error
      return { id: where.id }
    },

    async count(options: any = {}) {
      const { where } = options
      
      const client = getSupabaseClient();
      let query = client.from('usuarios').select('*', { count: 'exact', head: true })
      
      if (where) {
        const { OR, ...rest } = where

        Object.keys(rest).forEach(key => {
          const value = rest[key]

          if (value === undefined) {
            return
          }

          if (value === null) {
            query = query.is(key, null)
            return
          }

          if (typeof value === 'object') {
            if (value.contains) {
              const pattern = `%${value.contains}%`
              if (value.mode && value.mode.toLowerCase() === 'insensitive') {
                query = query.ilike(key, pattern)
              } else {
                query = query.like(key, pattern)
              }
              return
            }

            if (value.gte !== undefined) {
              query = query.gte(key, value.gte)
            }

            if (value.lte !== undefined) {
              query = query.lte(key, value.lte)
            }

            if (Array.isArray(value.in) && value.in.length > 0) {
              query = query.in(key, value.in)
            }

            return
          }

          query = query.eq(key, value)
        })

        if (Array.isArray(OR) && OR.length > 0) {
          const orFilters: string[] = []

          OR.forEach((condition: Record<string, any>) => {
            Object.keys(condition).forEach(field => {
              const value = condition[field]
              if (value === undefined) {
                return
              }

              if (value === null) {
                orFilters.push(`${field}.is.null`)
                return
              }

              if (typeof value === 'object') {
                if (value.contains) {
                  const pattern = encodeURIComponent(`%${value.contains}%`)
                  const operator = value.mode && value.mode.toLowerCase() === 'insensitive' ? 'ilike' : 'like'
                  orFilters.push(`${field}.${operator}.${pattern}`)
                  return
                }

                if (value.eq !== undefined) {
                  orFilters.push(`${field}.eq.${encodeURIComponent(value.eq)}`)
                  return
                }

                if (value.gte !== undefined) {
                  orFilters.push(`${field}.gte.${encodeURIComponent(value.gte)}`)
                }

                if (value.lte !== undefined) {
                  orFilters.push(`${field}.lte.${encodeURIComponent(value.lte)}`)
                }

                if (Array.isArray(value.in) && value.in.length > 0) {
                  const list = value.in.map((item: any) => encodeURIComponent(item)).join(',')
                  orFilters.push(`${field}.in.(${list})`)
                }

                return
              }

              orFilters.push(`${field}.eq.${encodeURIComponent(value)}`)
            })
          })

          if (orFilters.length > 0) {
            query = query.or(orFilters.join(','))
          }
        }
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
      
      const client = getSupabaseClient();
      let query = client.from('transacciones').select(select ? Object.keys(select).join(', ') : '*')
      
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
      
      const client = getSupabaseClient();
      let query = client.from('transacciones').select('*', { count: 'exact', head: true })
      
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
      
      const client = getSupabaseClient();
      let query = client.from('deudas').select(select ? Object.keys(select).join(', ') : '*')
      
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
    const client = getSupabaseClient();
    const { data, error } = await client.from('usuarios').select('id').limit(1)
    if (error) throw error
    console.log('✅ Conexión a la base de datos verificada')
    return true
  } catch (error) {
    console.error('❌ Error verificando conexión:', error)
    return false
  }
}


// Si no hay credenciales de Supabase configuradas, la app entra en MODO DEMO
// (datos de ejemplo en el navegador) para poder verla funcionando.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY

// Orden y nombres de las fases del torneo (códigos de football-data.org)
export const STAGES = [
  { code: 'GROUP_STAGE', label: 'Fase de grupos', knockout: false },
  { code: 'LAST_32', label: 'Dieciseisavos', knockout: true },
  { code: 'LAST_16', label: 'Octavos', knockout: true },
  { code: 'QUARTER_FINALS', label: 'Cuartos', knockout: true },
  { code: 'SEMI_FINALS', label: 'Semifinales', knockout: true },
  { code: 'THIRD_PLACE', label: '3er puesto', knockout: true },
  { code: 'FINAL', label: 'Final', knockout: true },
]

export const stageInfo = (code) =>
  STAGES.find((s) => s.code === code) || { code, label: code, knockout: true }

export const isKnockout = (code) => stageInfo(code).knockout

// Puntos: 1 por acierto en grupos, 2 en eliminatorias
export const POINTS = { GROUP: 1, KNOCKOUT: 2 }

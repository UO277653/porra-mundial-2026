// Sincroniza los partidos del Mundial desde football-data.org a Supabase.
// Lo ejecuta GitHub Actions cada 30 min (ver .github/workflows/sync.yml),
// pero también puedes lanzarlo a mano:  npm run sync
//
// Variables de entorno necesarias:
//   FOOTBALL_DATA_TOKEN        token gratuito de football-data.org
//   SUPABASE_URL               URL del proyecto Supabase
//   SUPABASE_SERVICE_ROLE_KEY  clave service_role (¡solo en secretos, nunca en el frontend!)

const { FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

for (const [name, value] of Object.entries({ FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!value) {
    console.error(`Falta la variable de entorno ${name}`)
    process.exit(1)
  }
}

// Nombres de selecciones en castellano (la API los da en inglés)
const NAMES_ES = {
  Spain: 'España', France: 'Francia', Germany: 'Alemania', England: 'Inglaterra',
  Italy: 'Italia', Belgium: 'Bélgica', Netherlands: 'Países Bajos', Portugal: 'Portugal',
  Croatia: 'Croacia', Switzerland: 'Suiza', Poland: 'Polonia', Denmark: 'Dinamarca',
  Sweden: 'Suecia', Norway: 'Noruega', Austria: 'Austria', Scotland: 'Escocia',
  Wales: 'Gales', Ireland: 'Irlanda', Turkey: 'Turquía', Ukraine: 'Ucrania',
  Greece: 'Grecia', Hungary: 'Hungría', Serbia: 'Serbia', Slovenia: 'Eslovenia',
  Slovakia: 'Eslovaquia', Czechia: 'Chequia', 'Czech Republic': 'Chequia',
  Romania: 'Rumanía', Albania: 'Albania', Finland: 'Finlandia',
  Brazil: 'Brasil', Argentina: 'Argentina', Uruguay: 'Uruguay', Colombia: 'Colombia',
  Ecuador: 'Ecuador', Peru: 'Perú', Chile: 'Chile', Paraguay: 'Paraguay',
  Bolivia: 'Bolivia', Venezuela: 'Venezuela',
  Mexico: 'México', Canada: 'Canadá', 'United States': 'Estados Unidos', USA: 'Estados Unidos',
  'Costa Rica': 'Costa Rica', Panama: 'Panamá', Honduras: 'Honduras', Jamaica: 'Jamaica',
  Haiti: 'Haití', Curacao: 'Curazao', 'Curaçao': 'Curazao',
  Japan: 'Japón', 'South Korea': 'Corea del Sur', 'Korea Republic': 'Corea del Sur',
  Australia: 'Australia', 'Saudi Arabia': 'Arabia Saudí', Iran: 'Irán', Qatar: 'Catar',
  Uzbekistan: 'Uzbekistán', Jordan: 'Jordania', Iraq: 'Irak',
  Morocco: 'Marruecos', Senegal: 'Senegal', Tunisia: 'Túnez', Algeria: 'Argelia',
  Egypt: 'Egipto', Nigeria: 'Nigeria', Ghana: 'Ghana', Cameroon: 'Camerún',
  'Ivory Coast': 'Costa de Marfil', "Côte d'Ivoire": 'Costa de Marfil',
  'South Africa': 'Sudáfrica', 'Cape Verde': 'Cabo Verde', 'New Zealand': 'Nueva Zelanda',
}

const teamName = (team) => {
  if (!team || !team.name || team.name === 'TBD') return null
  return NAMES_ES[team.name] || team.shortName || team.name
}

// "GROUP_A" → "Grupo A"
const groupName = (g) => (g ? g.replace(/^GROUP_/, 'Grupo ') : null)

async function main() {
  console.log('Descargando partidos del Mundial desde football-data.org…')
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
  })
  if (!res.ok) {
    throw new Error(`football-data.org respondió ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()
  console.log(`Recibidos ${data.matches.length} partidos`)

  const rows = data.matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    group_name: groupName(m.group),
    matchday: m.matchday ?? null,
    utc_date: m.utcDate,
    status: m.status,
    home_team: teamName(m.homeTeam),
    home_crest: m.homeTeam?.crest || null,
    away_team: teamName(m.awayTeam),
    away_crest: m.awayTeam?.crest || null,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    winner: m.score?.winner || null,
    updated_at: new Date().toISOString(),
  }))

  // Upsert directo vía la API REST de Supabase (merge-duplicates = upsert por clave primaria)
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const up = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(chunk),
    })
    if (!up.ok) {
      throw new Error(`Error guardando en Supabase (${up.status}): ${await up.text()}`)
    }
  }
  console.log(`Sincronizados ${rows.length} partidos ✔`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

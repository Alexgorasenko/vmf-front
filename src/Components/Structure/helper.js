const tournamentModel = (tour, selection, archSeason, locked=false, relations) => {
    return {
        label: tour.name,
        level: archSeason ? '4' : '3',
        _id: tour._id,
        expanded: true,
        type: 'tournament',
        locked: locked,
        finished: tour.finished,
        removingEnabled: !tour.children || !tour.children.length  || !tour.children.filter(c => c._id).length,
        children: !locked && (selection[archSeason ? '4' : '3'] === tour._id) ? tour.children.map(st => ({
            label: st.name,
            expanded: false,
            removingEnabled: !st.matches,
            _id: st._id,
            type: 'stage',
            stageType: st.type
        })).concat({label: 'Создать стадию', type: 'create_trigger', collection: 'stages', relations: {...relations, tournamentId: tour._id, tournamentName: tour.name}}, {label: 'Завершить', type: 'finish_trigger', _id: tour._id, name: tour.name}) : []
    }
}

const seasonModel = (seas, selection, arch=false, relations) => {
    console.log(seas)
    const output = seas.children ? []
     .concat(seas.children.filter(t => !t.finished)).map(t => tournamentModel(t, selection, arch, false, {...relations, seasonId: seas._id, seasonName: seas.name}))
     .concat([seas.children.filter(t => t.finished).length ? {
         label: 'Завершённые турниры',
         level: arch ? '3' : '2',
         _id: 'archived_tours',
         expanded: true,
         children: selection[arch ? '3' : '2'] === 'archived_tours' ? seas.children.filter(t => t.finished).map(t => tournamentModel(t, selection, arch, true)) : []
     } : null])
     .flat(1)
     .filter(n => n) : []

     return {
         label: seas.name,
         level: arch ? '2' : '1',
         _id: seas._id,
         type: 'season',
         expanded: true,
         removingEnabled: !seas.children || !seas.children.length  || !seas.children.filter(c => c._id).length,
         children: selection[arch ? '2' : '1'] === seas._id ? [{label: 'Создать турнир', type: 'create_trigger', collection: 'tournaments', relations: {...relations, seasonId: seas._id, seasonName: seas.name}}].concat(output) : []
     }
}

const mapStructure = (federation, raw, selection) => {
    console.log(federation, 'raw', raw)
    return [
        {
            label: federation.name,
            expanded: true,
            children: raw.map(league => {
                return {
                    label: league.name,
                    disciplineId: league.disciplineId,
                    type: 'league',
                    level: '0',
                    _id: league._id,
                    expanded: true,
                    removingEnabled: !league.children || !league.children.length || !league.children.filter(c => c._id).length,
                    children: selection[0] === league._id ? [
                        {label: 'Создать сезон', type: 'create_trigger', collection: 'seasons', relations: {leagueId: league._id, leagueName: league.name, federationId: federation._id}},
                        league.children[0] ? seasonModel(league.children[0], selection, false, {leagueId: league._id, leagueName: league.name, federationId: federation._id}) : null,
                        league.children.slice(1).length ? {
                            label: 'Архивные сезоны',
                            level: '1',
                            _id: 'archived',
                            expanded: true,
                            children: selection['1'] === 'archived' ? league.children.slice(1).map(s => seasonModel(s, selection, true, {leagueId: league._id, leagueName: league.name, federationId: federation._id})) : []
                        } : null
                    ].filter(node => node) : []
                }
            }).concat([{
                label: 'Создать лигу',
                type: 'create_trigger',
                collection: 'leagues',
                relations: {federationId: federation._id}
            }])
        }
    ]
}

export { mapStructure }

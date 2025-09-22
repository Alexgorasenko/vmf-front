const getBasicAndActiveBtn = (form, team, limit, lineups) => {
    const output = {
        activeBtn: 'one',
        basic: []
    };

    if (form && form[`${team}Roster`]) {
        if (form[`${team}Roster`].lineup && form[`${team}Roster`].lineup.players) {
            output.basic.push(...form[`${team}Roster`].lineup.players.slice(0, limit))
            output.activeBtn = 'list'
            if (form[`${team}Roster`].lineup.formation) {
                output.activeBtn = 'arrangement';

                if (lineups && lineups.length) {
                    const tacticBtn = lineups.find((item, ind) => item[1].replace(/\s/ig, '') === form[`${team}Roster`].lineup.formation.replace(/' '/ig, ''));
                    output.tacticsButton = tacticBtn || lineups[0];
                } else {
                    output.tacticsButton = lineups[0];
                }
            }
        }
    }

    return output
}

export { getBasicAndActiveBtn }

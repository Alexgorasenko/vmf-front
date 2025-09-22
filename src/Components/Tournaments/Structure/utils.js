const utils = {}

const init = {
    "pts": 0,
    // "w": 0,
    // "d": 0,
    // "l": 0,
    // "pld": 0,
    // "gs": 0,
    // "gc": 0
}

utils.getInitial = teams => {
    if (teams && teams.length) {
        const red = teams.reduce((acc, t) => {
            if (t._id) {
                acc[t._id] = {
                    pts: 0,
                    team: t
                }
            } else if (t.team) {
                acc[t.team._id] = {...t}
            }
            return acc;
        }, {})

        return Object.values(red)
    } else {
        return null
    }
}

utils.mapperInitial = (initial, teams) => {
    if (teams && teams.length) {

        const red = teams.reduce((acc, t) => {
            if (t._id) {
                if (initial && initial[t._id]) {
                    acc[t._id] = {
                        ...initial[t._id],
                        team: t
                    }
                } else {
                    acc[t._id] = {
                        ...init,
                        team: t
                    }
                }
            }
            return acc
        }, {})

        return Object.values(red)
    } else {
        return null
    }
}

utils.teamsToInitial = (teams) => {
    if (teams && teams.length) {
        const red = teams.filter(t => t.pts).reduce((acc, t) => {
            const { _id, team, ...rest } = t;
            if (_id) {
                acc[_id] = {...rest}
            } else if (team) {
                acc[team._id] = {...rest}
            }
            return acc;
        }, {})
        console.log('teamsToInitial', red);
        return red
    } else {
        return null
    }
}

export default utils

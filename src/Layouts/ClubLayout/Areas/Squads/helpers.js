const checkUnlinkedDiff = obj => {
    return obj.squadState && (Object.entries(obj).length === 1) && obj.squadState.unlinked
}

const checkOnlyNumberDiff = (obj) => {
    return obj.squadState && (Object.entries(obj).length === 1) && obj.squadState.number && (Object.entries(obj.squadState).length === 1)
}

const collectNumbersOnly = (diff, origin) => {
    return Object.keys(diff).reduce((acc, id) => {
        const isOnlyNumber = checkOnlyNumberDiff(diff[id])
        if(isOnlyNumber) {
            const matched = origin.findIndex(p => p._id === id)
            if(matched > -1) {
                acc.push({_id: id, value: diff[id].squadState.number})
            }
        }

        return acc
    }, [])
}

const mergeUpdatedPlayers = (diff, origin, unlinked=false) => {
    return Object.keys(diff).reduce((acc, id) => {
        const isUnlinked = checkUnlinkedDiff(diff[id])
        const valid = (unlinked && isUnlinked) || (!unlinked && !isUnlinked)
        if(valid) {
            const isOnlyNumber = checkOnlyNumberDiff(diff[id])
            if(!isOnlyNumber) {
                const matched = origin.find(p => p._id === id)
                if(matched) {
                    acc.push({...matched})
                }
            }
        }

        return acc
    }, [])
}

const mapAddedPlayers = (obj) => {
    return Object.keys(obj).reduce((acc, id) => {
        const base = obj[id]._id ? {...obj[id]} : {...obj[id], id: id}
        const squadState = base.squadState ? {...base.squadState, isRequested: true} : {isRequested: true}
        acc.push({...base, squadState: squadState})
        return acc
    }, [])
}

const prepareManualSquad = (diff, squad) => {
    const { data } = squad

    return {
        body: {
            manage: true,
            mode: 'update',
            headquarters: {added: [], unlinked: [], updated: []},
            squadId: data._id,
            teamId: data.teamId,
            tournamentId: data.tournamentId,
            players: {
                added: mapAddedPlayers(diff.added),
                unlinked: [],
                updated: mergeUpdatedPlayers(diff.updated, data.players)
            }
        },
        unlinked: {
            data: mergeUpdatedPlayers(diff.updated, data.players, true).map(e => ({_id: e._id, value: e.squadState.unlinked})),
            squadId: data._id,
        },
        onlyNumbers: {
            data: collectNumbersOnly(diff.updated, data.players),
            squadId: data._id
        }
    }
}

export { prepareManualSquad }

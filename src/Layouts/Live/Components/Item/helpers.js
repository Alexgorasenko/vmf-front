import axios from 'axios'
import { ENDPOINT } from '../../../../env'

const patchStreamState = (stateId, body) => {
    axios.put(`${ENDPOINT}v2/states/${stateId}`, {stream: body}, {
        headers: {
            Authorization: localStorage.getItem('_amateum_subject_tkn'),
            SignedBy: localStorage.getItem('_amateum_tkn')
        }
    })
}

const applyMatchState = (ctx, options) => {
    return new Promise((resolve, reject) => {
        axios.post(`${ENDPOINT}v2/applyMatchState/${ctx.entity._id}`, options, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            resolve(resp.data)
        })
    })
}

const patchPostMode = (stateId, state) => {
    axios.put(`${ENDPOINT}v2/states/${stateId}`, {
        postMode: state
    }, {
        headers: {
            Authorization: localStorage.getItem('_amateum_subject_tkn'),
            SignedBy: localStorage.getItem('_amateum_tkn')
        }
    })
}

const blinkTime = (stateId, obj) => {
    const stamp = new Date().getTime()
    axios.put(`${ENDPOINT}v2/states/${stateId}`, {
        blinked: stamp,
        time: obj
    }, {
        headers: {
            Authorization: localStorage.getItem('_amateum_subject_tkn'),
            SignedBy: localStorage.getItem('_amateum_tkn')
        }
    })
}

const sortEventsByMinute = (a, b) => {
    return b.minute > a.minute ? 1 : a.minute > b.minute ? -1 : b.addon > a.addon ? 1 : a.addon > b.addon ? -1 : 0
}

const extractEvent = (events, id) => {
    const pull = (events.home ? events.home.map(e => ({...e, side: 'home'})) : []).concat(events.away ? events.away.map(e => ({...e, side: 'away'})) : [])
    return pull.find(e => e.id === id)
}

const completeLineup = (lineup, side, ctx) => {
    let rosters = ctx.entity.rosters ? {...ctx.entity.rosters} : {}
    const target = rosters[side] ? {...rosters[side]} : null
    if(target) {
        ctx.setEntity({
            ...ctx.entity,
            rosters: {
                ...rosters,
                [side]: {
                    ...target,
                    lineup: lineup
                }
            }
        })

        const patch = {[`rosters.${side}`]: {...target, lineup: lineup}}
        axios.put(`${ENDPOINT}v2/states/${ctx.entity._id}`, patch, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            ctx.setPanel(`${side}ShareLineupPanel`)
        })
    }
}

const completeRoster = (side, ctx) => {
    let rosters = ctx.entity.rosters ? {...ctx.entity.rosters} : {}
    const target = rosters[side] ? {...rosters[side]} : null
    if(target) {
        ctx.setEntity({
            ...ctx.entity,
            rosters: {
                ...rosters,
                [side]: {
                    ...target,
                    status: 'completed'
                }
            }
        })

        const patch = {[`rosters.${side}`]: {...target, status: 'completed'}}
        axios.put(`${ENDPOINT}v2/states/${ctx.entity._id}`, patch, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            // ctx.setPanel(!ctx.time.period ? side+'LineupPanel' : null)
            ctx.setPanel(side+'LineupPanel')
        })
    }
}

const patchRosterNum = (obj, side, ctx, setDoubles, inRoster) => {
    let rosters = ctx.entity.rosters ? {...ctx.entity.rosters} : {}
    const target = rosters[side] ? {...rosters[side]} : {actor: localStorage.getItem('_amateum_uid'), list: [], status: 'inprogress'}

    const entity = target.list.find(e => e._id === obj._id)

    if(target.list.find(p => obj.num && p.num === obj.num && p._id !== obj._id) && inRoster && !(target.list.find(p => entity && entity.num && entity.num === p.num && entity._id !== p._id))){
        setDoubles(prevState => prevState + 1)
    } else if (!(target.list.find(p => obj.num && p.num === obj.num && p._id !== obj._id)) && target.list.find(p => entity && entity.num && entity.num === p.num && entity._id !== p._id)) {
        setDoubles(prevState => prevState - 1)
    }

    ctx.setEntity({
        ...ctx.entity,
        rosters: {
            ...rosters,
            [side]: {
                ...target,
                list: target.list.map(e => e._id === obj._id ? ({...e, num: obj.num}) : e)
            }
        }
    })

    return
}

const togglePlayerInRoster = (obj, side, ctx, setDoubles) => {
    let rosters = ctx.entity.rosters ? {...ctx.entity.rosters} : {}
    const target = rosters[side] ? {...rosters[side]} : {actor: localStorage.getItem('_amateum_uid'), list: [], status: 'inprogress'}

    if(!rosters[side]) {
        const patch = {[`rosters.${side}`]: target}
        axios.put(`${ENDPOINT}v2/states/${ctx.entity._id}`, patch, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        })
    }

    const entity = target.list.find(e => e._id === obj._id)

    let modified

    if(entity) {
        if (target.list.find(p => obj.num && p.num === obj.num && p._id !== obj._id)){
            setDoubles(prevState => prevState - 1)
        }
        modified = target.list.filter(e => e._id !== obj._id)
    } else {
        if (!target.list.find(p => obj.num && p.num === obj.num && p._id !== obj._id)){
            modified = [...target.list].concat([obj])
        } else {
            setDoubles(prevState => prevState + 1)
            modified = [...target.list].concat([obj])
        }
    }

    ctx.setEntity({
        ...ctx.entity,
        rosters: {
            ...rosters,
            [side]: {
                ...target,
                list: modified
            }
        }
    })

    return
}

export { togglePlayerInRoster, patchRosterNum, completeRoster, completeLineup, extractEvent, sortEventsByMinute, blinkTime, patchPostMode, applyMatchState, patchStreamState }

import React, {useContext, useEffect, useRef, useState} from 'react'

import {ItemContext, LiveContext} from '../../../../ctx'

import {completeRoster, patchRosterNum, togglePlayerInRoster} from '../../helpers'

import {ProgressSpinner} from 'primereact/progressspinner'
import {Badge} from 'primereact/badge'
import {Button} from 'primereact/button'
import {Menu} from 'primereact/menu'

import PlayerItem from '../../PlayerItem'
import Pennant from '../../../../../../assets/img/pennant.png'

import './style.scss'

import axios from 'axios'
import {ENDPOINT} from '../../../../../../env'

const RosterPanel = ({ side }) => {
    const [squad, setSquad] = useState(null)
    const [siblingList, setSiblingList] = useState(null)
    const [siblingLimit, setSiblingLimit] = useState(0)
    const [siblingSelected, setSiblingSelected] = useState([])
    const [doubles, setDoubles] = useState(0)

    const ctx = useContext(ItemContext)
    const lctx = useContext(LiveContext)

    const siblingRef = useRef()

    useEffect(() => {
        if(ctx.entity.match && !squad) {
            axios.get(`${ENDPOINT}v2/teamSquadOnly/${ctx.entity.match[side]._id}?tournamentId=${ctx.entity.match.stage.tournamentId}`, {
                headers: {
                    Authorization: lctx.token,
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            }).then(resp => {
                setSquad(resp.data.players.filter(p => p.squadState && !p.squadState.unlinked).sort((a, b) => a.surname > b.surname ? 1 : b.surname > a.surname ? -1 : 0))
                if(resp.data.siblingTeamPlayers && resp.data.siblingTeamPlayers.length) {
                    setSiblingList(resp.data.siblingTeamPlayers.sort((a, b) => a.surname > b.surname ? 1 : b.surname > a.surname ? -1 : 0))
                    setSiblingLimit(resp.data.siblingTeamPlayersLimit)
                }
            })
        }
    }, [ctx.entity])

    useEffect(() => {
        if(siblingList && siblingList.length) {
            if(ctx.entity.rosters && ctx.entity.rosters[side] && ctx.entity.rosters[side].list) {
                const fromSibling = ctx.entity.rosters[side].list.filter(p => p.fromSibling)
                if(fromSibling.length) {
                    setSquad(squad.concat(fromSibling))
                }
            }
        }
    }, [siblingList])

    const team = ctx.entity && ctx.entity.match ? ctx.entity.match[side] : null

    const extractRosterNum = p => {
        if(ctx.entity.rosters && ctx.entity.rosters[side]) {
            const matched = ctx.entity.rosters[side].list.find(e => e._id === p._id)
            return matched ? matched.num || 'БН' : null
        } else {
            return null
        }
    }

    const isDouble = p => {
        if(ctx.entity.rosters && ctx.entity.rosters[side]) {
            return ctx.entity.rosters[side].list.find(e => e.num === p.num && e._id !== p._id && p.num)
        } else {
            return false
        }
    }

    const included = ctx.entity.rosters && ctx.entity.rosters[side] ? ctx.entity.rosters[side].list.length : 0
    const fromSiblingChunk = squad ? squad.filter(p => p.fromSibling).map(p => p._id) : []

    return  team ? (
                <div className='roster-panel'>
                    <div className='panel-icon'>
                        <img src={team.club.emblem || ''} onError={e => {e.target.src = Pennant}} />
                    </div>
                    <div className='panel-title'>Состав {team.name} <Badge severity='info' value={`${included || 'нет'} игроков`} /></div>
                    <div className='panel-subtitle'>выберите игроков, участвующих в матче:</div>

                    {squad ? (
                        <div className='roster-squad'>
                            {squad.map(p => (
                                <PlayerItem
                                    key={p._id}
                                    data={p}
                                    patchNum={obj => {
                                        patchRosterNum(obj, side, ctx, setDoubles, extractRosterNum(p))
                                        setSquad(squad.map(p => p._id === obj._id ? {...p, num: obj.num} : p))
                                    }}
                                    onToggle={obj => {
                                        togglePlayerInRoster(obj, side, ctx, setDoubles)
                                        if(p.fromSibling) {
                                            setSquad(squad.filter(_p => _p._id !== p._id))
                                        }
                                    }}
                                    inRoster={extractRosterNum(p)}
                                    tournamentId={ctx.entity.match.stage.tournamentId}
                                    matchDate={ctx.entity.match.date}
                                    isDouble={isDouble(p)}
                                />
                            ))}

                            {siblingList ? [
                                <Menu
                                    id='sibling_menu'
                                    popup
                                    style={{width: 260}}
                                    ref={siblingRef}
                                    model={siblingList.filter(p => !fromSiblingChunk.includes(p._id)).map(p => ({
                                        label: `${p.surname} ${p.name}`,
                                        command: (e) => {
                                            const { name, surname, num, _id } = p
                                            const obj = { name, surname, num, _id, fromSibling: true }
                                            setSquad(squad.concat(obj))
                                            togglePlayerInRoster(obj, side, ctx)
                                            siblingRef.current.hide(e)
                                        }
                                    }))}
                                />,
                                siblingLimit > fromSiblingChunk.length ? <Button
                                    className='sibling-toggle'
                                    label={siblingLimit === 2 ? 'из дубля' : 'из основы'}
                                    onClick={(e) => siblingRef.current.toggle(e)}
                                    aria-controls='sibling_menu'
                                    aria-haspopup
                                /> : null
                            ] : null}
                        </div>
                    ) : (
                        <div className='panel-loader'>
                            <ProgressSpinner style={{width: 64, height: 64}} />
                        </div>
                    )}

                    <div className='panel-action'>
                        <Button
                            className='p-button-sm p-button-info'
                            disabled={!squad || !included || doubles > 0}
                            icon='pi pi-check'
                            onClick={() => completeRoster(side, ctx)}
                        >Готово</Button>
                    </div>
                </div>
            ) : null
}

export default RosterPanel

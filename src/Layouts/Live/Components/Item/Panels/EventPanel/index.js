import React, { useState, useContext, useRef, useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { ItemContext } from '../../../../ctx'

import { Badge } from 'primereact/badge'
import { RadioButton } from 'primereact/radiobutton'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'

import PlayerItem from '../../PlayerItem'

import { v4 as uuidv4 } from 'uuid'

import { extractEvent } from '../../helpers'

import './style.scss'

const types = {
    goal: 'Гол',
    missedPenalty: 'Незабитый пенальти',
    yellowcard: 'Предупреждение',
    secondyellow: 'Удаление за 2ЖК',
    redcard: 'Прямое удаление'
}

const subtypes = {
    goal: [
        {value: 'default', label: 'С игры'},
        {value: 'penalty', label: 'С пенальти'},
        {value: 'standart', label: 'Со штрафного'},
        {value: 'owngoal', label: 'Автогол соперника'}
    ]
}

const EventPanel = ({ _side, preset }) => {
    const [minute, setMinute] = useState(null)
    const [addon, setAddon] = useState(null)
    const [side, setSide] = useState(_side || null)
    const [type, setType] = useState(preset || null)
    const [subtype, setSubtype] = useState(preset && subtypes[preset] ? subtypes[preset][0].value : null)
    const [players, setPlayers] = useState([])
    const [markedToDelete, setMarkedToDelete] = useState(false)

    const { eventId } = useParams()
    const history = useHistory()

    useEffect(() => {
        const hasAddon = ctx.entity.match ? (ctx.entity.match.periodDuration*ctx.time.period) < ctx.time.displayMinute : false
        setMinute(hasAddon ? (ctx.entity.match.periodDuration*ctx.time.period) : ctx.time.displayMinute)
        setAddon(hasAddon ? ctx.time.displayMinute - ctx.entity.match.periodDuration : null)
    }, [])

    const ctx = useContext(ItemContext)

    useEffect(() => {
        if(eventId) {
            const event = extractEvent(ctx.entity.events, eventId)
            setSide(event.side)
            setMinute(event.minute)
            setAddon(event.addon)
            setType(event.type)
            setSubtype(event.subtype)
            setPlayers([event.player ? event.player._id : null, event.assistant ? event.assistant._id : null].filter(e => e))
        }
    }, [eventId])

    const team = side ? ctx.entity && ctx.entity.match ? {...ctx.entity.match[side]} : null : null

    const rosterPath = subtype === 'owngoal' ? side === 'home' ? 'away' : 'home' : side
    const roster = ctx.entity.rosters && ctx.entity.rosters[rosterPath] ? ctx.entity.rosters[rosterPath].list : []

    const storeEvent = (del=false) => {
        const body = {
            type: type,
            subtype: subtype,
            player: players[0] ? roster.find(p => p._id === players[0]) : null,
            assistant: players[1] ? roster.find(p => p._id === players[1]) : null,
            minute: minute,
            addon: addon,
            id: uuidv4()
        }

        ctx.setEntity({
            ...ctx.entity,
            events: {
                ...ctx.entity.events,
                [side]: !ctx.entity.events[side] ? [body] : eventId ? del ? ctx.entity.events[side].filter(e => e.id !== eventId) : ctx.entity.events[side].map(e => e.id === eventId ? body : e) : [...ctx.entity.events[side]].concat([body])
            },
            score: (!eventId && type === 'goal') ? {
                ...ctx.entity.score,
                [side]: ctx.entity.score[side] + 1
            } : (eventId && type === 'goal' && del) ? {
                ...ctx.entity.score,
                [side]: ctx.entity.score[side] - 1
            } : ctx.entity.score
        })

        ctx.setPanel(null)

        if(!del && body && body.player && body.player._id) {
            ctx.setEventCache(body)
        }

        if(eventId) {
            history.push(window.location.pathname.replace('/'+eventId, ''))
        }
    }

    const renderBadge = _id => {
        if(players.includes(_id)) {
            if(type === 'goal') {
                if(subtype === 'owngoal') {
                    return 'Автогол'
                } else {
                    return players.findIndex(i => i === _id) === 0 ? 'Гол' : 'Ассист'
                }
            } else {
                return types[type]
            }
        } else {
            return null
        }
    }

    const renderPlayerBadge = () => {
        if(type === 'goal') {
            return subtype === 'owngoal' ? 'выберите автора автогола' : 'выберите автора гола и ассистента'
        } else {
            return 'выберите игрока'
        }
    }

    return  team ? (
                <div className='event-panel'>
                    <div className='panel-icon'>
                        <img src={team.club.emblem || ''} />
                    </div>

                    <div className='panel-title'>
                        {!type ? 'Событие' : types[type]} - {team.name}

                        <div className='p-inputgroup minute-control'>
                            <span className='p-inputgroup-addon'>мин</span>
                            <span className='p-inputnumber p-component p-inputwrapper'>
                                <input
                                    onChange={e => setMinute(e.target.value)}
                                    value={minute || null}
                                    inputMode='numeric'
                                    type='number'
                                    className='p-inputtext'
                                />
                            </span>
                            <span className='p-inputgroup-addon'>+</span>
                            <span className='p-inputnumber p-component p-inputwrapper'>
                                <input
                                    onChange={e => setAddon(e.target.value)}
                                    value={addon || null}
                                    inputMode='numeric'
                                    type='number'
                                    className='p-inputtext'
                                />
                            </span>
                        </div>
                    </div>

                    {subtypes[type] ? (
                        <div className='panel-section' style={{paddingTop: 20}}>
                            <div className='section-badge' style={{textAlign: 'center'}}>
                                <Badge severity='info' value='детали события' />
                            </div>

                            <div className='event-options'>
                                {subtypes[type].map((st, i) => (
                                    <div
                                        className="field-radiobutton"
                                        key={i}
                                        onClick={() => {
                                            setSubtype(st.value)
                                            if([st.value, subtype].includes('owngoal')) {
                                                setPlayers([])
                                            }
                                        }}
                                    >
                                        <RadioButton id={st.value} value={st.value} name='subtype' checked={subtype === st.value} />
                                        <label htmlFor={st.id}>{st.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {!type ? [
                        <div className='section-badge' style={{textAlign: 'center', marginTop: 30}}>
                            <Badge severity='info' value='тип события' />
                        </div>,
                        <div className='schemas-btns'>
                            {Object.entries(types).map((s, i) => (
                                <Button
                                    className='p-button-sm p-button-info p-button-outlined'
                                    key={i}
                                    onClick={() => setType(s[0])}
                                >{s[1]}</Button>
                            ))}
                        </div>
                    ] : null}

                    {roster && type ? [
                        <div className='section-badge' style={{textAlign: 'center', marginTop: 18}}>
                            <Badge
                                severity='info'
                                value={renderPlayerBadge()}
                            />
                        </div>,
                        <div className='roster-squad' style={{marginBottom: 130}}>
                            {roster.map(p => (
                                <PlayerItem
                                    key={p._id}
                                    data={p}
                                    onToggle={obj => {
                                        if(players.includes(obj._id)) {
                                            setPlayers(players.filter(i => i !== obj._id))
                                        } else {
                                            const limit = type === 'goal' && subtype !== 'owngoal' ? 2 : 1
                                            if(players.length < limit) {
                                                setPlayers(players.concat([obj._id]))
                                            }
                                        }
                                    }}
                                    badge={renderBadge(p._id)}
                                />
                            ))}
                        </div>
                    ] : null}

                    <div className='panel-action'>
                        {players.length ? <Button
                            className='p-button-sm p-button-info'
                            icon='pi pi-check'
                            onClick={() => storeEvent()}
                        >Записать событие</Button> : type ? <Button
                            className='p-button-sm p-button-info p-button-outlined'
                            icon='pi pi-check'
                            onClick={() => storeEvent()}
                        >Записать без игрока</Button> : null}

                        {players.length ? <Button
                            className='p-button-sm p-button-secondary'
                            icon='pi pi-times'
                            onClick={() => setPlayers([])}
                        >Очистить выбор</Button> : type ? <Button
                            className='p-button-sm p-button-secondary'
                            icon='pi pi-chevron-circle-left'
                            onClick={() => setType(null)}
                        >Изменить тип</Button> : <Button
                            className='p-button-sm p-button-secondary'
                            icon='pi pi-times'
                            onClick={() => ctx.setPanel(null)}
                        >Отмена</Button>}

                        {eventId ? (
                            <Button
                                className={`p-button-sm p-button-${markedToDelete ? 'danger' : 'warning'}`}
                                icon='pi pi-exclemation-circle'
                                onClick={() => markedToDelete ? storeEvent(true) : setMarkedToDelete(true)}
                            >{markedToDelete ? 'Нажмите ещё раз для удаления' : 'Удалить событие'}</Button>
                        ) : null}
                    </div>
                </div>
            ) : null
}

export default EventPanel

import React, {useState, useContext, useEffect, useRef} from 'react'

import { Button } from 'primereact/button'

import { MatchContext } from '../../../ctx'

import Event from './Event'
import PlayerSelector from '../GoalsController/PlayerSelector'

import { v4 as uuidv4 } from 'uuid'
import {Toast} from "primereact/toast";

const defaults = {
    yc: {player: null, minute: null, number: null},
    rc: {player: null, minute: null, number: null, direct: true},
    sub: {playerIn: null, playerOut: null, minute: null}
}

const types = [
    {value: 'sub', label: 'Замена', className: 'secondary'},
    {value: 'yc', label: 'Предупреждение', className: 'warning'},
    {value: 'rc', label: 'Удаление', className: 'danger'}
]

const SecondaryController = ({ setStep }) => {
    const [events, setEvents] = useState({home: [], away: []})
    const [selected, setSelected] = useState(null)
    const [side, setSide] = useState(null)
    const [playerSelectorTarget, setPlayerSelectorTarget] = useState(null)

    const ctx = useContext(MatchContext)

    const toastRef = useRef()

    useEffect(() => {
        const evsSource = ctx.form && ctx.form.events ? ctx.form.events : null
        if(evsSource) {
            const aggregated = ['home', 'away'].reduce((acc, side) => {
                if(evsSource[side]) {
                    for(let type of types) {
                        const arr = evsSource[side][type.value]
                        if(arr) {
                            acc[side] = acc[side].concat(arr.map(e => ({...e, path: type.value})))
                        }
                    }
                }
                return acc
            }, {home: [], away: []})

            setEvents(aggregated)
        }
    }, [])

    useEffect(() => {
        if(side && selected && events[side]) {
            setSelected(events[side].find(e => e.id === selected.id))
        }
    }, [events])

    const addEvent = (side, path) => {
        const patched = {
            ...events,
            [side]: events[side].concat([{...defaults[path], id: uuidv4(), path: path}])
        }

        setEvents(patched)
        updateEvents(patched)
    }

    const patchEvent = (side, id, k, v) => {
        const patched = {
            ...events,
            [side]: events[side].map(evt => evt.id === id ? ({...evt, [k]: v}) : evt)
        }

        setEvents(patched)
        updateEvents(patched)
    }

    const setEventPlayer = (side, obj) => {
        let patch = null
        if(obj) {
            const { _id, name, surname, number } = obj
            patch = { _id, name, surname, number }
        }

        const patchData = () => {
            const patched = {
                ...events,
                [side]: events[side].map(evt => evt.id === selected.id ? ({...evt, [playerSelectorTarget]: patch}) : evt)
            }

            setEvents(patched)
            updateEvents(patched)

            if(obj) {
                const nextTarget = playerSelectorTarget === 'playerOut' ? 'playerIn' : playerSelectorTarget === 'playerIn' ? null : null

                setPlayerSelectorTarget(nextTarget)
                if(!nextTarget) {
                    setSelected(null)
                }
            }
        }

        if (selected.path === 'yc') {
            if (events[side].filter(e => e.player ? ((e.path === 'yc' || (e.path === 'rc' && e.direct === false)) && e.player._id === obj._id) : false).length > 1) {
                toastRef.current.show({severity: 'error', message: 'Ошибка', detail: 'Этот игрок уже получил 2-а предупреждения'})
            } else if (events[side].filter(e => e.player ? ((e.path === 'yc' || (e.path === 'rc' && e.direct === false)) && e.player._id === obj._id) : false).length === 1) {
                if ((events[side].filter(e => e.player ? (e.path === 'rc' && e.player._id === obj._id) : false).length === 1)) {
                    if ((events[side].filter(e => e.player ? ((e.path === 'yc' || e.path === 'rc') && e.player._id === obj._id) : false).length > 1)) {
                        toastRef.current.show({severity: 'error', message: 'Ошибка', detail: 'Этот игрок уже получил предупреждение и прямое удаление'})
                    } else {
                        patchData()
                    }
                } else {
                    const patched = {
                        ...events,
                        [side]: events[side].map(evt => evt.id === selected.id ? ({
                            ...evt,
                            [playerSelectorTarget]: patch,
                            path: 'rc',
                            direct: false
                        }) : evt)
                    }

                    setEvents(patched)
                    updateEvents(patched)

                    if (obj) {
                        const nextTarget = playerSelectorTarget === 'playerOut' ? 'playerIn' : playerSelectorTarget === 'playerIn' ? null : null

                        setPlayerSelectorTarget(nextTarget)
                        if (!nextTarget) {
                            setSelected(null)
                        }
                    }
                }
            } else {
                patchData()
            }
        } else if (selected.path === 'rc') {
            if (events[side].filter(e => e.player ? (e.path === 'rc' && e.player._id === obj._id) : false).length > 0) {
                toastRef.current.show({severity: 'error', message: 'Ошибка', detail: 'Этот игрок уже получил удаление'})
            } else {
                patchData()
            }
        } else {
            patchData()
        }
    }

    const eraseEvent = (side, id) => {
        const patched = {
            ...events,
            [side]: events[side].filter(e => e.id !== id)
        }

        setEvents(patched)
        updateEvents(patched)
    }

    const updateEvents = obj => {
        const splitted = ['home', 'away'].reduce((acc, side) => {
            const source = obj[side]
            for(let {path, ...evt} of source) {
                if(!acc[side][path]) {
                    acc[side][path] = []
                }

                acc[side][path].push(evt)
            }

            return acc
        }, {home: {}, away: {}})

        ctx.setForm({
            ...ctx.form,
            events: {
                home: {...splitted.home, goal: ctx.form.events.home.goal || []},
                away: {...splitted.away, goal: ctx.form.events.away.goal || []}
            }
        })
    }

    return  <div className='block__step_two'>
                <Toast ref={toastRef} position='bottom-right' />
                <span className='step__two_title title'>Шаг 3: вторичные события</span>

                <div className='step__two_button-group navigate-btns'>
                    <Button className="p-button-secondary p-button-text" label="Результативные действия" icon='pi pi-chevron-left' onClick={()=> setStep(1)}/>
                    <Button className="p-button-success p-button-text" label="Опубликовать"icon='pi pi-check' onClick={() => setStep(3)} />
                </div>

                <div className={`step__thee_event_button-group`}>
                    {['home', 'away'].map((side, i) => (
                        <div className='event-type_control' key={i}>
                            {types.map((t, i) => (
                                <Button
                                    key={i}
                                    label={t.label}
                                    className={`p-button-${t.className}`}
                                    onClick={() => addEvent(side, t.value)}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {events ? <div className={"step__thee_event"+(selected ? ' has_focused' : '')}>
                    {selected && (side === 'home') ? (
                        <PlayerSelector
                            side='home'
                            playerSelectorTarget={playerSelectorTarget}
                            setPlayerSelectorTarget={setPlayerSelectorTarget}
                            event={selected}
                            blurEvent={() => setSelected(null)}
                            onSelected={obj => setEventPlayer('home', obj)}
                        />
                    ) : null}

                    {['home', 'away'].map((side, k) => (
                        <div className='step__two_main_block' key={k}>
                            {events[side] ? events[side].map((e) => (
                                <Event
                                    key={e.id}
                                    item={e}
                                    patchEvent={(k, v) => patchEvent(side, e.id, k, v)}
                                    onSelected={() => {
                                        setSelected(e)
                                        setSide(side)
                                        if(e.path === 'sub') {
                                            setPlayerSelectorTarget('playerOut')
                                        } else {
                                            setPlayerSelectorTarget('player')
                                        }
                                    }}
                                    isActive={selected && e.id === selected.id}
                                    eraseEvent={() => eraseEvent(side, e.id)}
                                />
                            )) : null}
                        </div>
                    ))}

                    {selected && (side === 'away') ? (
                        <PlayerSelector
                            side='away'
                            playerSelectorTarget={playerSelectorTarget}
                            setPlayerSelectorTarget={setPlayerSelectorTarget}
                            event={selected}
                            blurEvent={() => setSelected(null)}
                            onSelected={obj => setEventPlayer('away', obj)}
                        />
                    ) : null}
                </div> : null}
            </div>
}

export default SecondaryController

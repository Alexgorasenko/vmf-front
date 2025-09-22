import React, {useState, useContext, useEffect, useRef} from 'react'

import './style.scss'

import { Button } from 'primereact/button'

import { MatchContext } from '../../../ctx'

import { v4 as uuidv4 } from 'uuid'
import { Toast } from 'primereact/toast'

import { defaults, types, secondary } from './refs'
import EventItem from './EventItem'

const Controller = ({ currentStep, setStep }) => {
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

        const patchedForm = {
            ...ctx.form,
            events: {
                home: splitted && splitted.home ? {...splitted.home, goal: ctx.form.events ? ctx.form.events.home.goal || [] : []} : {},
                away: splitted && splitted.away ? {...splitted.away, goal: ctx.form.events ? ctx.form.events.away.goal || [] : []} : {}
            }
        }

        ctx.setForm(patchedForm)
    }

    const addEvent = (side, path, attrs) => {
        const item = attrs ? {...defaults[path], ...attrs} : {...defaults[path]}
        item.path = path
        item.id = uuidv4()

        let clone = [...events[side]]
        clone.unshift(item)

        const patched = {
            ...events,
            [side]: clone
        }

        setEvents(patched)
        updateEvents(patched)
    }

    const patchEvent = (side, id, obj) => {
        const patched = {
            ...events,
            [side]: events[side].map(evt => evt.id === id ? ({...obj}) : evt)
        }

        setEvents(patched)
        updateEvents(patched)
    }

    const eraseEvent = (side, id) => {
        const patched = {
            ...events,
            [side]: events[side].filter(e => e.id !== id)
        }

        setEvents(patched)
        updateEvents(patched)
    }

    return  <div className='event-controller'>
                <Toast ref={toastRef} position='bottom-right' />

                <div className='controller-header'>
                    <Button className="p-button-secondary p-button-text" label="Результативные действия" icon='pi pi-chevron-left' onClick={()=> setStep(1)}/>
                    <span className='title'>Шаг 3: вторичные события</span>
                    <Button className="p-button-success p-button-text" label="Опубликовать" iconPos='right' icon='pi pi-check' onClick={() => setStep(3)} />
                </div>

                <div className='controller-body'>
                    <div className='controller-content'>
                        {events.home.map((e, i) => (
                            <EventItem
                                key={i}
                                data={e}
                                side='home'
                                onErase={() => eraseEvent('home', e.id)}
                                patchEvent={(obj) => patchEvent('home', e.id, obj)}
                            />
                        ))}
                    </div>

                    <div className='controller-options'>
                        {secondary.map((type, i) => (
                            <div className='option' key={i}>
                                <div className='label'>{type.label}</div>
                                <div
                                    className='arrow'
                                    onClick={() => addEvent('home', type.path, type.attrs)}
                                >
                                    <i className='pi pi-chevron-left'></i>
                                </div>
                                <div className='icon'>
                                    <img src={type.icon} />
                                </div>
                                <div
                                    className='arrow'
                                    onClick={() => addEvent('away', type.path, type.attrs)}
                                >
                                    <i className='pi pi-chevron-right'></i>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='controller-content'>
                        {events.away.map((e, i) => (
                            <EventItem
                                key={i}
                                data={e}
                                side='away'
                                onErase={() => eraseEvent('away', e.id)}
                                patchEvent={(obj) => patchEvent('away', e.id, obj)}
                            />
                        ))}
                    </div>
                </div>
            </div>
}

export default Controller

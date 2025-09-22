import React, { useState, useEffect, useContext, useRef } from 'react'

import { MatchContext } from '../../../ctx'

import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast'

import ItemEvent from '../../../ItemEvent/index'
import PlayerSelector from './PlayerSelector'

import { v4 as uuidv4 } from 'uuid'

import './style.scss'

let defaultEvent={
    id:null,
    player: null,
    assistent: null,
    minute:'',
    number:null,
    assist: null,
}

const GoalsController = ({ setStep }) => {
    const [goals, setGoals] = useState({})
    const [selected, setSelected] = useState(null)
    const [side, setSide] = useState(null)
    const [playerSelectorTarget, setPlayerSelectorTarget] = useState(null)

    const ctx = useContext(MatchContext)

    const toastRef = useRef(null)

    //собирается массивы событий исходя из счета на первом шаге
    useEffect(() => {
        const reverseOwnGoals = obj => {
            const reversed = {}
            Object.assign(reversed, [obj])

            const reverse = (target, source) => {
                return target.filter(e => !e.owngoal).concat(source.filter(e => e.owngoal))
            }

            for(let side of ['home', 'away']) {
                if(!reversed[side]) { reversed[side] = {} }
                const opposite = side === 'home' ? 'away' : 'home'
                if(!reversed[opposite]) { reversed[opposite] = {} }
                reversed[side].goal = reverse((obj[side] && obj[side].goal ? obj[side].goal : []), (obj[opposite] && obj[opposite].goal ? obj[opposite].goal : []))
            }

            return reversed
        }

        const evsSource = ctx.form && ctx.form.events ? reverseOwnGoals(ctx.form.events) : null
        const scores = ctx.form && ctx.form.scores ? ctx.form.scores.full : {home: 0, away: 0}

        if(evsSource) {
            let handled = {home: [], away: []}
            for(let side of ['home', 'away']) {
                let sideSource = evsSource[side] ? evsSource[side].goal.map(e => ({...e, id: uuidv4()})) : []
                if(scores[side] !== '' && scores[side] > sideSource.length) {
                    while(sideSource.length < scores[side]) {
                        sideSource.push({...defaultEvent, id: uuidv4()})
                    }
                } /*else if(scores[side] !== '' && scores[side] < sideSource.length) {
                    sideSource = sideSource.slice(0, scores[side])
                }*/

                handled[side] = sideSource
            }

            setGoals(handled)
            updScores(handled)
        } else {
            let handled = {home: [], away: []}
            for(let side of ['home', 'away']) {
                let sideSource = []
                if(scores[side] !== '') {
                    while(sideSource.length < scores[side]) {
                        sideSource.push({...defaultEvent, id: uuidv4()})
                    }
                }
                handled[side] = sideSource
            }
            setGoals(handled)
        }
    },[])

    useEffect(() => {
        if(side && selected && goals[side]) {
            setSelected(goals[side].find(e => e.id === selected.id))
        }
    }, [goals])

    const setEventPlayer = (side, obj) => {
        let patch = null
        if(obj) {
            const { _id, name, surname, number } = obj
            patch = { _id, name, surname, number }
        }

        const patched = {
            ...goals,
            [side]: goals[side].map(evt => evt.id === selected.id ? ({...evt, [playerSelectorTarget]: patch}) : evt)
        }

        setGoals(patched)
        updScores(patched)

        if(obj) {
            const nextTarget = playerSelectorTarget === 'player' ? !selected.owngoal && !selected.penalty && selected.subtype !== 'penalty' && !selected.missedPenalty ? 'assistant' : null : null
            setPlayerSelectorTarget(nextTarget)
            if(!nextTarget) {
                setSelected(null)
            }
        }
    }

    const patchGoal = (side, id, k, v) => {
        const ogReset = k === 'owngoal' && v ? {player: null, assistant: null} : {}
        const subtypes = ['penalty', 'missedPenalty', 'freeKick']
        const subtypesReset = subtypes.includes(k) || k === 'goal' && v ? subtypes.filter(i => i !== k).reduce((acc, sub) => {
            acc[sub] = false
            return acc
        }, {}) : {}

        const patched = {
            ...goals,
            [side]: goals[side].map(evt => evt.id === id ? ({...evt, ...ogReset, ...subtypesReset, [k]: v}) : evt)
        }

        setGoals(patched)
        updScores(patched)
    }

    const eraseEvent = (side, id) => {
        const patched = {
            ...goals,
            [side]: goals[side].filter(e => e.id !== id)
        }

        setGoals(patched)
        updScores(patched)
    }

    const addGoal = side => {
        const patched = goals[side] ? {
            ...goals,
            [side]: goals[side].concat({...defaultEvent, id: uuidv4()})
        } : {
            ...goals,
            [side]: [{...defaultEvent, id: uuidv4()}]
        }

        setGoals(patched)
        updScores(patched)
    }

    const updScores = patched => {
        const stringify = obj => {
            return obj.home + ':' + obj.away
        }

        const current = ctx.form.scores ? ctx.form.scores.full : {home: 0, away: 0}
        const updated = ['home', 'away'].reduce((acc, side) => {
            for (let g of patched[side].filter(g => !g.missedPenalty)) {
                acc[side]++
            }

            return acc
        }, {home: 0, away: 0})

        const reverseOwnGoals = (source, sibling) => {
            return source.filter(e => !e.owngoal).concat(sibling.filter(e => e.owngoal))
        }

        if (stringify(current) !== stringify(updated)) {
            if (ctx.form.events) {
                ctx.setForm({
                    ...ctx.form,
                    scores: {
                        ...ctx.form.scores,
                        full: {...updated}
                    },
                    events: {
                        home: {...ctx.form.events.home, goal: reverseOwnGoals(patched.home, patched.away)},
                        away: {...ctx.form.events.away, goal: reverseOwnGoals(patched.away, patched.home)}
                    }
                })
            } else {
                ctx.setForm({
                    ...ctx.form,
                    scores: {
                        ...ctx.form.scores,
                        full: {...updated}
                    },
                    events: {
                        home: {goal: reverseOwnGoals(patched.home, patched.away)},
                        away: {goal: reverseOwnGoals(patched.away, patched.home)}
                    }
                })
            }

            toastRef.current.show({severity: 'info', summary: stringify(updated), detail: 'Счёт матча изменился'})
        } else {
            if (ctx.form.events) {
                ctx.setForm({
                    ...ctx.form,
                    events: {
                        home: {...ctx.form.events.home, goal: reverseOwnGoals(patched.home, patched.away)},
                        away: {...ctx.form.events.away, goal: reverseOwnGoals(patched.away, patched.home)}
                    }
                })
            } else {
                ctx.setForm({
                    ...ctx.form,
                    events: {
                        home: {goal: reverseOwnGoals(patched.home, patched.away)},
                        away: {goal: reverseOwnGoals(patched.away, patched.home)}
                    }
                })
            }
        }
    }

    return  <div className='block__step_two'>
                <Toast ref={toastRef} position='top-center'/>

                <span className='step__two_title title'>Шаг 2: результативные действия</span>

                <div className='step__two_button-group navigate-btns'>
                    <Button className="p-button-secondary p-button-text" label="К вводу результата" icon='pi pi-chevron-left' onClick={()=> setStep(0)} />
                    <Button className="p-button-secondary p-button-text" iconPos='right' label="Следующий шаг" icon='pi pi-chevron-right' onClick={()=> setStep(2)} />
                </div>

                {goals ? <div className={'step__two_main'+(selected ? ' has_focused' : '')}>
                    {selected && playerSelectorTarget && (side === 'home') ? (
                        <PlayerSelector
                            side='home'
                            playerSelectorTarget={playerSelectorTarget}
                            setPlayerSelectorTarget={setPlayerSelectorTarget}
                            event={{...selected, type: 'goal'}}
                            blurEvent={() => setSelected(null)}
                            onSelected={obj => setEventPlayer('home', obj)}
                        />
                    ) : null}

                    {['home', 'away'].map((side, k) => (
                        <div className='step__two_main_block' key={k}>
                            {goals[side] ? goals[side].map((e) => (
                                <ItemEvent
                                    key={e.id}
                                    item={e}
                                    side={side}
                                    isActive={selected && (selected.id === e.id)}
                                    onSelected={() => {
                                        if (ctx.form[side+'Roster']) {
                                            setSelected(e)
                                            setPlayerSelectorTarget('player')
                                            setSide(side)
                                        } else {
                                            toastRef.current.show({severity: 'error', detail: 'Состав не заполнен'})
                                        }
                                    }}
                                    patchEvent={(k, v) => patchGoal(side, e.id, k, v)}
                                    eraseEvent={() => eraseEvent(side, e.id)}
                                />
                            )) : null}

                            <Button
                                className="p-button-text add-event"
                                label="Добавить"
                                icon='pi pi-plus-circle'
                                onClick={()=> addGoal(side)}
                            />
                        </div>
                    ))}

                    {selected && playerSelectorTarget && (side === 'away') ? (
                        <PlayerSelector
                            side='away'
                            playerSelectorTarget={playerSelectorTarget}
                            setPlayerSelectorTarget={setPlayerSelectorTarget}
                            event={{...selected, type: 'goal'}}
                            blurEvent={() => setSelected(null)}
                            onSelected={obj => setEventPlayer('away', obj)}
                        />
                    ) : null}
                </div> : null}
            </div>
}

export default GoalsController

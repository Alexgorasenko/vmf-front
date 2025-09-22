import React, {useContext, useEffect, useState} from 'react'

import {MatchContext} from '../../../ctx'

import {InputSwitch} from 'primereact/inputswitch'
import {InputNumber} from 'primereact/inputnumber'
import {Button} from 'primereact/button'
import Scoreboard from '../../../Scoreboard/index'
import {v4 as uuidv4} from "uuid";

const defaultOptions = {
    tech: false,
    extraTime: false,
    shootout: false
}

const defaultShootout = {home: 0, away: 0}

const defaultScores = {
    full: {home: 0, away: 0},
    options: defaultOptions,
    shootout: defaultShootout
}

const InitScore = ({ setStep }) => {
    const [scores, setScores] = useState(null)
    const ctx = useContext(MatchContext)

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
            setScores({
                ...ctx.form.scores,
                full: {...updated},
                options: {...defaultOptions},
                shootout: {...defaultShootout}
            })
        } else {
            setScores(ctx.form.scores ? {
                ...ctx.form.scores,
                options: ctx.form.scores.options || {...defaultOptions},
                shootout: ctx.form.scores.shootout || {...defaultShootout}
            } : {...defaultScores})
        }
    }

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

        const evsSource = ctx?.form?.events?.home || ctx?.form?.events?.away ? reverseOwnGoals(ctx.form.events) : null

        if(evsSource) {
            let handled = {home: [], away: []}
            for(let side of ['home', 'away']) {
                handled[side] = evsSource[side] ? evsSource[side].goal.map(e => ({...e, id: uuidv4()})) : []
            }
            updScores(handled)
        } else {
            setScores(ctx.form.scores ? {
                ...ctx.form.scores,
                options: ctx.form.scores.options || {...defaultOptions},
                shootout: ctx.form.scores.shootout || {...defaultShootout}
            } : {...defaultScores})
        }
    }, [])

    useEffect(() => {
        if(scores) {
            ctx.setForm({...ctx.form, scores: {...scores}})
        }
    }, [scores])

    return scores ? (
        <div className='block__step_one'>
                <span className='step__one_title title'>Шаг 1: укажите счёт матча</span>

                <div className='step__one_scoreboard'>
                    <Scoreboard
                        number={scores.full.home}
                        onChange={v => setScores({
                            ...scores,
                            full: {
                                ...scores.full,
                                home: v
                            }
                        })}
                        id={"home"}
                    />

                    <Scoreboard
                        number={scores.full.away}
                        onChange={v => setScores({
                            ...scores,
                            full: {
                                ...scores.full,
                                away: v
                            }
                        })}
                        id={"home"}
                    />
                </div>

                <div className='step__one_main'>

                    <div className='main__switch'>
                        <InputSwitch
                            checked={scores.options.tech}
                            onChange={() => setScores({
                                ...scores,
                                options: {
                                    ...scores.options,
                                    tech: !scores.options.tech
                                }
                            })}
                        />
                        <span className='main__switch_label'>Технический результат?</span>
                    </div>

                    <div className='main__switch'>
                        <InputSwitch
                            checked={scores.options.extraTime}
                            onChange={() => setScores({
                                ...scores,
                                options: {
                                    ...scores.options,
                                    extraTime: !scores.options.extraTime
                                }
                            })}
                        />
                        <span className='main__switch_label'>После дополнительного времени?</span>
                    </div>

                    <div className='main__switch last'>
                        <InputSwitch
                            checked={scores.options.shootout}
                            onChange={() => setScores({
                                ...scores,
                                options: {
                                    ...scores.options,
                                    shootout: !scores.options.shootout
                                }
                            })}
                        />
                        <span className='main__switch_label'>Серия пенальти?</span>
                    </div>

                    {scores.options.shootout && <div className='main__input'>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">Хозяева</span>
                            <InputNumber
                                value={scores.shootout.home}
                                onValueChange={(e) => setScores({
                                    ...scores,
                                    shootout: {
                                        ...scores.shootout,
                                        home: e.value
                                    }
                                })}
                                min={0}
                            />
                            <InputNumber
                                value={scores.shootout.away}
                                onValueChange={(e) => setScores({
                                    ...scores,
                                    shootout: {
                                        ...scores.shootout,
                                        away: e.value
                                    }
                                })}
                                min={0}
                            />
                            <span className="p-inputgroup-addon">Гости</span>
                        </div>
                    </div>}

                </div>

                <Button label="Далее" icon="pi pi-check"  onClick={()=> setStep(1)} />
            </div>
    ) : null
}


export default InitScore

import React, { useContext, useState, useEffect } from 'react'

import { ItemContext } from '../../../../ctx'

import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'

import Lineup from './Lineup'

import PlayerItem from '../../PlayerItem'
import Pennant from '../../../../../../assets/img/pennant.png'

import { completeLineup } from '../../helpers'

import { schemas } from '../../../../../../references'

import './style.scss'

const LineController = ({ lineIdx, lineCapacity, onCompleted, used, roster }) => {
    const [line, setLine] = useState([])

    useEffect(() => {
        if(lineCapacity === line.length) {
            onCompleted(line)
            setLine([])
        }
    }, [line])

    const forms = [
        ['вратаря'],
        ['защитника', 'защитников'],
        ['среднюю линию', 'среднюю линию'],
        ['нападающего', 'нападающих']
    ]

    return  forms[lineIdx] ? (
                <div className='line-controller'>
                    <div className='top'>
                        <Badge severity='info' value={`выберите ${forms[lineIdx][lineCapacity > 1 ? 1 : 0]}${lineCapacity > 1 ? ' (слева-направо)' : ''}`} />
                    </div>
                    <div className='options'>
                        {roster.filter(p => !used.includes(p._id)).sort((a, b) => a.surname > b.surname ? 1 : b.surname > a.surname ? -1 : 0).map(p => (
                            <PlayerItem
                                key={p._id}
                                data={p}
                                onToggle={() => setLine(line.includes(p._id) ? line.filter(i => i !== p._id) : line.concat([p._id]))}
                                badge={line.includes(p._id) ? line.findIndex(i => i === p._id)+1 : null}
                            />
                        ))}
                    </div>
                </div>
            ) : null
}

const mapRosterToLines = (roster, lines) => {
    return lines.reduce((acc, line) => {
        for(let i of line) {
            const plr = roster.find(p => p._id === i)
            if(plr) {
                acc.push(plr)
            }
        }

        return acc
    }, [])
}

const LineupPanel = ({ side }) => {
    const [schema, setSchema] = useState(null)
    const [lines, setLines] = useState([])

    const ctx = useContext(ItemContext)
    const team = ctx.entity && ctx.entity.match ? ctx.entity.match[side] : null
    const roster = ctx.entity && ctx.entity.rosters ? ctx.entity.rosters[side].list : []
    const qty = ctx.entity && ctx.entity.match && ctx.entity.match.format ? parseInt(ctx.entity.match.format.slice(0, 1)) !== 1 ? parseInt(ctx.entity.match.format.slice(0, 1)) : parseInt(ctx.entity.match.format.slice(0, 2)) : 8

    const used = lines.reduce((acc, l) => {
        acc = acc.concat(l)
        return acc
    }, [])

    // useEffect(() => {
    //     if(lines.length === 4) {
    //         completeLineup({schema, lines: used}, side, ctx)
    //     }
    // }, [lines])

    const names = roster ? used.map(i => roster.find(p => p._id === i).surname).join(' - ') : ''

    return  team ? (
                <div className='lineup-panel'>
                    <div className='panel-icon'>
                        <img src={team.club.emblem || ''} onError={e => {e.target.src = Pennant}} />
                    </div>

                    <div className='panel-title'>Стартовая расстановка</div>
                    <div className='panel-subtitle'>{names}</div>

                    <div className='lineup-panel_body'>
                        <div className='hint'>{!schema ? 'выберите схему:' : null}</div>

                        {schema ? (lines.length === schema.split('-').length) ? (
                            <div className='lineup-panel_preview'>
                                <Lineup
                                    data={{
                                        formation: schema,
                                        players: mapRosterToLines(roster, lines)
                                    }}
                                    theme={{
                                        numFill: 'var(--blue-100)',
                                        numColor: 'var(--blue-500)',
                                        numShadow: 'rgba(39, 130, 246, .25)',
                                        nameColor: 'var(--bluegray-700)',
                                        mutedColor: 'var(--bluegray-400)'
                                    }}
                                />
                            </div>
                        ) : (
                            <LineController
                                lineIdx={lines.length}
                                lineCapacity={parseInt(schema.split('-')[lines.length])}
                                onCompleted={arr => setLines([...lines, arr])}
                                used={used}
                                roster={roster}
                            />
                        ) : (
                            <div className='schemas-btns'>
                                {schemas[qty].map((s, i) => (
                                    <Button
                                        className='p-button-sm p-button-info p-button-outlined'
                                        key={i}
                                        onClick={() => setSchema('1-'+s)}
                                    >{s}</Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='panel-action'>
                        <Button
                            className='p-button-sm p-button-info'
                            icon='pi pi-check'
                            disabled={lines.length < 4}
                            onClick={() => completeLineup({schema, lines: used}, side, ctx)}
                        >Сохранить</Button>

                        <div className='panel-action-grid' style={{paddingTop: 10}}>
                            <Button
                                className='p-button-sm p-button-secondary'
                                icon='pi pi-refresh'
                                onClick={() => setLines([])}
                            >Заполнить заново</Button>

                            <Button
                                className='p-button-sm p-button-secondary'
                                icon='pi pi-times'
                                onClick={() => ctx.setPanel(null)}
                            >Без расстановки</Button>
                        </div>
                    </div>
                </div>
            ) : null
}

export default LineupPanel

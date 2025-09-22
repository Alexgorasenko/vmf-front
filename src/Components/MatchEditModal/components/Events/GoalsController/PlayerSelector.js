import React, { useState, useContext } from 'react'

import { MatchContext } from '../../../ctx'

import { Button } from 'primereact/button'

const PlayerSelector = ({ side, playerSelectorTarget, setPlayerSelectorTarget, event, blurEvent, onSelected }) => {
    const ctx = useContext(MatchContext)

    const rosterSource = event && event.owngoal ? side === 'home' ? 'away' : 'home' : side

    return  <div className="step__two_main_block players-list" style={{transform: `translateX(${side === 'home' ? -50 : 50}px)`}}>
                <div className='block__title'>
                    <span>{!event.path ? playerSelectorTarget === 'assistant' ? 'Выберите ассистента' : event.type === 'goal' ? event.owngoal ? 'Выберите автора автогола' : 'Выберите автора гола' : 'Выберите игрока' : playerSelectorTarget === 'playerOut' ? 'Покинул поле' : playerSelectorTarget === 'playerIn' ? 'Появился на поле' : 'Выберите игрока'}</span>
                    <Button
                        className='p-button-sm'
                        label={event[playerSelectorTarget] ? 'без изменений' : 'не указывать'}
                        onClick={()=> {
                            const nextTarget = playerSelectorTarget === 'playerIn' ? 'playerOut' : playerSelectorTarget === 'player' ? (event.type === 'goal' && !event.owngoal && event.subtype !== 'penalty' && !event.penalty && !event.missedPenalty) ? 'assistant' : null : null
                            setPlayerSelectorTarget(nextTarget)
                            if(!nextTarget) {
                                blurEvent()
                            }
                        }}
                    />
                </div>

                {ctx.form[rosterSource+'Roster'].players ? (
                    ctx.form[rosterSource+'Roster'].players.sort((a,b) => a.surname > b.surname ? 1 : -1).map((p, idx) => (
                        event.player && playerSelectorTarget === 'assistant' && event.player._id === p._id ? null :
                        <div className={`player-selector_player ${event[playerSelectorTarget] && event[playerSelectorTarget]._id === p._id ? 'selected' : ''}`} onClick={() => onSelected(p)}>
                            <div className='block__name'>{p.surname} {p.name}</div>
                            <div className='block__number'>{p.number === '' ? "БН" : p.number}</div>

                            {event[playerSelectorTarget] && (event[playerSelectorTarget]._id === p._id) ? (
                                <i
                                    className='pi pi-times-circle'
                                    onClick={e => {
                                        e.stopPropagation()
                                        onSelected(null)
                                    }}
                                />
                            ) : null}
                        </div>
                    ))
                ) : null}
            </div>
}

export default PlayerSelector

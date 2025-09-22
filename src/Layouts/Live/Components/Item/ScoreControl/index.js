import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { ItemContext } from '../../../ctx'

import { Button } from 'primereact/button'

import { sortEventsByMinute } from '../helpers'

import './style.scss'

const ScoreControl = () => {
    const ctx = useContext(ItemContext)
    const history = useHistory()

    const openLastGoal = side => {
        const pull = ctx.entity.events[side] || []
        const evt = pull.filter(e => e.type === 'goal').sort(sortEventsByMinute)[0]
        if(evt) {
            history.push(window.location.pathname+'/'+evt.id)
        }
    }

    return  <div className='score-control'>
                <div className='qty-control'>
                    <Button className='p-button-raised p-button-text p-button-success' icon='pi pi-plus-circle' onClick={() => ctx.setPanel('homeGoalPanel')} />
                    <Button disabled={!ctx.entity.score.home} className='p-button-raised p-button-text p-button-warning' icon='pi pi-times-circle' onClick={() => openLastGoal('home')} />
                </div>

                <div className='score-main'>
                    <div className='match-main_score_cell'>{ctx.entity.score.home}</div>
                    <div className='match-main_score_cell'>{ctx.entity.score.away}</div>
                </div>

                <div className='qty-control'>
                    <Button className='p-button-raised p-button-text p-button-success' icon='pi pi-plus-circle' onClick={() => ctx.setPanel('awayGoalPanel')} />
                    <Button disabled={!ctx.entity.score.away} className='p-button-raised p-button-text p-button-warning' icon='pi pi-times-circle' onClick={() => openLastGoal('away')} />
                </div>

                <div className='teams-triggers'>
                    <Button className='p-button-raised p-button-text p-button-info p-button-sm' icon='pi pi-bookmark' label='Хозяева' onClick={() => ctx.setPanel('homeEventPanel')} />
                    <Button className='p-button-raised p-button-text p-button-info p-button-sm' icon='pi pi-bookmark' label='Гости' iconPos='right' onClick={() => ctx.setPanel('awayEventPanel')} />
                </div>
            </div>
}

export default ScoreControl

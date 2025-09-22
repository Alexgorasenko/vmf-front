import React, { useContext } from 'react'
import { ItemContext } from '../../ctx'

import { Button } from 'primereact/button'

const ItemActions = () => {
    const ctx = useContext(ItemContext)

    const { rosters } = ctx.entity
    const { match } = ctx.entity

    const handleLaunchBtn = () => {
        if(!rosters || !rosters.home || !rosters.away) {
            ctx.setPanel('emptyRosters')
        } else {
            ctx.setPanel('launchLive')
        }
    }

    const v2 = true

    let model = []
    if(ctx.entity.postMode || ctx.entity.finished) {
        model = [
            {
                label: 'Опубликовать матч',
                icon: 'pi pi-check'
            }
        ]
    } else if(!ctx.time.period) {
        model = [
            {
                label: 'Начать матч LIVE',
                icon: 'pi pi-play',
                className: 'p-button-sm p-button-success'
            },
            {
                label: 'Внести события матча',
                icon: 'pi pi-flag'
            }
        ]
    }

    return  <div className='item-actions'>
                {(ctx.entity.postMode || ctx.entity.finished) ? (
                    <Button onClick={() => ctx.setPanel('postModeFinish')} className='p-button-success p-button-outlined p-button-sm' icon='pi pi-check'>Опубликовать матч</Button>
                ) : !ctx.time.period ? [
                    <Button onClick={() => handleLaunchBtn()} className='p-button-info p-button-sm' icon='pi pi-play'>Начать матч LIVE</Button>,
                    <Button onClick={() => ctx.setPanel('postModePanel')} className='p-button-secondary p-button-sm' icon='pi pi-flag'>Внести события матча</Button>
                ] : ctx.time.active ? (
                    <Button onClick={() => ctx.setPanel('finishPeriod')} className='p-button-secondary p-button-sm' icon='pi pi-clock'>Закончить тайм</Button>
                ) : (
                    <Button onClick={() => ctx.setTime({
                        period: ctx.time.period+1,
                        displayMinute: ctx.time.period*match.periodDuration,
                        clientOffset: new Date().getTimezoneOffset(),
                        active: true,
                        stamps: [...ctx.time.stamps].concat([new Date().getTime()])
                    })} className='p-button-info  p-button-sm' icon='pi pi-play'>Возобновить матч</Button>
                )}
            </div>
}

export default ItemActions

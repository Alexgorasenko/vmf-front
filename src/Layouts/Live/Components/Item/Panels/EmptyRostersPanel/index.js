import React, { useContext } from 'react'

import { ItemContext } from '../../../../ctx'

import { Button } from 'primereact/button'

const EmptyRostersPanel = () => {
    const ctx = useContext(ItemContext)

    const { rosters } = ctx.entity || {}

    const TeamNode = ({ side }) => {
        return !rosters || !rosters[side] ? ctx.entity.match[side] ? (
            <div className='panel-section'>
                <div className='panel-title'>Состав {ctx.entity.match[side].name}</div>
                <div className='panel-actions'>
                    <Button onClick={() => ctx.setPanel(side+'RosterPanel')} className='p-button-sm p-button-info'>Заполнить на этом устройстве</Button>
                    <Button onClick={() => ctx.setPanel(null)} className='p-button-sm p-button-info'>Заполнит представитель команды</Button>
                    <Button className='p-button-sm p-button-secondary'>Заполнить из заявки на сезон (не рекоменд.)</Button>
                </div>
            </div>
        ) : null : null
    }

    return  <div className='empty-rosters'>
                <div className='panel-icon'>
                    <img src={require('../assets/referee.png')} />
                </div>
                <div className='panel-title'>Обратите внимание на составы!</div>
                <div className='panel-subtitle'>У одной или обеих команд не заполнены составы на матч. Перед запуском LIVE необходимо действие:</div>

                <TeamNode side='home' />
                <TeamNode side='away' />
            </div>
}

export default EmptyRostersPanel

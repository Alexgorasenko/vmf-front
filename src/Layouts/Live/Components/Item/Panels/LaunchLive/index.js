import React, { useContext } from 'react'

import { ItemContext } from '../../../../ctx'

import { Button } from 'primereact/button'

import './style.scss'

const LaunchLive = () => {
    const ctx = useContext(ItemContext)

    return  <div className='launch-panel'>
                <div className='panel-icon'>
                    <img src={require('../assets/scoreboard.png')} />
                </div>
                <div className='panel-title'>Запустить матч?</div>
                <div className='panel-subtitle'>в LIVE-режиме будет запущен таймер матча, пользователи смогут отслеживать счёт и события онлайн.</div>

                <div className='panel-action'>
                    <Button
                        className='p-button-sm p-button-info'
                        icon='pi pi-check'
                        onClick={() => {
                            ctx.setTime({active: true, period: 1, stamps: [new Date().getTime()], clientOffset: new Date().getTimezoneOffset()})
                            ctx.setPanel(null)
                        }}
                    >Запустить таймер</Button>

                    <Button
                        className='p-button-sm p-button-secondary'
                        icon='pi pi-times'
                        onClick={() => ctx.setPanel(null)}
                    >Отмена</Button>
                </div>
            </div>
}

export default LaunchLive

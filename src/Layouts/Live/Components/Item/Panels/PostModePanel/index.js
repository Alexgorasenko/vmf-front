import React, { useContext } from 'react'

import { Button } from 'primereact/button'
import { ItemContext } from '../../../../ctx'

import './style.scss'

import { patchPostMode } from '../../helpers'

const PostModePanel = () => {
    const ctx = useContext(ItemContext)

    return  <div className='post-mode-panel'>
                <div className='panel-icon'>
                    <img src={require('../assets/scoreboard.png')} />
                </div>
                <div className='panel-title'>Заполнить матч?</div>
                <div className='panel-subtitle'>Таймер матча не будет запущен. Пользователи не смогут наблюдать за ним в режиме LIVE!</div>

                <div className='panel-action'>
                    <Button
                        className='p-button-sm p-button-info'
                        icon='pi pi-check'
                        onClick={() => {
                            ctx.setEntity({
                                ...ctx.entity,
                                postMode: true
                            })

                            patchPostMode(ctx.entity._id, true)
                            ctx.setPanel(null)
                        }}
                    >Заполнить матч</Button>

                    <Button
                        style={{marginTop: 12}}
                        className='p-button-sm p-button-secondary'
                        icon='pi pi-times'
                        onClick={() => ctx.setPanel(null)}
                    >Отмена</Button>
                </div>
            </div>
}

export default PostModePanel

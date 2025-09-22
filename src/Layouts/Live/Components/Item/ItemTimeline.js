import React, { useContext } from 'react'

import { Timeline } from 'primereact/timeline'
import { Tag } from 'primereact/tag'

import { ItemContext } from '../../ctx'

import Ticker from './Ticker'

const ItemTimeline = () => {
    const ctx = useContext(ItemContext)

    const { isClub, teamAccess } = ctx
    const { rosters } = ctx.entity

    const renderRosterNode = side => {
        if(!rosters || !rosters[side]) {
            return [!isClub || (isClub && (teamAccess === side)) ? (
                    <Tag value='Заполнить' onClick={() => ctx.setPanel(side+'RosterPanel')} />
                ) : (isClub && (teamAccess !== side)) ? (
                    <Tag value='Ожидаем...' className='disabled' />
                ) : null,
                null,
                null
            ]
        } else {
            const roster = {...rosters[side]}
            if(roster.status === 'completed') {
                return [<Tag className='ready' onClick={() => ctx.setPanel(side+'RosterPanel')} value={`${roster.list.length} игроков`} />, 'pi pi-check', '#188A42']
            } else {
                return [<Tag className='progress' onClick={() => roster.actor === localStorage.getItem('_amateum_uid') ? ctx.setPanel(side+'RosterPanel') : null}  value={`в процессе`} />, 'pi pi-cog', '#AE510F']
            }
        }
    }

    const [homeNode, homeStatus, homeColor] = renderRosterNode('home')
    const [awayNode, awayStatus, awayColor] = renderRosterNode('away')

    const timeline = [
        {
            label: 'Состав хозяев',
            action: !ctx.time.period ? homeNode : null,
            icon: homeStatus
        },
        {
            label: 'Состав гостей',
            action: awayNode,
            icon: awayStatus,
            content: ctx.time.period ? ['Состав хозяев', homeNode] : null
        },
        {
            label: ctx.entity.finished ? 'Матч окончен' : !ctx.time.active ? ctx.time.period ? 'Перерыв' : 'Не начался' : `Идёт ${ctx.time.period}-й тайм`,
            action: null,
            content: <Ticker />
        }
    ]

    return  <div className={'item-timeline'+(ctx.entity.finished ? ' finished' : ctx.time.period ? ' launched' : '')+(ctx.entity.postMode ? ' post-mode' : '')}>
                <Timeline
                    align='alternate'
                    content={item => item.content}
                    opposite={item => ([item.label, item.action])}
                    marker={item => item.icon ? <i className={`marker ${item.icon}`}></i> : null}
                    value={ctx.entity.postMode ? timeline.slice(0, -1) : timeline}
                />
            </div>
}

export default ItemTimeline

import React, { useContext } from 'react'

import { useHistory } from 'react-router-dom'

import { ItemContext } from '../../../ctx'
import CustomScrollbars from 'react-custom-scrollbars-2'

import { sortEventsByMinute } from '../helpers'

import Emblem from '../../../../../Components/Emblem'

import './style.scss'

const types = {
    goal: 'Гол',
    owngoal: 'Автогол соперника',
    penalty: 'Гол с пенальти',
    missedPenalty: 'Незабитый пенальти',
    yellowcard: 'Предупреждение',
    secondyellow: 'Удаление за 2ЖК',
    redcard: 'Прямое удаление'
}

const EventItem = ({ data, team }) => {
    const history = useHistory()

    const renderPersonLine = () => {
        if(data.player) {
            let output = data.player.name+' '+data.player.surname
            if(data.assistant) {
                output += ' ('+data.assistant.name+' '+data.assistant.surname+')'
            }
            return output
        } else {
            return 'игрок не указан'
        }
    }

    return  <div className='event-item'>
                <div className='emb'>
                    <Emblem source={team.club.emblem} size='xs' />
                </div>

                <div className='minute'>{data.minute}'{data.addon ? '+'+data.addon : ''}</div>

                <div className='info'>
                    <div className='icon'>
                        <img src={require(`./icons/${types[data.subtype] ? data.subtype : data.type}.png`)} />
                    </div>

                    <div className='mean'>
                        <div className='type'>{data.subtype && types[data.subtype] ? types[data.subtype] : types[data.type]}</div>
                        <div className='person'>{renderPersonLine()}</div>
                    </div>
                </div>

                <div className='action' onClick={() => history.push(window.location.pathname+'/'+data.id)}>
                    <i className='pi pi-cog'></i>
                </div>
            </div>
}

const EventsList = () => {
    const ctx = useContext(ItemContext)

    const { events } = ctx.entity

    const merged = events ? (events.home ? events.home.map(e => ({...e, side: 'home'})) : []).concat(events.away ? events.away.map(e => ({...e, side: 'away'})) : []) : []

    return  <div className='events-list'>
                <CustomScrollbars>
                    {merged.sort(sortEventsByMinute).map(e => (
                        <EventItem
                            key={e.id}
                            data={e}
                            team={ctx.entity.match[e.side]}
                        />
                    ))}
                </CustomScrollbars>
            </div>
}

export default EventsList

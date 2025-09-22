import React, { useState, useContext, useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { ClubContext } from './ctx'
import { Sidebar } from 'primereact/sidebar'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'

import * as areas from './Areas'

import ym from 'react-yandex-metrika'
import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'

import moment from 'moment'

const navModel = [
    [
        {label: 'События', icon: 'goal', alias: 'events'},
        {label: 'Матчи', icon: 'field', alias: 'matches', metaBlock: {
            key: 'nextMatch',
            formatter: (data, history) => (
                <div>
                    {data && data.length ? data.map((item, idx) => {
                        const { nearest, teamEntry } = item
                        const isToday = moment().format('YY-MM-DD') === nearest.date

                        return  <div
                                    className='match-shortcut'
                                    key={idx}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if(isToday) {
                                            history.push(`/live/${nearest._id}`)
                                        }
                                    }}
                                >
                                    <div>{moment(nearest.date, 'YY-MM-DD').format('D MMMM')} {nearest.time}</div>
                                    <div className='self-name'>{teamEntry.canonical ? 'Осн. команда' : teamEntry.name}</div>
                                    <div className='opposer-name'>vs {nearest.opposer.name}</div>
                                    {isToday ? (
                                        <Badge value='Заполнить' />
                                    ) : null}
                                </div>
                    }) : 'не назначены'}
                </div>
            )
        }},
        {label: 'Заявки', icon: 'trophy', area: 'squads', component: 'Squads', metaBlock: {
            key: 'activeSquads',
            formatter: data => (
                <div>
                    {data ? <Badge value={data} /> : 'нет'} активных
                </div>
            )
        }}
    ],
    [
        {label: 'Клуб', icon: 'referee', alias: 'club'},
        {label: 'Команды', icon: 'player_2', alias: 'team'},
        {label: 'Представители', icon: 'winner', alias: 'representatives',}
    ],
    [
        {label: 'Игроки', icon: 'player', alias: 'players'},
        {label: 'Контент', icon: 'winner', alias: 'content'},
        {label: 'Premium', icon: 'goal_2', alias: 'premium'},
        {label: 'Спонсоры', icon: 'winner', alias: 'sponsors', area: 'sponsors', component: 'Sponsors',}
    ]
]

const ClubLayout = ({ subject }) => {
    const [ctx, setCtx] = useState()
    const [comingSoon, setComingSoon] = useState(null)
    const [meta, setMeta] = useState(null)

    const { area } = useParams()
    const history = useHistory()

    useEffect(() => {
        if(subject && subject._id) {
            setCtx({...subject})
            if(ym) {
                ym('reachGoal','REPRESENTATIVE_RENDER')
            }

            axios.get(`${ENDPOINT}v2/clubMenu`, {
                headers: {
                    authorization: subject.token
                }
            }).then(resp => {
                if(resp.data && !resp.data.error) {
                    setMeta(resp.data)
                }
            })
        }
    }, [subject])

    const flatten = navModel.flat(2)
    const spec = flatten.find(n => n.area && n.area === area)
    const Specified = spec ? areas[spec.component] : 'No area'

    return  <ClubContext.Provider value={ctx}>
                <div className='club-layout'>
                    {!area ? (
                        <div className='nav-tile'>
                            {navModel.map((row, i) => (
                                <div className={`nav-row _${i+1}`} key={i}>
                                    {row.map((item, k) => (
                                        <div
                                            className='nav-item'
                                            key={k}
                                            onClick={() => {
                                                ym('reachGoal', `REPRESENTATIVE_CLICK`, {area: item.area || item.alias})
                                                if(item.area) {
                                                    history.push(`/${item.area}`)
                                                } else {
                                                    setComingSoon(item.icon)
                                                }
                                            }}
                                        >
                                            <img className='icon' src={require(`./assets/stickers/${item.icon}.png`)} />
                                            <div className='label'>{item.label}</div>
                                            {item.metaBlock && meta && meta[item.metaBlock.key] ? (
                                                <div className='meta-block'>
                                                    {item.metaBlock.formatter(meta[item.metaBlock.key], history)}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <Sidebar
                                visible={comingSoon !== null}
                                position='bottom'
                                maskClassName='player-form-mask'
                            >
                                <div className='coming-soon'>
                                    <div>Немного терпения...</div>
                                    {comingSoon ? <img src={require(`./assets/stickers/${comingSoon}.png`)} /> : null}
                                    <div className='desc'>этот раздел скоро станет доступным для представителей команд, мы обязательно сообщим</div>
                                    <Button label='Понятно' icon='pi pi-check' className='p-button-sm btn-action' onClick={() => setComingSoon(null)} />
                                </div>
                            </Sidebar>
                        </div>
                    ) : <Specified subject={subject}/>}
                </div>
            </ClubContext.Provider>
}

export default ClubLayout

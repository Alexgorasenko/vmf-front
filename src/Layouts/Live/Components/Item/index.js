import React, { useState, useEffect, useContext } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import ItemLoader from './ItemLoader'
import ItemTimeline from './ItemTimeline'
import ItemActions from './ItemActions'
import ScoreControl from './ScoreControl'
import EventsList from './EventsList'
import Emblem from '../../../../Components/Emblem'
import { Tag } from 'primereact/tag'
import { Sidebar } from 'primereact/sidebar'

import { LiveContext, ItemContext } from '../../ctx'

import { EmptyRostersPanel, RosterPanel, LineupPanel, LaunchLive, FinishPeriod, EventPanel, PostModePanel, ShareLineupPanel, StreamPanel } from './Panels'

import './style.scss'

import { ENDPOINT } from '../../../../env'
import axios from 'axios'

import moment from 'moment'

const panels = {
    emptyRosters: <EmptyRostersPanel />,
    homeRosterPanel: <RosterPanel side='home' />,
    awayRosterPanel: <RosterPanel side='away' />,
    homeLineupPanel: <LineupPanel side='home' />,
    awayLineupPanel: <LineupPanel side='away' />,
    homeShareLineupPanel: <ShareLineupPanel side='home' />,
    awayShareLineupPanel: <ShareLineupPanel side='away' />,
    launchLive: <LaunchLive />,
    finishPeriod: <FinishPeriod />,
    homeGoalPanel: <EventPanel _side='home' preset='goal' />,
    awayGoalPanel: <EventPanel _side='away' preset='goal' />,
    homeEventPanel: <EventPanel _side='home' />,
    awayEventPanel: <EventPanel _side='away' />,
    eventPanel: <EventPanel />,
    postModePanel: <PostModePanel />,
    postModeFinish: <FinishPeriod _finishSuggested={true} />,
    streamPanel: <StreamPanel />
}

const checkTeamAccess = (teams, entity) => {
    let access
    if(teams && entity) {
        for(let side of ['home', 'away']) {
            const tid = entity.match[side+'Id']
            if(teams.find(t => t._id === tid)) {
                access = side
            }
        }
    }

    return access
}

const Item = ({ teamsAccess }) => {
    const [entity, setEntity] = useState(null)
    const [fetching, setFetching] = useState(false)
    const [panel, setPanel] = useState(null)
    const [eventCache, setEventCache] = useState(null)
    const [time, setTime] = useState({displayMinute: 0, active: false, period: 0, stamps: [], clientOffset: new Date().getTimezoneOffset()})

    const { id, eventId } = useParams()
    const history = useHistory()
    const ctx = useContext(LiveContext)

    const { isClub } = ctx

    useEffect(() => {
        if(eventId) {
            setPanel('eventPanel')
        }
    }, [eventId])

    const fetch = () => {
        if(!fetching) {
            setFetching(true)
            axios.get(`${ENDPOINT}v2/state/${id}`, {
                headers: {
                    Authorization: ctx.token,
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            }).then(resp => {
                setEntity(resp.data)
                if(resp.data.time && resp.data.time.period && !time.period) {
                    if(!resp.data.active) {
                        setTime({...resp.data.time, displayMinute: resp.data.match.periodDuration*(resp.data.time.period)})
                    } else {
                        setTime({...resp.data.time})
                    }
                }
                setFetching(false)
            })
        }
    }

    useEffect(() => {
        if(id && !entity) {
            fetch()
        }
    }, [id])

    useEffect(() => {
        if(eventCache && eventCache.id && eventCache.player && entity.stream && entity.stream.onAir) {
            axios.put(`${ENDPOINT}v2/states/${entity._id}`, {'stream.widget': `event_${eventCache.id}`}, {
                headers: {
                    Authorization: ctx.token,
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            }).then(resp => {
                setEventCache(null)
                axios.put(`${ENDPOINT}v2/states/${entity._id}`, {'widgetCleaner': true}, {
                    headers: {
                        Authorization: ctx.token,
                        SignedBy: localStorage.getItem('_amateum_tkn')
                    }
                }).then(cleaned => {
                    if(cleaned.data && cleaned.data.success) {
                        console.log('Event cleaned on server side')
                    } else {
                        console.log('Failed clean event')
                    }
                })
            })
        }
    }, [eventCache])

    useEffect(() => {
        if(entity && entity.events) {
            axios.put(`${ENDPOINT}v2/states/${entity._id}`, {
                events: entity.events,
                score: entity.score
            }, {
                headers: {
                    Authorization: ctx.token,
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            })
        }
    }, [entity ? entity.events : null])

    const isOnAir = entity && entity.stream && entity.stream.onAir

    return  !entity ? (
                <ItemLoader />
            ) : (
                <ItemContext.Provider
                    value={{entity, setEntity, setEventCache, panel, setPanel, time, setTime, isClub, teamAccess: checkTeamAccess(teamsAccess, entity)}}
                >
                    <div className='item'>
                        <div className='item-top'>
                            <Tag severity='secondary' icon='pi pi-chevron-left' value={isClub ? 'в меню' : 'к матчам'} onClick={() => history.push(isClub ? '/' : '/live')} />

                            {!isClub ? <Tag
                                className='stream-control'
                                severity={entity.finished ? 'info' : isOnAir ? 'danger' : 'warning'}
                                icon='pi pi-youtube'
                                value={entity.finished ? 'Завершен' : isOnAir ? 'ON AIR' : 'БЕЗ СТРИМА'}
                                onClick={() => entity.finished ? null : setPanel('streamPanel')}
                            /> : null}

                            <div className='subject-emblem'>
                                <Emblem source={entity.match.stage.tournament.federation.emblem || ''} size='md' backdroped={true} />
                            </div>

                            <div className='team'>
                                <Emblem isClub={true} source={entity.match.home.club.emblem || ''} size='sm' />
                                <Tag value={entity.match.home.name} />
                            </div>

                            <div className='meta'>
                                <span className='date'>{moment(entity.match.date, 'YY-MM-DD').format('D MMMM')}</span>
                                <span className='time'>{entity.match.time || '--:--'}</span>
                            </div>

                            <div className='team'>
                                <Emblem isClub={true} source={entity.match.away.club.emblem || ''} size='sm' />
                                <Tag value={entity.match.away.name} />
                            </div>
                        </div>

                        <ItemTimeline />
                        {!isClub ? <ItemActions /> : null}

                        {(time.period || entity.postMode) ? (
                            <ScoreControl disabled={isClub} />
                        ) : null}

                        <EventsList />

                        <Sidebar
                            maskClassName='live-panel'
                            visible={panel !== null}
                            position='bottom'
                            onHide={() => {
                                setPanel(null)
                                if(eventId) {
                                    history.push(window.location.pathname.replace('/'+eventId, ''))
                                }
                            }}
                        >{panels[panel] || null}</Sidebar>
                    </div>
                </ItemContext.Provider>
            )
}

export default Item

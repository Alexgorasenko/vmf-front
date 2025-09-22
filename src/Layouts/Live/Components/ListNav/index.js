import React, { useState, useRef, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown'
import CustomScrollbars from 'react-custom-scrollbars-2'

import ListLoader from '../ListLoader'
import Emblem from '../../../../Components/Emblem'

import './style.scss'

import moment from 'moment'

const dates = [
    {label: 'Позавчера', value: moment().add(-2, 'days').format('YY-MM-DD')},
    {label: 'Вчера', value: moment().add(-1, 'days').format('YY-MM-DD')},
    {label: 'Сегодня', value: moment().format('YY-MM-DD')},
    {label: 'Завтра', value: moment().add(1, 'days').format('YY-MM-DD')}
]

const renderStateTag = state => {
    let label = 'не начался'

    if(state.finished) {
        label = 'окончен'
    } else if(state.time) {
        switch(true) {
            case !state.time.active:
                label = 'перерыв'
                break
            default:
                label = Math.ceil(state.time.displayMinute)+' минута'
        }
    }

    return <div className='state-label'>{label}</div>
}

const getStash = () => {
    const stashStr = localStorage.getItem('_am_liveNav_stash')
    return stashStr ? JSON.parse(stashStr) : {}
}

const patchStash = (k, v) => {
    const current = getStash()
    localStorage.setItem('_am_liveNav_stash', JSON.stringify({...current, [k]: v}))
}

const ListNav = ({ data, date, setDate }) => {
    const [selectedTour, setSelectedTour] = useState(null)

    const [tourIdx, setTourIdx] = useState(0)
    const history = useHistory()
    const topRef = useRef(null)

    useEffect(() => {
        const stash = getStash()
        if(stash.date && dates.map(d => d.value).includes(stash.date)) {
            setDate(stash.date)
        } else {
            setDate(moment().format('YY-MM-DD'))
            patchStash('date', moment().format('YY-MM-DD'))
        }
    }, [])

    useEffect(() => {
        if(data && data.length) {
            const tids = data.map(t => t._id)
            const stash = getStash()
            if(stash && stash.tour && tids.includes(stash.tour)) {
                setSelectedTour(stash.tour)
            } else {
                setSelectedTour(data[0]._id)
            }
        }
    }, [data])

    const listSource = data ? data.find(t => t._id === selectedTour) : null

    return  !data ? <ListLoader /> : <div className='list-nav'>
                <div className='top' ref={topRef}>
                    <Tag
                        className='logout'
                        severity='info'
                        icon='pi pi-sign-out'
                        onClick={() => {
                            localStorage.removeItem('_amateum_subject_tkn')
                            localStorage.removeItem('_amateum_tkn')
                            history.push('/')
                            window.location.reload()
                        }}
                    >выйти</Tag>

                    <div className='controls'>
                        <div>
                            <Dropdown
                                options={dates}
                                value={date}
                                onChange={e => {
                                    setDate(e.target.value)
                                    patchStash('date', e.target.value)
                                }}
                                dropdownIcon='pi pi-calendar'
                            />
                        </div>
                        <div>
                            <Dropdown
                                options={data.map(t => ({label: t.name, value: t._id}))}
                                value={selectedTour}
                                onChange={e => {
                                    setSelectedTour(e.target.value)
                                    patchStash('tour', e.target.value)
                                }}
                                placeholder='нет турниров'
                                dropdownIcon='pi pi-star'
                            />
                        </div>
                    </div>
                </div>

                <CustomScrollbars className='list-bars' style={{height: `calc(100vh - ${topRef && topRef.current ? (topRef.current.clientHeight + 30) : 150}px)`, margin: '0 -12px', width: '100vw'}}>
                    <div className='tour-list'>
                        {listSource && listSource.list.length ? listSource.list.map((l, i) => (
                            <div className='list-card' key={l._id} onClick={() => history.push(`/live/${l._id}`)}>
                                {l.state && l.state.executive ? (
                                    <Tag severity='info' className='executive-tag' value={[l.state.executive.name, l.state.executive.surname].join(' ')} />
                                ) : null}

                                <div className='team'>
                                    <Emblem source={l.home.club.emblem || ''} size='sm' />
                                    <Tag value={l.home.name} />
                                </div>

                                <div className='meta'>
                                    <span className='date'>{moment(l.date, 'YY-MM-DD').format('D MMMM')}</span>
                                    <span className='time'>{l.time || '--:--'}</span>

                                    {l.state ? (
                                        <Tag severity='info' className='score-tag' value={l.state.score.home+':'+l.state.score.away} />
                                    ) : null}

                                    {l.state ? renderStateTag(l.state) : null}
                                </div>

                                <div className='team'>
                                    <Emblem source={l.away.club.emblem || ''} size='sm' />
                                    <Tag value={l.away.name} />
                                </div>
                            </div>
                        )) : (
                            <div className='empty-list'>
                                <i className='pi pi-calendar-times'></i>
                                <div>нет матчей на {moment(date, 'YY-MM-DD').format('D MMMM')}</div>
                            </div>
                        )}
                    </div>
                </CustomScrollbars>
            </div>
}

export default ListNav

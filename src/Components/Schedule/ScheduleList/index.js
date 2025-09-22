import React, { useEffect, useRef, useState } from "react";

import './style.scss'
import { Tag } from "primereact/tag";
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'

import 'primeicons/primeicons.css';
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

import {Splide, SplideSlide} from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import moment from "moment";
import {ENDPOINT} from "../../../env";
import axios from "axios";
import {Link, useLocation} from "react-router-dom";
import service from "../service";
import CustomScrollbars from "react-custom-scrollbars-2";
import matchday from "../../Tournaments/Calendar/Controls/Matchday";
import { Chip } from 'primereact/chip'

import MatchdaysNav from './MatchdaysNav'

import PlayerPhoto from "../../../assets/img/soccer-player-1.svg";
import MatchItem from "./MatchItem";

const roles = [
    {label: 'Арбитры', value: 'referee'},
    {label: 'Делегаты', value: 'executive'},
    {label: 'Медики', value: 'medicine'},
    {label: 'Фотографы', value: 'photo'},
    {label: 'Операторы', value: 'media'}
]

const formatter = count => {
    if (count === 1 || (count > 20 && count % 10 === 1)) {
        return 'е'
    } else if ([2, 3, 4].includes(count) || (count > 20 && [2, 3, 4].includes(count % 10))) {
        return 'я'
    } else {
        return 'й'
    }
}

const ScheduleList = ({ onUpdatedStats, rangeBtn, rangeStages, subject, staffMode }) => {
    const [data, setData] = useState([])
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [leGrandeCostyl, setLeGrandeCostyl] = useState(0)
    const [selectedMatchDay, setSelectedMatchDay] = useState(null)
    const [employees, setEmployees] = useState(null)
    const [role, setRole] = useState('referee')
    const [needUpdateEmployees, setNeedUpdateEmployees] = useState(false)
    const [renderingGraphics, setRenderingGraphics] = useState(false)

    const _rangeStages = rangeStages || subject.stages[0]
    const toastRef = useRef(null)
    let location = useLocation();

    const [rangeBtnMin, setRangeBtnMin] = useState(rangeBtn.range.min === rangeBtn.range.max ? moment().subtract(0, 'weeks').startOf('isoWeek').format('YY-MM-DD') : rangeBtn.range.min)
    const [rangeBtnMax, setRangeBtnMax] = useState(rangeBtn.range.min === rangeBtn.range.max ? moment().subtract(0, 'weeks').endOf('isoWeek').format('YY-MM-DD') : rangeBtn.range.max)

    useEffect(() => {
        if (rangeBtn.range.min !== rangeBtn.range.max){
            setRangeBtnMin(rangeBtn.range.min)
            setRangeBtnMax(rangeBtn.range.max)
        }
    }, [rangeBtn])

    useEffect(() => {
        setLoading(true)
        setSelectedMatchDay(null)
        setData([])
        const tkn = localStorage.getItem('_amateum_subject_tkn')

        const url = `${ENDPOINT}v2/scheduleSource/${_rangeStages ? _rangeStages._id : null}?startDate=${rangeBtnMin}&endDate=${rangeBtnMax}`
        axios.get(url, {'headers': {'Authorization': tkn}})
            .then(resp => {
                if(resp.data){
                    setLoading(false)
                    setData(resp.data)
                    setLeGrandeCostyl(1)
                }
            })

    }, [localStorage.getItem('_amateum_subject_tkn'), subject, rangeStages])

    useEffect(() => {
        setLoading(true)
        const tkn = localStorage.getItem('_amateum_subject_tkn')

        const url = `${ENDPOINT}v2/scheduleSource/${_rangeStages ? _rangeStages._id : null}?startDate=${rangeBtnMin}&endDate=${rangeBtnMax}`
        axios.get(url, {'headers': {'Authorization': tkn}})
            .then(resp => {
                if(resp.data){
                    setLoading(false)
                    setData(resp.data)
                    setSelectedMatchDay({...selectedMatchDay, matches: resp.data.matchdays.filter(md => md).find(md => selectedMatchDay._id === md._id).matches})
                }
            })

    }, [location])

    useEffect(() => {
        axios.get(`${ENDPOINT}v2/list/employees`, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setEmployees(resp.data)
        })
    }, [staffMode, localStorage.getItem('_amateum_subject_tkn')])

    useEffect(() => {
        setLoading(true)
        setSlots([])
        const tkn = localStorage.getItem('_amateum_subject_tkn')

        const url = `${ENDPOINT}v2/scheduleSource/${_rangeStages ? _rangeStages._id : null}?startDate=${rangeBtnMin}&endDate=${rangeBtnMax}`
        axios.get(url, {'headers': {'Authorization': tkn}})
            .then(resp => {
                if(resp.data){
                    setLoading(false)
                    if(resp.data.locations) {
                        let currSlots = resp.data.locations.reduce(function(prev, curr) {
                            return [...prev,
                                curr.slots.map(slot => {
                                    return slot.list.map(l => {
                                        return {locationName: curr.name || curr.address, locationId: curr._id, weekday: slot.day, date: slot.date, time: l.time, match: l.match}
                                    })
                            })]
                        }, [])
                        let opacity = 1.0
                        currSlots.map(cs => {
                            cs.map(c => {
                                c.map(c1 => {
                                    c1.opacity = opacity
                                })
                            })
                            opacity-=0.1
                        })
                        currSlots = currSlots.flat(2)
                        currSlots = currSlots.sort((a, b) =>  moment(a.date+'  '+a.time, 'YY-MM-DD HH:mm').unix() - moment(b.date+'  '+b.time, 'YY-MM-DD HH:mm').unix())
                        setSlots(currSlots)
                    } else {
                        setSlots([])
                    }
                }
            })

    }, [rangeBtnMin, rangeBtnMax])

    useEffect(() => {
        if(data && data.matchdays) {
            const matches = data.matchdays.reduce((acc, md) => {
                acc = acc.concat(md.matches)
                return acc
            }, [])

            onUpdatedStats([matches.flat(1).filter(match => !match.date).length, matches.flat(1).length])
        }
    }, [leGrandeCostyl])

    useEffect(() => {
        if(data.locations) {
            let currSlots = data.locations.reduce(function(prev, curr) {
                return [...prev,
                    curr.slots.map(slot => {
                        return slot.list.map(l => {
                            return {locationName: curr.name || curr.address, locationId: curr._id, weekday: slot.day, date: slot.date, time: l.time, match: l.match}
                        })
                })]
            }, [])
            let opacity = 1.0
            currSlots.map(cs => {
                cs.map(c => {
                    c.map(c1 => {
                        c1.opacity = opacity
                    })
                })
                opacity-=0.1
            })
            currSlots = currSlots.flat(2)
            currSlots = currSlots.sort((a, b) =>  moment(a.date+'  '+a.time, 'YY-MM-DD HH:mm').unix() - moment(b.date+'  '+b.time, 'YY-MM-DD HH:mm').unix())
            setSlots(currSlots)
        } else {
            setSlots([])
        }

    }, [data])

    useEffect(() => {
        setNeedUpdateEmployees(false)
        if (data && data.matchdays) {
            if (employees && employees[role]) {
                const newEmployees = []
                employees[role].map(e => {
                    let allMatchesCount = 0
                    data.matchdays.map(md => {
                        md.matches.map(m => {
                            if (m.date >= rangeBtnMin && m.date <= rangeBtnMax) {
                                m.employees.map(me => {
                                    if (e._id === me._id) {
                                        allMatchesCount += 1
                                    }
                                })
                            }
                        })
                    })
                    newEmployees.push({...e, allMatchesCount: allMatchesCount})
                    allMatchesCount = 0
                })
                setEmployees(prevState => {prevState[role] = newEmployees; return prevState})
                setLeGrandeCostyl(prevState => {
                    return prevState + 1
                })
            }
            if (selectedMatchDay) {
                setSelectedMatchDay({...selectedMatchDay, matches: data.matchdays.find(md => md && selectedMatchDay._id === md._id)?.matches})
            }
        }
    }, [role, data, rangeBtn, needUpdateEmployees])

    const splideRef = useRef(null)

    const renderMdGraphics = () => {
        setRenderingGraphics(true)
        const isResult = selectedMatchDay?.matches?.find(match => match.score)
        const sharableUrl = subject.federationId === '624c17e25887f52dbfc6819c' ? `${ENDPOINT}render/ole/matchdayv2/${selectedMatchDay._id}${isResult ? '?type=results' : ''}` : `${ENDPOINT}render/elegance/matches/${rangeStages._id}?type=schedule`
        axios.get(`${ENDPOINT}share?url=${encodeURIComponent(sharableUrl)}&asDecoded=true`)
            .then(resp => {
                setRenderingGraphics(false)
                const a = document.createElement("a")
                a.href = "data:image/png;base64," + resp.data
                a.download = `${selectedMatchDay.name}.png`
                a.click()
            })
    }

    const onDragEnd = async result => {
        const {destination, source, draggableId} = result;

        if (!destination) {
            return;
        }

        if (source.droppableId.includes('role')){
            if (slots[destination.droppableId].match === null) {
                return;
            }
            let currMatch = ''
            setData(prevState => {
                prevState.matchdays.map(matchday => {
                    matchday.matches.map(match => {
                        if (match._id === slots[destination.droppableId].match._id) {
                            if(!match.employees.map(e => {
                                if (e._id.includes(draggableId.slice(7))){
                                    return 1
                                } else return 0
                            }).includes(1)){
                                employees[source.droppableId.slice(5)].map(e => {
                                    if (e._id === draggableId.slice(7)){
                                        match.employees.push({
                                            _id: draggableId.slice(7),
                                            role: source.droppableId.slice(5),
                                            name: e.name
                                        })
                                        currMatch = match
                                    }
                                })
                            }
                        }
                    })
                });
                return prevState
            })
            if (currMatch){
                setSlots(prevState => {
                    prevState[destination.droppableId].match = currMatch;
                    return prevState
                })

                await service.updateMatches(currMatch._id, {
                    employees: currMatch.employees
                }).then(r => {
                    toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Сотрудник назначен!'})
                    setNeedUpdateEmployees(true)
                    setLeGrandeCostyl(prevState => {
                        return prevState + 1
                    })
                })
            }

        } else {

            if (
                destination.droppableId === source.droppableId &&
                destination.index === source.index
            ) {
                return;
            }

            if (slots[destination.droppableId].match !== null) {
                return;
            }

            let currMatch = ''

            setData(prevState => {
                prevState.matchdays.map(matchday => {
                    if (matchday._id === source.droppableId) {
                        matchday.matches.map(match => {
                            if (match._id === draggableId) {
                                match.date = slots[destination.droppableId].date
                                match.time = slots[destination.droppableId].time
                                match.locationId = slots[destination.droppableId].locationId
                                currMatch = match
                            }
                        })
                    }
                });
                return prevState
            })

            setSelectedMatchDay(s => {
                s?.matches?.map(match => {
                    if (match._id === draggableId) {
                        match.date = slots[destination.droppableId].date
                        match.time = slots[destination.droppableId].time
                        match.locationId = slots[destination.droppableId].locationId
                    }
                })
                return s
            })

            setSlots(prevState => {
                prevState[destination.droppableId].match = currMatch;
                return prevState
            })

            await service.updateMatches(currMatch._id, {
                date: currMatch.date,
                time: currMatch.time,
                locationId: currMatch.locationId
            }).then(r => {
                toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Расписание обновлено'})
                setLeGrandeCostyl(prevState => {
                    return prevState + 1
                })
            })
        }
    }

    const itemTemplate = (matchday) => {
        return <Droppable droppableId={`${matchday._id}`} isDropDisabled={true}>
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className={'tour'}>
                            <div className={'tour-number'}>
                                <div>{matchday.name}</div>
                            </div>
                            <Button
                                className='p-button-sm render-btn'
                                label={renderingGraphics ? 'Рендеринг...' : 'Скачать графику'}
                                icon='pi pi-image'
                                onClick={() => renderMdGraphics()}
                                loading={renderingGraphics}
                            />
                            {!matchday.isCompleted ? <div className='dnd-tip'>перетащите матч в свободный слот</div> : null}

                            {matchday.matches ? matchday.matches.sort((a,b) =>
                                (a.date && b.date) ? a.date > b.date ? 1 : a.date === b.date ? a.time > b.time ? 1 : -1 : -1 : a.date ? -1 : 1
                            ).map((match, index) => {
                                return <MatchItem match={match} index={index} subject={subject}/>
                            }) : []}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
    }

    const onClickDeleteMatch = async (slotIndex) => {

        const currMatch = slots[slotIndex].match

        setLeGrandeCostyl(prevState => {
            return prevState - 1
        })

        setSlots(prevState => {
            prevState[slotIndex].match = null;
            return prevState
        })

        setData(prevState => {
            prevState.matchdays.map(matchday => {
                matchday.matches.map(match => {
                    if (match._id === currMatch._id) {
                        match.date = null
                        match.time = null
                        match.locationId = null
                        match.employees = []
                    }
                })
            });
            return prevState
        })

        setSelectedMatchDay(s => {
            s?.matches?.map(match => {
                if (match._id === currMatch._id) {
                    match.date = null
                    match.time = null
                    match.locationId = null
                    match.employees = []
                }
            })
            return s
        })

        await service.updateMatches(currMatch._id, {
            date: null,
            time: null,
            locationId: null,
            employees: []
        }).then(r => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Расписание обновлено'})
        })
    }

    const onRemoveEmployee = async (matchId, entity, curE) => {
        const newEmployees = entity.employees.filter(e => e !== curE)
        entity.employees = newEmployees
        await service.updateMatches(matchId, {
            employees: newEmployees
        }).then(r => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Расписание обновлено'})
            setNeedUpdateEmployees(true)
        })
    }

    const getEmployees = (matchId) => {
        const pull = data && data.matchdays ? data.matchdays.map(md => md.matches).flat(1) : []
        const entity = pull.find(m => m._id === matchId)

        if(entity) {
            return !entity.employees || !entity.employees.length ? null : entity.employees.map(e => (
                <Chip
                    key={e._id}
                    removable
                    onRemove={() => onRemoveEmployee(matchId, entity, e)}
                    label={e.name}
                />
            ))
        } else {
            return null
        }
    }

    return (
        <div className={'content'}>
            <Toast position='top-center' ref={toastRef} />
            <DragDropContext onDragEnd={onDragEnd}>
                <div className={'schedule-list'}>
                    <CustomScrollbars className='schedule-staff-bars' autoHeight autoHide autoHeightMin='66vh'>
                        {!staffMode && data.matchdays ? (
                            <MatchdaysNav
                                data={data.matchdays}
                                active={selectedMatchDay}
                                onSelected={v => setSelectedMatchDay(v)}
                            />
                        ) : null}

                        <div>
                        {selectedMatchDay && !staffMode ? (
                            <div className={'tour-shadow-container'}>{itemTemplate(selectedMatchDay)}</div>
                        ) : null}
                        </div>

                        {staffMode ? employees ? (
                            <div className='staff-controls'>
                                <div className='btn-group'>
                                    {roles.map((r, i) => (
                                        <Button
                                            key={r.value || 'all'}
                                            className={`p-button-sm p-button-info ${role !== r.value ? 'p-button-outlined' : ''}`}
                                            onClick={() => setRole(r.value)}
                                        >{r.label}</Button>
                                    ))}
                                </div>

                                <Droppable droppableId={`role-${role}`} isDropDisabled={true}>
                                    {(provided) => (
                                        <div className='staff-list' {...provided.droppableProps} ref={provided.innerRef}>
                                            {employees[role] ? employees[role].map((person, i) => (
                                                <Draggable key={person._id} draggableId={`person-${person._id}`} index={i}>
                                                    {(provided, snapshot) => (
                                                        <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} key={person._id} className='person-item card'>
                                                            <div className={'photo-rectangle'}>
                                                                <img src={person.avatarUrl || PlayerPhoto} className={'photo'}/>
                                                            </div>
                                                            <div className='person-info'>
                                                                <div className='name'>{person.name} {person.surname || ''}</div>

                                                                {person.allMatchesCount ? <Tag severity='info'>{`${person.allMatchesCount} назначени${formatter(person.allMatchesCount)} на этой неделе`}</Tag> : <Tag severity='info'>нет активных назначений</Tag>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            )) : null}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ) : (
                            <div style={{height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                <ProgressSpinner style={{width: 64, height: 64}} />
                            </div>
                        ) : null}
                    </CustomScrollbars>
                </div>

                <CustomScrollbars className='slots-wrap' autoHide autoHeight autoHeightMin='78vh'>
                    <div className={'slots'}>
                        {slots.map((slot, index) => {
                            return <Droppable droppableId={`${index}`}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={'slot'}
                                        style={{background: slot.match!==null ? 'var(--blue-50)' : snapshot.isDraggingOver && !snapshot.draggingOverWith.includes('person') ? 'var(--indigo-100)' : '#F7F8F9'}}
                                    >
                                        <Tag className="tag" severity="info" value={slot.locationName} style={{backgroundColor: `rgba(218, 222, 227, ${slot.opacity})`}}/>
                                            {(snapshot.isDraggingOver && slot.match===null && !snapshot.draggingOverWith.includes('person')) ?
                                                <div className={'slot-match'}>
                                                    <div style={{display: 'flex', alignItems: 'center', height: '70px'}}>Поместить сюда</div>
                                                </div> :  (slot.match===null) ?
                                                <i className="pi pi-calendar" style={{'fontSize': '1.375rem', color: '#616161'}}/> :
                                                <div className={'slot-match'}>
                                                    <Link
                                                        to={{
                                                            pathname: `/schedule?editmatch=${slot.match._id}`,
                                                            state: { background: location }
                                                        }}
                                                        style={{color: 'inherit', textDecoration: 'inherit', display: 'flex', alignItems: 'center', justifyContent:'center'}}
                                                    ><div className={'home-team'}>{slot.match.homeName}</div> <div style={{alignSelf: 'center'}}><i className='pi pi-bolt'></i></div> <div className={'away-team'}>{slot.match.awayName}</div></Link>
                                                    {
                                                        !slot.match.stageId ? <div className={'delete-match'} onClick={() => onClickDeleteMatch(index)}><i className="pi pi-times-circle" style={{'fontSize': '1rem', color: '#FFACA7'}}/></div> : null
                                                    }
                                                    <div className={'staff'}>{getEmployees(slot.match._id)}</div>
                                                </div>}
                                        <div className={'tag-group'}>
                                            <Tag className={"tag2"+((slot.match!==null || snapshot.isDraggingOver) ? '' : ' available')} severity="info" value={moment(slot.date, "YYYY-MM-DD").format('DD MMMM')+' '+slot.time}/>
                                        </div>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        })}
                    </div>
                </CustomScrollbars>
            </DragDropContext>
        </div>
    )
}

export default ScheduleList

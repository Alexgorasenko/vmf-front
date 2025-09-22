import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'

import { SquadContext } from './ctx'
import { ClubContext } from '../../ctx'

import { TopSwitch } from '../../Atoms'
import SquadController from './SquadController'
import CloneFlow from './CloneFlow'

import { Chip } from 'primereact/chip'
import { Sidebar } from 'primereact/sidebar'
import { Button } from 'primereact/button'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../../env'

import { v4 as uuidv4 } from 'uuid'
import { prepareManualSquad } from './helpers'

const cats = ['active', 'finished']

const traverseDiffQty = obj => {
    return obj ? Object.entries(obj).reduce((acc, e) => {
        acc += Object.keys(e[1]).length
        return acc
    }, 0) : 0
}

const Squads = () => {
    const [data, setData] = useState()
    const [cat, setCat] = useState('active')
    const [squad, setSquad] = useState()
    const [diff, setDiff] = useState()
    const [applying, setApplying] = useState(false)

    const ctx = useContext(ClubContext)

    const loadSquads = (actualize=false) => {
        axios.get(`${ENDPOINT}v2/clubSquads`, {
            headers: {
                Authorization: ctx.token
            }
        }).then(resp => {
            if(resp.data && !resp.data.error) {
                setData(resp.data)
                if(actualize) {
                    const matched = resp.data.active.find(sqd => sqd._id === squad._id)
                    if(matched) {
                        setSquad({...matched})
                    }

                    setTimeout(() => {
                        setApplying(false)
                    }, 500)
                }
            }
        })
    }

    useEffect(() => {
        if(ctx && ctx.token) {
            loadSquads()
        }
    }, [ctx])

    const catIdx = cats.findIndex(c => c === cat)
    const diffQty = traverseDiffQty(diff)

    const applyChanges = async () => {
        const { body, onlyNumbers, unlinked } = prepareManualSquad(diff, squad)
        if(onlyNumbers.data && onlyNumbers.data.length) {
            await axios.post(`${ENDPOINT}v2/patchSquadNumbers`, onlyNumbers, {
                headers: {
                    Authorization: ctx.token
                }
            })
        }

        setApplying(true)

        if(unlinked.data && unlinked.data.length) {
            await axios.post(`${ENDPOINT}v2/patchSquadUnlinks`, unlinked, {
                headers: {
                    Authorization: ctx.token
                }
            })
        }

        axios.post(`${ENDPOINT}v2/applyManualSquad`, body, {
            headers: {
                Authorization: ctx.token,
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            if(resp.data) {
                loadSquads(true)
            }
        })
    }

    return  <SquadContext.Provider value={{squad, setSquad, setDiff}}>
                <div className='club-squads'>
                    <TopSwitch
                        active={catIdx}
                        onChange={idx => setCat(cats[idx])}
                        model={[
                            {label: 'Активные', icon: !data ? 'pi-spin pi-spinner' : null, badge: data ? data.active.length : null},
                            {label: 'Завершённые', icon: !data ? 'pi-spin pi-spinner' : null, badge: data ? data.finished.length : null}
                        ]}
                    />

                    <Sidebar
                        visible={squad && squad._id}
                        onHide={() => setSquad(null)}
                        position='right'
                        maskClassName='club-squad'
                    >
                        {squad ? (
                            <SquadItem
                                item={squad}
                                action={null}
                                onCreate={() => setSquad({
                                    ...squad,
                                    data: {
                                        ...squad.data,
                                        players: [{id: uuidv4()}].concat(squad.data.players)
                                    }
                                })}
                                onClone={arr => setSquad({
                                    ...squad,
                                    data: {
                                        ...squad.data,
                                        players: arr.map(p => ({...p, squadState: {isRequested: true}})).concat(squad.data.players)
                                    }
                                })}
                            />
                        ) : null}

                        <div className='squad-buttons'>
                            {squad && !squad.finished ? <Button
                                className='p-button-sm'
                                style={diffQty ? {width: '200%'} : {}}
                                disabled={!diffQty}
                                loading={applying}
                                label={diffQty ? `Отправить ${diffQty} изменений` : 'Нет изменений'}
                                icon={diffQty ? 'pi pi-check' : null}
                                onClick={() => applyChanges()}
                            /> : null}
                            <Button className='p-button-sm btn-create' label='Закрыть' icon='pi pi-times' onClick={() => setSquad(null)} />
                        </div>

                        {squad ? (
                            <SquadController token={ctx.token} isApplying={applying} />
                        ) : null}
                    </Sidebar>

                    <div className='club-squads_list'>
                        {data && data[cat] ? data[cat].map((item, idx) => (
                            <SquadItem
                                item={item}
                                action={() => setSquad({...item, finished: cat === 'finished'})}
                                key={item._id}
                            />
                        )) : null}
                    </div>
                </div>
            </SquadContext.Provider>
}

const SquadItem = ({ item, action, onCreate, onClone }) => {
    const [cloneFlow, setCloneFlow] = useState(false)

    return  <div
                className='squad-item'
                onClick={() => action ? action() : null}
            >
                <div className='tour'>
                    <span>{item.tournament}</span>
                    <span>({item.league})</span>
                </div>
                <Chip label={item.team} image={item.emblem} />
                <div className='qtys'>
                    <div>
                        <span>{item.players}</span>
                        <b>активно</b>
                    </div>
                    <div>
                        <span>{item.playersAwait}</span>
                        <b>ожидает</b>
                    </div>
                    <div>
                        <span>{item.playersUnlinked}</span>
                        <b>отзаявлено</b>
                    </div>
                </div>
                {onCreate && !item.finished ? (
                    <span className='create-trigger' onClick={() => onCreate()}><i className='pi pi-plus-circle'></i>добавить игрока</span>
                ) : null}

                {onCreate && !item.finished ? (
                    <span className='create-trigger _clone' onClick={() => setCloneFlow(true)}><i className='pi pi-clone'></i>копировать старую</span>
                ) : null}

                <Sidebar
                    position='bottom'
                    visible={cloneFlow}
                    maskClassName='player-form-mask clone-flow-mask'
                >
                    {cloneFlow ? (
                        <CloneFlow
                            squad={item}
                            onClose={() => setCloneFlow(false)}
                            onClone={onClone}
                        />
                    ) : null}
                </Sidebar>
            </div>
}

export default Squads

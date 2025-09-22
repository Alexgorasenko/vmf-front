import React, { useState, useEffect, useContext } from 'react'

import { ClubContext } from '../../../ctx'

import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { Checkbox } from 'primereact/checkbox'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../../../env'

import moment from 'moment'

const PlayerItem = ({ data, currentIds, onToggle, isPicked, squadData, tkn }) => {
    const [presentedIn, setPresentedIn] = useState(null)

    const isIncluded = currentIds.includes(data._id)

    useEffect(() => {
        if(data._id) {
            axios.get(`${ENDPOINT}v2/checkPlayerPresence/${data._id}?teamId=${squadData.teamId}&tournamentId=${squadData.tournamentId}`, {
                headers: {
                    authorization: tkn
                }
            }).then(resp => {
                if(resp.data && resp.data.length) {
                    setPresentedIn(resp.data[0])
                }
            })
        }
    }, [data])

    return  <div
                className={`option player-option ${isIncluded ? 'included' : ''}`}
                onClick={() => !isIncluded ? onToggle() : null}
            >
                <Checkbox checked={isIncluded || isPicked} />
                <div className='current-status'>
                    {isIncluded ? <label>уже в заявке</label> : null}
                    {!isIncluded && presentedIn ? [
                        <label>заявлен за:</label>,
                        <span>{presentedIn.team.name}</span>
                    ] : null}
                </div>
                <div>
                    <label>{data.name} {data.middlename}</label>
                    <span>{data.surname}</span>
                </div>
            </div>
}

const CloneFlow = ({ squad, onClose, onClone }) => {
    const [data, setData] = useState(null)
    const [selected, setSelected] = useState(null)
    const [currentList, setCurrentList] = useState(null)
    const [pickedList, setPickedList] = useState([])
    const ctx = useContext(ClubContext)

    useEffect(() => {
        if(squad._id) {
            axios.get(`${ENDPOINT}v2/squadsToClone?teamId=${squad.teamId}&currentId=${squad._id}`, {
                headers: {
                    authorization: ctx.token
                }
            }).then(resp => {
                if(resp.data && !resp.data.error) {
                    setTimeout(() => {
                        setData(resp.data)
                    }, 1000)

                    if(squad.data && squad.data.players) {
                        setCurrentList(squad.data.players.map(p => p._id))
                    }
                }
            })
        }
    }, [squad])

    useEffect(() => {
        setPickedList([])
    }, [selected])

    const clonePickedPlayers = () => {
        onClone(pickedList.map(id => {
            const matched = selected.playersData.find(p => p._id === id)
            return matched || null
        }).filter(p => p))
        setPickedList([])
        setSelected(null)
        setCurrentList(null)
        setData(null)
        onClose()
    }

    return  <div className='clone-flow'>
                {!data ? (
                    <ProgressSpinner style={{width: 34, height: 34}} />
                ) : selected ? (
                    <div className='options-list'>
                        <div className='options-title'>Выберите игроков для копирования:</div>
                        {selected.playersData.map(p => (
                            <PlayerItem
                                key={p._id}
                                data={p}
                                currentIds={currentList}
                                isPicked={pickedList.includes(p._id)}
                                onToggle={() => setPickedList(pickedList.includes(p._id) ? pickedList.filter(i => i !== p._id) : pickedList.concat([p._id]))}
                                squadData={{teamId: squad.teamId, tournamentId: squad.tournamentId}}
                                tkn={ctx.token}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='options-list'>
                        <div className='options-title'>Выберите одну из прошлых заявок:</div>
                        {data.filter(opt => opt.playersData && opt.playersData.length).map(opt => (
                            <div className='option' key={opt._id} onClick={() => setSelected({...opt})}>
                                <Tag className='players-qty'>{opt.playersData.length} игроков</Tag>
                                <div><label>в турнир:</label>{opt.tournament.name}</div>
                                <div><label>дата открытия:</label>{moment(opt.openDate, 'YY-MM-DD').format('DD.MM.YY')}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div className='actions'>
                    {selected ? (
                        <Button
                            className='p-button-sm add-players'
                            disabled={!pickedList.length}
                            label={pickedList.length ? `Добавить ${pickedList.length} игроков` : `Добавить игроков`}
                            onClick={() => clonePickedPlayers()}
                        />
                    ) : null}
                    <Button
                        label={selected ? 'Назад' : 'Отмена'}
                        className='p-button-sm back-btn'
                        icon='pi pi-times'
                        onClick={() => selected ? setSelected(null) : onClose()}
                    />
                </div>
            </div>
}

export default CloneFlow

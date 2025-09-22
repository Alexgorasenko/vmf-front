import React, { useState, useEffect, useRef } from 'react'
import '../style.scss'
import emblem from "../../../Emblem";
import {Tag} from "primereact/tag";
import { Toast } from 'primereact/toast'
import { Checkbox } from 'primereact/checkbox';
import {Button} from "primereact/button";
import CustomScrollbars from 'react-custom-scrollbars-2'
import service from '../service'
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup'

import { ENDPOINT } from '../../../../env'
import axios from 'axios'

import moment from 'moment'

const PersonItem = ({ toggleApply, apply, item, idx, handled, teamId, tournamentId, unlinkCandidates, setUnlinkCandidates }) => {
    const [siblingSquad, setSiblingSquad] = useState(null)
    const [markedResolved, setMarkedResolved] = useState(false)

    useEffect(() => {
        if(!handled) {
            axios.get(`${ENDPOINT}v2/testSiblingSquads?teamId=${teamId}&tournamentId=${tournamentId}&playerId=${item._id}`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                if(resp.data && !resp.data.empty) {
                    setSiblingSquad(resp.data)
                }
            })
        }
    }, [])

    const checkedState = apply.includes(item._id ? item._id.toString() : idx.toString())

    const handleToggle = evt => {
        if(!checkedState && siblingSquad) {
            const popup = confirmPopup({
                target: evt.currentTarget,
                acceptLabel: 'Всё в порядке. Заявить в обе',
                rejectLabel: `Отзаявить из «${siblingSquad.team.name}»`,
                message: `Игрок заявлен в «соседний» турнир «${siblingSquad.tournament.name}» в составе команды «${siblingSquad.team.name}». Дата заявки ${moment(siblingSquad.linked, 'YY-MM-DD').format('DD.MM.YY')}`,
                accept: () => {
                    setMarkedResolved(true)
                    toggleApply(item._id || idx.toString())
                },
                reject: () => {
                    setUnlinkCandidates({
                        ...unlinkCandidates,
                        [item._id]: {
                            squadId: siblingSquad._id,
                            //originSquadIndex: siblingSquad.originSquadIndex
                        }
                    })
                    toggleApply(item._id || idx.toString())
                }
            })

            popup.show()
        } else {
            if(siblingSquad) {
                setUnlinkCandidates(
                    Object.entries(unlinkCandidates)
                        .filter(e => e[0] !== item._id)
                        .reduce((acc, e) => {
                            acc[e[0]] = e[1]
                            return acc
                        }, {})
                )
            }

            setMarkedResolved(false)
            toggleApply(item._id || idx.toString())
        }
    }

    return  <div className='request__block_item'>
                <Checkbox
                    onChange={evt => handleToggle(evt)}
                    value={item}
                    checked={checkedState}
                    disabled={handled}
                />
                <div className='item' onClick= {evt => handled ? null : handleToggle(evt)}>
                    <span className='item__name'>{item.surname} {item.name} {item.middlename}</span>
                    <span className='item__date'>{item.birthday} {/*item.number || ''*/}</span>
                    {/*<span className='item__name'>{item.isRequested ? item.unlinked ? 'отзаявяить' : 'заявить' : 'обновить данные'}</span>*/}
                </div>

                {siblingSquad && !markedResolved ? !unlinkCandidates[item._id] ? (
                    <Tag intent='danger' className='conflict'>возможный конфликт заявок</Tag>
                ) : (
                    <Tag
                        intent='warning'
                        icon='pi pi-times-circle'
                        className='marked'
                        onClick={() => {
                            setUnlinkCandidates(
                                Object.entries(unlinkCandidates)
                                    .filter(e => e[0] !== item._id)
                                    .reduce((acc, e) => {
                                        acc[e[0]] = e[1]
                                        return acc
                                    }, {})
                            )
                            toggleApply(item._id || idx.toString())
                        }}
                    >{`«трансфер» из ${siblingSquad.team.name}`}</Tag>
                ) : null}

                <ConfirmPopup className='conflict-popup' />
            </div>
}

const AddonItem = ({item, getEmblem, patchItem, onArchived, clubManage, allTournaments}) => {
    const [unlinkCandidates, setUnlinkCandidates] = useState({})

    const {_id, team, club, user, squad, tournament, league, data, createdAt, handledAt, handler, archived} = item;
    const handled = !!handledAt || !!archived || clubManage;

    const [apply, setApply] = useState(data && data.addon.length ? data.addon.filter((p, ind) => p.applied || (squad && squad.players && squad.players.find(_p => _p._id === p._id))).map((p, ind) => p._id ? p._id.toString() : ind.toString()) : [] )
    const [progress, setProgress] = useState(false)
    //const toastId = useRef(null)

    const toggleApply = id => {
        if(apply.includes(id)) {
            setApply(apply.filter(i => i !== id))
        } else {
            setApply(apply.concat([id]))
        }
    }
    const maintoast = useRef(null)

    const applySquadData = async (archived=false) => {
        setProgress(true)

        if (maintoast.current) {
            maintoast.current.show({severity: 'success', summary: 'Обработка', life: 1000})
        }
        let patch
        if (archived) {
            patch = await service.applyQuery({archived: true, queryId: _id});
        } else {
            if (unlinkCandidates && Object.keys(unlinkCandidates).length) {
                for (let plrId in unlinkCandidates) {
                    const res = await service.unlinkPlrFromSquad({playerId: plrId, squadId: unlinkCandidates[plrId].squadId}, maintoast.current)
                }
            }
            patch = await service.applyQuery({
                apply: apply,
                queryId: _id,
                tournamentId: data.tournamentId
            }, maintoast.current);
        }
        if (patch) {
            patchItem({
                ...item,
                ...patch
            })
        }
        setProgress(false)
    }
    return (

        <div className={'control__request'}>
            <Toast ref={maintoast} position='top-right' />
            <img src={team.emblem || `${getEmblem(club)}`} className={'control__request-image'} />
            <div className='control__request_title'>дозаявка команды <span>{team ? team.name : club ? club.name : 'нет названия'}</span> в <br/>
            {tournament ? (
                <Tag className="tag" severity="info" value={`${tournament.league ? tournament.league.name : league ? league.name : ''}, ${tournament.name || ''}`}></Tag>
            ) : league ? (
                <Tag className="tag" severity="info" value={`${league.name || 'нет названия у лиги'}`}></Tag>
            ) : <Tag className="tag" severity="info" value={`нет данных`}></Tag>}
            </div>
            {data.addon && data.addon.length ? <div className='control__request_block'>
                <CustomScrollbars className='players-bars' autoHide autoHeight autoHeightMin='53vh'>

                {data.addon.map((item,idx) => (
                    <PersonItem
                        key={idx}
                        idx={idx}
                        item={item}
                        toggleApply={toggleApply}
                        apply={apply}
                        handled={handled}
                        teamId={team._id}
                        tournamentId={tournament ? tournament._id : null}
                        unlinkCandidates={unlinkCandidates}
                        setUnlinkCandidates={setUnlinkCandidates}
                    />
                ))}
                {handled || clubManage || !tournament ? null : <div className='control__request_group-button'>
                    <span onClick={()=> setApply(data.addon.map((item,idx) => item._id ? item._id.toString() : idx.toString()))}>Отметить всех</span>
                    <span onClick={()=> setApply([])}>Снять отметки</span>
                </div>}
                {!handled && !clubManage && apply.length && tournament ? (
                    <Button
                        label={`Принять ${apply.length} игрок${pluralForm(apply.length)}`}
                        icon="pi pi-check"
                        className='control__request_button'
                        onClick={async () => await applySquadData()}
                        disabled={progress}
                    />) : null}
                {!handled && !clubManage ? (
                    <Button
                        label={`Отклонить заявку`}
                        icon="pi pi-times"
                        className='control__request_button p-button-danger'
                        onClick={async () => await applySquadData(true)}
                        disabled={progress}
                    />) : null}
                </CustomScrollbars>
            </div> : <div className='control__request_title'>нет данных</div>}

        </div>
    )
}

const pluralForm = (n) => {
    let arr = ["а", "ов", "ов"]
    return arr[n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
}

export default AddonItem

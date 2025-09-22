import React, { useState, useEffect, useRef } from 'react'
import '../style.scss'
import emblem from "../../../Emblem";
import {Tag} from "primereact/tag";
import { Toast } from 'primereact/toast'
import { Checkbox } from 'primereact/checkbox';
import {Button} from "primereact/button";
import { Dropdown } from 'primereact/dropdown'
import CustomScrollbars from 'react-custom-scrollbars-2'
import service from '../service'

const SquadItem = ({item, getEmblem, patchItem, onArchived, clubManage, allTournaments}) => {
    const {_id, team, club, user, relatedTo, data, league, createdAt, handledAt, handler, archived} = item;
    const [tournament, setTournament] = useState(item.tournament)
    const [curtourn, setCurTournament] = useState(null)

    const handled = !!handledAt || !!archived;

    const [apply, setApply] = useState(data && data.length ? data.filter((p, ind) => p.applied).map((p, ind) => p._id ? p._id.toString() : ind.toString()) : [] )
    const [progress, setProgress] = useState(false)

    const opRef = useRef()

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
            const tid = tournament ? tournament._id : curtourn ? curtourn._id : null;
            if (tid) {
                patch = await service.applyQuery({
                    apply: apply,
                    queryId: _id,
                    relatedId: relatedTo,
                    tournamentId: tid
                }, maintoast.current);
            } else {
                console.log('tournament Id not found', tid, tournament, 'curtourn', curtourn);
            }
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
            <img src={team && team.emblem ? team.emblem : `${getEmblem(club)}`} className={'control__request-image'} />
            <div className='control__request_title'>Заявка команды <span>{team ? team.name : club ? club.name : 'не указано название'}</span> в <br/>
            {tournament ? (
                <Tag className="tag" severity="info" value={`${tournament.league ? tournament.league.name : league ? league.name : ''}, ${tournament.name || ''}`}></Tag>
            ) : league ? (
                <Tag className="tag" severity="info" value={`${league.name || 'нет названия у лиги'}`}></Tag>
            ) : (
                <Dropdown
                    className='squad-dd'
                    placeholder='Автор заявки не выбрал турнир'
                    onChange={e => setCurTournament(e.value)}
                    value={curtourn}
                    options={allTournaments}
                    optionLabel="name"
                />
            )}
            </div>
            <CustomScrollbars autoHeight autoHide autoHeightMin='53vh'>
                <div className='control__request_block'>
                {data && data.length ? (
                    data.map((item,idx) => (
                        <div className='request__block_item' key={idx}>
                            <Checkbox
                                onChange={() => toggleApply(item._id || idx.toString())}
                                value={item}
                                checked={apply.includes(item._id ? item._id.toString() : idx.toString())}
                                disabled={handled}
                            />
                            <div className='item' onClick= {() => handled ? null : toggleApply(item._id || idx.toString())}>
                                <span className='item__name'>{item.surname} {item.name} {item.middlename}</span>
                                <span className='item__date'>{item.birthday}</span>
                            </div>
                        </div>
                    ))
                ) : <div className='control__request_title'>пустая заявка</div>}
                {data && data.length ? handled ? null : <div className='control__request_group-button'>
                    <span onClick={()=> setApply(data.map((item,idx) => item._id ? item._id.toString() : idx.toString()))}>Отметить всех</span>
                    <span onClick={()=> setApply([])}>Снять отметки</span>
                </div> : null}
                    {handled ? null : <Button
                        label={!handled && apply.length ? `Принять ${apply.length} игрок${pluralForm(apply.length)}` : `Принять`}
                        icon="pi pi-check"
                        className='control__request_button'
                        onClick={async () => await applySquadData()}
                        disabled={progress || (data && data.length ? !apply.length : false) || (!tournament && !curtourn)}
                    />}
                {!handled ? (
                    <Button
                        label={`Отклонить заявку`}
                        icon="pi pi-times"
                        className='control__request_button p-button-danger'
                        onClick={async () => await applySquadData(true)}
                        disabled={progress}
                    />) : null}
            </div>
            </CustomScrollbars>
        </div>
    )
}

const pluralForm = (n) => {
    let arr = ["а", "ов", "ов"]
    return arr[n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
}

export default SquadItem

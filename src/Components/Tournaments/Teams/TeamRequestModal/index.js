import React, { useState, useRef, useEffect } from "react";
import './style.scss'
import emblem from "../../../Emblem";
import {RadioButton} from "primereact/radiobutton";
import {Button} from "primereact/button";
import { Tag } from 'primereact/tag'
import { Checkbox } from 'primereact/checkbox'
import { ProgressSpinner } from 'primereact/progressspinner'
import KitIcon from '../../../../assets/img/image 13.svg'
import InputMask from 'react-input-mask'
import {InputText} from "primereact/inputtext";

import service from '../../service'

import moment from 'moment'
import axios from "axios";
import {ENDPOINT} from "../../../../env";

const formatText = count => {
    if (count > 20) {
        if (count % 10 === 1) {
            return `${count} игрок`
        } else if ([2, 3, 4].includes(count % 10)){
            return `${count} игрока`
        } else {
            return `${count} игроков`
        }

    } else {
        if (count === 1) {
            return `${count} игрок`
        } else if ([2, 3, 4].includes(count)){
            return `${count} игрока`
        } else {
            return `${count} игроков`
        }
    }
}

const TeamRequestModal = ({ isVisible = false, data, onClose, toast, tournamentId, pushTeam, updateTeam }) => {
    const [mode, setMode] = useState('')
    const [fetching, setFetching] = useState(false)
    const [squads, setSquads] = useState([])

    useEffect(() => {
        if (data.hasOwnProperty('latestSquad')) {
            setMode('addTeam')
        } else {
            setMode('clone')
        }
    }, [])

    useEffect(() => {
        if (mode === 'clone'){
            setFetching(true)
            axios.get(`${ENDPOINT}v2/getTeamWithSquads/${data._id}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            })
                .then(suggs => {
                    setSquads(suggs.data.squads)
                    setFetching(false)
                })
        }
    }, [mode])

    const keydownHandler = ({ key }) => {
        switch (key) {
            case 'Escape':
                onClose();
                break;
            default:
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', keydownHandler);
        return () => document.removeEventListener('keydown', keydownHandler);
    });

    const [option, setOption] = useState('empty');
    const [processing, setProcessing] = useState(false)
    const [listStash, setListStash] = useState(null)
    const [selfHeight, setSelfHeight] = useState(400)

    const modalRef = useRef()

    useEffect(() => {
        if(modalRef && modalRef.current) {
            if(modalRef.current.clientHeight !== selfHeight) {
                setSelfHeight(modalRef.current.clientHeight)
            }
        }
    }, [modalRef, listStash])

    const onClearChecked = () => {
        const mapd = listStash ? listStash.map(p => ({...p, exclude: true})) : []
        setListStash(mapd)
    }

    const onCheckedAll = () => {
        const mapd = listStash ? listStash.map(p => ({...p, exclude: false})) : []
        setListStash(mapd)
    }

    return !isVisible ? null : (
        <div className="modal" onClick={onClose}>
            <div className="modal-dialog" ref={modalRef} onClick={e => e.stopPropagation()} style={{marginTop: `calc((100vh - ${selfHeight}px)/2)`}}>
                <div className={'emblem-wrap'}>{emblem({source: data.club.emblem || require('../TeamData/pennant.png'), backdroped: true, size: 'lg'})}</div>
                <div className={'modal-background'}>
                    {mode === 'addTeam' ?
                        <div className={'text'}>Заявить команду {data.name} <br/>в турнир: </div> :
                        <div className={'text'}>Клонировать заявку команды {data.name} <br/>в турнир: </div>
                    }

                    {mode === 'addTeam' ? data.squads && data.squads.length ? listStash ? (
                        <div className='list-stash'>{listStash.sort((a, b) => b.surname > a.surname ? -1 : a.surname > b.surname ? 1 : 0).map((plr, key) => (
                            <div className='list-stash_item' key={key}>
                                <Checkbox inputId={plr._id} checked={!plr.exclude} onChange={() => setListStash(listStash.map(p => p._id !== plr._id ? p : ({...p, exclude: plr.exclude ? false : true})))} />
                                <div className={'number'} style={{marginLeft: '10px'}}>
                                    {/*<div className={'icon'}>
                                        <img src={KitIcon}/>
                                    </div>*/}
                                    <InputMask

                                        mask='99'
                                        value={plr.num || ''}
                                        placeholder={'99'}
                                        onChange={(e) => {
                                            console.log(e.target.value);
                                            setListStash(listStash.map(p => p._id !== plr._id ? p : ({...p, num: e.target.value})))
                                        }}
                                        //disabled={typeof(plr._id) !== 'undefined'}
                                    >
                                        {() => (
                                            <InputText
                                                placeholder={'99'}
                                                style={{width: '50px',height: '30px', padding: '5px', textAlign: "center"}}
                                            />
                                        )}
                                    </InputMask>
                                </div>
                                <label htmlFor={plr._id}>{plr.surname} {plr.name} {plr.middlename}</label>

                                {plr && plr.presentedIn && plr.presentedIn.length ? (
                                    <Button
                                        className='p-button-sm'
                                        label={`активных заявок: ${plr.presentedIn.length}`}
                                        tooltip={plr.presentedIn.map(pi => `${pi.team} (${pi.tournament})`).join(', ')}
                                    />
                                ) : null}
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className={'actions'}>
                            <div className="action">
                                <RadioButton
                                    inputId="empty"
                                    name="mode"
                                    value='empty'
                                    onChange={(e) => setOption(e.value)}
                                    checked={option === 'empty'}
                                />
                                <label htmlFor="empty" className={'label'}>с пустой заявкой</label>
                            </div>
                            {data.squads.filter(s => s.tournament && s.players && s.players.length).map(s => (
                                <div className="action">
                                    <RadioButton
                                        inputId={s._id}
                                        name="mode"
                                        value={s._id}
                                        onChange={(e) => setOption(s._id)}
                                        checked={option === s._id}
                                    />
                                    <label htmlFor={s._id} className={'label'}>{`клонировать заявку (${ s.tournament.league ? s.tournament.league.name : ''}, ${s.tournament.name} от ${s.openDate.split('-').reverse().join('.')})`}{s.players ? (<Tag>{formatText(s.players.length)}</Tag>) : null}</label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='notice'>
                            {fetching ? (
                                <ProgressSpinner />
                            ) : [
                                <span>Нет заявок команды для клонирования.</span>,
                                <span>Будет создана новая.</span>
                            ]}
                        </div>
                    ) : squads && squads.length ? listStash ? (
                        <div className='list-stash'>{listStash.sort((a, b) => b.surname > a.surname ? -1 : a.surname > b.surname ? 1 : 0).map((plr, key) => (
                            <div className='list-stash_item' key={key}>
                                <Checkbox inputId={plr._id} checked={!plr.exclude} onChange={() => setListStash(listStash.map(p => p._id !== plr._id ? p : ({...p, exclude: plr.exclude ? false : true})))} />
                                <label htmlFor={plr._id}>{plr.surname} {plr.name} {plr.middlename}</label>
                                {plr && plr.presentedIn && plr.presentedIn.length ? (
                                    <Button
                                        className='p-button-sm'
                                        label={`активных заявок: ${plr.presentedIn.length}`}
                                        tooltip={plr.presentedIn.map(pi => `${pi.team} (${pi.tournament})`).join(', ')}
                                    />
                                ) : null}
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className={'actions'}>
                            {squads.filter(s => s.tournament && s.players && s.players.length).map(s => (
                                <div className="action">
                                    <RadioButton
                                        inputId={s._id}
                                        name="mode"
                                        value={s._id}
                                        onChange={(e) => setOption(s._id)}
                                        checked={option === s._id}
                                    />
                                    <label htmlFor={s._id} className={'label'}>{`клонировать заявку (${ s.tournament.league ? s.tournament.league.name : ''}, ${s.tournament.name} от ${s.openDate.split('-').reverse().join('.')})`}{s.players ? (<Tag>{formatText(s.players.length)}</Tag>) : null}</label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='notice'>
                            {fetching ? (
                                <ProgressSpinner />
                            ) : [
                                <span>Нет заявок команды для клонирования.</span>,
                                <span>Будет создана новая.</span>
                            ]}
                        </div>
                    )}

                    {mode === 'addTeam' ?
                        <div className={'button-group'}>
                        {listStash ? <Button label="Убрать все"  className={'button-sub'} style={{whiteSpace: 'nowrap', background:"#6366F1"}} onClick={onClearChecked}/> : null}
                        {/*<Button label="Выбрать всех" className="button-escape" onClick={onCheckedAll}/>*/}

                        <Button
                            label="Добавить команду"
                            icon="pi pi-check"
                            className={'button-sub'}
                            loading={processing}
                            onClick={async () => {
                                const pull = option && data && data.squads ? data.squads.find(sqd => sqd._id === option) : null
                                if(!listStash) {
                                    if(pull) {
                                        setListStash(pull.playersData.map(p => ({...p, exclude: false})))
                                    } else {
                                        setProcessing(true)
                                        const pushedSquad = await service.pushTeamToTour(tournamentId, data, 'empty', toast)
                                        if (pushedSquad) {
                                            const {latestSquad, squads, ...teamTailData} = data
                                            pushTeam({...teamTailData, squad: {...pushedSquad}})
                                            onClose()
                                        }
                                    }
                                } else {
                                    if(pull) {
                                        const filtered = listStash.filter(plr => !plr.exclude)
                                        const players = pull.players.map(p => filtered.find(f => f._id === p._id)).filter(p => p).map(p => ({...p, unlinked: null, linked: moment().format('YY-MM-DD')}))
                                        setProcessing(true)
                                        const pushedSquad = await service.pushTeamToTour(tournamentId, data, players, toast)
                                        if (pushedSquad) {
                                            pushTeam({...data, squad: {...pushedSquad}})
                                            onClose()
                                        }
                                        setListStash(null)
                                    }
                                }
                            }}
                        />
                        <Button label="Отмена" className="button-escape" onClick={onClose}/>
                    </div> :
                        <div className={'button-group'}>
                            <Button
                                label="Клонировать заявку"
                                icon="pi pi-check"
                                className={'button-sub'}
                                loading={processing}
                                onClick={async () => {
                                    const pull = option && squads ? squads.find(sqd => sqd._id === option) : null
                                    if(!listStash) {
                                        if(pull) {
                                            setListStash(pull.players.map(p => ({...p, exclude: false})))
                                        } else {
                                            setProcessing(true)
                                            const pushedSquad = await service.patchData(data.squad._id, 'squads', {players: []}, toast)
                                            if (pushedSquad) {
                                                updateTeam(data, [])
                                                onClose()
                                            }
                                        }
                                    } else {
                                        if(pull) {
                                            const filtered = listStash.filter(plr => !plr.exclude)
                                            const players = pull.players.map(p =>
                                                filtered.find(f => f._id === p._id)).filter(p => p).map(p => (
                                                    {
                                                        linked: moment().format('YY-MM-DD'),
                                                        unlinked: null,
                                                        number: p.number,
                                                        agegroup: null,
                                                        _id: p._id
                                                    })
                                            )
                                            setProcessing(true)
                                            const pushedSquad = await service.patchData(data.squad._id, 'squads', {players}, toast)
                                            if (pushedSquad) {
                                                updateTeam(data, players)
                                                onClose()
                                            }
                                            setListStash(null)
                                        }
                                    }
                                }}
                            />
                        </div>
                    }
                </div>

            </div>
        </div>
    );
};

export default TeamRequestModal

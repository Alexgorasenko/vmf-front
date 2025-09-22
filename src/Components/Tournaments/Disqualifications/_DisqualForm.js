import React, { useState, useEffect, useRef } from 'react'

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import service from './service'

import CustomScrollbars from 'react-custom-scrollbars-2';

import {Toast} from "primereact/toast";
import {RadioButton} from "primereact/radiobutton";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {Tag} from "primereact/tag";
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog } from 'primereact/confirmdialog'; // To use <ConfirmDialog> tag
import { confirmDialog } from 'primereact/confirmdialog'; // To use confirmDialog method

const moment = require('moment')
moment.locale('ru');

const initDays = [
    {key: 'mon', descr: 'Понедельник', data: []},
    {key: 'tue', descr: 'Вторник', data: []},
    {key: 'wed', descr: 'Среда', data: []},
    {key: 'thu', descr: 'Четверг', data: []},
    {key: 'fri', descr: 'Пятница', data: []},
    {key: 'sat', descr: 'Суббота', data: []},
    {key: 'sun', descr: 'Воскресенье', data: []}
];

const initDisqual = {
    tournamentId: null,
    playerId: null,
    squadId: null,
    count: 0,
    finishDate: null,
    fictive: false,
    club: null,
    tournament: null,
    player: null,
    missedMatches: [],
    startDate: moment().format('YY-MM-DD'),
    _id: null
}
const isDiscActive = (item) => {
    if ( item['count'] !== 'undefined' && item['count'] !== null && !isNaN(+item.count)) {
        if (+item.count === 0) {
            return false
        } else if (item.missedMatches && (+item.count - item.missedMatches.length === 0)) {
            return false
        } else {
            return true
        }
    } else if (item.finishDate && moment(item.finishDate, 'YY-MM-DD').unix() < moment().unix()) {
        return false
    } else {
        return true
    }
}
const DisqualForm = ({ disqual, curTournament, disqualsData, patchDisqual, removeDisqual, exitDisqual, fid, isActive}) => {
    console.log('form', disqual);
    const [curDisqual, setCurDisqual] = useState(disqual || {...initDisqual, tournamentId: curTournament ? curTournament._id : null, tournament: curTournament || null});
    const [curPlayer, setCurPlayer] = useState(disqual.player || null);
    const [count, setCount] = useState(disqual.count ? +disqual.count : disqual.finishDate ? disqual.finishDate : 0);

    const [players, setPlayers] = useState([]);
    const [playerInfo, setPlayerInfo] = useState('');
    const [squads, setSquads] = useState([]);
    const [curSquad, setCurSquad] = useState(disqual.squad || null);
    const [fictive, setFictive] = useState(disqual.fictive ? disqual.fictive : false);
    const [progress, setProgress] = useState(false)
    const [isQtType, setIsQtType] = useState(disqual.count ? true : disqual.finishDate ? false : true)
    const [needSaving, setNeedSaving] = useState(false);
    const [isRedCardCheck, setIsRedCardCheck] = useState(false);
    const [comment, setComment] = useState(disqual.comment || null);

    const getPlayersSquads  = async (fid, playerId) => {
        //запрос к скваду
        const _squads = await service.playerSquads(fid, curPlayer._id)
        setSquads([..._squads, {_id: 'allclubs', club:{name: 'Для всех клубов'}}])
    }

    useEffect(() => {
        if (curTournament) {
            setCurDisqual({...curDisqual, tournament: curTournament, tournamentId: curTournament._id})
        } else {
            setCurDisqual({...curDisqual, tournament: null, tournamentId: null})
        }
        if (curPlayer) {
            setCurDisqual({...curDisqual, player: curPlayer, playerId: curPlayer._id});
            setPlayers([curPlayer])
        } else {
            setCurDisqual({...curDisqual, player: null, playerId: null})
        }
        if (curSquad) {
            setCurDisqual({...curDisqual, squad: curSquad, squadId: curSquad._id});

        } else {
            setCurDisqual({...curDisqual, squad: null, squadId:null})
        }
        if (curPlayer && fid) {
            getPlayersSquads(fid, curPlayer._id)
        }
    }, [curPlayer, curTournament, curSquad])

    useEffect(() => {
        if (playerInfo && playerInfo.length > 3) {
            axios.post(`${ENDPOINT}unscoped/getPlayers`, {playerInfo: playerInfo})
                .then( _feed => {
                    setPlayers(_feed.data)
                })
        } else {
            /*if (curPlayer) {
                setPlayers([curPlayer]);
                setOpenPlayer(false)
            } else {
                setPlayers([]);
                setOpenPlayer(false)
            }*/
            /*setPlayers([]);
            setOpenPlayer(false)*/
        }
    }, [playerInfo])

    useEffect(() => {
        if (disqual && disqual._id) {
            if (curSquad && count) {
                if (((disqual.count && disqual.count.toString() !== count.toString()) ||
                (disqual.finishDate && disqual.finishDate.toString() !== count.toString())) ||
                disqual.fictive !== fictive ||
                (disqual.comment && disqual.comment !== comment) ||
                (!disqual.comment && comment)) {
                    setNeedSaving(true)
                } else {
                    setNeedSaving(false)
                }
            }
        } else {
            setNeedSaving(true)
        }
    }, [disqual, count, comment, fictive])

    const toast = useRef(null)

    const updDisqual = ({target}) => {
        setCurDisqual({...curDisqual, [target.name]: target.value})
    }

    /*const confirm = () => {
        confirmDialog({
            message: 'Все игроки кроме эталонного будут удалены без возможности восстановлления',
            header: 'Объединить выбранных игроков?',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => mergePlayers(),
            reject
        });
    }

    const reject = () => {
        toast.current.show({ severity: 'warn', summary: 'Rejected', detail: 'Вы отменили действие', life: 3000 });
    }*/

    const submitDisqual = async () => {
        if (curSquad._id === 'allclubs') {
            //toast.current = toast('Сохранение...', { autoClose: false })
            setProgress(true);
            const disqs = [];
            for (let i=0; i< squads.length; i++) {

                if (squads[i]._id !== 'allclubs') {
                    const dis = isQtType ? {
                        count: count ? +count : 0,
                        finishDate: null,
                        playerId: curPlayer._id,
                        squadId: squads[i]._id,
                        tournamentId: squads[i].tournamentId,
                        fictive: fictive,
                        missedMatches: curDisqual.missedMatches,
                        startDate: curDisqual.startDate,
                        isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                        isManual: curDisqual.isManual || false,
                        comment: comment
                    } : {
                        finishDate: count,
                        count: null,
                        playerId: curPlayer._id,
                        squadId: squads[i]._id,
                        tournamentId: squads[i].tournamentId,
                        fictive: fictive,
                        missedMatches: curDisqual.missedMatches,
                        startDate: curDisqual.startDate,
                        isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                        isManual: curDisqual.isManual || false,
                        comment: comment
                    }
                    const indx = disqualsData && disqualsData.length ? disqualsData.findIndex(item => item.playerId.toString() === dis.playerId.toString() && item.squadId.toString() === dis.squadId.toString() && item.tournamentId.toString() === dis.tournamentId.toString()): -1;

                    if (indx > -1) {
                        dis._id = disqualsData[indx]._id ? disqualsData[indx]._id : null;
                        if (dis._id && isDiscActive(disqualsData[indx])) {
                            const submit = await service.updDisqual(dis);
                            if(submit) {
                                disqs.push({...dis, squad: squads[i], club: squads[i].club, player: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                                //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Успешно сохранено!', autoClose: 2500})
                            }
                        } else {
                            const respn = await service.saveDisqual(dis);
                            disqs.push({...dis, _id: respn._id, squad: squads[i], club: squads[i].club, player: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                        }
                    } else {
                        const resp = await service.saveDisqual(dis);
                        disqs.push({...dis, _id: resp._id, club: squads[i].club, player: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                    }

                    setProgress(false)
                    //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => 'Успешно сохранено!', autoClose: 250})
                }
            }
            patchDisqual(disqs, false);
            exitDisqual();
        } else {
            const disq = isQtType ? {
                count: count ? +count : 0,
                finishDate: null,
                playerId: curPlayer._id,
                squadId: curSquad._id,
                tournamentId: curTournament._id,
                fictive: fictive,
                missedMatches: curDisqual.missedMatches,
                startDate: curDisqual.startDate,
                _id: curDisqual._id || null,
                isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                isManual: curDisqual.isManual || false,
                comment: comment
            } : {
                finishDate: count,
                count: null,
                playerId: curPlayer._id,
                squadId: curSquad._id,
                tournamentId: curTournament._id,
                fictive: fictive,
                missedMatches: curDisqual.missedMatches,
                startDate: curDisqual.startDate,
                isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                isManual: curDisqual.isManual || false,
                comment: comment,
                _id: curDisqual._id || null
            }

            setProgress(true);
            //toastId.current = toast('Сохранение...', { autoClose: false })

            if (!disq._id) {
                const indx = disqualsData && disqualsData.length ? disqualsData.findIndex(item => item.playerId.toString() === disq.playerId.toString() && item.squadId.toString() === disq.squadId.toString() && item.tournamentId.toString() === disq.tournamentId.toString()): -1;
                if (indx > -1 && isDiscActive(disqualsData[indx])) {
                    disq._id = disqualsData[indx]._id ? disqualsData[indx]._id : null;
                } else {
                    disq._id = null;
                }
            }

            if (!disq._id) {
                const resp = await service.saveDisqual(disq);
                //disqs.push({...disq, _id: resp._id, club: squads[i].club, player: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                setProgress(false)
                setCurDisqual({...disq, _id: resp._id,squad: curSquad, club: curSquad.club, player: curPlayer, tournament: curTournament, team: curSquad.team});

                patchDisqual({...disq, _id: resp._id, squad: curSquad, club: curSquad.club, player: curPlayer, tournament: curTournament, team: curSquad.team});

                //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Успешно сохранено!', autoClose: 2500})

            } else {
                const submit = await service.updDisqual(disq);
                if(submit) {
                    setProgress(false)
                    setCurDisqual({...curDisqual,...disq, squad: curSquad, club: curSquad.club, player: curPlayer, tournament: curTournament, team: curSquad.team});
                    patchDisqual({...curDisqual,...disq, squad: curSquad, club: curSquad.club, player: curPlayer, tournament: curTournament, team: curSquad.team});

                //    toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => 'Успешно сохранено!', autoClose: 2500})
                }
            }
        }
    }

    return <div className="modal">
        <ConfirmDialog />
        <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className='disqual-control'>
                <div className={'modal-background'}>
                    <div className='disqual-player' >
                        {curDisqual._id ? null : <InputText
                            type='text'
                            value={playerInfo}
                            onChange={e =>  setPlayerInfo(e.target.value)}
                            placeholder='Введите ФИО игрока'
                            autoComplete='off'
                        />}

                        {players.length || curPlayer ? <Dropdown
                            id='player'
                            onChange={e => {
                                setCurPlayer(e.value)
                                setPlayerInfo('')
                            }}
                            value={curPlayer}
                            options={players}
                            placeholder='-- выберите игрока'
                            optionLabel="surname"
                            optionValue="_id"
                        /> : null }

                        {squads.length || curSquad ? <div className='disqual-squad' >
                        {/*<CustomScrollbars autoHeight autoHeightMin='calc(100vh - 760px)' >*/}
                             <Dropdown id='squads'
                                 onChange={e => setCurSquad(e.value)}
                                 value={curSquad  && curSquad.club ? curSquad.club.name : curSquad && curSquad.team ? curSquad.team.name : curDisqual.club ? curDisqual.club.name : curDisqual.team ? curDisqual.team.name : 'Клуб не выбран'}
                                 options={squads}
                                 placeholder='-- выберите клуб'
                                 optionLabel="name"
                                 optionValue="_id"
                             />
                            </div> : null}
                    </div>

                    {isQtType ? (
                        <InputText
                            type='number'
                            value={count}
                            onChange={e => setCount( e.target.value ? isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value) : e.target.value)} />
                        ) :
                        <InputText
                            type='date'
                            value={moment(count, 'YY-MM-DD').format('YYYY-MM-DD')}
                            onChange={e =>  setCount(moment(e.target.value, 'YYYY-MM-DD').format('YY-MM-DD'))}
                            placeholder="Укажите продолжительность дисквалификации в формате YY-MM-DD"
                        />}

                    <InputText
                        type='text'
                        value={comment || ''}
                        placeholder='Комментарий'
                        onChange={e => setComment( e.target.value )}
                        s
                    />
                    <div>
                        <Checkbox
                        id='isQtType'
                        name='isQtType'
                        checked={isQtType}
                        onChange={e => setIsQtType(!isQtType)} />
                        <label htmlFor='isQtType' className='p-checkbox-label'>Матчевая дисквалификация</label>
                    </div>
                    <div>
                        <Checkbox
                        id='fictive'
                        name='fictive'
                        checked={fictive}
                        onChange={e => setFictive(!fictive)} />
                        <label htmlFor='fictive' className='p-checkbox-label'>Условная дисквалификация</label>
                    </div>

                    {curDisqual.isRedCard ? (
                        <div>
                            <Checkbox
                            id='isRedCardCheck'
                            name='isRedCardCheck'
                            checked={isRedCardCheck}
                            onChange={e => setIsRedCardCheck(!isRedCardCheck)} />
                            <label htmlFor='isRedCardCheck' className='p-checkbox-label'>Красная проверена</label>
                        </div>
                    ) : null}

                    {/*<Button theme='success' onClick={() => addDay()} style={{marginRight: '.5rem'}}>Добавить день</Button>*/}
                </div>
                <div className="action">
                    <Button
                        theme='light'
                        disabled={progress}
                        onClick={exitDisqual}
                        style={{marginRight: '.5rem'}}
                    >К списку</Button>
                    <Button
                        theme='primary'
                        disabled={(curSquad && curSquad._id === 'allclubs') ?  false : (curSquad && curPlayer && curTournament && needSaving) ? false : true }
                        onClick={() => submitDisqual()}
                    >Сохранить</Button>
                    {isActive && curDisqual._id ? <Button
                        disabled={!curDisqual._id}
                        size='sm'
                        theme='danger'
                        onClick={() => removeDisqual(curDisqual)}
                    >Отменить дисквалификацию</Button> : null}
                </div>
            </div>
        </div>
    </div>
}
export default DisqualForm

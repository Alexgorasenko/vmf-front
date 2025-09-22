import React, { useState, useEffect, useRef } from 'react'

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import service from './service'

import CustomScrollbars from 'react-custom-scrollbars-2';

import {RadioButton} from "primereact/radiobutton";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {InputSwitch} from "primereact/inputswitch";
import {InputNumber} from "primereact/inputnumber";
import {Tag} from "primereact/tag";
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ConfirmDialog } from 'primereact/confirmdialog'; // To use <ConfirmDialog> tag
import { confirmDialog } from 'primereact/confirmdialog'; // To use confirmDialog method
import { debounce } from 'throttle-debounce';

const options = {
    headers: {
        authorization: localStorage.getItem('_amateum_subject_tkn'),
        SignedBy: localStorage.getItem('_amateum_tkn')
    }
}

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
    //console.log('isDiscActive', item);
    let res = true;

    if ( item['count'] !== 'undefined' && item['count'] !== null && !isNaN(+item.count)) {
        if (+item.count === 0) {
            res = false
        } else if (item.missedMatches && (+item.count - item.missedMatches.length === 0)) {
            res = false
        }
    } else if (item.finishDate && moment(item.finishDate, 'YY-MM-DD').add(1, 'days').utc(true).unix() < moment().unix()) {
        res = false
    } else if (item.finished) {
        res = false
    }

    //console.log('isDiscActive res',item, res);
    return res
}
const DisqualForm = ({ disqual, curTournament, toast, disqualsData, patchDisqual, removeDisqual, cleareGlobal, exitDisqual, fid, isActive}) => {
    const [curDisqual, setCurDisqual] = useState(disqual || {...initDisqual, tournamentId: curTournament ? curTournament._id : null, tournament: curTournament || null});
    const [curPlayer, setCurPlayer] = useState(disqual.player || disqual.headquarter || null);
    const [count, setCount] = useState(disqual.count ? +disqual.count : disqual.finishDate ? disqual.finishDate : 0);

    const [players, setPlayers] = useState([]);
    const [playerInfo, setPlayerInfo] = useState('');
    const [debQuery, setDebQuery] = useState('');
    const [squads, setSquads] = useState([]);
    const [curSquad, setCurSquad] = useState(disqual.squad || null);
    const [fictive, setFictive] = useState(disqual.fictive ? disqual.fictive : false);
    const [globalDisqTill, setGlobalDisqTill] = useState(disqual.globalDisqTill ? disqual.globalDisqTill : false);

    const [progress, setProgress] = useState(false)
    const [isQtType, setIsQtType] = useState(disqual.count ? true : disqual.finishDate ? false : true)
    const [needSaving, setNeedSaving] = useState(false);
    const [isRedCardCheck, setIsRedCardCheck] = useState(false);
    const [comment, setComment] = useState(disqual.comment || null);
    const [matchedSquadFlag, setMatchedSquadFlag] = useState(disqual.squad ? true : null);
    const [isHeadsDisqual, setIsHeadsDisqual] = useState(!!disqual.headquarter);

    const getPlayersSquads  = async (fid, playerId) => {
        //запрос к скваду
        const _squads = await service.playerSquads(fid, curPlayer._id, isHeadsDisqual)
        const options = [..._squads.map(s => ({...s, team: {...s.team, name: `${s.team.name} (${s.tournament ? [s.tournament.name, s.tournament.appendMarker].filter(c => c).join(',') : ''})`}})), {_id: 'allclubs', team: {name: 'Для всех заявок'}}]
        setSquads(options)
        const matched = options.find(o => o.tournament && curTournament && o.tournament._id === curTournament._id)
        if(matched && !matchedSquadFlag) {
            setCurSquad(matched)
            setMatchedSquadFlag(true)
        }
    }

    useEffect(() => {
        const upd = disqual ? {...disqual} : {}
        if (curTournament) {
            upd.tournament = curTournament;
            upd.tournamentId = curTournament._id;
        }
        if (curPlayer) {
            if (isHeadsDisqual) {
                upd.headquarter = curPlayer;
                upd.headquarterId = curPlayer._id;
            } else {
                upd.player = curPlayer;
                upd.playerId = curPlayer._id;
            }
            setPlayers([curPlayer])
        }
        if (curSquad) {
            upd.squad = curSquad;
            upd.squadId = curSquad._id;
        }

        setCurDisqual({...curDisqual, ...upd});

        if (curPlayer && fid) {
            getPlayersSquads(fid, curPlayer._id)
        }
    }, [curPlayer, curTournament, curSquad, disqual])

    const getPlayers = (playerInfo) => {
        setPlayers([])
        const plrsQuery = isHeadsDisqual ? `${ENDPOINT}v2/suggestPlayer?query=${playerInfo}&disqual=1&key=headquarters${curTournament ? '&tournamentId='+curTournament._id : ''}` : `${ENDPOINT}v2/suggestPlayer?query=${playerInfo}&disqual=1${curTournament ? '&tournamentId='+curTournament._id : ''}`
        axios.get(plrsQuery, options)
            .then( _feed => {
                const mapd = _feed.data.map(p => ({...p, fio: `${p.surname} ${p.name}${p.teams && p.teams.length ? ' ('+p.teams[0].name+')': ''}`}));
                setPlayers(curPlayer ? [curPlayer, ...mapd] : mapd)
                setProgress(false)
            })
            .catch(err => {setProgress(false); console.log('get plrs list faild', err)})
    }

    const waitingEndWrite = (str) => {
        if (!progress) {
            //console.log('waitingEndWrite', str);
            setProgress(true);
            getPlayers(str)
        }
    }

    useEffect(() => {
        if (playerInfo && playerInfo.length > 3) {
            const setQuery = debounce(500, playerInfo => setDebQuery(playerInfo));
            setQuery(playerInfo)
        } else {
            if (curPlayer) {
                setPlayers([curPlayer]);
            } else {
                setPlayers([]);
            }
        }

    }, [playerInfo])

    useEffect(() => {
        if (debQuery && debQuery.length > 3) {
            waitingEndWrite(debQuery)
        } else {
            if (curPlayer) {
                setPlayers([curPlayer]);
            } else {
                setPlayers([]);
            }
        }
    }, [debQuery])

    useEffect(() => {
        let hasChanges = false;
        if (disqual && disqual._id) {
            //console.log('needSaving', disqual, count, comment, fictive);
            if (curSquad && count) {
                if (((disqual.count && disqual.count !== count) ||
                (disqual.finishDate && disqual.finishDate !== count)) ||
                disqual.fictive !== fictive ||
                (disqual.comment && disqual.comment !== comment) ||
                (!disqual.comment && comment) ||
                (!disqual.globalDisqTill && globalDisqTill)||
                (disqual.globalDisqTill && !globalDisqTill)) {
                    hasChanges = true
                }
            }
        } else {
            hasChanges = true
        }
        //console.log('hasChanges', hasChanges);
        setNeedSaving(hasChanges)
    }, [disqual, count, comment, fictive, isQtType, globalDisqTill])

    //const toast = useRef(null)

    const updDisqual = ({target}) => {
        setCurDisqual({...curDisqual, [target.name]: target.value})
    }
    const getPatch = (form, disqual) => {
        const patch = {_id: form._id}
        const keys = ['count','finishDate', 'fictive', 'isRedCardCheck', 'comment', 'globalDisqTill'];
        for (let key of keys) {
            if (disqual[key] !== form[key] ) {
                patch[key] = form[key]
            }
        }
        return patch;
    }

    const submitDisqual = async () => {
        const memberKey = isHeadsDisqual ? 'headquarter' : 'player'
//console.log('curSquad', curSquad, memberKey);
        if (!curSquad || curSquad._id === 'allclubs') {
            //toast.current = toast('Сохранение...', { autoClose: false })
            setProgress(true);
            const disqs = [];
            for (let i=0; i< squads.length; i++) {

                if (squads[i]._id !== 'allclubs') {

                    const dis = {
                        finishDate: null,
                        count: null,
                        [`${memberKey}Id`]: curPlayer._id,
                        squadId: squads[i]._id,
                        tournamentId: squads[i].tournamentId,
                        fictive: fictive,
                        globalDisqTill: globalDisqTill,
                        missedMatches: curDisqual.missedMatches,
                        startDate: curDisqual.startDate,
                        isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                        isManual: curDisqual.isManual || false,
                        comment: comment
                    }

                    if (isQtType) {
                        dis.count = count ? +count : 0;
                    } else {
                        dis.finishDate = count.includes('-') ? count.split('-')[0].length === 4 ? count.slice(2) : count : null;
                    }
                    if (globalDisqTill) {
                        dis.globalDisqTill = globalDisqTill;
                    }
                    const indx = disqualsData && disqualsData.length ? disqualsData.findIndex(item =>item[`${memberKey}Id`] && dis[`${memberKey}Id`] && item[`${memberKey}Id`].toString() === dis[`${memberKey}Id`].toString() && item.squadId.toString() === dis.squadId.toString() && item.tournamentId.toString() === dis.tournamentId.toString()) : -1;

                    if (indx > -1) {
                        dis._id = disqualsData[indx]._id ? disqualsData[indx]._id : null;
                        if (dis._id && isDiscActive(disqualsData[indx])) {
                            const submit = await service.sendDisq(dis, toast);
                            if(submit) {
                                disqs.push({...dis, squad: squads[i], club: squads[i].club, [memberKey]: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                                //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Успешно сохранено!', autoClose: 2500})
                            }
                        } else {
                            const respn = await service.sendDisq(dis, toast);
                            disqs.push({...dis, _id: respn._id, squad: squads[i], club: squads[i].club, [memberKey]: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                        }
                    } else {
                        const resp = await service.sendDisq(dis, toast);
                        disqs.push({...dis, _id: resp ? resp._id : null, club: squads[i].club, [memberKey]: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                    }

                    setProgress(false)
                    //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => 'Успешно сохранено!', autoClose: 250})
                }
            }
            patchDisqual(disqs, false);
            exitDisqual();
        } else {
            const disq = {
                count: null,
                finishDate: null,
                [`${memberKey}Id`]: curPlayer._id,
                squadId: curSquad._id,
                tournamentId: curTournament._id,
                fictive: fictive,
                missedMatches: curDisqual.missedMatches,
                startDate: curDisqual.startDate,
                isRedCard: curDisqual.isRedCard ? !isRedCardCheck : false,
                isManual: curDisqual.isManual || false,
                comment: comment
            }
            // if (curDisqual && curDisqual._id) {
            //     disq._id = curDisqual._id
            // }
            if (isQtType) {
                disq.count = count ? +count : 0;
            } else {
                disq.finishDate = count.includes('-') ? count.split('-')[0].length === 4 ? count.slice(2) : count : null;
            }
            if (globalDisqTill) {
                disq.globalDisqTill = globalDisqTill;
            }
            setProgress(true);
            //toastId.current = toast('Сохранение...', { autoClose: false })

            if (!disq._id) {
                const indx = disqualsData && disqualsData.length ? disqualsData.findIndex(item => item[`${memberKey}Id`] && disq[`${memberKey}Id`] && item[`${memberKey}Id`].toString() === disq[`${memberKey}Id`].toString() && item.squadId.toString() === disq.squadId.toString() && item.tournamentId.toString() === disq.tournamentId.toString() && isDiscActive(item)): -1;
                //console.log('index', indx);
                //console.log('disqualsData', disqualsData, disq, indx);

                if (indx > -1) {
                    disq._id = disqualsData[indx]._id || null;
                }
            }

            if (!disq._id) {
                const resp = await service.sendDisq(disq, toast);
                //disqs.push({...disq, _id: resp._id, club: squads[i].club, player: curPlayer, tournament: squads[i].tournament, team: squads[i].team});
                setProgress(false)
                if (resp && resp._id) {
                    const disqRes = {...disq, _id: resp._id,squad: curSquad, club: curSquad.club, [memberKey]: curPlayer, tournament: curTournament, team: curSquad.team};

                    setCurDisqual(disqRes);

                    patchDisqual(disqRes);
                }

                //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Успешно сохранено!', autoClose: 2500})

            } else {
                const patch = getPatch(disq, disqual);

                if (Object.keys(patch).length > 1) {
                    const submit = await service.sendDisq(patch, toast);
                    if(submit) {
                        setProgress(false)
                        setCurDisqual({...curDisqual,...disq, squad: curSquad, club: curSquad.club,  [memberKey]: curPlayer, tournament: curTournament, team: curSquad.team});
                        patchDisqual({...curDisqual,...disq, squad: curSquad, club: curSquad.club,  [memberKey]: curPlayer, tournament: curTournament, team: curSquad.team});
                    }
                } else{
                    console.log('not have change', patch);
                }
            }
        }
        setProgress(false);
        exitDisqual();
    }

    return <div className="disqual-modal">
        <ConfirmDialog />
        <div className="disqual-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className='disqual-control'>
                <div className={'modal-background'}>
                    <div className='disqual-player' >
                        {curDisqual._id ? null : (
                            <div className={'name-input'}>
                                <span className="p-input-icon-right">
                                    {progress ? <i className="pi pi-spin pi-spinner" /> : null}
                                    <InputText
                                    className={'input'}
                                    value={playerInfo}
                                    onChange={(e) => setPlayerInfo(e.target.value)}
                                    placeholder={isHeadsDisqual ? 'Введите ФИО представителя штаба' : 'Введите ФИО игрока'}
                                    autoComplete='off' />
                                </span>
                            </div>
                            )}
                        {curDisqual._id ? null : <div
                            className={'switch-obj'}
                            style={{ marginBottom: '0'}}
                        >
                            <InputSwitch
                                checked={isHeadsDisqual}
                                onChange={e => {
                                    setIsHeadsDisqual(!isHeadsDisqual)
                                }}
                                name='isHeadsDisqual'
                                disabled={!isActive}
                            />
                            <div
                                className={'text'}
                                onClick={ () => setIsHeadsDisqual(!isHeadsDisqual)}
                                style={{whiteSpace: 'nowrap', marginLeft: '0.5rem', cursor: 'pointer'}}
                            >Поиск по админ штабу</div>
                        </div>}

                        {curDisqual._id ? curPlayer ? <div>{curPlayer.fio}</div> : <div>{isHeadsDisqual ? 'представитель штаба не найден' : 'игрок не найден'}</div> : players.length || curPlayer ? <Dropdown
                            onChange={e => {
                                setCurPlayer(e.value)
                                setPlayerInfo('')
                            }}
                            value={curPlayer}
                            options={players}
                            placeholder={isHeadsDisqual ? '-- выберите игрока представителя штаба' : '-- выберите игрока'}
                            optionLabel="fio"
                            //optionValue="_id"
                        /> : null }

                        {curDisqual._id ? curSquad ? <div>Команда: {curSquad && curSquad.team ? curSquad.team.name : 'не указана'}</div> : <div>клуб не найден</div> : squads.length || curSquad ? <div className='disqual-squad' >
                        {/*<CustomScrollbars autoHeight autoHeightMin='calc(100vh - 760px)' >*/}
                             <Dropdown id='squads'
                                 onChange={e => setCurSquad(e.value)}
                                 value={curSquad}
                                 options={squads}
                                 placeholder='для всех заявок'
                                 optionLabel="team.name"
                                 //optionValue="_id"
                             />
                            </div> : null}
                    </div>
                    {isQtType ? (
                        <p className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>количество матчей</span>
                            <InputNumber
                                inputId="count"
                                value={count}
                                onValueChange={e => setCount( e.target.value ? isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value) : e.target.value)}
                                disabled={!isActive}
                            />
                        </p>
                    ) : (
                        <div className={'switch-obj'}>
                            <label htmlFor="count" style={{marginRight: '0.5rem'}}>действительна до</label>

                            <InputText
                                inputId='count'
                                disabled={!isActive}
                                type='date'
                                value={isNaN(+count) ? moment(count, 'YY-MM-DD').format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')}
                                onChange={e =>  setCount(moment(e.target.value, 'YYYY-MM-DD').format('YY-MM-DD'))}
                                placeholder="продолжительность дисквалификации"
                            />
                        </div>
                    )}

                    <div
                        className={'switch-obj'}

                    >
                        <InputSwitch
                            checked={isQtType}
                            onChange={e => {
                                setIsQtType(!isQtType)
                                setCount(isQtType ? moment().format('YY-MM-DD') : 2)
                                if (!isQtType) {
                                    setGlobalDisqTill(null)
                                }
                            }}
                            name='isQtType'
                            disabled={!isActive}
                        />
                        <div
                            className={'text'}
                            onClick={ () => {
                                if (isActive) {
                                    setIsQtType(!isQtType)
                                    if (!isQtType) {
                                        setCount(2)
                                        setGlobalDisqTill(null)
                                    }
                                }
                            }}
                            style={{whiteSpace: 'nowrap', marginLeft: '0.5rem', cursor: 'pointer'}}
                        >Матчевая</div>
                    </div>

                    <div
                        className={'switch-obj'}

                    >
                        <InputSwitch
                            checked={fictive}
                            onChange={e => setFictive(!fictive)}
                            name='fictive'
                            disabled={!isActive}
                        />
                        <div
                            onClick={ () => isActive ? setFictive(!fictive) : null}
                            className={'text'}
                            style={{whiteSpace: 'nowrap', marginLeft: '0.5rem', cursor: 'pointer'}}
                        >Условная</div>
                    </div>

                    <div
                        className={'switch-obj'}

                    >
                        <InputSwitch
                            checked={globalDisqTill}
                            onChange={e => {
                                setIsQtType(false)
                                setCount(moment().format('YY-MM-DD'))
                                setGlobalDisqTill(!globalDisqTill)
                            }}
                            name='globalDisqTill'
                            disabled={!isActive}
                        />
                        <div
                            onClick={ () => {
                                if (isQtType) {
                                    setIsQtType(false)
                                    setCount(moment().format('YY-MM-DD'))
                                }
                                if (globalDisqTill) {
                                    setGlobalDisqTill(!globalDisqTill)
                                }  else {
                                    setGlobalDisqTill(true)
                                }
                            }}
                            className={'text'}
                            style={{whiteSpace: 'nowrap', marginLeft: '0.5rem', cursor: 'pointer'}}
                        >Глобальная дисквалификация</div>
                    </div>
                    {curDisqual && curDisqual.globalDisqTill ? <div className="button-group" style={{margin: '0 auto 0.5rem', alignSelf: "center" }}>
                        <Button
                            theme='light'
                            disabled={progress}
                            onClick={() => cleareGlobal(curDisqual)}

                            icon={'pi pi-fw pi-lock-open'}
                            label="Снять глобально"
                            className="p-button-outlined btn-save p-button-sm"
                        />
                    </div> : null }
                    {/*{curDisqual.isRedCard ? <div
                        className={'switch-obj'}
                    >
                        <InputSwitch
                            checked={isRedCardCheck}
                            onChange={e => setIsRedCardCheck(!isRedCardCheck)}
                            name='isRedCardCheck'
                            disabled={!isActive}
                        />
                        <div
                            onClick={ () => isActive ? setIsRedCardCheck(!isRedCardCheck) : null}
                            className={'text'}
                            style={{whiteSpace: 'nowrap', marginLeft: '0.5rem', cursor: 'pointer'}}
                        >Красная проверена</div>
                    </div> : null}*/}

                    <InputText
                        type='text'
                        value={comment || ''}
                        placeholder='Комментарий'
                        onChange={e => setComment( e.target.value )}
                        style={{width: '100%'}}
                        disabled={!isActive}
                    />
                    {/*<Button theme='success' onClick={() => addDay()} style={{marginRight: '.5rem'}}>Добавить день</Button>*/}
                    <div className="button-group">
                        <Button
                            theme='light'
                            disabled={progress}
                            onClick={exitDisqual}
                            style={{marginRight: '.5rem'}}
                            icon={'pi pi-fw pi-arrow-left'}
                            label="Закрыть"
                            className="p-button-outlined btn-default p-button-sm"
                        />
                        {isActive ? <Button
                            icon={'pi pi-fw pi-check'}
                            label="Сохранить"
                            className="p-button-outlined btn-save p-button-sm"
                            disabled={!(curPlayer && curTournament && needSaving)}
                            onClick={() => submitDisqual()}
                            style={{marginRight: '.5rem'}}
                        /> : null}
                        {isActive && curDisqual._id ? <Button
                            icon={'pi pi-fw pi-lock-open'}
                            label="Завершить"
                            className="p-button-outlined btn-default p-button-sm"
                            disabled={!curDisqual._id}
                            size='sm'
                            theme='danger'
                            onClick={() => removeDisqual(curDisqual)}
                        /> : null}
                    </div>
                </div>

            </div>
        </div>
    </div>
}
export default DisqualForm

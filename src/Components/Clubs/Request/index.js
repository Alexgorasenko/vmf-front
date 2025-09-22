import React, { useEffect, useState, useRef, useCallback } from "react";

import './style.scss'
import {Button} from "primereact/button";
import {Timeline} from "primereact/timeline";
import { Menu } from 'primereact/menu'
import { Tag } from 'primereact/tag'

import PlayerIcon from '../../../assets/img/image 14.svg'
import BdayIcon from '../../../assets/img/image 18.svg'
import KitIcon from '../../../assets/img/image 13.svg'
import emblem from "../../Emblem";
import axios from "axios";
import {InputText} from "primereact/inputtext";
import {useHistory} from "react-router-dom";
import qs from "qs";
import moment from 'moment';
import CustomScrollbars from 'react-custom-scrollbars-2'
import InputMask from 'react-input-mask'
import { v4 as uuidv4 } from 'uuid'
import { validate as uuidValidate } from 'uuid'

import { ENDPOINT } from '../../../env'
import {ProgressSpinner} from "primereact/progressspinner";
import {Toast} from "primereact/toast";
import Hotkeys from "react-hot-keys";
import debounce from 'lodash.debounce';

import Headquarters from './Headquarters'
import {ConfirmDialog, confirmDialog} from "primereact/confirmdialog";

const Request = ({ team, setVisibleRight, manage=false }) => {
    const history = useHistory()
    const [mode, setMode] = useState('initial')

    const [check, setCheck] = useState(0)
    const [playersCheck, setPlayersCheck] = useState([])

    const [rawPlayers, setRawPlayers] = useState(null)
    const [rawHeadquarters, setRawHeadquarters] = useState(null)
    const [data, setData] = useState({players:[], headquarters: []})
    const [query, setQuery] = useState(null)
    const [suggesting, setSuggesting] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [playerForm, setPlayerForm] = useState({})
    const [inputFocused, setInputFocused] = useState(false)

    const [loading, setLoading] = useState(false)
    const [blockSend, setBlockSend] = useState(false)

    const [subjectMode, setSubjectMode] = useState('players')

    const toastRef = useRef()

    const getSquad = () => {
        axios.get(`${ENDPOINT}v2/teamsquad/${team._id}${history.location.search}`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(
            resp => {
                if (resp.data) {
                    setData(resp.data)  //полный объект с которым работаем
                    setRawPlayers(resp.data.players.sort(
                        (p1, p2) => p1.squadState.unlinked < p2.squadState.unlinked ? 1 :
                                (p1.squadState.unlinked === p2.squadState.unlinked ? (p1.surname > p2.surname ? 1 : -1) :
                                        (p2.squadState.unlinked ? -1 : 1))
                    )) //сырой инит-массив с игроками
                    setRawHeadquarters(resp.data.headquarters.sort((p1, p2) => p1.surname > p2.surname ? 1 : -1))
                    setMode(resp.data._id /*|| resp.data.players.length*/ ? 'update' : 'initial') //режим по-умолчанию достаточно установить здесь
                    setLoading(true)
                }
            }
        )
    }

    useEffect(() => {
        getSquad()
    }, [])

    useEffect(() => {
        let copy = playersCheck
        const searchString = qs.parse(window.location.search.replace('?',''))
        data.players.map(player => {
            axios.get(`${ENDPOINT}v2/checkPlayerPresence/${player._id}?teamId=${team._id}&tournamentId=${searchString.tournamentId}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(
                resp => {
                    if (resp.data !== null) {
                        copy.push({id: player.id})
                    }
                }
            )
        })
        setPlayersCheck(copy)
    }, [check])

    const handleQuery = str => {
        setQuery(str)
        if(str && str.length > 3) {
            if(!suggesting) {
                verifyQuery(str)
            }
        } else {
            setSuggesting(false)
            setSuggestions([])
        }
    }

    const verifyQuery = useCallback(
        debounce(q => {
            setSuggesting(true)
            const queryString = q.trim()

            axios.get(`${ENDPOINT}v2/suggestPlayer?query=${encodeURIComponent(queryString)}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setSuggesting(false)
                setSuggestions(resp.data
                    .filter(p => p._id && !data.players.find(s => s._id && s._id.toString() === p._id.toString()))
                    .map(p => {
                        return {
                            ...p,
                            teams: p.teams.map(t => {
                                const activeSquad = p.squads && p.squads.actived ? p.squads.actived.find(sqd => sqd.teamId === t._id) : null
                                return {
                                    ...t,
                                    isActive: activeSquad ? activeSquad.tournament.name : null
                                }
                            })
                        }
                    })
                )
            })
        }, 800),
        []
    )

    const sendData = async () => {
        if (!blockSend){
            setBlockSend(true)
            const searchString = qs.parse(window.location.search.replace('?',''))
            const requestBody = {
                mode: mode,
                manage: manage,
                teamId: team._id,
                tournamentId: data.tournamentId || searchString.tournamentId,
                squadId: data ? data._id : null,
                players: mode === 'update' ? {
                    added: data.players.filter(p => uuidValidate(p.id)),
                    unlinked: data.players.filter(p => {
                        const raw = rawPlayers.find(_p => _p._id === p._id)
                        return (raw && !raw.squadState.unlinked && p.squadState.unlinked)
                    }),
                    updated: data.players.filter(p => {
                        const raw = rawPlayers.find(_p => _p._id === p._id)
                        return (raw && p.squadState && (
                            (raw.squadState.number !== p.squadState.number) || (raw.squadState.unlinked && !p.squadState.unlinked)
                        ) && !uuidValidate(p.id))
                    })
                } : data.players,
                headquarters: mode === 'update' ? {
                    added: data.headquarters.filter(p => uuidValidate(p.id)),
                    unlinked: data.headquarters.filter(p => {
                        const raw = rawHeadquarters && rawHeadquarters.length ? rawHeadquarters.find(_p => _p._id === p._id) : null
                        return (raw && !raw.squadState.unlinked && p.squadState.unlinked)
                        //return false
                    }),
                    updated: data.headquarters.filter(p => {
                        const raw = rawHeadquarters && rawHeadquarters.length ? rawHeadquarters.find(_p => _p._id === p._id) : null
                        return (raw && p.squadState && raw.squadState.unlinked && !p.squadState.unlinked)
                        //return false
                    })
                } : data.headquaters
            }

            const res = await axios.post(`${ENDPOINT}v2/applyManualSquad`, requestBody, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            })
            setBlockSend(false)
            if (res && res.data && res.data.success) {
                getSquad()
                toastRef.current.show({severity: 'success', message: 'Готово', detail: 'Состав команды сохранён'})
            }
        }
    }

    const formatPlrs = length => {
        const ended = ['', 'а', 'ов'];
        let len = length > 20 ? length % 10 : length;
        let ind = 2;
        if (len === 1) {
            ind = 0
        } else if (len > 1 && len < 5) {
            ind = 1
        }
        return `игрок${ended[ind]}`;
    }

    const formatAction = len => {
        return len > 1 ? 'о' : ''
    }

    const mapQueriesToTimeLine = (queries) => {
        const mapd = [];
        for (let query of queries) {
            const { createdAt, user, handledAt, handler, archived, type, data} = query;
            // if (type === 'season') {
            //     continue
            // }
            const len = type === 'season' ? 0 : type === 'addon' ? data.addon : data;

            const obj = {
                name: `${user.name || ''} ${user.surname || ''}`,
                date: moment(createdAt).format('DD MMM'),
                action: type === 'season' ? `создана` : `добавлен${formatAction(len)} ${len} ${formatPlrs(len)}` ,
                handled: handledAt
            }
            mapd.push(obj)
            if (handledAt) {
                const obj2 = {
                    name: handler ? `${handler.name || ''} ${handler.surname || ''}` : 'нет данных кем',
                    date: moment(handledAt).format('DD MMM'),
                    action: archived ? type === 'season' ? `отклонена` : `отклонен${formatAction(len)} ${len} ${formatPlrs(len)}` : type === 'season' ? `обработана` :`обработан${formatAction(len)} ${len} ${formatPlrs(len)}`,
                    handled: true
                }
                mapd.push(obj2)
            }
        }
        return mapd
    }

    const customizedContent = (item) => {
        return (
            <div className={'timeline-event'}>
                <div className={'date'}>{item.action} {item.date}</div>
                <div className={'name'}>{item.name}</div>
                {item.handled ? null : <div className={'date handled'}>(не обработана)</div>}
            </div>
        );
    };

    const customizedMarker = (item) => {
        return (
            <div className={item.action.includes('отклонен') ? "custom-marker-red" : "custom-marker-blue"}></div>
        );
    };

    const addNewPlayer = () => {
        const {_id, num, name, surname, middlename, birthday, ...body} = playerForm
        const splitted = query.split(' ')

        const added = {
            id: uuidv4(),
            _id: _id || null,
            surname: surname || splitted[0] || '',
            name: name || splitted[1] || '',
            middlename: middlename || splitted[2] || '',
            birthday: birthday || null,
            squadState: {
                number: num || null,
                isRequested: true
            }
        }

        setData({
            ...data,
            players: [added].concat([...data.players])
        })

        setPlayerForm({})
        setQuery('')
        setSuggesting(false)
        setSuggestions([])
    }

    const getManageButton = (player, isFinished) => {
        if(!player._id) {
            if(!player.id) {//новый игрок, ещё не добавлен в основной массив
                return <Button label='Сохранить' disabled={!playerForm.name && (!query || !query.length)} className="p-button-outlined p-button-success" onClick={() => isFinished ? null : addNewPlayer()} />
            } else {//новый игрок, уже добавлен в основной массив с uuidv4
                return <Button label='Удалить' iconPos="right" icon="pi pi-times" className="p-button-outlined p-button-danger" onClick={() => isFinished ? null : deleteCreatedPlayer(player.id)}/>
            }
        } else {
            if(player.squadState) {
                if (player.squadState.isRequested) {//есть в БД, но нет даты заявки
                    return <Button label='Ожидает подтверждения' className="p-button-outlined p-button-warning" />
                } else if (player.squadState.linked && !player.squadState.unlinked) { //есть дата заявки, не отзаявлен
                    return <Button label='Отзаявить' className="p-button-outlined p-button-secondary" onClick={() => isFinished ? null : unlinkedPlayer(player._id)}/>
                } else if(player.squadState.unlinked) { //отзаявлен
                    return [
                        <Button icon="pi pi-trash" className='p-button-outlined p-button-danger' style={{width: '38px'}} onClick={() => isFinished ? null : confirm(player._id)}/>,
                        <Button label={'Отзаявлен ' + moment(player.squadState.unlinked, 'YY-MM-DD').format('DD.MM.YY')} className="p-button-outlined p-button-danger" />,
                        <Button icon="pi pi-refresh" className='p-button-outlined p-button-success' style={{width: '38px'}} onClick={() => isFinished ? null : returnPlayer(player._id)}/>
                    ]
                }
            } else {
                return <Button label='Ожидает подтверждения' className="p-button-outlined p-button-warning" />
            }
        }
    }

    const confirm = (id) => {
        confirmDialog({
            message: 'Это действие нельзя отменить. Вы точно хотите навсегда удалить игрока из заявки?',
            header: 'Внимание!',
            icon: 'pi pi-exclamation-triangle',
            accept: () => deletePlayer(id),
            acceptLabel: 'Да',
            rejectLabel: 'Нет'
        });
    }

    const deleteCreatedPlayer = (id) => {
        let copy = Object.assign([], data)
        copy.players = copy.players.filter(el => el.id !== id)
        setData(copy)
    }

    const unlinkedPlayer = (id) => {
        setData({
            ...data,
            players: data.players.map(p => ((p.id === id) || (p._id === id)) ? ({
                ...p,
                squadState: {
                    ...p.squadState,
                    unlinked: moment().format('YY-MM-DD')
                }
            }) : p)
        })
    }

    const deletePlayer = async (id) => {
        setData({
            ...data,
            players: data.players.filter(p => ((p.id !== id) && (p._id !== id)))
        })
        const requestBody = {mode: 'players', itemId: id, squadId: data._id, manage: false}
        const res = await axios.post(`${ENDPOINT}v2/removeItemFromSquad`, requestBody, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn'),
                signedby: localStorage.getItem('_amateum_tkn')
            }
        })
    }

    const returnPlayer = (id) => {
        setData({
            ...data,
            players: data.players.map(p => ((p.id === id) || (p._id === id)) ? ({
                ...p,
                squadState: {
                    ...p.squadState,
                    unlinked: null
                }
            }) : p)
        })
    }

    const patchPlayer = (player, patch) => {
        if(patch.hasOwnProperty('birthday')){
            const day = patch.birthday[0] + patch.birthday[1]
            const month = patch.birthday[3] + patch.birthday[4]
            const year = patch.birthday[6] + patch.birthday[7] + patch.birthday[8] + patch.birthday[9]
            if (!new RegExp(/(0[1-9]|1[0-2])$/).exec(month)){
                patch.birthday = `${patch.birthday[0]}${patch.birthday[1]}.${patch.birthday[3]}_.${year}`
                if (!new RegExp(/[0-1]$/).exec(month[0])){
                    patch.birthday = `${patch.birthday[0]}${patch.birthday[1]}.__.${year}`
                }
            }
            if (!new RegExp(/^(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/).exec(day)){
                patch.birthday = `${patch.birthday[0]}_.${patch.birthday[3]}${patch.birthday[4]}.${year}`
                if (!new RegExp(/[0-3]$/).exec(day[0])){
                    patch.birthday = `__.${patch.birthday[3]}${patch.birthday[4]}.${year}`
                }
            }
            if (Number(year) > Number(moment().format('YYYY'))){
                patch.birthday = `${patch.birthday[0]}${patch.birthday[1]}.${patch.birthday[3]}${patch.birthday[4]}.${moment().format('YYYY')}`
            }
        }
        if (player._id){
            setData({
                ...data,
                players: data.players.map(p => (p._id === player._id) ? ({
                    ...p,
                    ...patch
                }) : p)
            })
        } else setData({
            ...data,
            players: data.players.map(p => (p.id === player.id) ? ({
                ...p,
                ...patch
            }) : p)
        })
    }

    const inputNumber = (player, value, key='number') => {
        if ((parseInt(value) > 0 && parseInt(value) < 100) || value === '') {
            if (player._id) {
                setData({
                    ...data,
                    players: data.players.map(p => (p._id === player._id) ? ({
                        ...p,
                        squadState: {
                            ...p.squadState,
                            [key]: parseInt(value)
                        }
                    }) : p)
                })
            } else {
                setData({
                    ...data,
                    players: data.players.map(p => (p.id === player.id) ? ({
                        ...p,
                        squadState: {
                            ...p.squadState,
                            [key]: parseInt(value)
                        }
                    }) : p)
                })
            }
        }
    }

    const _fixNumber = (player, value, key='number') => {
        const fixValue = value.indexOf('_') !== -1 ? value.replace('_', '0').split('').sort().join('') : value
        if (player._id){
            setData({
                ...data,
                players: data.players.map(p => (p._id === player._id) ? ({
                    ...p,
                    squadState: {
                        ...p.squadState,
                        [key]: fixValue
                    }
                }) : p)
            })
        } else {
            setData({
                ...data,
                players: data.players.map(p => (p.id === player.id) ? ({
                    ...p,
                    squadState: {
                        ...p.squadState,
                        [key]: fixValue
                    }
                }) : p)
            })
        }
    }

    const fixNumber = (value) => {
        if ((parseInt(value) > 0 && parseInt(value) < 100) || value === '') {
            return parseInt(value)
        }
    }

    const getEmblem = (data) => {
        const emb = data ? data.emblem ? data.emblem : data.club && data.club.emblem ? data.club.emblem : data.club && data.club.origin ? data.club.origin.emblem : null : null
        return emb || (data && data.club ? require('../pennant.png') : '')
    }

    const title = data.tournament ? `${data.tournament.league.name}, ${data.tournament.name}, ${data.tournament.season.name}`: 'нет данных'

    const customDateInput = (value) => {
        const day = value[0] + value[1]
        const month = value[3] + value[4]
        const year = value[6] + value[7] + value[8] + value[9]
        if (!new RegExp(/(0[1-9]|1[0-2])$/).exec(month)){
            value = `${value[0]}${value[1]}.${value[3]}_.${year}`
            if (!new RegExp(/[0-1]$/).exec(month[0])){
                value = `${value[0]}${value[1]}.__.${year}`
            }
        }
        if (!new RegExp(/^(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/).exec(day)){
            value = `${value[0]}_.${value[3]}${value[4]}.${year}`
            if (!new RegExp(/[0-3]$/).exec(day[0])){
                value = `__.${value[3]}${value[4]}.${year}`
            }
        }
        if (Number(year) > Number(moment().format('YYYY'))){
            value = `${value[0]}${value[1]}.${value[3]}${value[4]}.${moment().format('YYYY')}`
        }
        setPlayerForm({...playerForm, birthday: value})
    }
    const isFinished = data && data.tournament && data.tournament.finished;

    const checkDate = (player, value) => {
        const day = value ? (value[0] + value[1]) : '';
        const month = value ? (value[3] + value[4]) : '';
        const year = value ? (value[6] + value[7] + value[8] + value[9]) : '';
        if (!new RegExp(/(0[1-9]|1[0-2])$/).exec(month) || !new RegExp(/^(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/).exec(day) || Number(year) > Number(moment().format('YYYY'))){
            if (player._id){
                setData({
                    ...data,
                    players: data.players.map(p => (p._id === player._id) ? ({
                        ...p,
                        birthday: null
                    }) : p)
                })
            } else if (player.id) {
                setData({
                    ...data,
                    players: data.players.map(p => (p.id === player.id) ? ({
                        ...p,
                        birthday: null
                    }) : p)
                })
            } else setPlayerForm({...playerForm, birthday: null})
        }
    }

    const onKeyDown = (e) => {
        if (e === 'Enter' && !isFinished) {
            addNewPlayer()
        }
    }

    return (
        <div className={'club-request'}>
            <Toast ref={toastRef} position='bottom-right' />
            <div className={'request-info'}>
                <ConfirmDialog />
                {emblem({source: getEmblem((data && data.team) ? data.team : team), backdroped: true, size: 'md'})}
                <i className="pi pi-angle-double-right" style={{'fontSize': '13px'}}></i>
                {emblem({source: getEmblem(data && data.tournament ? data.tournament.league : null), backdroped: true, size: 'md'})}
                <div className={'text'}>Заявка команды <span style={{fontWeight: '600'}}>{team.name}</span> <br/> на участие в {title}</div>
                <div className={'buttons'}>
                    {isFinished ? null : (
                        <div className={'button'} onClick={() => sendData()}>
                            <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-outlined"/>
                            <div className={'button-text'} style={{color: '#1DA750'}}>ОТПРАВИТЬ</div>
                        </div>
                    )}
                    <div className={'button'}>
                        <Button icon="pi pi-times" className="p-button-rounded p-button-secondary p-button-outlined" onClick={() => {history.goBack(); setVisibleRight()}}/>
                        <div className={'button-text'} style={{color: '#282E38'}}>ЗАКРЫТЬ</div>
                    </div>
                </div>
            </div>
            <div className={'content'}>
                <div className='timeline_container'>
                    <CustomScrollbars className='timeline_container__scroll' autoHide autoHeight autoHeightMin='80vh'>
                        <Timeline value={data.queries && data.queries.length ? mapQueriesToTimeLine(data.queries) : []} className={'timeline'} content={customizedContent} marker={customizedMarker}/>
                    </CustomScrollbars>
                </div>
                {/*<Timeline value={data.queries && data.queries.length ? mapQueriesToTimeLine(data.queries) : []} className={'timeline'} content={customizedContent} marker={customizedMarker}/>*/}
                <div className={'editor'}>
                    <div className='subject-switch'>
                        <span className='p-buttonset'>
                            <Button onClick={() => setSubjectMode('players')} className={`p-button-sm${subjectMode === 'players' ? ' active' : ''}`}>Игроки</Button>
                            <Button onClick={() => setSubjectMode('headquaters')} className={`p-button-sm${subjectMode === 'headquaters' ? ' active' : ''}`}>Административный штаб</Button>
                        </span>
                    </div>

                    {subjectMode === 'players' ? [
                        <div className={'text'}>
                            <div>ДАТА РОЖДЕНИЯ</div>
                            <div>ИГР. НОМЕР</div>
                        </div>,
                        <div className={'players'}>
                        {isFinished ? null : <div className={'player new-wrap'}>
                            <Hotkeys
                                keyName="Enter"
                                onKeyDown={(e) => onKeyDown(e)}
                            >
                            <div className={'new-player'}>
                                <div className={'player-name'}>
                                    <div className={'player-icon'}><img src={playerForm && playerForm.avatarUrl ? playerForm.avatarUrl : PlayerIcon} style={{objectFit: 'contain'}}/></div>
                                    <span className="p-input-icon-right">
                                        {suggesting ? <i className="pi pi-spin pi-spinner" /> : null}
                                        <InputText
                                            value={playerForm._id ? [playerForm.surname, playerForm.name, playerForm.middlename].join(' ') : query}
                                            onChange={(e) => handleQuery(e.target.value)}
                                            style={{border: "none", background: 'none', width: '100%', paddingLeft: '0px'}}
                                            disabled={playerForm._id}
                                            placeholder="Новый игрок (ФИО)"
                                            onFocus={() => setInputFocused(true)}
                                            onBlur={() => {
                                                setTimeout(() => {
                                                    if(inputFocused) {
                                                        setInputFocused(false)
                                                    }
                                                }, 500)
                                            }}
                                            onKeyDown={(e) => onKeyDown(e.key)}
                                        />

                                        {playerForm._id ? <i className="pi pi-times-circle" onClick={() => setPlayerForm({})} /> : null}

                                        {suggestions && suggestions.length && inputFocused ? (
                                            <Menu
                                                style={{width: 380, marginLeft: -60, marginTop: 6}}
                                                model={suggestions.map(item => ({
                                                    data: item,
                                                    template: ({ data }) => {
                                                        return  <div className='player-suggestion_item' onClick={() => {
                                                                    setPlayerForm(data)
                                                                    setQuery('')
                                                                }}>
                                                                    <div className={'player-icon'}><img src={data.avatarUrl || PlayerIcon} style={{objectFit: 'contain'}}/></div>
                                                                    <div className='player-suggestion_body'>
                                                                        <div className='name'>{[data.surname, data.name, data.middlename].filter(i => i).join(' ')}</div>
                                                                        <div className='tags'>
                                                                            {data.globalDisqTill ? (
                                                                                <Tag className='danger'>блок до {moment(data.globalDisqTill, 'YY-MM-DD').format('DD.MM.YY')}</Tag>
                                                                            ) : null}
                                                                            <Tag severity='info'>{data.birthday && data.birthday.length ? data.birthday : 'нет даты рождения'}</Tag>
                                                                            {data.teams.reverse().filter(t => t).map(t => (
                                                                                <Tag severity={t.isActive ? 'danger' : ''} key={t._id}>{t.isActive ? 'активная заявка за ' : ''}{t.name}{t.isActive ? ` (${t.isActive})` : ''}</Tag>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }
                                                        }))}
                                                    />
                                        ) : null}
                                    </span>
                                </div>
                            </div>
                            <div className={'bday'}>
                                <div className={'icon'}>
                                    <img src={BdayIcon}/>
                                </div>
                                <InputMask
                                    mask='99.99.9999'
                                    slotChar="mm.dd.yyyy"
                                    value={playerForm.birthday || ''}
                                    onChange={(e) => customDateInput(e.target.value)}
                                    disabled={typeof(playerForm._id) !== 'undefined'}
                                    onBlur={() => {checkDate(playerForm, playerForm.birthday)}}
                                >
                                    {() => (
                                        <InputText
                                            style={{border: "none", background: 'none', width: '110px', paddingLeft: '0px'}}
                                            disabled={typeof(playerForm._id) !== 'undefined'}
                                        />
                                    )}
                                </InputMask>
                            </div>
                            <div className={'number'}>
                                <div className={'icon'}>
                                    <img src={KitIcon}/>
                                </div>
                                <form>
                                    <span className='p-inputnumber p-component p-inputwrapper'>
                                        <input
                                            autoFocus
                                            inputMode='numeric'
                                            type='number'
                                            className='p-inputtext'
                                            value={playerForm.num || ''}
                                            onChange={(e) => setPlayerForm({...playerForm, num: fixNumber(e.target.value)})}
                                            min={1}
                                            max={99}
                                            style={{border: "none", background: 'none', width: '40px', paddingLeft: '0px'}}
                                        />
                                    </span>
                                </form>
                                {/*<InputMask
                                    mask='99'
                                    value={playerForm.num || ''}
                                    onChange={(e) => setPlayerForm({...playerForm, num: e.target.value})}
                                    onBlur={(e) => {
                                        setPlayerForm({...playerForm, num: e.target.value.replace('_', '0').split('').sort().join('')})
                                    }}
                                >
                                    {() => (
                                        <InputText
                                            style={{border: "none", background: 'none', width: '40px', paddingLeft: '0px'}}
                                        />
                                    )}
                                </InputMask>*/}
                            </div>
                            <div className={'manage-button'}>
                                {getManageButton('new')}
                            </div>
                            </Hotkeys>
                        </div>}

                        {loading ?
                            <CustomScrollbars className='request-bars' autoHide autoHeight autoHeightMin='72vh'>
                                {data.players.map((player, i) => {
                                    return <div className={'player'} key={i+1}>
                                        <div className={'player-name'}>
                                            <div className={'player-icon'}><img src={player.avatarUrl || PlayerIcon} style={{objectFit: 'contain'}}/></div>
                                            <InputText
                                                disabled={player._id}
                                                value={(player.surname + ' ' + player.name + ' ' + player.middlename).replace(' null', '')}
                                                onChange={(e) => {
                                                    if (!isFinished) {
                                                        const splitted = e.target.value.split(' ')
                                                        patchPlayer(player, {name: splitted[1], surname: splitted[0], middlename: splitted[2]})
                                                    }
                                                }}
                                                style={{border: "none", background: 'none', width: '22.75vw', paddingLeft: '0px'}}
                                            />
                                            {playersCheck.filter(el => el.id === player._id).length > 0 ? <Button icon="pi pi-exclamation-triangle" className="p-button-rounded p-button-danger p-button-outlined" style={{marginLeft: 'auto', marginRight: '9px', width: '42px', height: '38px'}} aria-label="Cancel" /> : null}
                                            {/*<Tag
                                            className={`isCoach ${player.squadState.isCoach ? 'active' : ''}`}
                                            severity='info'
                                            onClick={() => inputNumber(player, !player.squadState.isCoach, 'isCoach')}
                                            >{player.squadState.isCoach ? 'тренер / представитель' : ' назначить тренером / представителем'}</Tag>*/}
                                        </div>
                                        <div className={'bday'}>
                                            <div className={'icon'}>
                                                <img src={BdayIcon}/>
                                            </div>
                                            <InputMask
                                                mask='99.99.9999'
                                                value={player.birthday || ''}
                                                onChange={(e) => isFinished ? null : patchPlayer(player, {birthday: e.target.value})}
                                                onBlur={() => {checkDate(player, player.birthday)}}
                                            >
                                                {() => (
                                                    <InputText style={{border: "none", background: 'none', width: '110px', paddingLeft: '0px'}} />
                                                )}
                                            </InputMask>
                                        </div>
                                        <div className={'number'}>
                                            <div className={'icon'}>
                                                <img src={KitIcon}/>
                                            </div>
                                            <form>
                                                <span className='p-inputnumber p-component p-inputwrapper'>
                                                    <input
                                                        autoFocus
                                                        inputMode='numeric'
                                                        type='number'
                                                        className='p-inputtext'
                                                        value={player.squadState.number || ''}
                                                        onChange={(e) => isFinished ? null : inputNumber(player, e.target.value)}
                                                        min={1}
                                                        max={99}
                                                        style={{border: "none", background: 'none', width: '40px', paddingLeft: '0px'}}
                                                    />
                                                </span>
                                            </form>
                                            {/*<InputMask
                                                mask='99'
                                                value={player.squadState.number || ''}
                                                onChange={(e) => isFinished ? null : inputNumber(player, e.target.value)}
                                                disabled={typeof(playerForm._id) !== 'undefined'}
                                                onBlur={(e) => {
                                                    fixNumber(player, e.target.value)
                                                }}
                                            >
                                                {() => (
                                                    <InputText
                                                        style={{border: "none", background: 'none', width: '40px', paddingLeft: '0px'}}
                                                    />
                                                )}
                                            </InputMask>*/}
                                        </div>
                                        <div className={'manage-button'}>
                                            {getManageButton(player, isFinished)}
                                        </div>
                                    </div>
                                })}
                            </CustomScrollbars>
                            :
                            <ProgressSpinner animationDuration='1s'/>
                        }

                        </div>
                    ] : (
                        <Headquarters
                            data={data.headquarters}
                            setter={arr => setData({...data, headquarters: [...arr]})}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Request

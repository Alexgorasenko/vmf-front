import React, {useState, useEffect} from "react";
import './style.scss'
import Emblem from "../../../../Emblem";
import {RadioButton} from "primereact/radiobutton";
import {Button} from "primereact/button";
import { Checkbox } from 'primereact/checkbox'
import InputMask from 'react-input-mask'
import {InputText} from "primereact/inputtext";

import moment from 'moment'

import service from '../../../service'
import CustomScrollbars from "react-custom-scrollbars-2";

const TeamNewSquadSteps = ({ isVisible=false, data, emblem, updateTeam, onClose, toast, tournaments=[], manage=false, reload }) => {
    //const [tourns, setTournaments] = useState(tournaments || []);
    const [squads, setSquads] = useState(data.squads || []);
    //const [tournament, setTournament] = useState(tournaments[0] || null)
    //const [squad, setSquad] = useState(squads[0] || null)

    const filtred = squads.length && tournaments.length ? tournaments.filter(t => !squads.find(s => s.tournamentId.toString() === t._id.toString())) : tournaments;
    //setOption(filtred.length ? filtred[0] : null)
    const [viewAddStep, setViewAddStep] = useState(false)
    const [option, setOption] = useState(filtred[0] || null);
    const [optionRequest, setOptionRequest] = useState('empty');
    const [listStash, setListStash] = useState(null)
    /*useEffect(() => {
        console.log('filtred', data, tournaments);

        if (data) {
            const { squads } = data;
            setSquads(squads || []);
            //setSquad(squads[0] || null)
            const filtred = squads.length && tournaments.length ? tournaments.filter(t => !squads.find(s => s.tournamentId.toString() === t._id.toString())) : tournaments;
            setOption(filtred.length ? filtred[0] : null)

        } else {
            //setTournaments([])
            //setTournament(null)
            setSquads([]);
            setOption(tournaments[0] || null)
            //setSquad(null);
        }
    }, [data])*/

    const close = () => {
        onClose();
        setListStash(null)
        setViewAddStep(false);
        setOption(null);
    }

    const keydownHandler = ({ key }) => {
        switch (key) {
            case 'Escape':
                close()
                break;
            default:
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', keydownHandler);
        return () => document.removeEventListener('keydown', keydownHandler);
    });

    const TournamentGetter = ({filtred, squads, tourns, viewAddStep, data, manage, updateTeam}) => {
        // console.log('tourns', tourns, 'squads', squads);
        // const filtred = squads.length && tourns.length ? tourns.filter(t => !squads.find(s => s.tournamentId.toString() === t._id.toString())) : tourns;
        //setOption(filtred.length ? filtred[0] : null)
        return filtred.length ? (
            [<CustomScrollbars  autoHide autoHeight autoHeightMin={100} autoHeightMax={300} style={{marginBottom: '10px'}}><div className={'actions'}>
                {filtred.map(t => {
                    const descr = t.league.discipline ? `${t.name}, ${t.league.discipline.name}, ${t.season.name}` : `${t.name},${t.league.name}, ${t.season.name}`;
                    return <div className="action" key={t._id}>
                        <RadioButton
                            inputId={t._id}
                            name="mode"
                            value={t}
                            onChange={(e) => {
                                //console.log('RadioButton', e.value);
                                setOption(e.value)
                            }}
                            checked={option && option._id.toString() === t._id.toString()}
                        />
                        <label htmlFor={t._id} className={'label'}>{descr}</label>
                    </div>
                })}
            </div></CustomScrollbars>,
            <div className='button-group'>
                <Button label="Отмена" className="button button-escape" onClick={close}/>
                <Button
                    label={viewAddStep ? "Добавить заявку" : "Далее"}
                    icon="pi pi-check"
                    className='button button-sub'
                    //loading={processing}
                    onClick={async () => {
                        if (viewAddStep) {
                            //setProcessing(true)
                            const body = {
                                tournamentId: option._id,
                                teamId: data._id,
                                players: optionRequest === 'empty' ? [] : latestSquad && latestSquad.players ? latestSquad.players : [],
                                manage: manage
                            };
                            console.log('BODY', optionRequest, viewAddStep, body);
                            //const pushedSquad = await service.pushTeamToTour(option._id, data, optionRequest, toast)
                            // const pushedSquad = await service.pushTeamToTour(body, toast)
                            // // pushTeam({...data, squad: pushedSquad})
                            // //console.log('pushedSquad', pushedSquad);
                            // if (pushedSquad.success) {
                            //     //reload()
                            //     //squadId: squadId, queryId: querySquadId
                            //     const squad = {
                            //         _id: pushedSquad.squadId || pushedSquad.querySquadId,
                            //         tournamentId: body.tournamentId,
                            //         tournament: option,
                            //         players: body.players,
                            //         isRequested: manage
                            //     }
                            //     //console.log('squad', squad, 'pushedSquad', pushedSquad);
                            //     const patch = {
                            //         ...data,
                            //         squads: data.squads && data.squads.length ? [...data.squads, squad] : [squad]
                            //     }
                            //     updateTeam(patch)
                            //     close()
                            // }

                        } else {
                            setViewAddStep(true)
                        }
                    }}
                />
            </div>]
        ) : ([
            <div className='notice'>
                <span>Нет турниров для новой заявки.</span>
            </div>,
            <div className='button-group'>
                <Button label="Отмена" className="button button-escape" onClick={close}/>
            </div>
        ])
    }

    const fulledSquads = squads ? squads.filter(sq => sq && sq.players && sq.players.length).slice(0, 5).map(s => {
        const dis = s.tournament && s.tournament.league && s.tournament.league.discipline ? s.tournament.league.discipline.name + ',' : '';
        const descr = s.tournament ? `клонировать заявку (${s.tournament.league ? s.tournament.league.name : 'Лига не указана'}, ${dis} ${s.tournament.season ? s.tournament.season.name : "Сезон не указан"}, ${s.tournament.name})` : "нет данных о турнире";

        return {...s, descr: descr}
    }) : [];

    const onClearChecked = () => {
        const mapd = listStash ? listStash.map(p => ({...p, exclude: true})) : []
        setListStash(mapd)
    }

    const onCheckedAll = () => {
        const mapd = listStash ? listStash.map(p => ({...p, exclude: false})) : []
        setListStash(mapd)
    }

    const latestSquad = fulledSquads.length ? fulledSquads[0] : null;
    //const latestSquadDisc = latestSquad && latestSquad.tournament && latestSquad.tournament.league && latestSquad.tournament.league.discipline ? latestSquad.tournament.league.discipline.name + ',' : '';
    const latestSquadDisc = latestSquad ? latestSquad.descr : 'нет данных'
//console.log('latestSquad', data, tournaments);
    return !isVisible ? null : (
        <div className="modal" onClick={close}>
            <div className={`modal-dialog ${listStash && listStash.length ? 'hasList' : ''}`} onClick={e => e.stopPropagation()}>
                <div className={'emblem-wrap'}>
                    <Emblem
                        source={emblem || require('../../../pennant.png')}
                        backdroped={true}
                        backgroundTransparent={false}
                        size= 'md'
                    />
                </div>
                {option && viewAddStep ? (
                    <div className={'modal-background'}>
                        <div className={'text'}>Заявить команду {data.name}<br/> {option.name}</div>

                        {latestSquad ? (
                            <div className={'actions'}>
                                <div className="action">
                                    <RadioButton
                                        inputId="empty"
                                        name="mode"
                                        value='empty'
                                        onChange={(e) => {
                                            setOptionRequest(e.value)
                                            setListStash([])
                                        }}
                                        checked={optionRequest === 'empty'}
                                    />
                                    <label htmlFor="empty" className={'label'}>с пустой заявкой</label>
                                </div>
                                {fulledSquads.map((s, i) => (
                                    <div key={s._id || i} className="action">
                                        <RadioButton
                                            inputId={s._id}
                                            name="mode"
                                            value={s._id}
                                            onChange={(e) => {
                                                setOptionRequest(s._id)
                                                setListStash(s.playersData.map(p => ({...p, exclude: false})))
                                            }}
                                            checked={optionRequest === s._id}
                                        />
                                        <label htmlFor={s._id} className={'label'}>{s.descr}</label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='notice'>
                                <span>Нет заявок команды для клонирования.</span>
                                <span>Будет создана новая.</span>
                            </div>
                        )}
                        <div className='button-group'>
                            <Button label="Отмена" className="button button-escape" onClick={close}/>
                            <Button
                                label={viewAddStep ? "Добавить заявку" : "Далее"}
                                icon="pi pi-check"
                                className='button button-sub'
                                //loading={processing}
                                onClick={async () => {
                                    if (viewAddStep) {
                                        //setProcessing(true)
                                        const squadData = fulledSquads.find(s => s._id === optionRequest)
                                        const body = {
                                            tournamentId: option._id,
                                            teamId: data._id,
                                            players: [],
                                            manage: manage
                                        };
                                        console.log('body empty', optionRequest, body, viewAddStep);
                                        if (optionRequest === 'empty') {
                                            // const pushedSquad = await service.pushTeamToTour(body, toast)
                                        } else {
                                            console.log(squadData.playersData);
                                            if(!listStash) {
                                                body.players = [];
                                            } else {
                                                const filtered = listStash.filter(plr => !plr.exclude)
                                                const players = squadData.players.map(p => filtered.find(f => f._id === p._id)).filter(p => p).map(p => ({_id: p._id, number: p.num || p.number || null, unlinked: null, linked: moment().format('YY-MM-DD')}))
                                                body.players = players;
                                            }
                                        }
                                        console.log('BODY FIXER', body);
                                        const pushedSquad = await service.pushTeamToTour(body, toast)

                                        //console.log('pushedSquad', pushedSquad);
                                        if (pushedSquad.success) {
                                            //reload()
                                            //squadId: squadId, queryId: querySquadId
                                            const squad = {
                                                _id: pushedSquad.squadId || pushedSquad.querySquadId,
                                                tournamentId: body.tournamentId,
                                                tournament: option,
                                                players: body.players,
                                                isRequested: manage
                                            }
                                            //console.log('squad', squad, 'pushedSquad', pushedSquad);
                                            const patch = {
                                                ...data,
                                                squads: data.squads && data.squads.length ? [...data.squads, squad] : [squad]
                                            }
                                            updateTeam(patch)
                                            close()
                                        }
                                    } else {
                                        setViewAddStep(true)
                                    }
                                }}
                            />
                        </div>
                        {listStash && listStash.length ? (
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
                                        placeholder={'5'}
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

                                </div>
                            ))}
                            <Button label="Убрать все" className="button-cleare" style={{fontSize: '12px', padding: '5px', marginTop: '10px'}} onClick={onClearChecked}/>
                            {/*<Button label="Выбрать всех" className="button-escape" onClick={onCheckedAll}/>*/}
                            </div>) :null}
                    </div>
                ) : (
                    <div className={'modal-background'}>
                        <div className={'text'}>Выберите турнир для новой заявки команды <br/>{data ? data.name : ''}</div>

                        <TournamentGetter
                            squads={squads}
                            tourns={tournaments}
                            filtred={filtred}
                            viewAddStep={viewAddStep}
                            data={{...data, latestSquad: latestSquad}}
                            manage={manage}
                            reload={reload}
                            updateTeam={updateTeam}
                        />
                    </div>
                )}

            </div>
        </div>
    );
};

export default TeamNewSquadSteps

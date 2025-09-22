import React, { useState, useEffect } from "react";
import './style.scss'
import emblem from "../../../Emblem";
import {Button} from "primereact/button";
import {Tag} from "primereact/tag";
import {InputText} from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar'
import {Scrollbars} from 'react-custom-scrollbars-2'
import Emblem from '../../../Emblem'
import TeamNewSquadSteps from './TeamNewSquadSteps'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";

import service from '../../service'
import {Sidebar} from "primereact/sidebar";
import Request from "../../Request";
import { PanelWrapper } from '../../../Atoms'
import {useHistory} from "react-router-dom";
import qs from "qs";

import moment from 'moment'

const formatText = count => {
    if (count > 20) {
        if (count % 10 === 1) {
            return `Заявлен ${count} игрок`
        } else if ([2, 3, 4].includes(count % 10)){
            return `Заявлено ${count} игрока`
        } else {
            return `Заявлено ${count} игроков`
        }

    } else {
        if (count === 1) {
            return `Заявлен ${count} игрок`
        } else if ([2, 3, 4].includes(count)){
            return `Заявлено ${count} игрока`
        } else {
            return `Заявлено ${count} игроков`
        }
    }
}

const initForm = {
    name: '',
    age: null,
    canonical: false,
    squads: []
}
const TeamData = ({ data, club, toast, pushTeam, removeTeam, patchTeam, setCanonical, manage, reload, layout, allTournaments }) => {

    const history = useHistory()
    const [form, setForm] = useState(initForm)
    const [viewAddAgeBtn, setViewAgeBtn] = useState(false)
    const [isViewAddSquadModal, setIsViewAddSquadModal] = useState(false)
    const [processing, setProcessing] = useState(false)
    const searchString = qs.parse(window.location.search.replace('?',''))
    const [visibleRight, setVisibleRight] = useState(searchString.tournamentId && searchString.tournamentId.length === 24);
    const [visibleBottom, setVisibleBottom] = useState(false)
    const [updated, setUpdated] = useState(false)

    useEffect(() => {
        if (data) {
            // const { name, age, canonical, squads, _id } = data;
            // if (name) {
            //     info.name = name
            // }
            // if (age) {
            //     info.age = age
            // }
            // if (squads) {
            //     info.squads = squads
            // }
            // info.canonical = !!canonical
            setForm({...data})
            setViewAgeBtn(data.age ? true : false);
        } else {
            setForm(initForm)
            setViewAgeBtn(false)
        }
    }, [data])

    const updateTeam = (item, isNewTeam) => {
        const id = isNewTeam ? 'newTeam' : form._id
        setForm({...form, ...item})
        patchTeam(id, item)
    }

    const onAgeChange = async () => {
        if (viewAddAgeBtn) {
            //setForm({...form, age: null})
            if (data.age || form.age) {
                await service.simpleUpdate(form._id, {age: null},'teams', toast)
            }
            updateTeam({age: null})
        }
        setViewAgeBtn(!viewAddAgeBtn);
    }

    const addSquad = () => {
        setIsViewAddSquadModal(true)
    }

    const onClose = () => {
        setIsViewAddSquadModal(false)
    }

    const handleInput = async e => {
        setProcessing(true)
        //toastId.current = toast('Загрузка и обработка...', {autoClose: false})
        //console.log('handleInput', e.target.files);
        const decoded = await service.convertBase64(e.target.files[0])
        // const uploaded = await axios.post(`${ENGINE}common/upload`, {
        //     target: 'clubs',
        //     base64Data: decoded,
        //     asRaw: asRaw
        // })
        //const resp = await service.attachment({decoded: decoded, toast: toast})
        const resp = await service.upload({decoded: decoded, target: 'clubs', asRow: true, toast: toast})
        if(resp && resp.uploaded) {
            //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => '⚽️ Обработано', autoClose: 500})
            //setForm({...form, emblem: uploaded.data.uploaded})
            //setEmblem(data.uploaded)
            await service.simpleUpdate(form._id, {emblem: resp.uploaded},'teams', toast)
            setForm({...form, emblem: resp.uploaded})
            //updateClub({emblem: data.uploaded})
            updateTeam({emblem: resp.uploaded})
        } else {
            console.log('upload', resp)
            //alert('Ошибка обработки')
        }
        setProcessing(false)

    }

    const SquadPreview = ({ squad }) => {
        const { tournament, players, isRequested, archived } = squad;
        const leagueDescr = tournament && tournament.league ? tournament.league.discipline && tournament.league.discipline.name ? `${tournament.league.discipline.name}, ${tournament.league.name}` : tournament.league.name : '';

        return (
            tournament ? (
                // tournament.finished ? (
                //     <div
                //         className='squadPreview'
                //         onClick={() => null}
                //         style={{cursor: 'dafault'}}
                //     >
                //         <div className={'text'}>{tournament.name}</div>
                //         <Tag className="tag tag-league" severity="info" value={leagueDescr}/>
                //         <Tag className="tag empty" severity="info" value={'Завершен'}/>
                //         {players && players.length ? (
                //             <Tag className="tag" severity="info" value={formatText(players.filter(p => !p.unlinked).length)}/>
                //         ) : (
                //             <Tag className="tag empty" severity="info" value={'Пустая заявка'}/>
                //         )}
                //     </div>
                // ) :
                isRequested ? (
                    <div
                        className='squadPreview'
                        onClick={() => null}
                        style={{cursor: 'dafault'}}
                    >
                        <div className={'text'}>{tournament.name}</div>
                        <Tag className="tag tag-league" severity="info" value={leagueDescr}/>
                        <Tag className="tag empty" severity="info" value={'Ожидает подтверждения'}/>
                    </div>
                ) : archived ? (
                    <div
                        className='squadPreview'
                        onClick={() => null}
                        style={{cursor: 'dafault'}}
                    >
                        <div className={'text'}>{tournament.name}</div>
                        <Tag className="tag tag-league" severity="info" value={leagueDescr}/>
                        <Tag className="tag empty" severity="info" value={'Отклонена'}/>
                    </div>
                ) : (
                    <div
                        className='squadPreview'
                        onClick={() => {history.push(`${window.location.pathname}/teamsquad/${squad._id}?tournamentId=${squad.tournamentId}`); setVisibleRight(true); setVisibleBottom(true)}}
                        style={{cursor: 'pointer'}}
                    >
                        <div className={'text'}>{tournament.name}</div>
                        <Tag className="tag tag-league" severity="info" value={leagueDescr}/>
                        {tournament.finished ? <Tag className="tag empty" severity="info" value={'Завершен'}/> : null}
                        {players && players.length ? (
                            <Tag className="tag" severity="info" value={formatText(players.filter(p => !p.unlinked).length)}/>
                        ) : (
                            <Tag className="tag empty" severity="info" value={'Пустая заявка'}/>
                        )}
                    </div>)
            ) : null
        )
    }
    const confirmRemoving = (id, evt) => {
        confirmPopup({
            target: evt.currentTarget,
            message: 'Вы действительно хотите удалить команду?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: () => {
                //console.log('REMOVE', id, 'team', form);
                removeTeam(id);
            }
        });
    };

    return (
        isViewAddSquadModal ? (
            <TeamNewSquadSteps
                onClose={onClose}
                data={form}
                updateTeam={updateTeam}
                reload={reload}
                isVisible={isViewAddSquadModal}
                tournaments={club.tournaments && club.tournaments.length ? club.tournaments : allTournaments}
                toast={toast}
                manage={manage}
            />
        ) : (
            <div className='team-data'>
                <ConfirmPopup />
                {(data._id !== undefined || null) && (layout !== 'mobile') && (history.location.search !== undefined || null) ?
                <Sidebar className='request-sidebar' visible={visibleRight} position="right" showCloseIcon={false} onHide={() => {setVisibleRight(false);}} style={{width: '1546px', overflow: 'hidden'}}>
                    <Request
                        team={data}
                        setVisibleRight={() => setVisibleRight(false)}
                        manage={manage}
                    />
                </Sidebar> : null}

                {visibleBottom && layout === 'mobile' ? (
                    <PanelWrapper resetTrigger={() => setVisibleBottom(false)} layout={layout} area='request'>
                        <Request
                            team={data}
                            setVisibleRight={() => setVisibleBottom(false)}
                            manage={manage}
                        />
                    </PanelWrapper>
                ) : null}

                <div className='fields-grid double-row np'>
                    <div className='fields-group teamdata'>
                        <Tag className='group-title'>Настройки команды</Tag>
                        {form && form._id && form._id !== 'newTeam' && form.isEmpty ? <Tag
                        className='removingBtn'
                        onClick={(evt) => confirmRemoving(form._id, evt)}
                        icon="pi pi-times"
                        severity="danger"
                        //value="Danger"
                        >Удалить команду</Tag> : null}

                        <div style={{marginBottom: 0}}>
                            <label htmlFor="teamname">Название команды</label>
                            <InputText
                                id='teamname'
                                value={form.name || ''}
                                onChange={(e) => {
                                    setForm({...form, name: e.target.value})
                                    //updateTeam({name: e.target.value})
                                    setUpdated(true)
                                }}
                                autoFocus
                                autoComplete='off'
                                required
                                className={!form.name ? "p-invalid block" : 'block'}
                                onBlur={async e => {
                                    if (form._id && form.name) {
                                        if (form._id === 'newTeam' ) {
                                            const {_id, ...team} = form;
                                            const doc = await service.saveData('teams', team, toast);
                                            setUpdated(false)
                                            //console.log('save data', doc);
                                            if (doc && doc._id) {
                                                //setForm({...form, ...doc})
                                                //console.log('doc', doc);
                                                updateTeam(doc, true)
                                            }
                                        } else {
                                            if (updated) {
                                                //console.log('toast', toast);
                                                await service.simpleUpdate(form._id, {name: form.name},'teams', toast);
                                                updateTeam({name: form.name})
                                                setUpdated(false)
                                            }
                                        }
                                    }

                                    //updateTeam({name: form.name})
                                }}
                                placeholder='Название команды'
                            />
                        </div>

                        {viewAddAgeBtn ? (
                            <div>
                                <label htmlFor="yearpicker">Возрастная группа</label>
                                <Calendar
                                    id="yearpicker"
                                    value={moment(form.age, 'YYYY').toDate()}
                                    onChange={async (e) => {
                                        setForm({...form, age: moment(e.value).format('YYYY')})

                                        if (moment(e.value).format('YYYY') !== data.age && form._id && form._id !== 'newTeam') {
                                            await service.simpleUpdate(form._id, {age: moment(e.value).format('YYYY')},'teams', toast)
                                        }

                                        updateTeam({age: moment(e.value).format('YYYY')})
                                    }}
                                    view="year"
                                    dateFormat="yy"
                                    maxDate={moment().toDate()}
                                />
                            </div>
                        ) : null}

                        {form._id && form._id !== 'newTeam' ? <Button
                            label={viewAddAgeBtn ? 'Убрать возрастную группу' : 'Добавить возрастную группу'}
                            icon={viewAddAgeBtn ? "pi pi-times-circle" : "pi pi-id-card"}
                            className={`button-sub p-button-sm p-button-warning compact`}
                            loading={processing}
                            onClick={onAgeChange}
                        /> : null}

                        {form._id && form._id !== 'newTeam' && !form.canonical ? <Button
                            label="Сделать основной"
                            icon="pi pi-star"
                            className={`button-sub p-button-sm p-button-info`}
                            loading={processing}
                            style={{marginBottom: 12, marginTop: 12}}
                            onClick={async () => {
                                updateTeam({canonical: true})
                                await setCanonical({...form, canonical: true})
                            }}
                        /> : (<div style={{marginBottom: 0, marginTop: 12}}></div>) }

                        {form && form._id && form._id !== 'newTeam'? <div className='fields-group teamdata' >
                            <Tag className='group-title'>Эмблема</Tag>

                            <div className='emb-loader'>
                                <div className='emb-content'>

                                    <div className='emb-current'>
                                        <img className={!form.emblem ? 'holder' : ''} src={form.emblem || club.emblem || require('../../pennant.png')} />
                                    </div>
                                    <div className='emb-input'>
                                        <input type='file' onChange={handleInput} />
                                        <Button
                                            label="Выбрать эмблему"
                                            icon="pi pi-file"
                                            className={'button-sub p-button-sm'}
                                            loading={processing}
                                            // onClick={async () => {
                                            //     setLoading(true)
                                            // }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div> : null}
                    </div>

                    {form._id && form._id !== 'newTeam' ? <div className='fields-group pb'>
                        <Tag className='group-title'>Заявки в турниры</Tag>

                        <div className='squads-info'>
                            {form.squads && form.squads.length ? (
                                <Scrollbars
                                    autoHide
                                    autoHeight
                                    autoHeightMin={200}
                                    autoHeightMax={400}
                                >
                                    <div className='squads-list'>
                                        {form.squads.map((squad, ind) =>
                                            <SquadPreview
                                                key={squad._id || `squad_${ind}`}
                                                squad={squad}
                                                updateTeam={updateTeam}
                                            />
                                        )}
                                    </div>
                                </Scrollbars>
                            ) : null }
                            <Button
                                label="Добавить заявку"
                                icon="pi pi-bookmark"
                                className='button-sub p-button-sm p-button-info'
                                loading={processing}
                                onClick={addSquad}
                            />
                        </div>
                    </div>  : null}
                </div>
            </div>
    ));
};

export default TeamData

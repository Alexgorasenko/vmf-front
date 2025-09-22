import React, { useContext, useEffect, useState, useRef } from 'react'

import { SquadContext } from '../ctx'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Sidebar } from 'primereact/sidebar'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'
import { InputNumber } from 'primereact/inputnumber'
import { InputMask } from 'primereact/inputmask'
import { Button } from 'primereact/button'

import { Splide, SplideSlide } from '@splidejs/react-splide'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../../../env'

import moment from 'moment'
import debounce from 'lodash.debounce'
import { detailedDiff } from 'deep-object-diff'
import {FileUpload} from "primereact/fileupload";
import service from "../../../../../Components/PlayersAndCoaches/service";

const LOCKED_TOOLTIP = 'редактировать существующих игроков можно только в разделе «‎Игроки»'

const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file)
        fileReader.onload = () => {
            resolve(fileReader.result);
        }
        fileReader.onerror = (error) => {
            reject(error);
        }
    })
}

const SquadController = ({ token, isApplying }) => {
    const [form, setForm] = useState(null)
    const [suggestions, setSuggestions] = useState([])
    const [suggesting, setSuggesting] = useState(false)
    const [loadAva, setLoadAva] = useState(false)
    const ctx = useContext(SquadContext)
    const { setSquad, squad, setDiff } = ctx

    const sugRef = useRef()
    const listRef = useRef()

    const suggestPlayers = queryString => {
        if(!suggesting) {
            setSuggesting(true)
            axios.get(`${ENDPOINT}v2/suggestPlayer?query=${queryString}`, {
                headers: {
                    Authorization: token
                }
            }).then(resp => {
                if(resp.data) {
                    if(squad && squad.data.players) {
                        setSuggestions(resp.data.filter(i => !squad.data.players.find(p => p._id === i._id)))
                    } else {
                        setSuggestions(resp.data)
                    }

                    setSuggesting(false)
                }
            }).catch(e => {
                setSuggesting(false)
            })
        }
    }

    const loadData = () => {
        axios.get(`${ENDPOINT}v2/teamsquad/${squad.teamId}?tournamentId=${squad.tournamentId}`, {
            headers: {
                Authorization: token
            }
        }).then(resp => {
            if(resp.data && resp.data._id) {
                setTimeout(() => {
                    setSquad({...squad, data: resp.data})
                    listRef.current = makeObj([...resp.data.players])
                }, 500)
            }
        })
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if(squad && squad.data && squad.data.players && !form && squad.data.players.find(p => !p._id)) {
            setForm(squad.data.players.find(p => !p._id))
        }

        if(squad.data) {
            setDiff(detailedDiff(listRef.current, makeObj(squad.data.players)))
        }

        if(!squad.data && listRef.current) {
            loadData()
        }
    }, [squad])

    useEffect(() => {
        if(form) {
            if(form.surname) {
                const rawString = [form.surname, form.name || ''].join(' ').trim()
                if(rawString.length > 5) {
                    const queryString = encodeURIComponent(rawString)
                    suggestPlayers(queryString)
                }
            } else {
                setSuggestions([])
                setSuggesting(false)
            }
        }
    }, [form ? form.surname : null, form ? form.name : null])

    const customUploader = async (event) => {
        setLoadAva(true)
        const decoded = await convertBase64(event.files[0])
        const data = await service.upload({
            target: 'players',
            decoded: decoded,
            asRaw: true,
            trim: false
        })
        if (data && data.uploaded) {
            setForm({ ...form, avatarUrl: data.uploaded})
        } else {
            console.log('Фото не загружено')
        }
        setLoadAva(false)
    }

    const customUploaderHandler = async (event) => {
        setLoadAva(false)
        setForm({...form, avatarUrl: null})
        event.options.clear()
    }

    const deleteUpload = async (event) => {
        setLoadAva(false)
        setForm({...form, avatarUrl: null})
        event.options.clear()
    }

    const chooseOptions = {label: 'Загрузить фото', icon: 'pi pi-upload'};

    return  <div className='squad-controller'>
                {!squad || !squad.data || isApplying ? (
                    <div style={{display: 'flex', width: '100%', height: '50vh', alignItems: 'center', justifyContent: 'center'}}>
                        <ProgressSpinner size={32} />
                    </div>
                ) : (
                    <div className='squad-players'>
                        {sortItems([...squad.data.players]).map(p => (
                            <div
                                className='player-card'
                                key={p._id}
                                onClick={() => setForm({...p})}
                            >
                                <div
                                    className='player-photo'
                                    style={{
                                        backgroundImage: `url(${p.avatarUrl && p.avatarUrl.length ? p.avatarUrl : require('../../../assets/holder.png')})`
                                    }}
                                ></div>
                                <div className='player-names'>
                                    <div>{p.surname}</div>
                                    <div>{p.name} {p.middlename || ''}</div>
                                </div>
                                <div className='player-num'>
                                    <i>игр.номер</i>
                                    <span>{p.squadState ? p.squadState.number || '-' : '-'}</span>
                                </div>
                                {p.squadState && p.squadState.linked && !p.squadState.unlinked ? null : (
                                    <Tag
                                        className='squadState'
                                        value={p.squadState ? p.squadState.unlinked ? 'отзаявлен' : 'на рассмотрении' : 'не отправлен'}
                                        severity={p.squadState ? p.squadState.unlinked ? 'danger' : 'warning' : null}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Sidebar
                    visible={form !== null}
                    position='bottom'
                    maskClassName='player-form-mask'
                >
                    {form ? [
                        form._id || form.birthday ? (
                            <div className='player-form-top'>
                                {loadAva ?
                                    <div style={{display: 'flex', width: '40%', height: '20vh', alignItems: 'center', justifyContent: 'center'}}>
                                        <ProgressSpinner size={32} />
                                    </div> : <div
                                        className='photo'
                                        style={{backgroundImage: `url(${form.avatarUrl && form.avatarUrl.length ? form.avatarUrl : require('../../../assets/holder.png')})`}}
                                    >
                                        <FileUpload
                                            mode='basic'
                                            name="demo[]"
                                            url="https://primefaces.org/primereact/showcase/upload.php"
                                            accept=".jpg,.png"
                                            maxFileSize={3e+6}
                                            chooseLabel="Загрузить фото"
                                            chooseOptions={chooseOptions}
                                            customUpload
                                            onSelect={customUploader}
                                            uploadHandler={customUploaderHandler}
                                        />
                                        {form.avatarUrl && form.avatarUrl.length ?
                                            <Tag
                                                className="fileupload-cancel"
                                                icon={'pi pi-times-circle'}
                                                severity="info"
                                                value={'Удалить фото'}
                                                onClick={deleteUpload}
                                            /> : null
                                        }
                                        <div></div>
                                        <InputNumber
                                            disabled={(form && form.squadState && form.squadState.isRequested) || squad.finished}
                                            placeholder='игр.номер'
                                            value={form.squadState ? form.squadState.number || null : null}
                                            onChange={e => setForm({...form, squadState: form.squadState ? {...form.squadState, number: e.value} : {number: e.value}})}
                                        />
                                    </div>
                                }
                                <div className='status'>
                                    {form.squadState ? [
                                        <label>статус заявки:</label>,
                                        squadStateNode(form.squadState),
                                        squadStateActionNode(form.squadState, () => {
                                            setForm({
                                                ...form,
                                                squadState: form.squadState ? {
                                                    ...form.squadState,
                                                    unlinked: moment().format('YY-MM-DD')
                                                } : {
                                                    unlinked: moment().format('YY-MM-DD')
                                                }
                                            })
                                        }, () => {
                                            setForm({
                                                ...form,
                                                squadState: {
                                                    ...form.squadState,
                                                    linked: null,
                                                    unlinked: null,
                                                    isRequested: true
                                                }
                                            })
                                        })
                                    ] : null}
                                </div>
                            </div>
                        ) : (
                            <div className={`suggest-options${suggesting || (suggestions && suggestions.length) ? ' shown' : ''}`}>
                                <label>Похожие игроки</label>
                                <div className='cards'>
                                    {suggesting ? (
                                        <div className='suggest-card suggest-progress'>
                                            <ProgressSpinner style={{width: 34, height: 34}} />
                                        </div>
                                    ) : null}
                                    {suggestions && suggestions.length ? (
                                        <Splide
                                            ref={sugRef}
                                            options={{
                                                pagination: false,
                                                fixedWidth: 88,
                                                gap: '0.75rem',
                                                arrows: false,
                                                type: (suggestions.length > 3) ? 'loop' : null,
                                                interval: 4500,
                                                perMove: 1,
                                                updateOnMove: false,
                                                waitForTransition: true,
                                                clones: 0
                                            }}
                                        >
                                            {suggestions.map(sug => (
                                                <SplideSlide
                                                    className='suggest-card'
                                                    key={sug._id}
                                                    onClick={() => {
                                                        setForm({...sug, id: form.id || null})
                                                        setSuggestions([])
                                                        setSuggesting(null)
                                                    }}
                                                    style={{backgroundImage: `url(${sug.avatarUrl && sug.avatarUrl.length ? sug.avatarUrl : require('../../../assets/holder.png')})`}}
                                                >
                                                    <div className='name'>{sug.name} {sug.surname}</div>
                                                    <div className='birthday'>{sug.birthday}</div>
                                                    {sug.squads ? sug.squads.actived && sug.squads.actived.length ? (
                                                        <div className='team current'><i>сейчас в:</i><span>{sug.squads.actived[sug.squads.actived.length-1].team.name}</span></div>
                                                    ) : sug.squads.finished && sug.squads.finished.length ? (
                                                        <div className='team'><i>был в:</i><span>{sug.squads.finished[sug.squads.finished.length-1].team.name}</span></div>
                                                    ) : null : null}
                                                </SplideSlide>
                                            ))}
                                        </Splide>
                                    ) : null}
                                </div>
                            </div>
                        ),
                        <span className='p-input-icon-right'>
                            {form && form._id ? (
                                <i className='pi pi-lock'></i>
                            ) : null}
                            <InputText
                                value={form.surname}
                                placeholder='Фамилия'
                                disabled={squad.finished}
                                onChange={e => form && form._id ? null : setForm({...form, surname: e.target.value})}
                                tooltip={form && form._id ? LOCKED_TOOLTIP : null}
                                tooltipOptions={{event: 'focus', position: 'bottom', style: {width: '90%', textAlign: 'center'}}}
                            />
                        </span>,
                        <span className='p-input-icon-right'>
                            {form && form._id ? (
                                <i className='pi pi-lock'></i>
                            ) : null}
                            <InputText
                                value={form.name}
                                onChange={e => form && form._id ? null : setForm({...form, name: e.target.value})}
                                placeholder='Имя'
                                disabled={squad.finished}
                                tooltip={form && form._id ? LOCKED_TOOLTIP : null}
                                tooltipOptions={{event: 'focus', position: 'bottom', style: {width: '90%', textAlign: 'center'}}}
                            />
                        </span>,
                        <span className='p-input-icon-right'>
                            {form && form._id ? (
                                <i className='pi pi-lock'></i>
                            ) : null}
                            <InputText
                                value={form.middlename}
                                placeholder='Отчество'
                                disabled={squad.finished}
                                onChange={e => form && form._id ? null : setForm({...form, middlename: e.target.value})}
                                tooltip={form && form._id ? LOCKED_TOOLTIP : null}
                                tooltipOptions={{event: 'focus', position: 'bottom', style: {width: '90%', textAlign: 'center'}}}
                            />
                        </span>,
                        <span className='p-input-icon-right'>
                            {form && form._id ? (
                                <i className='pi pi-lock'></i>
                            ) : null}
                            <InputMask
                                mask={'99.99.9999'}
                                value={form.birthday}
                                slotChar={'ДД.ММ.ГГГГ'}
                                autoClear
                                disabled={squad.finished}
                                placeholder='Дата рождения'
                                onChange={e => form && form._id ? null : setForm({...form, birthday: e.value})}
                                tooltip={form && form._id ? LOCKED_TOOLTIP : null}
                                tooltipOptions={{event: 'focus', position: 'bottom', style: {width: '90%', textAlign: 'center'}}}
                            />
                        </span>,
                        <div className='form-actions'>
                            {!squad.finished ? <Button
                                className='btn-action p-button-sm'
                                label={form.squadState ? 'Сохранить' : 'Заявить игрока'}
                                onClick={() => {
                                    setSquad({
                                        ...squad,
                                        data: {
                                            ...squad.data,
                                            players: squad.data.players.map(p => {
                                                const key = form.id ? 'id' : '_id'
                                                return p[key] === form[key] ? {...form} : p
                                            })
                                        }
                                    })
                                    setTimeout(() => {
                                        setForm(null)
                                    }, 500)
                                }}
                            /> : null}
                            <Button
                                className='btn-secondary p-button-sm'
                                label={form._id ? 'Закрыть' : 'Очистить'}
                                onClick={() => {
                                    if(!form._id) {
                                        setSquad({
                                            ...squad,
                                            data: {
                                                ...squad.data,
                                                players: squad.data.players.filter(p => p._id)
                                            }
                                        })
                                    }
                                    setForm(null)
                                }}
                            />
                        </div>
                    ] : null}
                </Sidebar>
            </div>
}

const makeObj = arr => {
    return arr.reduce((acc, e) => {
        const key = typeof(e.id) !== 'undefined' ? 'id' : '_id'
        acc[e[key]] = {...e}
        return acc
    }, {})
}

const squadStateActionNode = (obj, unlinkPlayer, restorePlayer) => {
    return  obj ? obj.unlinked ? (
                <span
                    className='squad-state-action'
                    onClick={() => restorePlayer()}
                >Вернуть в заявку</span>
            ) : obj.linked ? (
                <span
                    className='squad-state-action'
                    onClick={() => unlinkPlayer()}
                >Отзаявить</span>
            ) : null : null
}

const squadStateNode = obj => {
    return  obj ? (
                <div className={`squad-state-node`}>
                    {!obj.linked && !obj.unlinked ? (
                        <Tag severity='warning' value='Ожидает...' />
                    ) : obj.linked && !obj.unlinked ? (
                        <Tag severity='success' value={`Заявлен ${moment(obj.linked, 'YY-MM-DD').format('DD.MM.YY')}`} />
                    ) : [
                        <Tag severity={null} value={`Заявлен ${moment(obj.linked, 'YY-MM-DD').format('DD.MM.YY')}`} />,
                        <Tag severity='danger' value={`Отзаявлен ${moment(obj.unlinked, 'YY-MM-DD').format('DD.MM.YY')}`} />
                    ]}
                </div>
            ) : null
}

const sortItems = arr => {
    return arr
            .sort((a, b) => a.squadState && b.squadState ? a.squadState.unlinked ? 1 : b.squadState.unlinked ? -1 : a.surname > b.surname ? 1 : b.surname > a.surname ? -1 : 0 : 0)
}

export default SquadController

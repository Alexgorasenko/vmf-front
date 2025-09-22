import React, { useState } from 'react'
import { ENDPOINT } from '../../../env'
import axios from "axios";

import { InputText } from 'primereact/inputtext'
import { InputMask } from 'primereact/inputmask'
import { Button } from 'primereact/button'

import './style.scss'
import models from './models'

import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { Menu } from 'primereact/menu'
import { Tag } from 'primereact/tag'
/*
display: ENUM('row', 'column')
subjectType: ENUM('player', 'headquarter')
*/

const PersonForm = ({ display, subjectType, squadState, data, setter, editable, allPersons=[], remove }) => {
    const [form, setForm] = useState(data ? {...data} : {})
    const [suggesting, setSuggesting] = useState(false)
    const [suggestions, setSuggestions] = useState([])

    const model = models[subjectType]
    const key = model ? `${subjectType}s` : null

    const resetForm = () => {
        const obj = {}
        for(let key in form) {
            obj[key] = null
        }

        setForm(obj)
        setSuggestions([])
    }

    const checkHead = () => {
        if (key && form.surname) {
            setSuggesting(true)
            const query = form.surname.trim() + ' ' + (form.name || '')
            axios.get(`${ENDPOINT}v2/suggestPlayer?query=${query.trim()}&key=${key}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setSuggesting(false)
                setSuggestions([form,
                    ...resp.data
                    .filter(p => p._id && !allPersons.find(s => s._id && s._id.toString() === p._id.toString()))
                    .map(p => {
                        return {
                            ...p,
                            teams: p.teams.map(t => {
                                const activeSquad = p.squads && p.squads.actived && p.squads.actived.length ? p.squads.actived.find(sqd => sqd.teamId === t._id) : null
                                return {
                                    ...t,
                                    isActive: activeSquad ? activeSquad.tournament.name : null
                                }
                            })
                        }
                    })]
                )
            })
        }
    }

    return  <div className='person-form'>
                <div className='p-inputgroup'>
                    {model.map((f, i) => (
                        <Node
                            key={i}
                            data={f}
                            value={form[f.key]}
                            setter={v => setForm({...form, [f.key]: v})}
                            editable={editable}
                        />
                    ))}
                    {!form._id && !form.id ? (
                        <Button
                            className='btn-create'
                            label='Сохранить'
                            icon='pi pi-plus'
                            loading={suggesting}
                            // onClick={() => {
                            //     setter({...form, id: uuidv4()})
                            //     resetForm()
                            // }}
                            onClick={() => checkHead()}
                        />
                    ) : squadState && (squadState.linked || squadState.unlinked) ? [
                        <span className='p-inputgroup-addon state-status'>{squadState.unlinked ? 'от' : ''}заявлен {moment(squadState.unlinked || squadState.linked, 'YY-MM-DD').format('DD.MM.YY')}</span>,
                        <Button
                        className={`btn-${squadState.unlinked ? 'save' : 'delete'}`}
                        icon={`pi pi-${squadState.unlinked ? 'sync' : 'times'}`}
                        onClick={() => squadState.unlinked ? setter({...form, squadState: {...squadState, unlinked: null, linked: (squadState.linked || moment().format('YY-MM-DD'))}}) :
                            setter({...form, squadState: {...squadState, unlinked: moment().format('YY-MM-DD')}})
                        }
                        />
                    ] : form.id ? (
                        <Button
                            className='btn-warning'
                            icon='pi pi-history'
                            label='Убрать'
                            onClick={() => remove(form)}
                        />
                    ) : (
                        <Button
                            disabled
                            className='btn-warning'
                            icon='pi pi-history'
                            label='Ожидает...'
                        />
                    )}
                </div>
                {suggestions && suggestions.length ? (
                    <Menu
                        //style={{width: 380, marginLeft: 0, marginTop: 6}}
                        model={suggestions.map(item => ({
                            key: item._id,
                            data: item,
                            template: ({ data }) => {
                                return  <div className='person-suggestion_item' onClick={() => {
                                            setter({...data, id: uuidv4()})
                                            resetForm()
                                        }}>
                                            {/*<div className={'player-icon'}><img src={data.avatarUrl || PlayerIcon} style={{objectFit: 'contain'}}/></div>*/}
                                            <div className='person-suggestion_body'>
                                                <div className='name'>{[data.surname, data.name, data.middlename].filter(i => i).join(' ')}</div>
                                                <div className='tags'>
                                                    {data.globalDisqTill ? (
                                                        <Tag className='danger'>блок до {moment(data.globalDisqTill, 'YY-MM-DD').format('DD.MM.YY')}</Tag>
                                                    ) : null}
                                                    <Tag severity='info'>{data.birthday && data.birthday.length ? data.birthday : 'нет даты рождения'}</Tag>
                                                    {data.teams && data.teams.length ? data.teams.reverse().filter(t => t).map(t => (
                                                        <Tag severity={t.isActive ? 'danger' : ''} key={t._id}>{t.isActive ? 'активная заявка за ' : ''}{t.name}{t.isActive ? ` (${t.isActive})` : ''}</Tag>
                                                    )) : null}
                                                </div>
                                            </div>
                                        </div>
                                    }
                                }))}
                            />
                ) : null}
            </div>
}

const Node = ({ data, value, setter, editable }) => {
    switch(data.type) {
        case 'mask':
            return  <InputMask
                        mask={data.mask}
                        placeholder={data.placeholder}
                        className={`_${data.key}`}
                        value={value || ''}
                        onChange={e => setter(e.target.value)}
                        disabled={!editable}
                    />
            break
        case 'text':
            return  <InputText
                        placeholder={data.placeholder}
                        className={`_${data.key}`}
                        value={value || ''}
                        onChange={e => setter(e.target.value)}
                        disabled={!editable}
                    />
            break
        case 'addon':
            return  <span
                        className='p-inputgroup-addon'
                    ><i className={`pi pi-${data.icon}`} /></span>
            break
    }
}

export default PersonForm

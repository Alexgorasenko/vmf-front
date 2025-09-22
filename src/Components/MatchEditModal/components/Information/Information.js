import React, { useState, useEffect, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom'

import { MatchContext } from '../../ctx'

import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { addLocale, locale } from 'primereact/api';

import moment from 'moment'

import axios from 'axios'
import { ENDPOINT } from '../../../../env'

addLocale('ru', {
    firstDayOfWeek: 1,
    dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    monthNames: [ " Январь " , " Февраль " , " Март " , " Апрель " , " Май " , " Июнь " , " Июль " , " Август " , " Сентябрь " , " Октябрь " , " Ноябрь " , "Декабрь " ],
});

locale('ru')

const employeeCategories = [
    {path: 'referee', blockName: 'personals__block_referee', label: 'Судейская бригада'},
    {path: 'executive', blockName: 'personals__block_inspector', label: 'Инспектор / Делегат'},
    {path: 'medicine', blockName: 'personals__block_medic', label: 'Медицина'},
    {path: 'photo', blockName: 'personals__block_foto', label: 'Фото'},
    {path: 'video', blockName: 'personals__block_video', label: 'Видео'}
]

const Information = ({ match }) => {
    const ctx = useContext(MatchContext)
    const { form } = ctx

    const [employeesList, setEmployeesList] = useState(null)
    const [employees, setEmployees] = useState(null)
    const [focusedSuggestions, setFocusedSuggestions] = useState(null)
    const [publishing, setPublishing] = useState(false)

    const toastRef = useRef(null)

    const history = useHistory()

    const publishMatch = () => {
        setPublishing(true)
        axios.post(`${ENDPOINT}v2/applyMatchChanges`, {form: ctx.form}, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            let info = resp.data ? (resp.data.info || '') : ''
            if (info) {
                toastRef.current.show({severity: 'info', summary: 'Матч сохранён успешно!', detail:info, life: 4000})
            } else {
                toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Матч сохранён!'})
            }
            setTimeout(() => {
                 setPublishing(false)
            }, 1500)
        })
    }

    useEffect(() => {
        if(employeesList) {
            setEmployees(employeeCategories.reduce((acc, cat) => {
                if(form.employees) {
                    acc[cat.path] = employeesList[cat.path] ? employeesList[cat.path].filter(p => form.employees.find(e => e.role === cat.path && e._id === p._id)) : []
                } else {
                    acc[cat.path] = []
                }

                return acc
            }, {}))
        }
    }, [employeesList])

    useEffect(() => {
        axios.get(`${ENDPOINT}v2/list/employees`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setEmployeesList(resp.data)
        }).catch(e => {
            console.log('Method unavailable')
        })
    }, [])

    const updateCtxEmployees = obj => {
        ctx.setForm({
            ...ctx.form,
            employees: Object.entries(obj).reduce((acc, e) => {
                acc = acc.concat(e[1].map(p => ({_id: p._id, role: e[0], name: p.name})))
                return acc
            }, [])
        })
    }

    const locationsOptions = match && match.stage && match.stage.league && match.stage.league.locations ? match.stage.league.locations.map(l => ({...l, name: l.name || l.address})) : []

    return (
        <div className='information__block'>
            <Toast position='top-center' ref={toastRef} />

            <div className='information__block_date'>
                <div className='date__input_date input__label' >
                    <label htmlFor="basic">Дата</label>
                    <Calendar id="basic" value={moment(form.date, 'YY-MM-DD').toDate()} onChange={(e) => ctx.setForm({...ctx.form, date: moment(e.value).format('YY-MM-DD')})} dateFormat="dd MM yy" />
                </div>

                <div className='date__input_time input__label'>
                    <label htmlFor="time12">Время</label>
                    <Calendar id="time12" value={moment(form.time, 'HH:mm').toDate()} onChange={(e) => ctx.setForm({...ctx.form, time: moment(e.value).format('HH:mm')})} stepMinute={5} timeOnly hourFormat="24" mask="99:99" />
                </div>

                <div className='date__input_location input__label'>
                    <label htmlFor="basic">Локация</label>
                    <Dropdown
                        value={locationsOptions.find(o => o._id === form.locationId)}
                        options={locationsOptions}
                        onChange={e => ctx.setForm({...form, locationId: (e.value && e.value._id) ? e.value._id : null})}
                        optionLabel="name"
                        showClear
                        placeholder="Выберите локацию"
                        valueTemplate={(option, props) => {
                             if (option) {
                                 return (
                                     <div className="country-item country-item-value"><div>{option.name || option.address}</div></div>
                                 );
                             }

                             return (
                                 <span>{props.placeholder}</span>
                             );
                        }}
                        itemTemplate={(option) => {
                            return (
                                <div className="country-item">
                                    <div>{option.name}</div>
                                </div>
                            );
                        }}
                    />
                </div>
            </div>

            <div className='information__block_personals'>
                <span className='personals__title'>Персонал:</span>

                <div className='personals__block'>
                    {employeeCategories.map((cat, i) => (
                        <div className={`${cat.blockName} input__label`} key={i}>
                            <label htmlFor="basic">{cat.label}:</label>
                            <AutoComplete
                                value={employees ? employees[cat.path] || [] : []}
                                suggestions={focusedSuggestions}
                                completeMethod={e => {
                                    setFocusedSuggestions(employeesList && employeesList[cat.path] ? employeesList[cat.path].filter(el => !employees[cat.path].includes(el)).filter(p => e.query.length ? p.name.toLowerCase().includes(e.query.toLowerCase()) : p.name)  : [])
                                }}
                                minLength={0}
                                field="name"
                                multiple
                                dropdown
                                onChange={(e) => {
                                    const patched = {...employees, [cat.path]: e.value}
                                    setEmployees(patched)
                                    updateCtxEmployees(patched)
                                }}
                                aria-label={`complete_${cat.path}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className='information__block_media'>
                <span className='media__title'>Медиа:</span>
                    <div className='media__block'>
                        <div className="media__block_foto">
                            <label htmlFor="basic">Фотоальбом:</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-camera"></i>
                                </span>
                                <InputText placeholder="https://" disabled />
                            </div>
                        </div>

                        <div className="media__block_live">
                            <label htmlFor="basic">Трансляция (Youtube/VK)</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-bolt"></i>
                                </span>
                                <InputText
                                    placeholder="https://"
                                    value={ctx.form.broadcastURL || null}
                                    onChange={e => ctx.setForm({...ctx.form, broadcastURL: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="media__block_hailait">
                            <label htmlFor="basic">Хайлайты</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-star"></i>
                                </span>
                                <InputText placeholder="https://" disabled />
                            </div>
                        </div>
                    </div>
            </div>

            <div className='instant-save'>
                <Button
                    label={publishing ? "Сохраняем матч" : "Сохранить изменения"}
                    icon="pi pi-check"
                    className="p-button-success p-button-sm"
                    onClick={() => publishMatch()}
                    loading={publishing}
                />
            </div>
        </div>

    )
}

export default Information

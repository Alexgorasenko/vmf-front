import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { FileUpload } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Checkbox } from 'primereact/checkbox'
import { PanelWrapper } from '../Atoms'
import InputMask from 'react-input-mask'

import CustomScrollbars from 'react-custom-scrollbars-2'

import SideNotes from '../SideNotes'
import StaffItem from './StaffItem'

import PlayerPhoto from "../../assets/img/soccer-player-1.svg";

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import service from './service';
/*
const rules = {
    name: /\S{2,}\s\S{2,}/,
    phone: /(\+)\d{11}/,
    simple: /\S{2,}/
}

const eqvArrs = (arr1, arr2) => {
    if (arr1 && arr2) {
        if (arr1.sort().join('') === arr2.sort().join('')) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

const phoneFormatter = i => {
    return i ? i.replace(/[\(\)\-\s]/g, '') : ''
}
*/
const roles = [
    {label: 'Все сотрудники', value: null},
    {label: 'Арбитры', value: 'referee'},
    {label: 'Делегаты', value: 'executive'},
    {label: 'Медики', value: 'medicine'},
    {label: 'Фотографы', value: 'photo'},
    {label: 'Операторы', value: 'media'}
]

const sortRoles = {
    referee: 1,
    executive: 2,
    medicine: 3,
    photo: 4,
    media: 5
}

const templ = {
    name: '',
    role: '',
    roles: []
}

const formatter = count => {
    if (count === 1 || (count > 20 && count % 10 === 1)) {
        return 'е'
    } else if ([2, 3, 4].includes(count) || (count > 20 && [2, 3, 4].includes(count % 10))) {
        return 'я'
    } else {
        return 'й'
    }
}

const Staff = ({ layout }) => {
    const [staff, setStaff] = useState(null)
    const [role, setRole] = useState(null)
    const [item, setItem] = useState(null)

    const history = useHistory()

    useEffect(() => {
        setStaff(null)
        axios.get(`${ENDPOINT}v2/list/employees?full=true`, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setStaff(resp.data)
        })
    }, [localStorage.getItem('_amateum_subject_tkn')])

    const patchData = (data) => {
        const ind = staff.findIndex(it => it && it._id && it._id.toString() === data._id.toString())
        if (ind > -1) {
            setStaff([...staff.slice(0, ind), data, ...staff.slice(ind+1)]);
        } else {
            setStaff([...staff, data]);
        }
        setItem(data)
    }

    return  <div className='staff'>
        {staff && staff.length>0 ?
                <div className='toolbar'>
                    <p className='p-buttonset'>
                        {roles.map((r, i) => (
                            <Button
                                key={r.value || 'all'}
                                className={`p-button-sm p-button-info ${role !== r.value ? 'p-button-outlined' : ''}`}
                                onClick={() => setRole(r.value)}
                            >{r.label}</Button>
                        ))}
                    </p>
                </div> : null
        }

                {!staff ? (
                    <div className='spinner'>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                ) : (
                    <div className='mean'>
                        <CustomScrollbars className='staff-bars' autoHeight autoHeightMin='77vh' autoHide>
                            <div className='staff-grid'>
                                {staff.filter(person => role ? person.roles && person.roles.includes(role) : person._id).map((person, i) => (
                                    !person.archived ?
                                    <div key={person._id} className='person-item card' onClick={() => setItem(person)}>
                                        {!person.authorized ? (
                                            <Tag className='unauthorized' severity='warning'>не авторизовался</Tag>
                                        ) : null}
                                        <div className={'photo-rectangle'}>
                                            <img src={person.avatarUrl || PlayerPhoto} className={'photo'}/>
                                        </div>
                                        <div className='person-info'>
                                            <div className='name'>{person.name} {person.surname || ''}</div>
                                            <div className='phone'>{person.phone || 'телефон не указан'}</div>
                                            {person.roles && person.roles.length ? <div className='roles'>
                                                {person.roles.filter(r => roles.find(_r => _r.value === r)).sort((a, b) => sortRoles[a] - sortRoles[b]).map((r, i) => (
                                                    <Tag key={'role_'+i} severity='info'>{roles.find(_r => _r.value === r).label.slice(0, -1)}</Tag>
                                                ))}
                                            </div> : <div><Tag severity='info'>не добавлены роли</Tag></div>}
                                            {person.allMatchesCount ? <Tag severity='info'>{`${person.allMatchesCount} назначени${formatter(person.allMatchesCount)} на этой неделе`}</Tag> : <Tag severity='info'>нет назначений на этой неделе</Tag>}
                                        </div>
                                    </div> : null
                                ))}
                            </div>
                        </CustomScrollbars>
                        {layout !== 'mobile' ? !item ? <SideNotes
                            style={{marginTop: 20, width: '25%'}}
                            icon='referee'
                            content={staff.length > 0 ? (
                                <ul role="list" className={'text-group__text'}>
                                    <li>
                                        Кликните на карточку сотрудника для редактирования
                                    </li>
                                    <li>
                                        Или добавьте нового👇
                                    </li>
                                </ul>
                            ) : <ul role="list" className={'text-group__text'}>
                                <li>
                                    Добавьте нового сотрудника 👇
                                </li>
                            </ul>}
                            primaryAction={{
                                label: 'Добавить сотрудника',
                                action: () => {
                                    setItem(templ)
                                }
                            }}
                        /> : (
                            <StaffItem
                                item={item}
                                patchData={patchData}
                                roles={roles}
                                addNewStaff={() => setItem(templ)}
                                closeItem={() => setItem(null)}
                            />
                        ) : !item ? null : (
                            <PanelWrapper resetTrigger={() => setItem(null)} layout={layout} area='staff'>
                                <StaffItem
                                    item={item}
                                    patchData={patchData}
                                    roles={roles}
                                    addNewStaff={() => setItem(templ)}
                                    closeItem={() => setItem(null)}
                                />
                            </PanelWrapper>
                        )}
                    </div>
                )}
            </div>
}

export default Staff

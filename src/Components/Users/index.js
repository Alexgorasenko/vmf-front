import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { FileUpload } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Checkbox } from 'primereact/checkbox'
import { Toast } from 'primereact/toast'

import { PanelWrapper } from '../Atoms'
import InputMask from 'react-input-mask'

import CustomScrollbars from 'react-custom-scrollbars-2'

import SideNotes from '../SideNotes'
import UserItem from './UserItem'

import PlayerPhoto from "../../assets/img/soccer-player-1.svg";

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import service from './service';

const formatter = count => {
    if (count === 1 || (count > 20 && count % 10 === 1)) {
        return 'е'
    } else if ([2, 3, 4].includes(count) || (count > 20 && [2, 3, 4].includes(count % 10))) {
        return 'я'
    } else {
        return 'й'
    }
}
const templ = {
    name: '',
    phone: '',
    scopes: []
}

const Users = ({ layout }) => {
    const [users, setUsers] = useState(null)
    const [filtred, setFiltred] = useState(null)
    const [feds, setFeds] = useState(null)
    const [progress, setProgress] = useState(false);

    const [item, setItem] = useState(null)
    const [searchString, setSearchString] = useState('');

    const history = useHistory()
    const toast = useRef(null)

    useEffect(() => {
        setUsers(null)
        axios.get(`${ENDPOINT}v2/list/users`, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setUsers(resp.data)
            setFiltred(resp.data)
        })
        if (!feds || !feds.length) {
            axios.get(`${ENDPOINT}v2/list/federations`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setFeds(resp.data)
            })
        }
    }, [localStorage.getItem('_amateum_subject_tkn')])

    useEffect(() => {
        const filt = searchString ? users.filter(u => (u.name && u.name.toLowerCase().includes(searchString.toLowerCase())) || u.phone && u.phone.includes(searchString)) : users
        setFiltred(filt)
    }, [searchString])

    const patchData = (data) => {
        const ind = users.findIndex(it => it && it._id && it._id.toString() === data._id.toString())
        if (ind > -1) {
            const mapd = [...users.slice(0, ind), data, ...users.slice(ind+1)]
            setUsers(mapd);
            const filt = searchString ? mapd.filter(u => (u.name && u.name.toLowerCase().includes(searchString.toLowerCase())) || u.phone && u.phone.includes(searchString)) : mapd
            setFiltred(filt)
        } else {
            setUsers([...users, data]);
            setFiltred([...users, data])
        }
        setItem(data)
    }


    const removeUser = async (id) => {

        setProgress(true)

        const resp = await service.removeData('users', id, toast.current );
        setProgress(false)
        //console.log('resp', resp);
        if (resp && resp.success) {
            setItem(null)
            const usrs = users.filter(u => u._id !== id)
            const filt = searchString ? usrs.filter(u => (u.name && u.name.toLowerCase().includes(searchString.toLowerCase())) || u.phone && u.phone.includes(searchString)) : usrs;
            setUsers(usrs);
            setFiltred(filt)
        }

    }

    return  <div className='users'>
                <Toast ref={toast} position='bottom-right' />

                <div className={'name-input'}>
                    <div className={'text'}>Поиск по фамилии, имени, номеру</div>
                    <span className="p-input-icon-right">
                        <InputText
                            className={'input'}
                            value={searchString}
                            placeholder='Александр Иванов'
                            onChange={(e) => setSearchString(e.target.value)}
                        />
                    </span>
                </div>

                {!users ? (
                    <div className='spinner'>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                ) : (
                    <div className='mean'>
                        <CustomScrollbars className='users-bars' autoHeight autoHeightMin='77vh' autoHide>
                            <div className='user-grid'>
                                {filtred.map((person, i) => (

                                    <div key={person._id} className='person-item card' onClick={() => setItem(person)}>
                                        {!person.token ? (
                                            <Tag className='unauthorized' severity='warning'>не авторизовался</Tag>
                                        ) : null}
                                        <div className={'photo-rectangle'}>
                                            <img src={person.avatarUrl || PlayerPhoto} className={'photo'}/>
                                        </div>
                                        <div className='person-info'>
                                            <div className='name'>{person.name} {person.surname || ''}</div>
                                            <div className='phone'>{person.phone || 'телефон не указан'}</div>
                                            {person.scopes ? <div className='roles'>
                                                {`выдано прав: ${person.scopes}` }
                                            </div> : <div><Tag severity='info'>не добавлены права</Tag></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CustomScrollbars>
                        {layout !== 'mobile' ? !item ? <SideNotes
                            style={{marginTop: 20, width: '25%'}}
                            icon='referee'
                            content={users.length > 0 ? (
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
                            <UserItem
                                item={item}
                                patchData={patchData}
                                addNewStaff={() => setItem(templ)}
                                closeItem={() => setItem(null)}
                                feds={feds}
                                removeUser={removeUser}
                            />
                        ) : !item ? null : (
                            <PanelWrapper resetTrigger={() => setItem(null)} layout={layout} area='staff'>
                                <UserItem
                                    item={item}
                                    patchData={patchData}
                                    addNewStaff={() => setItem(templ)}
                                    closeItem={() => setItem(null)}
                                    feds={feds}
                                    removeUser={removeUser}
                                />
                            </PanelWrapper>
                        )}
                    </div>
                )}
            </div>
}

export default Users

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { Sidebar } from 'primereact/sidebar'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import {Toast} from 'primereact/toast'
import { Dialog } from 'primereact/dialog'

import CustomScrollbars from 'react-custom-scrollbars-2'

import SideNotes from '../SideNotes'
import CreateFlow from './CreateFlow'
import Attachment from './Attachment'
import Form from './Form'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'

import moment from 'moment'
import {Menu} from "primereact/menu";

import striptags from 'striptags'

const categories = {
    news: 'новости',
    broadcast: 'трансляции',
    interview: 'интервью',
    highlights: 'обзоры',
    previews: 'анонсы',
    photos: 'фото'
}

const Publications = ({ profile }) => {
    const [list, setList] = useState(null)
    const [loading, setLoading] = useState(false)
    const [removeDialog, setRemoveDialog] = useState(null)
    const toastRef = useRef(null)

    const [activePub, setActivePub] = useState('')
    const menu = useRef(null);

    const { id } = useParams()
    const history = useHistory()

    const items = [
        {
            label: 'Удалить публикацию',
            command: (e) => {
                setRemoveDialog(activePub)
            }
        }
    ];

    useEffect(() => {
        loadList()
    }, [localStorage.getItem('_amateum_subject_tkn')])

    const loadList = () => {
        setLoading(true)
        axios.get(`${ENDPOINT}v2/list/publications?scopeType=federation`, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setList(resp.data)
            setLoading(false)
        })
    }

    const removeItem = (pub) => {
        setLoading(true)
        //console.log('removeItem', pub);
        axios.delete(`${ENDPOINT}v2/publications/${pub._id}`, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            //console.log('resp', resp);
            if (resp && resp.data && resp.data.success) {
                if (toastRef) {
                    toastRef.current.show({severity: 'success', summary: 'Успешно!', detail: 'Публикация удалена'})
                }

                setList(list.filter(p => p._id !== pub._id))
                setRemoveDialog(null)
                setLoading(false)
            } else {
                if (toastRef) {
                    toastRef.current.show({severity: 'error', summary: 'Невозможно удалить', detail: 'Ошибка сервера. Пожалуйста, сообщите в поддержку'})
                }
            }
        })
        setLoading(false)
    }

    return  <div className='publications'>
                <Toast ref={toastRef} />

                <div className='content'>
                    <div className='list'>
                        {!list || loading ? (
                            <div className='loader'>
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <CustomScrollbars autoHeight autoHeightMin='88vh' autoHide>
                                {list.map((pub, i) => (
                                    <div
                                        key={i}
                                        className='card'
                                        onClick={() => history.push(`/publications/${pub._id}`)}
                                    >
                                        <div className='tags'>
                                            <Tag className='date'>{moment(pub.date, 'YY-MM-DD').format('D MMMM YYYY')}</Tag>
                                            <Tag>#{categories[pub.category]}</Tag>
                                            {pub.socialId ? (
                                                <Tag className='imported'>из ВКонтакте</Tag>
                                            ) : null}
                                            <Menu model={items} popup ref={menu} id="popup_menu" onHide={(e) => e.stopPropagation()}/>
                                            <Button
                                                icon="pi pi-ellipsis-v"
                                                className={'menu-button'}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActivePub(pub)
                                                    menu.current.toggle(e)
                                                }}
                                                aria-controls="popup_menu" aria-haspopup
                                            />
                                        </div>

                                <div className='mean'>
                                    <div className='title'>{pub.title}</div>
                                    {pub.content ? <div className='intro'> {striptags(pub.content).slice(0, 120)}...</div>: null}
                                </div>

                                        <div className='col'>
                                            <div className='label'>Автор:</div>
                                            <div className='value'>{pub.author ? pub.author.name : '-'}</div>
                                            <Tag severity={pub.published ? 'info' : 'warning'}>{!pub.published ? 'не ' : ''}опубликовано</Tag>
                                        </div>

                                        <div className='col'>
                                            {!pub.attachments || !pub.attachments.length ? (
                                                <div className='empty'>
                                                    <span className='pi pi-images'></span>
                                                    <div>нет вложений</div>
                                                </div>
                                            ) : [
                                                <Attachment data={pub.attachments[0]} />,
                                                pub.attachments.length > 1 ? <Tag className='muted'>и ещё {pub.attachments.length - 1} вложений</Tag> : null
                                            ]}
                                        </div>
                                    </div>
                            ))}
                            </CustomScrollbars>
                        )}
                    </div>

                    <SideNotes
                        style={{marginTop: 20, width: '25%'}}
                        icon='news'
                        content={(
                            <ul role="list" className={'text-group__text'}>
                                <li>
                                    Кликните на карточку публикации для редактирования
                                </li>
                                <li>
                                    Или создайте / импортируйте из ВК новую публикацию👇
                                </li>
                            </ul>
                        )}
                        primaryAction={{
                            label: 'Новая публикация',
                            action: () => {
                                history.push('/publications/create')
                            }
                        }}
                    />
                </div>

                <Sidebar
                    visible={id}
                    position='right'
                    style={{width: '50%'}}
                    onHide={() => history.push('/publications')}
                >
                    {id ? id === 'create' ? (
                        <CreateFlow
                            profile={profile}
                            onSaved={() => loadList()}
                        />
                    ) : (
                        <Form
                            data={list ? list.find(l => l._id === id) || null : null}
                            profile={profile}
                            onSaved={() => loadList()}
                        />
                    ) : null}
                </Sidebar>

                {removeDialog ? <Dialog
                    visible={removeDialog}
                    className='create-dialog'
                    modal
                    header={removeDialog ? `Удалить публикацию?` : ''}
                    onHide={() => {
                        if(!loading) {
                            setRemoveDialog(null)
                        }
                    }}
                    footer={removeDialog ? (
                        <div className='create-form_actions'>
                            <Button
                                className='p-button-sm'
                                icon={`pi pi-${loading ? 'spinner pi-spin' : 'check'}`}
                                disabled={loading}
                                onClick={() => removeItem(removeDialog)}
                            >Удалить</Button>
                            <Button
                                className='p-button-sm p-button-danger'
                                onClick={(e) => setRemoveDialog(null)}
                                disabled={loading}
                            >Отмена</Button>
                        </div>
                    ) : null}
                >{removeDialog ? (
                    <p className='notice'>Публикация <b>{removeDialog.title || ''}</b> будет удалена</p>
                ) : null}</Dialog> : null}
            </div>
}

export default Publications

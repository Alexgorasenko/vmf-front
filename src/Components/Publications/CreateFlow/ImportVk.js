import React, { useState, useEffect } from 'react'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'

import Form from '../Form'
import Attachment from '../Attachment'

import axios from 'axios'
import { ENDPOINT  } from '../../../env'

import moment from 'moment'

const exclude = ['link', 'poll']

const ImportVk = ({ profile, onSaved }) => {
    const [externals, setExternals] = useState(null)
    const [item, setItem] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('_amateum_subject_tkn')

        axios.get(`${ENDPOINT}v2/getVkSources`, {
            headers: {
                Authorization: token
            }
        }).then(resp => {
            if(!resp.data.error && resp.data[0]) {
                axios.get(`${ENDPOINT}v2/getVKPosts/${resp.data.join('_')}`, {
                    headers: {
                        Authorization: token
                    }
                }).then(resp => {
                    if(resp.data.data) {
                        setExternals(resp.data.data)
                    }
                })
            }
        })
    }, [])

    return  !externals ? (
        <ProgressSpinner />
    ) : !item ? (
        <div className='externals-list'>
            <div className='title'>Недавние посты:</div>
            <div className='cards'>
                {externals.map((ext, i) => {
                    const filtred = ext.attachments ? ext.attachments.filter(a => !exclude.includes(a.type)) : [];
                    return <div className='card'>
                        <div className='top'>
                            <div className='previews'>
                                {!filtred.length ? (
                                    <div className='empty'>
                                        <span className='pi pi-images'></span>
                                        <div>нет вложений</div>
                                    </div>
                                ) : [filtred.slice(0, 9).map((att, i) => (
                                    <Attachment key={i} data={att} type={ext.type}/>)),
                                    filtred.length > 9 ? <div className='empty'>
                                        <span className='pi pi-images'></span>
                                        <div>{`и еще ${filtred.length - 9} фото`}</div>
                                    </div> : null
                                ]}
                            </div>
                            <div className='meta'>
                                <div className='date'>{moment(ext.date, 'YY-MM-DD').format('D MMMM YYYY')}</div>
                                <Tag icon='pi pi-cloud-download' onClick={() => setItem({...ext})}>Импорт</Tag>
                            </div>
                        </div>
                        <div className='text'>{ext.text}</div>
                    </div>
                })}
            </div>
        </div>
    ) : [
        <div className='wrapper-bar'>
            <Button
                className='p-button-sm p-button-secondary p-button-text'
                label='Назад к списку'
                icon='pi pi-chevron-left'
                onClick={() => {
                    setItem(null)
                    window.history.pushState({}, null, `/publications/create`)
                }}
            />
        </div>,
        <Form
            external={item}
            socialId={item.socialEntryId}
            profile={profile}
            onSaved={onSaved}
        />
    ]
}

export default ImportVk

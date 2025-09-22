import React, {useEffect, useRef, useState} from 'react'

import {useHistory, useParams} from 'react-router-dom'

import {InputText} from 'primereact/inputtext'
import {Editor} from 'primereact/editor'
import {Tag} from 'primereact/tag'
import {Checkbox} from 'primereact/checkbox'
import {Calendar} from 'primereact/calendar'
import {Button} from 'primereact/button'
import {Toast} from 'primereact/toast'

import TagsControl from './TagsControl'
import CustomUploads from './CustomUploads'
import Attachment from '../Attachment'

import './style.scss'

import moment from 'moment'

import axios from 'axios'
import {ENDPOINT} from '../../../env'

const renderEditorHeader = () => {
    return (
        <span className="ql-formats">
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
        </span>
    )
}

const categories = [
    {label: 'новости', value: 'news'},
    {label: 'трансляции', value: 'broadcast'},
    {label: 'интервью', value: 'interview'},
    {label: 'обзоры',value: 'highlights'},
    {label: 'анонсы', value: 'previews'},
    {label: 'фото', value: 'photos'},
    {label: 'видео', value: 'videos'}
]

const tagsTypes = [
    {label: 'Привязка к матчам', type: 'matches', placeholder: 'Начните вводить названия команд'},
    {label: 'Привязка к турнирам', type: 'tournaments', placeholder: 'Начните вводить названия турниров'},
    {label: 'Привязка к командам', type: 'teams', placeholder: 'Начните вводить название команды'},
    {label: 'Привязка к игрокам', type: 'players', placeholder: 'Начните вводить ФИО игрока'}
]

const exclude = ['link', 'poll']

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

const Form = ({ data, external, socialId, profile, onSaved }) => {
    const [form, setForm] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [createdId, setCreatedId] = useState(null)
    const [splitVideoMode, setSplitVideoMode] = useState(false)
    const [content, setContent] = useState(null)

    const { id } = useParams()
    const publicationId = createdId || (id && id !== 'create' ? id : null)
    const toastRef = useRef(null)
    const history = useHistory()

    useEffect(() => {
        if(data || external) {
            const obj = data ? {...data} : {...external}
            const singleVideoTitle = obj.attachments && obj.attachments.length === 1 && obj.attachments[0].type === 'video' ? obj.attachments[0].video.title : null
            const federationToken = localStorage.getItem('_amateum_subject_tkn');
            //const federation = JSON.parse(localStorage.getItem('_am_federation'))

            setForm({
                title: obj.title || singleVideoTitle || null,
                published: obj.published || true,
                date: obj.date || moment().format('YY-MM-DD'),
                category: obj.category || 'news',
                content: obj.content || obj.text || null,
                attachments: obj.attachments ? obj.attachments.filter(a => !exclude.includes(a.type)).map(a => ({...a, selected: true, splitted: a.type === 'video' ? {title: a.video.title} : null})) : [],
                originId: obj.originId || obj.id || null,
                socialId: obj.socialId || socialId || null,
                userId: obj.userId || (profile ? profile.userId : null),
                type: obj.type || 'mixed',
                //federationId: federation ? federation._id : null,
                federationToken: federationToken || null,
                tags:obj.tags ,
                tagsdata: obj.tagsdata || {matches: [], players: [], tournaments: [], teams: []}
            })
            setContent(obj.content || obj.text || null)
        }
    }, [external])

    const sendDecoded = async (d) => {
        try {
            const resp = await axios.post(`${ENDPOINT}v2/attachment`,
            {base64Data: await convertBase64(d.file)},
            {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn'),
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            })
            if (resp.data.path) {
                return resp.data.path
            } else return null
        }
        catch (e) {
            console.log('error')
        }
    }

    const sendPublication = async (body) => {
        await axios.put(`${ENDPOINT}v2/publications${publicationId ? '/'+publicationId : ''}`, body, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            setProcessing(false)

            if(resp.data) {
                if(!publicationId && resp.data._id) {
                    window.history.pushState({}, null, `/publications/${resp.data._id}`)
                    setCreatedId(resp.data._id)
                }

                toastRef.current.show({severity: 'success', summary: 'Успешно!', detail: 'Публикация сохранена'})
                if(typeof(onSaved) !== 'undefined') {
                    onSaved()
                }
            } else {
                toastRef.current.show({severity: 'error', summary: 'Невозможно сохранить', detail: 'Ошибка сервера. Пожалуйста, сообщите в поддержку'})
            }
        })
    }

    const handleSave = async () => {
        if(!splitVideoMode) {
            if(!form.title || !form.title.length) {
                toastRef.current.show({severity: 'error', summary: 'Невозможно сохранить', detail: 'Добавьте заголовок публикации'})
            } else {
                setProcessing(true)
                if(form.socialId) {
                    const body = {
                        ...form,
                        attachments: form.attachments.filter(att => att.selected).map(({selected, ...att}) => att),
                        content: content
                    }
                    await sendPublication(body)
                } else {
                    const decoded = form.attachments.filter(att => att.selected).map(({ selected, ...att}) => att)
                    const decodedData = []
                    if (decoded.length) {
                        decoded.map(async (d, index) => {
                            d = d.type === 'photo' ? d : {
                                ...d,
                                file: {
                                    name: d.file.name,
                                    path: await sendDecoded(d)
                                }
                            }
                            decodedData.push(d)
                            if(decoded.length === index+1){
                                const body = {
                                    ...form,
                                    attachments: decodedData,
                                    content: content
                                }
                                if (body){
                                    await sendPublication(body)
                                }
                            }
                        })
                    } else {
                        const body = {
                            ...form,
                            attachments: form.attachments.filter(att => att.selected && att.type === 'photo'),
                            content: content
                        }
                        await sendPublication(body)
                    }
                }
            }
        } else {
            const items = form.attachments.filter(att => att.selected && att.splitted)
            if(!items.length) {
                toastRef.current.show({severity: 'error', summary: 'Невозможно сохранить', detail: 'Не выбрано видео для импорта'})
            } else {
                const unfilled = items.filter(att => !att.splitted.title || !att.splitted.title.length)
                if(unfilled.length) {
                    toastRef.current.show({severity: 'error', summary: 'Невозможно сохранить', detail: 'Заголовки публикаций не могут быть пустыми. Пожалуйста заполните это поле для каждого элемента.'})
                } else {
                    setProcessing(true)
                    for(let {splitted, selected, ...item} of items) {
                        const body = {
                            attachments: [item],
                            title: splitted.title,
                            type: 'video',
                            date: form.date,
                            category: splitted.category || form.category,
                            content: null,
                            tags: splitted.tags ? form.tags && form.tags.tournaments ? {...splitted.tags, tournaments: form.tags.tournaments} : {...splitted.tags} : form.tags && form.tags.tournaments ? {tournaments: form.tags.tournaments} : null,
                            originId: form.originId,
                            socialId: form.socialId,
                            userId: form.userId,
                            federationToken: form.federationToken || null,
                            published: form.published,
                            tagsdata: splitted.tagsdata ? form.tagsdata && form.tagsdata.tournaments ? {...splitted.tagsdata, tournaments: form.tagsdata.tournaments} : {...splitted.tagsdata} : form.tagsdata && form.tagsdata.tournaments ? {tournaments: form.tagsdata.tournaments} : null
                        }

                        await axios.put(`${ENDPOINT}v2/publications${publicationId ? '/'+publicationId : ''}`, body, {
                            headers: {
                                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                                SignedBy: localStorage.getItem('_amateum_tkn')
                            }
                        })
                    }

                    toastRef.current.show({severity: 'success', summary: 'Успешно!', detail: 'Публикации сохранены'})
                    setProcessing(false)
                    onSaved()
                    history.push('/publications')
                }
            }
        }
    }

    const updateTagsPost = (k, v) => {

        const updatedForm = {...form, tagsdata: {...form.tagsdata, [k]: v}}
        const { tagsdata } = updatedForm;

        if (k === 'matches') {
            for (let m of v) {
                const {stage, home, away} = m;
                if (!tagsdata['teams']) {
                    tagsdata['teams'] = [
                        {_id: home._id, name: home.name},
                        {_id: away._id, name: away.name}
                    ]
                } else {
                    for (let side of ['home','away']) {
                        const hasData = tagsdata['teams'].find(t => t._id.toString() === m[side]._id.toString())
                        if (!hasData) {
                            tagsdata['teams'].push({_id: m[side]._id, name: m[side].name})
                        }
                    }
                }
                const tour = stage ? stage.tournament : null
                if (tour) {
                    if (!tagsdata['tournaments']) {
                        tagsdata['tournaments'] = [
                            {_id: tour._id, name: tour.name}
                        ]
                    } else {
                        const hasData = tagsdata['tournaments'].find(t => t._id.toString() === tour._id.toString())
                        if (!hasData) {
                            tagsdata['tournaments'].push({_id: tour._id, name: tour.name})
                        }
                    }
                }
            }
            updatedForm.tagsdata = tagsdata
        }

        setForm(updatedForm)
    }

    const editorHeader = renderEditorHeader()

    const selectedAttachmentsQty = form ? form.attachments.reduce((acc, att) => {
        if (att.selected) {
            if (att.album && att.album.size) {
                acc += att.album.size;
            } else {
                acc += 1;
            }
        }
        return acc
    }, 0) : 0
    const enabledSplitVideoMode = form && form.attachments && form.attachments.filter(att => att.type === 'video').length > 0

    const tagsRefs = splitVideoMode ? [tagsTypes[1]] : [...tagsTypes];

    const toggleAll = (selected) => {
        setForm({
            ...form,
            attachments: form.attachments.map(it => ({
                ...it,
                selected: selected
            }))
        })
    }

    const customUploader = async (event) => {
        let newArray = form.attachments
        if (event.files.length && event.files.length > 1) {
            for (let i=0; i < event.files.length && i < 5; i++){
                newArray.push({
                    type: 'file',
                    file: event.files[i],
                    selected: true
                })
            }
        } else {
            newArray.push({
                type: 'file',
                file: event.files[0],
                selected: true
            })
        }
        setForm({
            ...form,
            attachments: newArray
        })
    }

    const chooseOptions = {label: 'Загрузить фото', icon: 'pi pi-upload'};
    const attachType = form && form.attachments && form.attachments[0] && ['album','article'].includes(form.attachments[0].type) ? form.attachments[0].type : 'notalbum'

    return  form ? (
                <div className='publication-form'>
                    <Toast ref={toastRef} />

                    <div className={'publication-action'+(!external ? ' stored' : '')}>
                        <Button
                            className='p-button-sm p-button-success p-button-text'
                            label={'Сохранить публикаци'+(splitVideoMode ? 'и' : 'ю')}
                            icon='pi pi-check-circle'
                            onClick={() => handleSave()}
                            loading={processing}
                        />
                    </div>

                    {!splitVideoMode ? (
                        <div>
                            <span className='p-float-label'>
                                <InputText
                                    className='p-inputtext-sm'
                                    id='title'
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    onPaste={e => {
                                        e.preventDefault()
                                        setForm({...form, title: e.clipboardData.getData('Text')})
                                    }}
                                />
                                <label htmlFor='title'>Заголовок</label>
                            </span>
                        </div>
                    ) : null}

                    <div className='form-settings'>
                        <div>
                            <Checkbox id='published' checked={form.published} onChange={() => setForm({...form, published: !form.published})} />
                            <label htmlFor='published' className='p-checkbox-label'>Опубликовать</label>
                        </div>
                        <div>
                            <Calendar
                                inputClassName='p-inputtext-sm'
                                dateFormat='dd MM yy'
                                value={moment(form.date, 'YY-MM-DD').toDate()}
                                onChange={e => setForm({...form, date: moment(e.value).format('YY-MM-DD')})}
                            />
                        </div>
                        {!splitVideoMode ? (
                            <div>
                                <h6 style={{margin: 0}}>Выбор категории</h6>
                                <div className='category-control'>
                                    {categories.map((cat, i) => (
                                        <Tag
                                            key={i}
                                            className={'category-tag'+(cat.value === form.category ? ' selected' : '')}
                                            onClick={() => setForm({...form, category: cat.value})}
                                        >{cat.label}</Tag>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className='tags-controls'>
                        {tagsRefs.map((t, i) => (
                            <div className='tags-controls_item' key={i}>
                                <h6>{t.label}</h6>
                                <TagsControl
                                    type={t.type}
                                    value={form['tagsdata'] ? form['tagsdata'][t.type] : []}
                                    updateTagsPost={updateTagsPost}
                                    placeholder={t.placeholder}
                                    // searchData={searchData}
                                    // suggestions={suggestions[t.type]}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <h4>Вложения
                            {form.socialId ? attachType === 'album' ? <Tag>Будет импортировано {selectedAttachmentsQty} фотографий альбома</Tag> : <Tag>выбрано для импорта вложений: {selectedAttachmentsQty}</Tag> : null}
                            {enabledSplitVideoMode ? (
                                <Tag
                                    icon={'pi pi-'+(splitVideoMode ? 'undo' : 'youtube')}
                                    className='switch-mode'
                                    onClick={() => setSplitVideoMode(!splitVideoMode)}
                                >{splitVideoMode ? 'В обычный режим публикации' : 'Разделить видео-галерею на разные публикации'}</Tag>
                            ) : null}
                        </h4>
                        <div className={'previews'+(splitVideoMode ? ' stacked' : ' formMode')}>
                            {form.socialId ? !form.attachments.length ? (
                                <div className='empty'>
                                    <span className='pi pi-images'></span>
                                    <div>нет вложений</div>
                                </div>
                            ) : form.attachments.map((att, i) => (
                                <Attachment
                                    key={i}
                                    data={att}
                                    type={form.type}
                                    selectable={true}
                                    splitedItem={splitVideoMode}
                                    categoriesOptions={categories}
                                    setSplittedForm={f => setForm({
                                        ...form,
                                        attachments: form.attachments.map((a, _i) => ({
                                            ...a,
                                            splitted: _i === i ? {...f} : a.splitted
                                        }))
                                    })}
                                    onToggle={() => ['album','article'].includes(attachType) ? null : setForm({
                                        ...form,
                                        attachments: form.attachments.map((a, _i) => ({
                                            ...a,
                                            selected: _i === i ? !a.selected : a.selected
                                        }))
                                    })}
                                />
                            )) : [
                                form.attachments.map((att, i) => (
                                    <Attachment
                                        key={i}
                                        data={att}
                                        type={form.type}
                                        selectable={true}
                                        splitedItem={splitVideoMode}
                                        categoriesOptions={categories}
                                        setSplittedForm={f => setForm({
                                            ...form,
                                            attachments: form.attachments.map((a, _i) => ({
                                                ...a,
                                                splitted: _i === i ? {...f} : a.splitted
                                            }))
                                        })}
                                        onToggle={() => ['album','article'].includes(attachType) ? null : setForm({
                                            ...form,
                                            attachments: form.attachments.map((a, _i) => ({
                                                ...a,
                                                selected: _i === i ? !a.selected : a.selected
                                            }))
                                        })}
                                    />
                                )),
                                <CustomUploads
                                    attachments={form.attachments}
                                    onUploaded={obj => setForm({
                                        ...form,
                                        attachments: [{
                                            selected: true,
                                            type: 'photo',
                                            photo: {
                                                sizes: [obj]
                                            }
                                        }].concat(form.attachments)
                                    })}
                                    chooseOptions={chooseOptions}
                                    customUploader={customUploader}
                                />
                            ]}
                        </div>
                    </div>

                    {!splitVideoMode && form.type !== 'album' ? (
                        <div>
                            <h4>Контент</h4>
                            <Editor
                                style={{height: 280}}
                                value={form.content}
                                onSelectionChange={e => {}}
                                onTextChange={e => {
                                    setContent(e.htmlValue)
                                    // setForm({...form, content: e.htmlValue})
                                }}
                                headerTemplate={editorHeader}
                            />
                        </div>
                    ) : null}
                </div>
            ) : null
}

export default Form

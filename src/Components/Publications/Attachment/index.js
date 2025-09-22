import React, { useState, useEffect } from 'react'

import { Tag } from 'primereact/tag'
import { InputText } from 'primereact/inputtext'

import TagsControl from '../Form/TagsControl'

import './style.scss'

const tagsTypes = [
    {label: 'Привязка к матчам', type: 'matches', placeholder: 'Начните вводить названия команд'},
    {label: 'Привязка к командам', type: 'teams', placeholder: 'Начните вводить название команды'},
    {label: 'Привязка к игрокам', type: 'players', placeholder: 'Начните вводить ФИО игрока'}
]

const getPhotoSrc = obj => {
    if(obj) {
        if (obj.sizes && obj.sizes.length) {
            return obj.sizes.sort((a, b) => b.height - a.height)[0].url
        } if (obj.objectURL) {
            return obj.objectURL
        } if (obj.name && obj.path) {
            return obj.path
        } else {
            return ''
        }
    }
}

const getVideoSrc = obj => {
    if(obj.image && obj.image.length) {
        return obj.image.sort((a, b) => b.height - a.height)[0].url
    } else {
        return ''
    }
}

const getFileName = obj => {
    if (obj.name) {
        return obj.name
    } else {
        return ''
    }
}

const SplittedItemForm = ({ onUpdated, data, categoriesOptions }) => {
    const [form, setForm] = useState(data ? {
        ...data,
        category: data.category || 'news',
        tagsdata: data.tagsdata || {matches: [], players: [], teams: []}
    } : {
        category: 'news',
        tagsdata: {matches: [], players: [], teams: []
    }})

    useEffect(() => {
        onUpdated({...form})
    }, [form])

    const updateSplitTagsPost = (k, v) => {

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
            }
            updatedForm.tagsdata = tagsdata
        }
        //console.log('upd form',tagsdata, updatedForm);

        setForm(updatedForm)
    }

    return  <div className='mini-form'>
                <div>
                    <div style={{marginBottom: 36}}>
                        <h6 style={{margin: 0}}>Выбор категории</h6>
                        <div className='category-control'>
                            {categoriesOptions.map((cat, i) => (
                                <Tag
                                    key={i}
                                    className={'category-tag'+(cat.value === form.category ? ' selected' : '')}
                                    onClick={() => setForm({...form, category: cat.value})}
                                >{cat.label}</Tag>
                            ))}
                        </div>
                    </div>
                    <span className='p-float-label'>
                        <InputText className='p-inputtext-sm' id='title' value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <label htmlFor='title'>Заголовок</label>
                    </span>
                </div>

                <div className='tags-controls'>
                    {tagsTypes.map((t, i) => (
                        <div className='tags-controls_item' key={i}>
                            <h6>{t.label}</h6>
                            <TagsControl
                                type={t.type}
                                placeholder={t.placeholder}
                                value={form.tagsdata[t.type]}
                                updateTagsPost={updateSplitTagsPost}
                            />
                        </div>
                    ))}
                </div>
            </div>
}

const Attachment = ({ data, type, tagsdata, updateTagsPost, selectable, onToggle, splitedItem, setSplittedForm, categoriesOptions }) => {
    let tag, img, name

    switch (data.type) {
        case 'article':
            tag = 'Статья'
            img = getPhotoSrc(data.photo)
            break
        case 'photo':
            tag = 'Графика'
            img = getPhotoSrc(data.photo)
            break
        case 'album':
            tag = 'Альбом'
            img = getPhotoSrc(data.album.thumb)
            break
        case 'video':
            tag = 'Видео'
            img = getVideoSrc(data.video)
            break
        case 'file':
            tag = 'file'
            name = getFileName(data.file)
            break
        default:
            return null
    }

    return  <div className='previews-item_wrap'>
        {data.type === 'file' ? <div className={`previews-item`}>
            {name}
            {selectable ? (
                <div
                    className={'select-control'+(data.selected ? ' active' : '')}
                    onClick={() => onToggle()}
                >
                    <span className={`pi pi-${data.selected ? 'check' : 'times'}-circle`}></span>
                </div>
            ) : null}
            {splitedItem && data.selected ? (
                <SplittedItemForm
                    onUpdated={setSplittedForm}
                    data={data.splitted}
                    tagsdata={tagsdata}
                    updateTagsPost={updateTagsPost}
                    categoriesOptions={categoriesOptions}
                />
            ) : null}
        </div> : <div>
                <div className={`previews-item ${data.type}`}>
                    <img src={img} />
                    {['photo','file'].includes(data.type) ? null : <Tag>{tag}</Tag>}
                    {selectable ? (
                        <div
                            className={'select-control'+(data.selected ? ' active' : '')}
                            onClick={() => onToggle()}
                        >
                            <span className={`pi pi-${data.selected ? 'check' : 'times'}-circle`}></span>
                        </div>
                    ) : null}
                </div>

                {splitedItem && data.selected ? (
                    <SplittedItemForm
                        onUpdated={setSplittedForm}
                        data={data.splitted}
                        tagsdata={tagsdata}
                        updateTagsPost={updateTagsPost}
                        categoriesOptions={categoriesOptions}
                    />
                ) : null}
            </div>
        }
    </div>
}


export default Attachment

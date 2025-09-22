import React, {useState, useEffect, useRef} from 'react'
import { useHistory } from 'react-router-dom'

import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown';
import { Chips } from 'primereact/chips';

import CustomScrollbars from 'react-custom-scrollbars-2'

import { PanelWrapper } from '../../Atoms'

import '../style.scss'
import service from '../service'

const App = ({ app, updApp, toast, allFeds, fed }) => {
    const [item, setItem] = useState(null)
    const [needUpdate, setNeedUpdate] = useState(true)

    useEffect(() => {
        setItem(app)
    }, [app])

    return  item ? <div className='app-form'>
        {(allFeds && allFeds.length) && fed ? <div className='app-feds' >
             <Dropdown
                id='app-fed'
                onChange={async e => {
                    console.log('fid', e.value, item, {federationId: e.value});
                    setItem(null)
                    updApp({...item, federationId: e.value}, true)
                    await service.patchData(item._id, 'apps', {federationId: e.value}, toast);
                }}
                value={fed._id}
                options={allFeds}
                placeholder='федерация'
                optionLabel="name"
                optionValue="_id"
             />
            </div> : null}
        <div className={'input-obj'}>
            <InputText
                inputid="name"
                type='text'
                value={item.name}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, name: v.target.value})
                }}
                onBlur={async v => {
                    await service.patchData(item._id, 'apps', {name: item.name}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='название'
            />
            <label htmlFor="name" className={'label'}>NAME</label>
        </div>
        <div className={'input-obj'}>

            <InputText
                inputid="type"
                type='text'
                value={item.type}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, type: v.target.value})
                }}
                onBlur={async v => {
                    await service.patchData(item._id, 'apps', {type: item.type}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='тип'
            />
            <label htmlFor="type" className={'label'}>ТИП</label>
        </div>
        <div className={'input-obj'}>

            <InputText
                inputid="origin"
                type='text'
                value={item.origin}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, origin: v.target.value})
                }}
                onBlur={async v => {
                    await service.patchData(item._id, 'apps', {origin: item.origin}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='origin'
            />
            <label htmlFor="origin" className={'label'}>origin</label>
        </div>
        <div className={'input-obj'}>
            <Chips
                value={item.alternativeOrigins || []}
                onChange={async (e) => {
                    //console.log(e.value);
                    //setValue(e.value)
                    setItem({...item, alternativeOrigins: e.value})
                    await service.patchData(item._id, 'apps', {alternativeOrigins: e.value}, toast);
                    updApp(item)

                }}
                separator=","
            />
            {/*<InputText
                inputid="alternativeOrigins"
                type='text'
                value={item.alternativeOrigins ? item.alternativeOrigins.join('; ') : ''}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, alternativeOrigins: v.target.value.split('; ')})
                }}
                onBlur={async () => {
                    await service.patchData(item._id, 'apps', {alternativeOrigins: item.alternativeOrigins}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='alternativeOrigins'
            />*/}
            <label htmlFor="alternativeOrigins" className={'label'}>alternative</label>
        </div>

        <div className={'input-obj'}>

            <InputText
                inputid="title"
                type='text'
                value={item.config ? item.config.title : ''}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, config: {...item.config, title: v.target.value}})
                }}
                onBlur={async () => {
                    await service.patchData(item._id, 'apps', {'config.title': item.config.title}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='title'
            />
            <label htmlFor="title" className={'label'}>config.title</label>
        </div>
        <div className={'input-obj'}>

            <InputText
                inputid="ym"
                type='number'
                value={item.config ? (item.config.ym || '') : ''}
                onChange={v => {
                    // await patchData(item._id, 'apps', {title: v}, toast);
                    // updApp({...item, title: v})
                    setItem({...item, config: {...item.config, ym: +v.target.value}})
                }}
                onBlur={async () => {
                    await service.patchData(item._id, 'apps', {'config.ym': +item.config.ym}, toast);
                    updApp(item)
                    //setItem({...item, title: v})
                }}
                icon='pi pi-star'
                placeholder='ym'
            />
            <label htmlFor="ym" className={'label'}>config.ym</label>
        </div>
        {/*<div className='actions'>
            <Button
                className='p-button-sm'
                icon='pi pi-check'
                onClick={() => updApp(item)}
                disabled ={!Object.keys(getPatch(item, app)).length}
                label="применить"
            />
        </div>*/}
    </div> : null
}
/*
const getPatch = (form, def) => {
    const patch = {}
    const keys = ['name', 'type', 'origin', 'alternativeOrigins']; //'config',
    const configKeys = ['title', 'logo', 'promo', 'appleIcon', 'ym']
    for (let key of keys) {
        if (key !== 'alternativeOrigins') {
            if (form[key] !== def[key]) {
                patch[key] = form[key]
            }
        } else {
            const f = form[key] ? form[key].join(';') : '';
            const d = def[key] ? def[key].join(';') : ''
            if (f !== d) {
                patch[key] = form[key]
            }
        }
    }
    return patch
}
*/
export default App

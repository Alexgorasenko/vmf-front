import React, {useState, useEffect, useRef} from 'react'
import { useHistory } from 'react-router-dom'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { FileUpload } from 'primereact/fileupload'
import { Checkbox } from 'primereact/checkbox'
import {InputSwitch} from "primereact/inputswitch";

import CustomScrollbars from 'react-custom-scrollbars-2'

import { CustomInput, PanelWrapper } from '../Atoms'

import SideNotes from '../SideNotes'
import App from './App'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import {Toast} from "primereact/toast";
import service from './service'

const defaultFed = {
    name: ''
}

const Fed = ({ subject, layout }) => {
    const [feds, setFeds] = useState(null)
    const [item, setItem] = useState(null)
    const [needUpdate, setNeedUpdate] = useState(true)
    const [gettedApp, setGettedApp] = useState(null)
    const [tkn, setTkn] = useState(localStorage.getItem('_amateum_subject_tkn'))

    const toastRef = useRef(null)

    useEffect(() => {
        if (needUpdate || tkn !== localStorage.getItem('_amateum_subject_tkn')) {
            if(tkn !== localStorage.getItem('_amateum_subject_tkn')) {
                setFeds(null)
            }

            setTkn(localStorage.getItem('_amateum_subject_tkn'))
            axios.get(`${ENDPOINT}v2/list/federations`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setFeds(resp.data)
                setNeedUpdate(false)
            })

        }
    }, [needUpdate, localStorage.getItem('_amateum_subject_tkn')])

    const updateFed = () => {
        let mapdFeds = item._id ? feds.map(nl => {
            if (nl._id === item._id) {
                return item
            }
            return nl
        }) : feds;
        axios.put(`${ENDPOINT}v2/federations${item._id ? '/'+item._id : ''}`,
            item,
            {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Федерация сохранена!'})
            if (item._id) {
                setFeds(mapdFeds)
            } else {
                setFeds([...mapdFeds, {...item, _id: resp.data._id}].sort((a, b) => a.name > b.name ? 1 : -1))
            }

            //setItem(null)
        })
    }

    return  <div className='feds'>
                <Toast position='top-center' ref={toastRef} />

                {!feds ? (
                    <div className='spinner'>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                ) : (
                    <div className='mean'>
                    <CustomScrollbars className='staff-bars' autoHeight autoHeightMin='70vh' autoHide>
                        <div className='fed-grid'>
                            {feds.map((f, i) => (
                                <div key={f._id || i} className={`fed-item card ${item && f._id === item._id ? 'active' : '' }`} onClick={() => {
                                    if (!item || f._id !== item._id) {
                                        setItem(f)
                                        setGettedApp(null)
                                    }
                                }}>
                                    <div className='fed-info'>
                                        <div className='name'>{f.name}</div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </CustomScrollbars>

                        {!item ? layout !== 'mobile' ? <SideNotes
                            style={{marginTop: 20, width: '25%'}}
                            icon='stadium'
                            content={(
                                <ul role="list" className={'text-group__text'}>
                                    <li>
                                        Кликните на карточку федерации для редактирования
                                    </li>
                                    <li>
                                        Или создайте новую👇
                                    </li>
                                </ul>
                            )}
                            primaryAction={{
                                label: 'Добавить федерацию',
                                action: () => {
                                    setItem({...defaultFed})
                                }
                            }}
                        /> : null : (
                            <PanelWrapper resetTrigger={() => setItem(null)} layout={layout} area='location'>
                                <SideNotes
                                    icon={'stadium'}
                                    content={(
                                        <div className='fed-form'>
                                            <CustomInput
                                                type='text'
                                                value={item.name}
                                                onChange={v => {setItem({...item, name: v})}}
                                                icon='pi pi-star'
                                                placeholder='название'
                                            />
                                            <div
                                                className={'switch-obj'}
                                                onClick={async () => {
                                                    const isFantasy = !item.isFantasy;
                                                    setItem({...item, isFantasy: isFantasy})
                                                    //await service.simpleUpdate(subject._id, {addonsAllowed: isFantasy}, toast)
                                                }}
                                            >
                                                <InputSwitch checked={item.isFantasy} />
                                                <div className={'text'}>Фэнтэзи</div>
                                            </div>

                                            <div
                                                className={'switch-obj'}
                                                onClick={async () => {
                                                    const useMatchStats = !item.useMatchStats;
                                                    setItem({...item, useMatchStats: useMatchStats})
                                                    //await service.simpleUpdate(subject._id, {addonsAllowed: isFantasy}, toast)
                                                }}
                                            >
                                                <InputSwitch checked={item.useMatchStats} />
                                                <div className={'text'}>матчевая статистика</div>
                                            </div>
                                            <div
                                                className={'switch-obj'}
                                                onClick={async () => {
                                                    const useStatsInStandingEnable = !item.useStatsInStandingEnable;
                                                    setItem({...item, useStatsInStandingEnable: useStatsInStandingEnable})
                                                    //await service.simpleUpdate(subject._id, {addonsAllowed: isFantasy}, toast)
                                                }}
                                            >
                                                <InputSwitch checked={item.useStatsInStandingEnable} />
                                                <div className={'text'}>статистика в таблице</div>
                                            </div>
                                            <div className='actions'>
                                                <Button
                                                    className='p-button-sm'
                                                    icon='pi pi-check'
                                                    onClick={() => updateFed()}
                                                    disabled ={!item.name}
                                                    label="Сохранить"
                                                />
                                                <Button
                                                    className='p-button-sm p-button-outlined'
                                                    icon='pi pi-arrow-left'
                                                    theme='light'
                                                    label="Убрать"
                                                    onClick={() => setItem(null)}
                                                    disabled ={!item.name}
                                                    style={{marginTop: '1rem'}}

                                                />
                                            </div>
                                            {item.apps && item.apps.length ? item.apps.map(ap => (<Tag severity={gettedApp && gettedApp._id === ap._id ? 'primary' : 'info'} key={ap._id}
                                            value={ap.name}
                                            style={{cursor:"pointer", marginLeft: '10px'}}
                                            onClick={()=>setGettedApp(ap)}/>))
                                             : null}
                                            {gettedApp ? <App
                                                app={gettedApp}
                                                updApp={(app, fedChanged=false) => {
                                                    const mapd = fedChanged ?  item.apps.filter(ap => ap._id !== app._id) : item.apps.map(ap => ap._id === app._id ? app : ap)
                                                    const patched = {...item, apps: mapd}
                                                    setItem(patched)

                                                    if (fedChanged) {
                                                        setNeedUpdate(true)
                                                    } else {
                                                        const mapdFeds = feds.map(f => f._id === item._id ? patched : f);
                                                        //console.log('mapdFeds', feds, mapdFeds, patched);
                                                        setFeds(mapdFeds)
                                                    }

                                                }}
                                                allFeds={feds}
                                                fed={item}
                                                toast={toastRef.current}
                                            /> : null}
                                        </div>
                                    )}
                                />
                            </PanelWrapper>
                        )}
                    </div>
                )}
            </div>
}

export default Fed

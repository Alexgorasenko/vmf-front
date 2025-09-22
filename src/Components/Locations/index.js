import React, {useState, useEffect, useRef} from 'react'
import { useHistory } from 'react-router-dom'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { FileUpload } from 'primereact/fileupload'
import { Checkbox } from 'primereact/checkbox'

import CustomScrollbars from 'react-custom-scrollbars-2'

import { CustomInput, PanelWrapper } from '../Atoms'

import SideNotes from '../SideNotes'

import PlayerPhoto from "../../assets/img/soccer-player-1.svg";

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import {Toast} from "primereact/toast";

const formats = [
    {label: 'Все форматы', value: null},
    {label: '11x11', value: '11x11'},
    {label: '9x9', value: '9x9'},
    {label: '8x8', value: '8x8'},
    {label: '7x7', value: '7x7'},
    {label: '6x6', value: '6x6'},
    {label: '5x5', value: '5x5'}
]

const defaultLocation = {
    address: '',
    federationId: '',
    format: '',
    name: ''
}

const Staff = ({ subject, layout }) => {
    const [locations, setLocations] = useState(null)
    const [format, setFormat] = useState(null)
    const [item, setItem] = useState(null)
    const [needUpdate, setNeedUpdate] = useState(true)
    const [tkn, setTkn] = useState(localStorage.getItem('_amateum_subject_tkn'))

    const toastRef = useRef(null)

    useEffect(() => {
        if (needUpdate || tkn !== localStorage.getItem('_amateum_subject_tkn')) {
            if(tkn !== localStorage.getItem('_amateum_subject_tkn')) {
                setLocations(null)
            }

            setTkn(localStorage.getItem('_amateum_subject_tkn'))
            axios.get(`${ENDPOINT}v2/list/locations`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setLocations(resp.data)
                setNeedUpdate(false)
            })
        }
    }, [needUpdate, localStorage.getItem('_amateum_subject_tkn')])

    const updateLocation = () => {
        let newLocations = locations
        newLocations = newLocations.map(nl => {
            if (nl._id === item._id) {
                nl = item
            }
            return nl
        })
        setLocations(newLocations)
        axios.put(`${ENDPOINT}v2/locations/${item._id}`,
            item,
            {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Площадка сохранена!'})
            setItem(null)
        })
    }

    const createLocation = () => {
        axios.post(`${ENDPOINT}v1/store/entity`,
            {
                target: 'self',
                scopeType: 'locations',
                body: item
            },
            {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn'),
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
        }).then(resp => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Площадка добавлена!'})
            setItem(null)
            setNeedUpdate(true)
        })
    }

    return  <div className='locations'>
                <Toast position='top-center' ref={toastRef} />
                <div className='toolbar'>
                    <p className='p-buttonset'>
                        {formats.map((r, i) => (
                            <Button
                                className={`p-button-sm p-button-info ${format !== r.value ? 'p-button-outlined' : ''}`}
                                onClick={() => setFormat(r.value)}
                            >{r.label}</Button>
                        ))}
                    </p>
                </div>

                {!locations ? (
                    <div className='spinner'>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                ) : (
                    <div className='mean'>
                    <CustomScrollbars className='staff-bars' autoHeight autoHeightMin='70vh' autoHide>
                        <div className='staff-grid'>
                            {locations.filter(loc => format ? loc.format === format || !loc.format : loc._id).map((loc, i) => (
                                <div className='person-item card' onClick={() => setItem(loc)}>
                                    <div className='person-info'>
                                        <div className='name'>{loc.name}</div>
                                        <div className='address'>
                                            <Tag severity='secondary'>{loc.address || 'адрес не указан'}</Tag>
                                            <Tag severity='info'>{loc.format || 'все форматы'}</Tag>
                                        </div>
                                    </div>
                                    {loc._id ? <Tag
                                        className='copyLinkBtn'
                                        severity='info'
                                        onClick={(evt) => {
                                            evt.stopPropagation()
                                            //console.log(`https://live.amateum.com/s/${loc._id}`);
                                            navigator.clipboard.writeText(`https://live.amateum.com/s/${loc._id}`)
                                            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Ссылка скопирована в буфер обмена'})
                                        }}
                                        >Скопировать ссылку на оверлей</Tag>
                                     : null}
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
                                        Кликните на карточку площадки для редактирования
                                    </li>
                                    <li>
                                        Или создайте новую👇
                                    </li>
                                </ul>
                            )}
                            primaryAction={{
                                label: 'Добавить площадку',
                                action: () => {
                                    setItem({...defaultLocation, federationId: subject._id})
                                }
                            }}
                        /> : null : (
                            <PanelWrapper resetTrigger={() => setItem(null)} layout={layout} area='location'>
                                <SideNotes
                                    icon='stadium'
                                    content={(
                                        <div className='location-form'>
                                            <CustomInput
                                                type='text'
                                                value={item.name}
                                                onChange={v => {setItem({...item, name: v})}}
                                                icon='pi pi-star'
                                                placeholder='название площадки'
                                            />

                                            <CustomInput
                                                type='dropdown'
                                                value={item.format}
                                                options={formats}
                                                onChange={v => setItem({...item, format: v})}
                                                icon='pi pi-users'
                                                placeholder='Все форматы'
                                            />

                                            <CustomInput
                                                type='text'
                                                value={item.address}
                                                onChange={v => setItem({...item, address: v})}
                                                icon='pi pi-map-marker'
                                                placeholder='адрес площадки'
                                            />

                                            <div className='actions'>
                                                <Button
                                                    className='p-button-sm'
                                                    icon='pi pi-check'
                                                    onClick={() => item._id ? updateLocation() : createLocation()}
                                                >Сохранить площадку</Button>
                                            </div>
                                        </div>
                                    )}
                                />
                            </PanelWrapper>
                        )}
                    </div>
                )}
            </div>
}

export default Staff

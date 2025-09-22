import React, { useEffect, useRef, useState } from "react";
import { useHistory } from 'react-router-dom'

import './style.scss'
import {InputText} from "primereact/inputtext";
import MapMarker from "../../../assets/img/map-marker.svg";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import CustomScrollbars from 'react-custom-scrollbars-2'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu'
import {Chips} from "primereact/chips";
import axios from "axios";
import { ENDPOINT } from '../../../env'
import service from '../service'
import Ranges from "./Ranges";

const LocationAndTime = ({ subject }) => {
    const [locations, setLocations] = useState([])
    const [slots ,setSLots] = useState([])
    const [loaded, setLoaded] = useState(false)

    const toast = useRef(null);
    const menuRef = useRef(null);

    const history = useHistory()

    useEffect(() => {
        if(subject) {
            setLoaded(false)
            axios.get(`${ENDPOINT}v2/relations/locations?federationId=${subject.federationId}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            })
                .then(suggs => {
                    setLocations(suggs.data)
                })

                axios.get(`${ENDPOINT}v2/relations/slots?tournamentId=${subject._id}`, {
                    headers: {
                        authorization: localStorage.getItem('_amateum_subject_tkn')
                    }
                })
                .then(suggs => {
                    setSLots(suggs.data)
                    setLoaded(true)
                })
        }
    },[subject])

    const updateSlots = () => {
        setTimeout(() => {
            axios.get(`${ENDPOINT}v2/relations/slots?tournamentId=${subject._id}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            })
                .then(suggs => {
                    setSLots(suggs.data)
                })
        }, 250);
    }

    const accept = (_id) => {
        service.removeLocationSlot(_id, toast).then()
        updateSlots()
        toast.current.show({ severity: 'info', summary: 'Подтверждено', detail: 'Площадка удалена', life: 3000 });
    };

    const confirm2 = (event, _id) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Вы действительно хотите отвязать площадку от турнира?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: () => accept(_id)
        });
    };

    const unusedLocations = locations ? locations.filter(loc => !slots.map(s => s.locationId).includes(loc._id)) : []

    return(
        <div className={'location-and-time'}>
            <Toast ref={toast} />

            <CustomScrollbars className='bars' autoHide autoHeight autoHeightMin='78vh'>
                <div className='fields-grid triple-row' style={{paddingTop: 10, margin: '0 15px 15px', maxWidth: '73vw'}}>
                    {slots.map(slot => {
                        const loc = locations.find(l => l._id === slot.locationId)

                        return  <div className='fields-group' key={slot._id}>
                                    <Tag className='group-title'>{loc ? loc.name : 'Поле 1'}</Tag>

                                    <div className={'location-background'}>
                                        <div className={'dates'}>
                                            <Ranges slot={slot} updateSlots={updateSlots} toast={toast}/>
                                            <ConfirmPopup />
                                        </div>
                                    </div>
                                    <div className='cancel-wrap'>
                                        <Button
                                            onClick={(event) => confirm2(event, slot._id)}
                                            icon="pi pi-times"
                                            className="p-button-rounded p-button-danger p-button-outlined"
                                            aria-label="Cancel"
                                        />
                                    </div>
                                </div>
                        })}

                    <div className='fields-group action-group'>
                        <div className='action-group-body'>
                            <i className='pi pi-map-marker'></i>

                            {!unusedLocations.length && loaded ? (
                                <div className='notice'>Нет {!slots.length ? 'доступных' : 'непривязанных'} площадок. Создайте их в разделе «Площадки»</div>
                            ) : null}

                            <Button
                                className='p-button-sm'
                                onClick={e => !unusedLocations.length ? history.push('/locations') : menuRef.current.toggle(e)}
                            >{!unusedLocations.length ? 'Перейти в раздел' : 'Добавить площадку'}</Button>
                            <Menu
                                popup
                                ref={menuRef}
                                model={unusedLocations.map(ul => ({
                                    label: ul.name,
                                    command: (e) => {
                                        menuRef.current.toggle(e)
                                        service.addLocationSlot(ul._id, subject._id, toast).then()
                                        updateSlots()
                                    }
                                }))}
                            />
                        </div>
                    </div>
                </div>
            </CustomScrollbars>
        </div>
    )
}

export default LocationAndTime

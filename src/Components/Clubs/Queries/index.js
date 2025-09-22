import React, {useEffect, useRef, useState} from "react";

import './style.scss'
import {InputText} from "primereact/inputtext";
import MapMarker from "../../../assets/img/map-marker.svg";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";
import { Toast } from 'primereact/toast';
import {Chips} from "primereact/chips";
import axios from "axios";
import { ENDPOINT } from '../../../env'
import service from '../service'

const rangesDefault = {
    'mon': [],
    'tue': [],
    'wed': [],
    'thu': [],
    'fri': [],
    'sat': [],
    'sun': []
}


const LocationAndTime = ({subject}) => {
    const [day1, setDay1] = useState(null);
    const [day2, setDay2] = useState(['20:45']);
    const [day3, setDay3] = useState(['20:45']);
    const [day4, setDay4] = useState(null);
    const [day5, setDay5] = useState(['--:--','21:45','20:45']);
    const [day6, setDay6] = useState(null);
    const [day7, setDay7] = useState(null);
    const [value2, setValue2] = useState('');

    const [locations, setLocations] = useState([])

    const [slots ,setSLots] = useState([])

    useEffect(() => {
        axios.get(`${ENDPOINT}v2/relations/locations?federationId=${subject.federationId}`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        })
            .then(suggs => {
                setLocations(suggs.data)
            })
        axios.get(`${ENDPOINT}v2/relations/slots?tournamentId=${subject.leagueId}`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        })
            .then(suggs => {
                setSLots(suggs.data)
            })
    },[])

    const updateSlots = () => {
        setTimeout(() => {
            axios.get(`${ENDPOINT}v2/relations/slots?tournamentId=${subject.leagueId}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            })
                .then(suggs => {
                    setSLots(suggs.data)
                })
        }, 150);
    }

    const updateRanges = (slot, day, time) => {
        const creRanges = rangesDefault
        creRanges[day].push(time.value)
        setSLots(prevState => {prevState.find(el => el._id = slot._id).ranges = creRanges; return prevState})
        console.log(slots)
    }

    const createRanges = (slot) => {
        const creRanges = rangesDefault
        setSLots(prevState => {prevState.find(el => el._id = slot._id).ranges = creRanges; return prevState})
        console.log(slots)
    }

    const toast = useRef(null);

    const accept = (_id) => {
        service.removeLocationSlot(_id, toast).then()
        updateSlots()
        // setSLots(prevState => prevState.filter(el => el._id !== _id))
        toast.current.show({ severity: 'info', summary: 'Подтверждено', detail: 'Площадка удалена', life: 3000 });
    };

    const confirm2 = (event, _id) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Вы действительно хотите удалить площадку?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: () => accept(_id)
        });
    };

    return(
        <div className={'location-and-time'}>
            <Toast ref={toast} />
            <div className={'title'}>
                <div className={'text'}>Добавить площадку</div>
                <InputText value={value2} onChange={(e) => setValue2(e.target.value)} />
                {(value2 !== '') ? <div className={'slidemenu'}>
                    <div className={'menu'}>
                        {locations.map(item => {
                            return (item.name.toUpperCase().includes(value2.toUpperCase()) && !slots.find(el => el.locationId === item._id)) ? <div className={'menu-item'} onClick={() => {service.addLocationSlot(item._id, subject.leagueId, toast).then(); setValue2(''); updateSlots();}}>
                                <div className={'icon'}><img src={MapMarker}/></div>
                                <div className={'label'}>{item.name}</div>
                            </div> : null
                        })}
                    </div>
                </div> : null}
                <div className={'text'}>Заявленные площадки:</div>
            </div>
            {slots.map(slot => {
                return <div className={'location'}>
                    <Tag className="tag" severity="info" value={locations.map(location => {
                        if (location._id.includes(slot.locationId)) return location.name
                    })}></Tag>
                    <div className={'location-background'}>
                        <div className={'dates'}>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Понедельник</span>
                                <span className="p-float-label">
                                    <Chips value={day1} onChange={(e) => updateRanges(slot, 'mon', e)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Вторник</span>
                                <span className="p-float-label">
                                    <Chips value={day2} onChange={(e) => setDay2(e.value)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Среда</span>
                                <span className="p-float-label">
                                    <Chips value={day3} onChange={(e) => setDay3(e.value)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Четверг</span>
                                <span className="p-float-label">
                                    <Chips value={day4} onChange={(e) => setDay4(e.value)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Пятница</span>
                                <span className="p-float-label">
                                    <Chips value={day5} onChange={(e) => setDay5(e.value)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Суббота</span>
                                <span className="p-float-label">
                                    <Chips value={day6} onChange={(e) => setDay6(e.value)}/>
                                </span>
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">Воскресенье</span>
                                <span className="p-float-label">
                                    <Chips value={day7} onChange={(e) => setDay7(e.value)}/>
                                </span>
                            </div>
                            <ConfirmPopup />
                            <Button onClick={(event) => confirm2(event, slot._id)} icon="pi pi-times" className="p-button-rounded p-button-danger p-button-outlined" aria-label="Cancel" />
                        </div>

                    </div>
                </div>
            })}
        </div>
    )
}

export default LocationAndTime
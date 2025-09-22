import React, { useState, useEffect, useRef } from 'react'

import './style.scss'
import {InputText} from "primereact/inputtext";
import { Toast } from 'primereact/toast'

import {Tag} from "primereact/tag";
import { Menu } from 'primereact/menu'
import {Button} from "primereact/button";
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';

import CustomScrollbars from 'react-custom-scrollbars-2'

//import TeamRequestModal from "./TeamRequestModal";
import SponsorData from "./SponsorData";

import axios from 'axios'
import { ENDPOINT } from '../../../../env'
import service from '../../service'

const Sponsors = ({ subject, maintoast, updateClub, reload, manage, layout, allTournaments }) => {
    //const [query, setQuery] = useState('');
    const [sponsors, setSponsors] = useState(subject.sponsors || [])
    //const [quering, setQuering] = useState(false)
    const [isreloaded, setReloaded] = useState(true)

    useEffect(() => {
        setReloaded(false)

        //console.log('check selected', selectedTeam);
        if (subject && subject.sponsors && subject.sponsors.length) {
            setSponsors(subject.sponsors)
        } else {
            setSponsors([])
        }

    }, [subject])

    const toast = useRef(null)

    const addSponsor = () => {
        const newItem = {
            _id: 'newTeam',
            name: '',
            subjectId: subject._id,
            subjectType: 'club',
            logo: null,
        }

        const t = sponsors.find(c => c._id.toString() === newItem._id);
        if (!t) {
            const addedList = sponsors ? [...sponsors, newItem] : [newItem];
            setSponsors(addedList)
        }
    }

    // const setCanonical = async (team) => {
    //
    //     for (let t of sponsors) {
    //         if (t._id.toString() === team._id.toString() && !t.canonical) {
    //             await service.simpleUpdate(team._id, {canonical: true}, 'sponsors', maintoast)
    //         } else if (t.canonical) {
    //             await service.simpleUpdate(t._id, {canonical: false}, 'sponsors')
    //         }
    //     }
    //     const mapd = sponsors.map(t => t._id.toString() === team._id.toString() ? {...t, canonical: true} : t.canonical ? {...t, canonical: false} : t);
    //     setTeams(mapd)
    // }

    return isreloaded ? (
        <div style={{width: "1200px", marginTop: "20px", display: "flex", justifyContent:"flex-start"}}>
            <div style={{marginRight:"30px"}}>
                    <Skeleton width="250px" height="200px" className="mb-2" borderRadius="16px"></Skeleton>
            </div>
            <div style={{marginRight:"30px"}}>
                    <Skeleton width="350px" height="200px"  className="mr-2" borderRadius="16px"></Skeleton>
            </div>
            <div style={{marginRight:"30px"}}>
                    <Skeleton width="350px" height="200px" borderRadius="16px"></Skeleton>
            </div>
        </div>
        ) : (
        <div className={'sponsors'}>
            {/*<Tag className='group-title'>Спонсоры</Tag>*/}

            <div className={'sponsors-content'}>
                {sponsors && sponsors.length &&(layout !== 'mobile') ? <CustomScrollbars  autoHide autoHeight autoHeightMin={60} autoHeightMax={500}>
                    <div className='sponsors-list'>
                        {sponsors.map(team => (
                            <SponsorData
                                toast={toast.current}
                                data={team}
                                club={subject}
                                allTournaments={allTournaments}
                                layout={layout}
                                reload={() => {
                                    setReloaded(true);
                                }}
                                pushTeam={team => {
                                    const ind = sponsors.findIndex(item => item._id.toString() === team._id.toString());

                                    if (ind > -1) {
                                        const mapd = sponsors.map((item, indx) => indx === ind ? team : item);
                                        updateClub({sponsors: mapd});
                                        setSponsors(mapd)
                                    } else {
                                        updateClub({sponsors: sponsors.concat([team])});
                                        setSponsors(sponsors.concat([team]))
                                    }
                                }}
                                patchTeam={(id, patch) => {
                                    const ind = sponsors.findIndex(item => item._id.toString() === id.toString());
                                    //console.log('patchTeam', id, patch, ind);
                                    if (ind > -1) {
                                        const mapd = sponsors.map((item, indx) => indx === ind ? {...item, ...patch} : item);
                                        const filtred = id === 'newTeam' ? mapd.filter(t => t._id !== id) : mapd
                                        updateClub({sponsors: filtred});
                                        //console.log('mapd teams', mapd);
                                        setSponsors(filtred)
                                    }
                                }}
                                removeTeam={async (id) => {
                                    const ind = sponsors.findIndex(item => item._id.toString() === id.toString());
                                    //console.log('patchTeam', id, patch, ind);
                                    if (ind > -1) {
                                        await service.removeData('sponsors', id, toast.current)
                                        const filtred = sponsors.filter(t => t._id !== id)
                                        updateClub({sponsors: filtred});
                                        //console.log('mapd sponsors', mapd);
                                        setSponsors(filtred)
                                    }
                                }}
                            />
                        ))}
                    </div>
                </CustomScrollbars> : null}
                {layout !== 'mobile' ? <Button
                    label="Добавить спонсора"
                    icon="pi pi-plus"
                    className={'teamadd p-button-sm'}
                    //loading={loading}
                    onClick={async () => {
                        //setLoading(true)
                        addSponsor();
                    }}
                /> : null}

            </div>

        </div>
    )
}

export default Sponsors

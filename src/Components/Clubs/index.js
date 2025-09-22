import React, { useState, useEffect, useRef, useContext } from 'react'
import {Tag} from "primereact/tag";

import './style.scss'
//import IconBadge from '../../assets/img/badge.svg'
import { WorkspaceContext } from '../../ctx'

import { Toast } from 'primereact/toast'
import {InputText} from "primereact/inputtext";
import {classNames} from "primereact/utils";
import Settings from "./Settings";
import Teams from "./Teams";
import Representatives from './Representatives';
import Queries from "./Queries";
import { Button } from "primereact/button";
import { Skeleton } from 'primereact/skeleton';

import { Splide, SplideSlide } from '@splidejs/react-splide'

import { CustomTabMenu } from '../Atoms'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import Request from "./Request";
import {useHistory} from "react-router-dom";
import qs from "qs";
import { debounce } from 'throttle-debounce';
import CustomScrollbars from "react-custom-scrollbars-2";

const components = {
    settings: Settings,
    teams: Teams,
    representative: Representatives,
    //request: Request
}

const items = [
    {label: 'Основное', id: 'settings', icon: 'pi pi-fw pi-cog'},
    {label: 'Команды', id: 'teams', icon: 'pi pi-fw pi-star'},
    {label: 'Представители', id: 'representative', icon: 'pi pi-fw pi-users'}
]

const Clubs = ({ subject, profile, manage, layout }) => {
    const [clubsList, setClubsList] = useState(null)
    const [clubsQuered, setClubsQuered] = useState(null)
    const [selectedClub, setSelectedClub] = useState(null)
    //const [tab, setTab] = useState('settings')
    const [clubSubject, setClubSubject] = useState(null)
    const searchString = qs.parse(window.location.search.replace('?',''))
    const [tabIndex, setTabIndex] = useState(searchString.tournamentId && searchString.tournamentId.length === 24 ? 1 : 0)
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const splideRef = useRef(null)
    const toast = useRef(null)

    const ctx = useContext(WorkspaceContext)

    useEffect(() => {
        if(subject) {
            reload()
        }
    }, [subject])

    /*useEffect(() => {
        const tkn = localStorage.getItem('_amateum_subject_tkn')
        getClubs()
        axios.get(`${ENDPOINT}v2/list/tournaments`, {
            headers: {
                Authorization: tkn
            }
        }).then(resp => {
            setLoading(false);
            ctx.setWorkspace({
                ...ctx.workspace,
                allTournaments: resp.data
            })

        })
    }, [localStorage.getItem('_amateum_subject_tkn')])*/

    useEffect(() => {
        if(ctx.workspace && ctx.workspace.allTournaments) {
            setTournaments(ctx.workspace.allTournaments)
        }
    }, [ctx.workspace])

    useEffect(() => {
        if (selectedClub) {
            getClubData(selectedClub)
        } else {
            setClubSubject(null)
        }
    }, [selectedClub])

    const getClubData = club => {
        if (manage) {
            setClubSubject(club)
        } else {
            const clubsubj = clubsList && clubsQuered && club ? clubsQuered.find(t => club._id ? t._id.toString() === club._id.toString() : t._id.toString() === club) : null;
            if (club === 'newClub') {
                setClubSubject(clubsubj)
            } else {
                const token = localStorage.getItem('_amateum_subject_tkn')
                //setLoading(true)
                axios.get(`${ENDPOINT}v2/checkClubData/${club._id ? club._id : club}`, {
                    headers: {
                        Authorization: token
                    }
                })
                .then(resp => {

                    if (resp && resp.data && resp.data._id) {
                        const redTms = resp.data.teams.reduce((acc, t) => {
                            if (t._id && !acc[t._id]) {
                                acc[t._id] = t.isEmpty || false
                            }
                            return acc
                        },{})
                        const mrgdClub = {
                            ...clubsubj,
                            isEmpty: resp.data.isEmpty || false,
                            teams: clubsubj.teams.map(t => ({
                                ...t,
                                isEmpty: redTms[t._id]
                            }))
                        }
                        setClubSubject(mrgdClub)
                    } else {
                        setClubSubject(clubsubj)
                    }
                })
                .catch((e) => {
                    setClubSubject(clubsubj)
                })
                //.finally(() => setLoading(false))
            }
        }
    }

    const reload = (isDelete=false) => {
        const token = localStorage.getItem('_amateum_subject_tkn')
        setLoading(true)
        axios.get(`${ENDPOINT}v2/list/clubs`, {
            headers: {
                Authorization: token
            }
        })
        .then(resp => {
            if (manage && resp.data && !selectedClub) {
                setSelectedClub(resp.data.club)
            } else {
                setClubsList(resp.data.clubs)
                setClubsQuered(resp.data.clubs)
                setSelectedClub(selectedClub ? isDelete ? null : selectedClub : null)
                setClubSubject(clubSubject ? isDelete ? null : clubSubject : null)
            }

            ctx.setWorkspace({
                ...ctx.workspace,
                allTournaments: resp.data.tournaments
            })
        })
        .finally(() => setLoading(false))
    }

    const getClubs = (clubterm) => {
        const token = localStorage.getItem('_amateum_subject_tkn')
        //const token = subject && subject.token ? subject.token : localStorage.getItem('_amateum_subject_tkn');

        if (token) {
            setLoading(true)
            setSelectedClub(null)

            axios.get(`${ENDPOINT}v2/list/clubs${clubterm ? `?clubterm=${clubterm}` : '' }`, {
                headers: {
                    Authorization: token
                }
            })
            .then(resp => {
                setSelectedClub(null)
                const { data } = resp;

                if (data && data.clubs) {
                    if (clubterm) {
                        //const added = clubsList ? Array.from(new Set(clubsList.concat(resp.data))) : resp.data
                        const added = clubsList ? [...clubsList] : [];

                        if (data.clubs.length) {
                            if (added.length) {
                                for (let cl of data.clubs) {
                                    const club = clubsList.find(c => c._id.toString() === cl._id.toString())
                                    if (!club) {
                                        added.push(cl)
                                    }
                                }
                            } else {
                                added.push(...resp.data.clubs)
                            }
                        }

                        const filtred = added.filter(cl => cl.name.toLowerCase().includes(query.toLowerCase()))
                        setClubsList(added)
                        setClubsQuered(filtred)
                    } else {
                        setClubsList(data.clubs)
                        setClubsQuered(data.clubs)
                    }
                }
            })
            .catch(err => console.log('get club list faild', err))
            .finally( () => setLoading(false))
        }
    }

    /*useEffect(() => {
        if(!manage) {
            getClubs()
            //getTourns()
        }
    }, [localStorage.getItem('_amateum_subject_tkn')])*/

    useEffect(() => {
        if (query && query.length > 1) {

            const debounceFunc = debounce(1000, query => getClubs(query));

            debounceFunc(query)
        } else {
            setClubsQuered(clubsList)
            setSelectedClub(null)
        }
    }, [query])

    const onClickTab = (e) =>{
        setTabIndex(e.index)
    }

    const updateClub = (obj, isNewClub=false) => {
        //console.log('updateClub', selectedClub, 'obj', obj, isNewClub);
        if (manage && selectedClub) {
            setSelectedClub({...selectedClub, ...obj})
            //setClubSubject({...selectedClub, ...obj})
            //setSelectedClub(selectedClub._id || null)
        } else {
            const clubsubject = clubsList && selectedClub ? clubsList.find(t => selectedClub._id ? t._id.toString() === selectedClub._id.toString() : t._id.toString() === selectedClub.toString()) : null
            //console.log('clubsubject', clubsubject);
            if(clubsubject) {
                const mapd = clubsList.map(t => t._id.toString() === clubsubject._id.toString() ? {...t, ...obj} : t)
                const filtred = isNewClub ? mapd.filter(c => c.id !== 'newClub' && c._id !== 'newClub') : mapd
                setClubsList(filtred)
                setClubsQuered(filtred)
                if (isNewClub) {
                    setSelectedClub(obj._id)
                } else {
                    const mergedClub = {...clubsubject, ...obj};
                    //console.log('mergedClub', mergedClub);
                    setClubSubject(mergedClub)
                }
            }
        }
    }

    const addClub = () => {
        //console.log('loading', loading);
        const newClub = {
            _id: 'newClub',
            name: '',
            countryId: null,
            territoryId: null,
            settlementId: null,
            created: '',
            emblem: '',
            colors: null,
            socials: null
        }

        const cl = clubsList ? clubsList.find(c => c._id === newClub._id) : null;
        if (!cl) {
            const addedList = clubsList ? [newClub, ...clubsList] : [newClub];
            //console.log('addedList', addedList);

            setClubsList(addedList)
            setClubsQuered(addedList)
        }
        //console.log('addClub', cl, newClub);
        setSelectedClub(newClub._id)
        setTabIndex(0)
    }

    const Specified = components[items[tabIndex].id] || null
    //console.log('selectedClub', selectedClub, clubsList, clubsQuered, clubsubject);
    //console.log('CCqd', clubsQuered)

    return (
        <div className={'clubs'+(manage ? ' manage' : '')}>
            <Toast ref={toast} position='bottom-right' />
            {!manage ? (
                <div className='clubs-query'>
                    <div className='clubs-actions'>
                        <InputText
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            name='query'
                            placeholder='Поиск клуба по названию'
                            autoComplete='off'
                            autoFocus
                        />
                        <Button
                            label="Создать новый клуб"
                            icon="pi pi-plus"
                            className={'button-add p-button-sm'}
                            //loading={loading}
                            disabled={loading}
                            onClick={() => {
                                //setLoading(true)
                                addClub();
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {!manage && subject ? <div className={'clubs-list'}>
                {clubsList && !loading ? clubsList.length ? (
                    <Splide
                        ref={splideRef}
                        options={{
                            pagination: false,
                            fixedWidth: 220,
                            gap: 30
                        }}
                    >
                        {clubsQuered.map((club, i) => {
                            const originEmb = club.emblem || (club.origin && club.origin.emblem ? club.origin.emblem : require('./pennant.png'))

                            return <SplideSlide key={club._id || `club_${i}`}>
                                <div className={`club${(club._id === selectedClub) ? ' selected' : ''}`} onClick={() => setSelectedClub(club._id)}>
                                    <img src={originEmb} className={'icon'}/>
                                    <div className={'name'}>
                                        <div className={'title'}>{club.name}</div>
                                        {club.settlement ? <Tag className="tag" severity="info" value={club.settlement ? club.settlement.name : null} style={{background: (club._id === selectedClub) ? '#DADAFC' : '#F5F9FF'}}></Tag> : null}
                                    </div>
                                </div>
                            </SplideSlide>}
                        )}
                    </Splide>
                ) : null : loading ? <div style={{width: "1200px", marginTop: "20px", display: "flex", justifyContent:"space-between"}}>
                        <Skeleton width="220px" height="100px" borderRadius="16px"></Skeleton>
                        <Skeleton width="220px" height="100px" borderRadius="16px"></Skeleton>
                        <Skeleton width="220px" height="100px" borderRadius="16px"></Skeleton>
                        <Skeleton width="220px" height="100px" borderRadius="16px"></Skeleton>
                        <Skeleton width="220px" height="100px" borderRadius="16px"></Skeleton>
                </div> : !manage ? 'данные не найдены' : null}
            </div> : null}

            {Specified && clubSubject ? (
                <div className={'content within-list'}>
                    <div className='tabmenu'>
                        <CustomTabMenu model={items} activeIndex={tabIndex} onTabChange={(e) => onClickTab(e)}/>
                    </div>
                    <CustomScrollbars autoHide autoHeight autoHeightMin='57vh'>
                        <Specified
                            layout={layout}
                            profile={profile}
                            subject={clubSubject}
                            reload={reload}
                            maintoast={toast.current}
                            updateClub={updateClub}
                            allTournaments={tournaments}
                            manage={manage}
                        />
                    </CustomScrollbars>
                </div>
            ) : loading || (!clubsQuered || !clubsQuered.length) ? null : <div className='holder'>Выберите клуб для редактирования</div>}
        </div>
    )
}

export default Clubs

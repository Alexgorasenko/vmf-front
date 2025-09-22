import React, { useState, useEffect, useRef } from 'react'

import './style.scss'
import {InputText} from "primereact/inputtext";

import TeamIcon from '../../../assets/img/team1icon.svg'
//import emblem from "../../Emblem";
import Emblem from '../../Emblem'
import {Tag} from "primereact/tag";
import { Menu } from 'primereact/menu'
import {Button} from "primereact/button";
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';

import CustomScrollbars from 'react-custom-scrollbars-2'

//import TeamRequestModal from "./TeamRequestModal";
import TeamData from "./TeamData";

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import service from '../service'

const Teams = ({ subject, maintoast, updateClub, reload, manage, layout, allTournaments }) => {
    //const [query, setQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teams, setTeams] = useState(subject.teams || [])
    //const [quering, setQuering] = useState(false)
    const [isreloaded, setReloaded] = useState(false);

    const menuRef = useRef(null)

    useEffect(() => {
        setReloaded(false)

        //console.log('check selected', selectedTeam);
        if (subject && subject.teams && subject.teams.length) {
            setTeams(subject.teams)
            if (!selectedTeam) {
                setSelectedTeam(subject.teams[0])
            } else {
                setSelectedTeam(subject.teams.find(t => t._id.toString() === selectedTeam._id.toString()) || subject.teams[0])
            }
        } else {
            setTeams([])
            setSelectedTeam(null)
        }

    }, [subject])

    const addTeam = () => {
        const newTeam = {
            _id: 'newTeam',
            name: '',
            clubId: subject._id,
            age: null,
            canonical: false,
        }

        const t = teams.find(c => c._id.toString() === newTeam._id);
        if (!t) {
            const addedList = teams ? [...teams, newTeam] : [newTeam];
            setTeams(addedList)
        }
        setSelectedTeam(newTeam)
    }

    const setCanonical = async (team) => {

        for (let t of teams) {
            if (t._id.toString() === team._id.toString() && !t.canonical) {
                await service.simpleUpdate(team._id, {canonical: true}, 'teams', maintoast)
            } else if (t.canonical) {
                await service.simpleUpdate(t._id, {canonical: false}, 'teams')
            }
        }
        const mapd = teams.map(t => t._id.toString() === team._id.toString() ? {...t, canonical: true} : t.canonical ? {...t, canonical: false} : t);

        //console.log('setCanonical team', team, mapd);

        setSelectedTeam(team)
        setTeams(mapd)
    }

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
        <div className={'teams'}>
            <div className={'teams-content'}>
                {teams && teams.length &&(layout !== 'mobile') ? <CustomScrollbars  autoHide autoHeight autoHeightMin={60} autoHeightMax={500}>
                    <div className='teams-list'>
                        {teams.map(team => (
                            <div className='team-btn' key={team._id}>
                                <Button
                                    className={'p-button-sm p-button-info'+(selectedTeam && (selectedTeam._id !== team._id) ? ' p-button-outlined' : '')}
                                    onClick={() => setSelectedTeam(team)}
                                >{team.name}</Button>

                                {team.canonical ? (
                                    <Tag className="tag" severity="info" value='Основная команда'/>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </CustomScrollbars> : null}
                {layout !== 'mobile' ? <Button
                    label="Добавить команду"
                    icon="pi pi-plus"
                    className={'teamadd p-button-sm'}
                    //loading={loading}
                    onClick={async () => {
                        //setLoading(true)
                        addTeam();
                    }}
                /> : null}

                {layout === 'mobile' ? (
                    <div className='p-inputgroup'>
                        <Dropdown
                            options={teams}
                            optionLabel='name'
                            value={selectedTeam}
                            onChange={e => setSelectedTeam(e.target.value)}
                        />
                        <Button
                            icon='pi pi-plus-circle'
                            onClick={async () => addTeam()}
                        />
                    </div>
                ) : null}
            </div>

            {selectedTeam ? (
                <TeamData
                    data={selectedTeam}
                    toast={maintoast}
                    club={subject}
                    allTournaments={allTournaments}
                    layout={layout}
                    reload={() => {
                        setReloaded(true);
                        reload()
                    }}
                    pushTeam={team => {
                        const ind = teams.findIndex(item => item._id.toString() === selectedTeam._id.toString());

                        if (ind > -1) {
                            const mapd = teams.map((item, indx) => indx === ind ? team : item);
                            updateClub({teams: mapd});
                            setTeams(mapd)
                        } else {
                            updateClub({teams: teams.concat([team])});
                            setTeams(teams.concat([team]))
                        }
                        setSelectedTeam(team)

                    }}
                    patchTeam={(id, patch) => {
                        const ind = teams.findIndex(item => item._id.toString() === id.toString());
                        //console.log('patchTeam', id, patch, ind);
                        if (ind > -1) {
                            const mapd = teams.map((item, indx) => indx === ind ? {...item, ...patch} : item);
                            const filtred = id === 'newTeam' ? mapd.filter(t => t._id !== id) : mapd
                            updateClub({teams: filtred});
                            //console.log('mapd teams', mapd);
                            setTeams(filtred)
                            setSelectedTeam({...teams[ind], ...patch})
                        }
                    }}
                    removeTeam={async (id) => {
                        const ind = teams.findIndex(item => item._id.toString() === id.toString());
                        //console.log('patchTeam', id, patch, ind);
                        if (ind > -1) {
                            await service.removeData('teams', id, maintoast)
                            const filtred = teams.filter(t => t._id !== id)
                            updateClub({teams: filtred});
                            //console.log('mapd teams', mapd);
                            setTeams(filtred)
                            setSelectedTeam(filtred[0] ? {...filtred[0]} : null)
                        }
                    }}
                    setCanonical={setCanonical}
                    manage={manage}
                />
            ) : null}
        </div>
    )
}

export default Teams

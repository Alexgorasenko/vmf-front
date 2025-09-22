import React, { useState, useEffect, useRef } from 'react'

import './style.scss'
import {InputText} from "primereact/inputtext";

import Emblem from '../../Emblem'
import { Menu } from 'primereact/menu'
import TeamRequestModal from "./TeamRequestModal";

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import TeamData from "./TeamData";
import { NonIdealState } from '../../Atoms'
import CustomScrollbars from "react-custom-scrollbars-2";

const Teams = ({ subject, toast, updateTournament, layout }) => {
    const [query, setQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [options, setOptions] = useState([])
    const [quering, setQuering] = useState(false)
    const [teams, setTeams] = useState([])

    const menuRef = useRef(null)

    useEffect(() => {
        if(query.length > 2 && !quering) {
            setQuering(true)
            axios.get(`${ENDPOINT}v2/list/queryTeams?query=${query}`, {
                    headers: {
                        authorization: localStorage.getItem('_amateum_subject_tkn')
                    }
                })
                .then(suggs => {
                    const filtred = suggs.data.filter(s => !subject.teams.find(t => t._id === s._id)).sort((s1, s2) => s1.name.toUpperCase().indexOf(query.toUpperCase()) > s2.name.toUpperCase().indexOf(query.toUpperCase()) ? 1 : -1)

                    setOptions(filtred)
                    setQuering(false)
                })
        } else {
            setQuering(false)
            setOptions([])
        }
    }, [query])

    const updateTeamsList = (teamId) => {
        updateTournament({teams: subject.teams.filter(t => t._id !== teamId)})
    }

    useEffect(() => {
        setTeams(subject.teams.reduce((o, i) => {
            if (!o.find(v => v._id === i._id)) {
                o.push(i);
            }
            return o;
        }, []))
    }, [subject])

    return (
        <div className={'tournament-teams'}>
            {selectedTeam ? (
                <TeamRequestModal
                    data={selectedTeam}
                    isVisible={true}
                    onClose={() => setSelectedTeam(null)}
                    toast={toast}
                    tournamentId={subject._id}
                    pushTeam={team => {
                        updateTournament({teams: subject.teams.concat([team])})
                        setOptions([])
                        setQuering(false)
                        setQuery('')
                    }}
                    updateTeam={(team, players) => {
                        const _team = {...team, squad: {...team.squad, players: players}}
                        updateTournament({teams: subject.teams.filter(st => st._id !== team._id).concat([_team])})
                    }}
                />
            ) : null}

            <div className={'title'} style={{alignItems: teams.length ? 'flex-start' : 'center'}}>
                <div className={'text'}>{teams.length ? 'Добавить команду:' : 'Поиск команды по названию'}</div>
                <span className="p-input-icon-right" style={{width: 390, marginBottom: 39}}>
                    {quering ? <i className="pi pi-spin pi-spinner" /> : null}
                    <InputText
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            menuRef.current[e.target.value.length > 2 ? 'show' : 'hide'](e)
                        }}
                        icon='pi pi-spin pi-spinner'/>
                </span>
                <Menu
                    ref={menuRef}
                    style={{width: 390}}
                    popup
                    model={options.map(opt => ({
                        label: opt.name,
                        icon: <Emblem size='xs' source={opt.club.emblem || require('./TeamData/pennant.png')} />,
                        command: () => {
                            setSelectedTeam({...opt})
                        }
                    }))}
                />
                {teams.length ? <div className={'text'}>Уже участвуют {teams.length} команд:</div> : null}
            </div>
            <CustomScrollbars autoHide autoHeight autoHeightMin='60vh'>
                <div className={'teams-content'}>
                    {teams.length ? teams.sort((t1, t2) => t1.name > t2.name ? 1 : -1).map(team => {
                        return <TeamData key={team._id} team={team} layout={layout} updateTeamsList={updateTeamsList} toast={toast} setSelectedTeam={setSelectedTeam}/>
                    }) : (
                        <NonIdealState
                            icon='pi pi-search'
                            text='используйте поле поиска, чтобы добавить первую команду в турнир'
                        />
                    )}
                </div>
            </CustomScrollbars>
        </div>
    )
}

export default Teams

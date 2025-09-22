import React, { useState, useEffect } from 'react'

import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown';
import {Link, useLocation} from "react-router-dom";
import service from '../../service'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

import MatchBindPanel from './Atoms/MatchBindPanel'

const Matchday = ({ groups, day, updMatchDay, type, teams, ind, toast, updMatchDayAndApply, isGridMD, isGridRound, lockedName, updateName, mds }) => {
    const [matches, setMatches] = useState(day ? day.matches : [])
    const [name, setName] = useState(day ? day.name : '')
    const [restTeams, setRestTeams] = useState(teams)

    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false)

    useEffect(() => {
        if (day) {
            setMatches(day.matches || [])
            setName(day.name || [])

            const msteams = day.matches && day.matches.length ? day.matches.reduce((acc, m) => {
                if (m.homeId && !acc[m.homeId]) {
                    acc[m.homeId] = m.home
                }
                if (m.awayId && !acc[m.awayId]) {
                    acc[m.awayId] = m.away
                }
                return acc
            }, {}) : {}
            setRestTeams(teams.filter(t => !msteams[t._id]))
            setLoading(false)
        }
    },[day])

    const updmd = async () => {
        updMatchDayAndApply({...day, matches: matches}, ind)
        setEditMode(false)
    }

    const updMatches = (match, index) => {
       const updated = [...matches.slice(0, index), match, ...matches.slice(index+1) ];

        const reduced = updated.reduce((acc, cur) => {
            if (cur.homeId && !acc[cur.homeId]) {
                acc[cur.homeId] = cur.home;
            }
            if (cur.awayId && !acc[cur.awayId]) {
                acc[cur.awayId] = cur.away;
            }
            return acc
        },{})

        const matchesTeams = Object.keys(reduced);

        const filtredTeams = teams.filter(item => !matchesTeams.includes(item._id.toString()))

        setRestTeams(filtredTeams)
        setMatches(updated)

        if (type !== 'manual' || isGridMD) {
            updMatchDay({...day, matches: updated}, ind)
        }
    }

    const isChanged = () => {
        const defms = day.matches && day.matches.length ? day.matches.filter(m => !m._id && m.homeId && m.awayId ).length : 0;
        const curms = matches.length ? matches.filter(m => !m._id && m.homeId && m.awayId ).length : 0;

        return !!((defms && curms !== defms) || (!defms && curms))
    }

    const bindOptions = isGridMD && matches && matches.length ? matches.map(m => ({home: m.home, away: m.away, derivativeBind: m.derivativeBind, _id: m._id})) : null

    const changeName = (value) => {
        /*if (day.name.replace(/[0-9]+/g, '').replace(' ', '') === value.replace(/[0-9]+/g, '').replace(' ', '') && (value.match(/\d+/) ? value.match(/\d+/)[0] <= mds : true)){
            const string = (value.match(/\d+/) ? value.match(/\d+/)[0] : '') + ' ' + value.replace(/[0-9]+/g, '').replace(' ', '');
            setName(string)
        }*/
        if (value <= mds) {
            const string = value + ' ' + day.name.replace(/[0-9]+/g, '').replace(' ', '');
            setName(string)
        }
    }

    return  day ? <div className='matchday-card'>
                <div className="matchday-name">
                    <span className='p-inputgroup'>
                        <InputText
                            disabled={lockedName}
                            value={lockedName ? name : ((name && name.match(/\d+/)) ? name.match(/\d+/)[0] : '')}
                            keyfilter={"num"}
                            onChange={(e)=>{
                                changeName(e.target.value)
                            }}
                            onBlur={async e => {
                                const newName = e.target.value ? (e.target.value + ' ' + day.name.replace(/[0-9]+/g, '').replace(' ', '')) : ''
                                if (newName && newName !== day.name) {
                                    if (day._id && !day._id.includes('new')) {
                                        updateName(newName, day)
                                        // const doc = await service.patchData(day._id, 'matchdays', {name: name}, toast);
                                    }
                                }
                                // updMatchDay({...day, name: e.target.value }, ind)
                            }}
                            className={(isGridMD || isGridRound) ? 'isGridMD' : ''}
                        />
                        {lockedName ? null :
                            <InputText
                                disabled={true}
                                value={name.replace(/[0-9]+/g, '').replace(' ', '')}
                                placeholder='тур'
                                className={(isGridMD || isGridRound) ? 'isGridMD' : ''}
                            />}
                        {/*(isGridMD || isGridRound) ? null :*/
                            ((type === 'manual' || type === 'fromDB') && (!day._id || isChanged() || editMode)) ? (
                            <Button
                                className='p-button'
                                icon='pi pi-check'
                                label='Сохранить'
                                disabled={!editMode && (loading || !(isChanged()))}
                                onClick={() => confirmDialog({
                                    message: 'Сохранить',
                                    header: 'Подтвердите выбор',
                                    icon: 'pi pi-check',
                                    position: 'top',
                                    acceptLabel: 'Да, Сохранить',
                                    rejectLabel: 'Изменить',
                                    accept: async () => {
                                        const apply = await updmd()
                                        return
                                    }
                                })}
                            />
                        ) : ((type === 'manual' || type === 'fromDB') && day._id && !isChanged() && !editMode) ? (
                            <Button
                                className='p-button btn-edit'
                                icon='pi pi-pencil'
                                label='Редактировать'
                                onClick={() => setEditMode(true)}
                            />
                        ) : null}
                    </span>
                </div>
                {matches.length ? matches.map((m, index) => (
                    <Match
                        match={m}
                        key={m._id || `${ind}_${index}_match`}
                        index={index}
                        restTeams={restTeams}
                        updMatches={updMatches}
                        type={m._id ? 'fromDB' : type}
                        groups={groups}
                        editMode={editMode}
                        bindOptions={bindOptions}
                    />)
                ) : null}
            </div>  : null
}

const Match = ({ match, updMatches, groups, index, type, restTeams, setRestTeams, editMode, bindOptions }) => {
    const [home, setHome] = useState(match ? match.home : null)
    const [away, setAway] = useState(match ? match.away : null)
    const [derivativeBind, setDerivativeBind] = useState(match ? match.derivativeBind : null)
    const [teams, setTeams] = useState(restTeams ? [...restTeams] : [])
    const [groupName, setGroupName] = useState(match && match.groupName ? match.groupName : null)

    const { date, time, scores, _id } = match;

    let location = useLocation();

    useEffect(() => {
        setHome(match.home || null)
        setAway(match.away || null)
        setGroupName(match.groupName || null)
    }, [match])

    useEffect(() => {
        if (groups && groups.length) {
            if (home && away) {
                const group = groups.find(gr => {
                    const grteams = [...gr.teams];
                    if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(home._id.toString())) {
                        return gr
                    }
                })

                if (group) {
                    const grteams = group.teams.map(t => t._id.toString())

                    setTeams(restTeams.filter(item =>
                        grteams.includes(item._id.toString()) && item._id.toString() !== home._id.toString() && item._id.toString() !== away._id.toString()))
                } else {
                    setTeams([...restTeams])
                }

            } else if (home) {
                const group = groups.find(gr => {
                    const grteams = [...gr.teams];
                    if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(home._id.toString())) {
                        return gr
                    }
                })

                //console.log('group', group);
                if (group) {
                    const grteams = group.teams.map(t => t._id.toString())

                    setTeams(restTeams.filter(item =>
                        grteams.includes(item._id.toString()) && item._id.toString() !== home._id.toString()))
                } else {
                    setTeams(restTeams.filter(item => item._id.toString() !== home._id.toString()))
                }
            } else if (away){
                const group = groups.find(gr => {
                    const grteams = [...gr.teams];
                    if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(away._id.toString())) {
                        return gr
                    }
                })

                //console.log('group', group);
                if (group) {
                    const grteams = group.teams.map(t => t._id.toString())
                    const restGroupTeams = restTeams.filter(item =>
                        grteams.includes(item._id.toString()) && item._id.toString() !== away._id.toString())
                    //console.log('restGroupTeams', away, restGroupTeams);
                    setTeams(restGroupTeams)
                } else {
                    setTeams(restTeams.filter(item => item._id.toString() !== away._id.toString()))
                }
            } else {
                if (groupName) {
                    const group = groups.find(gr => gr.name === groupName)

                    //console.log('group', group);
                    if (group) {
                        const grteams = group.teams.map(t => t._id.toString())
                        const restGroupTeams = restTeams.filter(item =>
                            grteams.includes(item._id.toString()))
                        //console.log('restGroupTeams', away, restGroupTeams);
                        setTeams(restGroupTeams)
                    } else {
                        setTeams(restTeams.filter(item => item?._id.toString() !== away?._id.toString()))
                    }
                } else {
                    setTeams([...restTeams])
                }
            }
        } else {
            setTeams([...restTeams])
        }
    }, [restTeams])

    useEffect(() => {
        if ((type === 'manual' || editMode) ) {
            const m = {
                home: home,
                away: away,
                homeId: home ? home._id : null,
                awayId: away ? away._id : null,
                groupName: groupName || null,
                groupId: match.groupId || null,
                _id: match._id || null
            }
            if (groups && groups.length) {
                if (home && away) {
                    const group = groups.find(gr => {
                        const grteams = [...gr.teams];
                        if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(home._id.toString())) {
                            return gr
                        }
                    })

                    if (group) {
                        m.groupName = group.name;
                        setGroupName(group.name);
                        const grteams = group.teams.map(t => t._id.toString())

                        setTeams(restTeams.filter(item =>
                            grteams.includes(item._id.toString()) && item._id.toString() !== home._id.toString() && item._id.toString() !== away._id.toString()))
                    } else {
                        setGroupName(null)
                        setTeams(restTeams.filter(item => item._id.toString() !== home._id.toString() && item._id.toString() !== away._id.toString()))
                    }

                } else if (home) {
                    const group = groups.find(gr => {
                        const grteams = [...gr.teams];
                        if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(home._id.toString())) {
                            return gr
                        }
                    })

                    if (group) {
                        m.groupName = group.name;
                        setGroupName(group.name);

                        const grteams = group.teams.map(t => t._id.toString())

                        setTeams(restTeams.filter(item =>
                            grteams.includes(item._id.toString()) && item._id.toString() !== home._id.toString()))
                    } else {
                        setGroupName(null)
                        setTeams(restTeams.filter(item => item._id.toString() !== home._id.toString()))
                    }
                } else if (away){
                    const group = groups.find(gr => {
                        const grteams = [...gr.teams];
                        if ( grteams && grteams.length && grteams.map(t => t._id.toString()).includes(away._id.toString())) {
                            return gr
                        }
                    })

                    if (group) {
                        m.groupName = group.name;
                        setGroupName(group.name);
                        const grteams = group.teams.map(t => t._id.toString())
                        const restGroupTeams = restTeams.filter(item =>
                            grteams.includes(item._id.toString()) && item._id.toString() !== away._id.toString())
                        setTeams(restGroupTeams)
                    } else {
                        setGroupName(null)
                        setTeams(restTeams.filter(item => item._id.toString() !== away._id.toString()))
                    }
                }
            } else {
                setGroupName(null)
                //console.log('match eff', m);

                if (home && away) {
                    setTeams(restTeams.filter(item => item._id.toString() !== home._id.toString() && item._id.toString() !== away._id.toString()))
                } else if (home) {
                    setTeams(restTeams.filter(item => item._id.toString() !== home._id.toString()))
                } else if (away){
                    setTeams(restTeams.filter(item => item._id.toString() !== away._id.toString()))
                }
            }

            updMatches(m, index)
        }
    }, [type, home, away, derivativeBind])

    const selectedTeamTemplate = (option, props) => {
        if (props.value) {
             return (
                <div className="team-item team-item-value">
                    <div>{props.value.name}</div>
                </div>
            );
        }

        return (
            <span>
                {props.placeholder}
            </span>
        );
    }

    const teamOptionTemplate = (option) => {

        return (
            <div className="team-item">
                <div>{option.name}</div>
            </div>
        );
    }

    const onTeamChange = (e) => {
        if (e.target.name === 'home') {
            setHome(e.value)
        } else {
            setAway(e.value)
        }
    }

    return ['auto','fromDB'].includes(type) && !editMode ? (
            <Link
                to={{
                    pathname: `/tournaments?editmatch=${match._id}`,
                    state: { background: location }
                }}
                style={{color: 'inherit', textDecoration: 'inherit', width:'100%', display: 'flex', justifyContent: 'center'}}
            >
                <div className={`matchday-match`}>
                    <div>{home ? home.name : 'Команда хозяев'}</div>

                    <div>{scores && scores.full ? `${scores.full.home} : ${scores.full.away}` : '🆚'}</div>
                    <div>{away ? away.name : 'Команда гостей'}</div>
                    {groupName ? <Tag className='matchday-match-groupName'>{groupName}</Tag> : null}

                    {bindOptions ? (
                        <MatchBindPanel
                            options={bindOptions}
                            matchId={_id}
                            derivativeBind={derivativeBind}
                            setDerivativeBind={setDerivativeBind}
                        />
                    ) : null}
                </div>
            </Link>
        ) : type === 'manual' || editMode ? (
            <div className={`matchday-match ${groupName ? 'group-manual' : 'match-manual'}`}>
                <div>
                    <Dropdown
                        value={home}
                        options={teams.sort((t1, t2) => t1.name > t2.name ? 1 : -1)}
                        onChange={onTeamChange}
                        optionLabel="name"
                        placeholder="Команда хозяев"
                        showClear
                        valueTemplate={selectedTeamTemplate}
                        itemTemplate={teamOptionTemplate}
                        name='home'
                    />
                </div>
                <Link
                    to={{
                        pathname: `/tournaments?editmatch=${match._id}`,
                        state: { background: location }
                    }}
                    style={{color: 'black', textDecoration: 'none', width:'20%', display: 'flex', justifyContent: 'center'}}
                >
                <div>🆚</div>
                </Link>
                <div>
                    <Dropdown
                        value={away}
                        options={teams}
                        onChange={onTeamChange}
                        optionLabel="name"
                        placeholder="Команда гостей"
                        showClear
                        valueTemplate={selectedTeamTemplate}
                        itemTemplate={teamOptionTemplate}
                        name='away'
                    />
                </div>
                {groupName ? <Tag className='matchday-match-groupName'>{groupName}</Tag> : null}
            </div>
        ) : (
            {/*<div className={`matchday-match ${groupName ? 'group': ''}`}>
                <div>{home ? home.name : 'Команда хозяев'}</div>
                <div>{scores && scores.full ? `${scores.full.home} : ${scores.full.away}` : 'vs'}</div>
                <div>{away ? away.name : 'Команда гостей'}</div>
                {groupName ? <span className='matchday-match-groupName'>{groupName}</span> : null}
            </div>*/}
        )
}


export default Matchday

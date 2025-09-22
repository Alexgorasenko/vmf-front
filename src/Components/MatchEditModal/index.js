import React, { useState, useEffect, useContext, useRef } from 'react'
import { Button } from 'primereact/button';
import { useHistory, useParams } from 'react-router-dom'
import axios from 'axios'

import RosterController from './components/RosterController'
//import CheckEvents from './components/CheckEvents/CheckEvents'
import Events from './components/Events'
import Information from './components/Information/Information'
import TeamEvents from './components/TeamEvents'
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast'

import { MatchContext } from './ctx'
import { WorkspaceContext } from '../../ctx'

import './style.scss'

//process.env.NODE_ENV === 'production'

//const ENGINE = process.env.NODE_ENV === 'production' ? 'https://proxy.amateum.com/v1/' : 'http://localhost:3123/v1/';
//const ENGINE = 'http://localhost:3123/v1/'
import { ENDPOINT } from '../../env'
import CustomScrollbars from "react-custom-scrollbars-2";

const LEGACY = 'https://rest.amateum.com/'

// если запущен проэкт storybook добавить в пропсы match !!!!!!!!!!
// если проэкт просто запущен то раскоментировать с 26-40 строку и удалить с пропсов match!!!!!!!!
const initForm = {
    locationId: null,
    date: '',
    time: '',
    employees: [],
    homeRoster: { //replace with initial match data mapper
        players: [],
        lineup: {
            players: [],
            formation: null
        }
    },
    awayRoster: { //replace with initial match data mapper
        players: [],
        lineup: {
            players: [],
            formation: null
        }
    },
    scores: {}, //replace with initial match data mapper
    events: {}, //replace with initial match data mapper
    mvp: {},
    broadcastURL: null
}

const CustomTabMenu = ({ model, activeIndex, onTabChange }) => {
    return  <div className='custom-tabs'>
                {model.map((i, idx) => (
                    <div className={`custom-tabs_btn ${idx === activeIndex ? ' active' : ''}`} key={idx} onClick={() => onTabChange({index: idx, value: i})}>
                        <i className={i.icon}></i>
                        <span>{i.label}</span>
                    </div>
                ))}
            </div>
}

const MatchModal = ({ matchId }) => {
    const [tab, setTab]= useState(0)
    const [wraps, setWraps] = useState('information')
    const history = useHistory()
    const [match, setMatch] = useState(false)
    const [form, setForm] = useState(initForm)
    const [loader, setLoader] = useState(false)
    const [club, setClub] = useState(false)

    const wctx = useContext(WorkspaceContext)

    const toastRef = useRef()

    useEffect(() => {
        if(wctx.workspace && !club) {
            if(wctx.workspace.subject && wctx.workspace.subject.type === 'club') {
                setClub(wctx.workspace.subject)
                setWraps('rosterController')
            }
        }

        if (!wctx.workspace.needUpdate){
            wctx.setWorkspace({
                ...wctx.workspace,
                needUpdate: true
            })
        }
    }, [wctx.workspace])

    const updForm = (k, v) => {
        if(!k.includes('.')) {
            setForm({
                ...form,
                [k]: v
            })
        } else {
            const ks = k.split('.')
            setForm({
                ...form,
                [ks[0]]: {
                    ...form[ks[0]],
                    [ks[1]]: v
                }
            })
        }
    }

    useEffect(() => {
        setLoader(true)
        if(matchId) {
            axios.get(`${ENDPOINT}v2/getMatchForm/${matchId}`).then(data => {
                const mt = data.data && data.data.match ? {...data.data.match} : null;
                if (mt) {
                    setMatch(mt)
                    const updatedForm = {_id: mt._id};
                    for (let key in form) {
                        if (['homeRoster','awayRoster'].includes(key)) {
                            if (key.includes('home')) {
                                if (mt['home']) {
                                    updatedForm[key] = mt['home']['roster']
                                } else {
                                    updatedForm[key] = form[key]
                                }
                            } else {
                                if (mt['away']) {
                                    updatedForm[key] = mt['away']['roster']
                                } else {
                                    updatedForm[key] = form[key]
                                }
                            }
                        } else if (key === 'employees') {
                            if (mt.employees_data) {
                                updatedForm[key] = [...mt.employees_data]
                            } else if (match.employees_legacy && match.employees_legacy.length > 0 ) {
                                updatedForm[key] = [...mt.employees_legacy]
                            } else if (mt.employeesRaw) {
                                updatedForm[key] = mt.employeesRaw
                            }
                        } else if(key === 'events') {
                            const evsSource = mt.events.find(e => e.type === 'events')
                            if(evsSource) {
                                updatedForm.events = evsSource.data
                            }
                        } else if(key === 'mvp') {
                            const mvpSource = mt.events.find(e => e.type === 'mvp')
                            if(mvpSource) {
                                updatedForm.mvp = mvpSource.data
                            }
                        } else {
                            updatedForm[key] = mt[key] || null
                        }
                    }

                    setForm(updatedForm)
                    setLoader(false)
                }
            })
        }
    }, [matchId])

    const wrap = {
        rosterController: RosterController,
        eventsController: Events,
        information: Information,
        teamEvents: TeamEvents
    }

    const onClickTab = (e) =>{
        setTab(e.index)
        setWraps(e.value.wrap)
    }

    let Specified = wrap[wraps] ? wrap[wraps] : wrap.information

    useEffect(() => {
        let body = document.body
        if (body && Specified) {
            body.style.overflow = "hidden"
            body.style["touch-action"] = "none"
            body.style["-webkit-overflow-scrolling"] = "none"
            body.style["overscroll-behavior"] = "none"
            body.style.width = "100%"
        } else {
            body.style = {}
        }
    }, [Specified])

    const extractClubMatchSide = () => {
        return club.teams.find(t => t._id === match.homeId) ? 'home' : club.teams.find(t => t._id === match.awayId) ? 'away' : null
    }

    const patchRosterByClub = (side, obj) => {
        const { lineup, players, _id } = obj
        axios.put(`${ENDPOINT}v2/rosters/${_id}`, {
            players: players,
            lineup: {
                ...lineup,
                players: lineup.players.filter(p => !p._id.includes('plr_'))
            }
        }, {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            toastRef.current.show({severity: 'success', message: 'Готово', detail: 'Состав команды сохранён'})
            setMatch({
                ...match,
                [side]: {
                    ...match[side],
                    roster: {...obj}
                }
            })
        })
    }

    const renderClubSaveBtn = () => {
        if(wraps === 'rosterController' && club) {
            const side = extractClubMatchSide()
            if(side) {
                if(match) {
                    if(JSON.stringify(match[side].roster) !== JSON.stringify(form[side+'Roster'])) {
                        return  <div className='button__save' onClick={() => patchRosterByClub(side, form[side+'Roster'])}>
                                    <Button icon='pi pi-check' aria-label="Cancel" className="p-button-rounded p-button-success p-button-outlined" />
                                    <div className={'button-text'}>Сохранить состав</div>
                                </div>
                    } else {
                        return null
                    }
                }
            } else {
                return null
            }
        } else {
            return null
        }
    }

    return  <MatchContext.Provider value={{form, setForm}}>
                <Toast ref={toastRef} position='top-right' />

                <CustomScrollbars autoHeight autoHide autoHeightMin={'90vh'}>
                    <div className='match__modal'>
                        {renderClubSaveBtn()}
                        <div className='button__close'>
                            <Button icon='pi pi-times' aria-label="Cancel" className="p-button-rounded p-button-secondary p-button-outlined" onClick={() => history.push(window.location.pathname)}/>
                        </div>

                        <div className='match__modal_title'>
                            {match.home && <span>{match.home.name} vs {match.away.name}</span>}
                        </div>

                        {loader ? null : <CustomTabMenu model={club ? clubItems : items} activeIndex={tab} onTabChange={(e) => onClickTab(e) } />}

                        {loader ? <ProgressSpinner className='loader' animationDuration='1s'/>
                        :
                        <Specified
                            match={match}
                            team={(club && match) ? extractClubMatchSide() : tab === 0 || tab === 3 ? null : tab === 1 ? 'home' : 'away'}
                            setMatch={setMatch}
                            updForm={updForm}
                            form={form}
                        />}
                    </div>
                </CustomScrollbars>
            </MatchContext.Provider>
}

const clubItems = [
    {label: 'Состав моей команды', icon: 'pi pi-fw pi-users', wrap: 'rosterController'},
    {label: 'События моей команды', icon: 'pi pi-fw pi-star', wrap: 'teamEvents'}
]

const items = [
    {label: 'Информация', icon: 'pi pi-fw pi-cog', wrap:'information'},
    {label: 'Состав хозяев', icon: 'pi pi-fw pi-users', wrap:'rosterController'},
    {label: 'Состав гостей', icon: 'pi pi-fw pi-users', wrap:'rosterController'},
    {label: 'Счёт и события', icon: 'pi pi-fw pi-star', wrap:'eventsController'},
];


export default MatchModal

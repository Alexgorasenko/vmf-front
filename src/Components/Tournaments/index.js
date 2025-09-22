import React, { useState, useEffect, useRef, useContext } from 'react'
import { WorkspaceContext } from '../../ctx'
import { ToolbarContext } from '../Toolbar/ctx'
import {Tag} from "primereact/tag";

import IconTour from '../../assets/img/icon-tour.svg'
import IconCup from '../../assets/img/icon-cup.svg'
import './style.scss'
import { Toast } from 'primereact/toast'
import {classNames} from "primereact/utils";
import { ProgressSpinner } from 'primereact/progressspinner'

import Settings from "./Settings";
import Teams from "./Teams";
import LocationAndTime from "./LocationAndTime";
import Structure from './Structure'
import Calendar from './Calendar'
import Disqualifications from './Disqualifications'
import DreamLineups from "./DreamLineups";

import { CustomTabMenu } from '../Atoms'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import qs from "qs";

const components = {
    settings: Settings,
    teams: Teams,
    locationAndTime: LocationAndTime,
    structure: Structure,
    calendar: Calendar,
    social: null,
    disquals: Disqualifications,
    dreamLineups: DreamLineups
}

const Tournaments = ({ layout }) => {
    const searchString = qs.parse(window.location.search.replace('?',''))
    const [tournamentsList, setTournamentsList] = useState(null)
    const [selectedTournament, setSelectedTournament] = useState(searchString.tournamentId && searchString.tournamentId.length === 24 ? searchString.tournamentId : null)
    const [subject, setSubject] = useState(null)
    const [loading, setLoading] = useState(true)

    const splideRef = useRef(null)
    const toast = useRef(null)
    const tabmenuRef = useRef()

    const ctx = useContext(WorkspaceContext)
    const tbCtx = useContext(ToolbarContext)

    const { toolbar, setFilter } = tbCtx

    const [firstLoad, setFirstLoad] = useState(ctx.workspace && ctx.workspace.topDropdown)

    useEffect(() => {
        const tkn = localStorage.getItem('_amateum_subject_tkn')
        axios.get(`${ENDPOINT}v2/list/tournaments`, {
            headers: {
                Authorization: tkn
            }
        }).then(resp => {
            const defaultId = resp.data && resp.data[0] ? searchString.tournamentId || resp.data[0]._id : null
            if (!firstLoad) {
                ctx.setWorkspace({
                    ...ctx.workspace,
                    topDropdown: {
                        title: 'Выберите турнир',
                        options: resp.data.map(f => ({...f, value: f._id})),
                        value: defaultId
                    },
                    allTournaments: resp.data
                })
                if(defaultId) {
                    const subj = resp.data.find(t => t._id === defaultId);
                    setSubject(subj)
                }
            } else {
                setFirstLoad(false)
            }
        }).finally(() => {
            setLoading(false)
        })
    }, [localStorage.getItem('_amateum_subject_tkn')])

    useEffect(() => {
        if(ctx.workspace && ctx.workspace.topDropdown && ctx.workspace.topDropdown.options && ctx.workspace.topDropdown.options.length) {
            const candidate = ctx.workspace.topDropdown.options.find(t => t._id === ctx.workspace.topDropdown.value)

            if(candidate) {
                if(!subject || (subject._id !== candidate._id)) {
                    setSubject(candidate)
                }
            }
        }
    }, [ctx])

    useEffect(() => {
        if(ctx.workspace.topDropdown && ctx.workspace.topDropdown.value) {
            if(selectedTournament !== ctx.workspace.topDropdown.value) {
                setSelectedTournament(ctx.workspace.topDropdown.value)
                setFilter('tab', 'settings')
            }
         }
    }, [ctx.workspace.topDropdown])

    const updateTournament = obj => {
        if(subject) {

            setSubject({...subject, ...obj})
            if (ctx.workspace && ctx.workspace.topDropdown && ctx.workspace.topDropdown.options) {
                const patched = {
                    ...ctx.workspace,
                    topDropdown: {
                        ...ctx.workspace.topDropdown,
                        options: ctx.workspace.topDropdown.options.map(t => t._id === subject._id ? ({...t, ...obj}) : t),
                    }
                }
                ctx.setWorkspace(patched)
            }
        }
    }
    console.log(toolbar)
    const Specified = toolbar && toolbar.filters && toolbar.filters.tab ? components[toolbar.filters.tab] || null : null

    const long = tournamentsList ? tournamentsList.find(t => t.name && t.name.length > 17) : null

    return (
        <div className={'tournaments'}>
            <Toast ref={toast} position='bottom-right' />
            {loading ? <div className='disqual-load'>
                <ProgressSpinner style={{width: 64, height: 64}} />
            </div> : <div className={'content within-list'}>
                {Specified && subject ? (
                    <Specified
                        subject={subject}
                        layout={layout}
                        toast={toast.current}
                        updateTournament={updateTournament}
                    />
                ) : null}
            </div> }
        </div>
    )
}

export default Tournaments

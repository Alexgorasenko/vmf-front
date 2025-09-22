import React, { useEffect, useRef, useState, useContext } from 'react'

import { WorkspaceContext } from '../../ctx'
import { ToolbarContext } from '../Toolbar/ctx'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import IconTour from "../../assets/img/icon-tour.svg";
import IconCup from '../../assets/img/icon-cup.svg'
import {Tag} from "primereact/tag";

import './style.scss'
import Settings from "../Tournaments/Settings";
import Teams from "../Tournaments/Teams";
import LocationAndTime from "../Tournaments/LocationAndTime";
import Structure from "../Tournaments/Structure";
import {classNames} from "primereact/utils";
import {Button} from "primereact/button";
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner'
import moment from "moment/moment";
import ScheduleList from "./ScheduleList";
import matchday from "../Tournaments/Calendar/Controls/Matchday";
import {Dropdown} from "primereact/dropdown";


const Schedule = () => {
    const [subject, setSubject] = useState(null)

    const ctx = useContext(WorkspaceContext)
    const tbCtx = useContext(ToolbarContext)

    const { toolbar, setToolbarData, setFilter } = tbCtx

    const [firstLoad, setFirstLoad] = useState(ctx.workspace && ctx.workspace.topDropdown)

    const splideRef = useRef(null)

    useEffect(() => {
        if(ctx.workspace && ctx.workspace.topDropdown) {
            const candidate = ctx.workspace.topDropdown.options.find(t => t._id === ctx.workspace.topDropdown.value)
            if(candidate) {
                if(!subject || (subject._id !== candidate._id)) {
                    setSubject(candidate)
                    setFilter('rangeStages', candidate.stages[0]) //TODO - detect active stage in pull
                }
            }
        }
    }, [ctx.workspace ? ctx.workspace.topDropdown : null])

    useEffect(() => {
        if(toolbar.filters.rangeStages && subject) {
            setToolbarData({
                stages: [...subject.stages],
                stats: getNoDateMatchesLength()
            })
        }
    }, [toolbar.filters.rangeStages])

    useEffect(() => {
        if (!firstLoad){
            const tkn = localStorage.getItem('_amateum_subject_tkn')
            axios.get(`${ENDPOINT}v2/list/tournaments`, {
                headers: {
                    Authorization: tkn
                }
            }).then(resp => {
                const filtered = resp.data.filter(tour => tour.stages && tour.stages.length)
                ctx.setWorkspace({...ctx.workspace, topDropdown: {title: 'Выберите турнир', options: filtered.map(f => ({...f, value: f._id})), value: filtered ? filtered[0]._id : null}})
            })
        } else setFirstLoad(false)
    }, [localStorage.getItem('_amateum_subject_tkn')])

    const getNoDateMatchesLength = () => {
        let matches = []
        if(subject){
            if(subject.stages){
                if(toolbar.filters.rangeStages) {
                    if (subject.stages.find(s => s._id === toolbar.filters.rangeStages._id)) {
                        subject.stages.find(s => s._id === toolbar.filters.rangeStages._id).matchdays.map(matchday => {
                            matches.push(matchday.matches)
                        })
                    }
                }
            }
        }

        return [matches.flat(1).filter(match => !match.date).length, matches.flat(1).length]
    }

    return (
        <div className={'schedule'}>
            {!toolbar.filters.rangeStages || !toolbar.data.stats ? (
                <div className='schedule-load'>
                    <ProgressSpinner style={{width: 64, height: 64}} />
                </div>
            ) : (
                <div className={'content within-list'}>
                    {subject ? (
                        <ScheduleList
                            staffMode={toolbar.filters.activeIndex === 1}
                            subject={subject}
                            rangeBtn={toolbar.filters ? toolbar.filters.rangeBtn : null}
                            rangeStages={toolbar.filters ? toolbar.filters.rangeStages : []}
                            //updateTournament={updateTournament}
                            onUpdatedStats={stats => setToolbarData({...toolbar.data, stats: stats})}
                        />
                    ) : null}
                </div>
            )}
        </div>
    )
}

export default Schedule

import React, { useState, useRef, useEffect } from 'react'

import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import GridPlayoff from './GridPlayoff'
import GridRound from './GridRound'
//import GridRound from './_GridRound'

import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'
import { Tag } from 'primereact/tag'
import { AutoComplete } from 'primereact/autocomplete'
import { Message } from 'primereact/message'
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { NonIdealState } from '../../../Atoms'
import { Dropdown } from 'primereact/dropdown';

const types = [
    {id: 'playoff', label: 'На вылет'},
    {id: 'round', label: ' В круг'}
]
const components = {
    round: GridRound,
    playoff: GridPlayoff
}

const PlayoffGrids = ({ stage, teams, toast, updateStage, playoffMdays, sharedGrid }) => {
    const [loading, setLoading] = useState(false)

    const updateData = (grid, secondRound, id) => {
        const upd = {}

        const mapdGrid = stage.playoffgrids && stage.playoffgrids.length ? stage.playoffgrids.map(gr => gr._id === grid._id ? {...grid} : gr) : [grid]

        upd.playoffgrids = mapdGrid;
        if (grid.matchdays && grid.matchdays.length) {

            const reduced = grid.matchdays.reduce((acc, cur) => {
                if (cur._id && !acc[cur._id]) {
                    acc[cur._id] = cur
                }
                return acc
            }, {})

            const mapdmds = !secondRound && stage.matchdays && stage.matchdays.length ? stage.matchdays.map(mday => reduced[mday._id] || mday) : [...grid.matchdays];

            upd.matchdays = mapdmds;
        }
        updateStage({...stage, ...upd})
    }

    return  <div className='model playoffView'>
                {sharedGrid && sharedGrid.teams && sharedGrid.teams.length > 1 ? (
                    <div className='calendar-card fields-group'>
                    <Tag className='group-title'>Календарь</Tag>

                    <GridCalendar
                        grid={sharedGrid}
                        teams={sharedGrid.teams ? teams.filter(t => sharedGrid.teams.map(tt => tt._id).includes(t._id)) : []}
                        toast={toast}
                        stage={stage}
                        updateData={updateData}
                    />
                </div>
            ) : null}
            </div>
}

const GridCalendar = ({ grid, teams, toast, updateData, stage }) => {
    const [form, setForm] = useState({})

    useEffect(() => {
        if (grid) {
            setForm({...grid})
        }
    },[grid])

    const setRounds = async (val) => {
        if (form._id && form._id !== 'newGrid') {
            await service.updateGrid(form._id, {roundsQty: val}, toast)
            updateData({...form, roundsQty: val}, form._id)
        }
        setForm({...form, roundsQty: val})
    }

    const Specified = form && form.type ? (components[form.type] || null) : null

    return  <div className='grid-card'>
                {Specified ? (
                    <Specified
                        grid={form}
                        teams={teams}
                        toast={toast}
                        updateData={updateData}
                        stage={stage}
                    />
                ) : null}

            </div>
}

export default PlayoffGrids

import React, { useState, useEffect } from 'react'
import { RadioButton } from 'primereact/radiobutton'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

import service from '../service'

import './style.scss'

import Playoff from './Models/Playoff'
import Round from './Models/Round'
import Mixed from './Models/Mixed'
import Custom from './Models/Custom'

const types = [
    {id: 'round', label: 'Круговой', model: Round},
    {id: 'playoff', label: 'Плейофф', model: Playoff},
    {id: 'mixed', label: 'Группы + плейофф', model: Mixed},
    {id: 'custom', label: 'Сложный (гибкая настройка)', model: Custom}
]

const parseConfiguredType = arr => {
    let output = 'custom'
    if(arr.length) {
        switch (true) {
            case arr.length === 1 && arr[0].type === 'round':
                output = 'round'
                break
            case arr.length === 1 && arr[0].type === 'playoff':
                output = 'playoff'
                break
            case !!(arr.length === 2 && arr.find(item => item.type === "groups") && arr.find(item => item.type === "playoff")):
                output = 'mixed'
                break
        }
    }
    return output
}

const Calendar = ({ subject, toast, updateTournament, activeStage, sharedGrid }) => {
    const [type, setType] = useState('auto')
    const [stages, setStages] = useState(subject && subject.stages && subject.stages.length ? [...subject.stages] : [])
    const [teams, setTeams] = useState(subject && subject.teams && subject.teams.length ? [...subject.teams] : [])
    const [configuredType, setConfiguredType] = useState(parseConfiguredType(subject.stages))

    useEffect(() => {
        const stagesSubj = subject && subject.stages && subject.stages.length ? subject.stages : [];
        const confType = parseConfiguredType(subject.stages);
        setConfiguredType(confType);
        setStages(stagesSubj);
        setTeams(subject && subject.teams && subject.teams.length ? [...subject.teams] : []);
    }, [subject])

    const setFillType = t => {
        setType(t)
    }

    const Model = types.find(t => t.id === configuredType).model

    return  <div className='calendar'>
                <ConfirmDialog />
                {activeStage > -1 ? (
                    <Custom
                        stages={stages}
                        teams={teams}
                        toast={toast}
                        updateTournament={updateTournament}
                        sharedGrid={sharedGrid}
                        fillType={type}
                        setFillType={setFillType}
                        activeStage={activeStage}
                    />
                ) : null}
            </div>
}

export default Calendar

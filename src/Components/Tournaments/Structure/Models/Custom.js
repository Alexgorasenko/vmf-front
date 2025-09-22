import React, { useState } from 'react'
import Groups from '../Controls/Groups'
import Plain from '../Controls/Plain'
import PlayoffGrids from '../Controls/PlayoffGrids'
import {Tag} from "primereact/tag";
import { NonIdealState } from '../../../Atoms'

const stageTypes = {
    round: Plain,
    groups: Groups,
    playoff: PlayoffGrids
}

const Custom = ({ stages, teams, toast, updateTournament, activeStage, setSharedGrid }) => {
    const [s, setStage] = useState(null);

    const Specified = stages && stages[activeStage] && stages[activeStage].type ? (stageTypes[stages[activeStage].type] || null): null;

    return <div className={`model customStructure`}>
        {stages && stages[activeStage] && Specified ? (
                <Specified
                    key={stages[activeStage]._id}
                    data={stages[activeStage]}
                    setSharedGrid={setSharedGrid}
                    teams={teams}
                    toast={toast}
                    updateStage={stage => {
                        updateTournament({stages: stages.map((s, i) => s._id === stage._id ? stage : s)})
                    }}
                />
            ) : (
                <NonIdealState
                    icon='sitemap'
                    text='Выберите стадию'
                />
            )}
    </div>
}

const StageView = ({data, selected, onHandle}) => {
    const { title, teams, groups, type, roundsQty } = data;
    return <div className={`stageView ${selected ? 'selected' : ''}`} onClick={onHandle}>
        <div className='descr'>
            <div className='title'>{title}</div>
            <div>кругов: {roundsQty}</div>
            <div>{teams && teams.length ? `команд: ${teams.length}` : `Команды не добавлены`}</div>
            {type === 'groups' ? (
                <Tag
                    className="tag"
                    severity="info"
                    value={groups && groups.length ? `групп: ${groups.length}` : `Группы не добавлены`}
                ></Tag>
            ) : null}
        </div>
    </div>
}

export default Custom

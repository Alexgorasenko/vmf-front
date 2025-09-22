/*import React, { useState } from 'react'

const Custom = ({ stages, teams, toast, updateTournament }) => {
    return  <div className='struct-card'>
                <div style={{margin: '150px 40px', textAlign: 'center', color: 'var(--bluegray-600)', fontSize: 14}}>
                    Для настройки турнира этого типа, пожалуйста обратитесь в поддержку
                </div>
            </div>
}

export default Custom
*/
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

const Custom = ({ stages, teams, toast, updateTournament, activeStage, sharedGrid}) => {
    const s = stages[activeStage] || null
    const Specified = s && s.type ? (stageTypes[s.type] || null): null;

    return <div className={`model customStructure`}>
             {s && Specified ? (
                <Specified
                    key={s._id}
                    stage={s}
                    teams={teams}
                    toast={toast}
                    updateStage={stage => {
                        updateTournament({stages: stages.map((s, i) => s._id === stage._id ? stage : s)})
                    }}
                    sharedGrid={sharedGrid}
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

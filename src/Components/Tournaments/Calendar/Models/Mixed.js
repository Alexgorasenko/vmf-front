import React, { useState } from 'react'

import Groups from '../Controls/Groups'
import PlayoffGrids from '../Controls/PlayoffGrids'

const Mixed = ({ stages, teams, toast, updateTournament, fillType, setFillType }) => {
    return  [
        <Groups
            stage={stages.find(item => item.type === 'groups')}
            teams={teams}
            toast={toast}
            updateStage={stage => {
                updateTournament({stages: stages.map((s, i) => s.type === 'groups' ? stage : s)})
            }}
        />,
        <PlayoffGrids
            stage={stages.find(item => item.type === 'playoff')}
            teams={teams}
            toast={toast}
            updateStage={stage => {
                updateTournament({stages: stages.map((s, i) => s.type === 'playoff' ? stage : s)})
            }}
        />
    ]
}

export default Mixed

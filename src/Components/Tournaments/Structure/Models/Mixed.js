import React, { useState } from 'react'

import Groups from '../Controls/Groups'
import PlayoffGrids from '../Controls/PlayoffGrids'

const Mixed = ({ stages, teams, toast, updateTournament }) => {
    return  [
        <Groups
            data={stages.find(s => s.type === 'groups')}
            teams={teams}
            toast={toast}
            updateStage={stage => {
                updateTournament({stages: stages.map((s, i) => s.type === stage.type ? stage : s)})
            }}
        />,
        <PlayoffGrids
            data={stages.find(s => s.type === 'playoff')}
            teams={teams}
            toast={toast}
            updateStage={stage => {
                updateTournament({stages: stages.map((s, i) => s.type === stage.type ? stage : s)})
            }}
        />
    ]
}

export default Mixed

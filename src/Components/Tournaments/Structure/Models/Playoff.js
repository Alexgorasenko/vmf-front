import React, { useState } from 'react'

import PlayoffGrids from '../Controls/PlayoffGrids'

const Playoff = ({ stages, teams, toast, updateTournament }) => {
    return <PlayoffGrids data={stages.find(s => s.type === 'playoff')} teams={teams} toast={toast} updateStage={stage => {
        updateTournament({stages: stages.map((s, i) => i === 0 ? stage : s)})
    }}/>
}

export default Playoff

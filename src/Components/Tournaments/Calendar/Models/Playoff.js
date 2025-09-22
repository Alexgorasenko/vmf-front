import React, { useState } from 'react'

import PlayoffGrids from '../Controls/PlayoffGrids'

const Playoff = ({playoffMdays, teams, stages, toast, updateTournament}) => {
    return  <PlayoffGrids
    // playoffMdays={playoffMdays}
    // teams={teams}
    // stages={stages}
    stage={stages.find(item => item.type === 'playoff')}
    teams={teams}
    toast={toast}
    updateStage={stage => {
        updateTournament({stages: stages.map((s, i) => s.type === 'playoff' ? stage : s)})
    }}
/>
}

export default Playoff

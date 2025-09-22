import React, { useState } from 'react'

import Plain from '../Controls/Plain'

const Round = ({ stages, teams, toast, updateTournament }) => {
    return  <Plain
        data={stages[0]}
        teams={teams}
        toast={toast}
        updateStage={stage => {
            updateTournament({stages: stages.map((s, i) => i === 0 ? stage : s)})
        }}
    />
}

export default Round

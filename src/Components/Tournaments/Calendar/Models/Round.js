import React, { useState } from 'react'

import Plain from '../Controls/Plain'

const Round = ({ teams, stages, toast, updateTournament }) => {
    return  <Plain
        teams={teams}
        stage={stages.find(item => item.type === 'round')}
        toast={toast}
        updateStage={stage => {
            updateTournament({stages: stages.map((s, i) => i === 0 ? stage : s)})
        }}
    />
}

export default Round

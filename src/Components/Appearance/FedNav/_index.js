import React, { useState } from 'react'
import { RadioButton } from 'primereact/radiobutton'
import { Button } from 'primereact/button'

import service from '../service'
import helper from './helper'

import './style.scss'

const FedNav = ({ subject, toast, updateTournament }) => {
    const [suggested, setSuggested] = useState(null)
    const [processing, setProcessing] = useState(false)
    const configuredType = parseConfiguredType(subject.stages)
    //console.log('subject.stages', subject.stages)

    const Model = types.find(t => t.id === configuredType).model

    return  <div className='tournament-struct'>

                {!subject.stages || !subject.stages.length ? (
                    <div className='type-setup'>
                        <div className='title'>Выберите тип турнира</div>
                        <div className='type-setup_options'>
                            {types.map((t, i) => (
                                <div className={`card${suggested === t.id ? ' suggested' : ''}`} key={i}>
                                    <div className='option-title'>{t.label}</div>
                                    <div className='option-content'>{typeCards[t.id]()}</div>
                                    <Button
                                        className={`p-button p-button-sm`}
                                        disabled={processing & (t.id !== suggested)}
                                        loading={processing & (t.id === suggested)}
                                        onClick={async () => {
                                            if(t.id === suggested) {
                                                setProcessing(true)
                                                const stages = await service.applyStages(subject, suggested, toast)
                                                updateTournament({stages: stages})
                                            } else {
                                                setSuggested(t.id)
                                            }
                                        }}
                                        icon={suggested === t.id ? 'pi pi-check' : 'pi'}
                                    >{suggested === t.id ? 'Подтвердить' : 'Выбрать'}</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className='model'>
                        <Model
                            stages={subject.stages}
                            teams={subject.teams}
                            toast={toast}
                            updateTournament={updateTournament}
                        />
                    </div>
                )}
            </div>
}

export default FedNav

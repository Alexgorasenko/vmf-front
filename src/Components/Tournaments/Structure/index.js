import React, { useState } from 'react'
import { RadioButton } from 'primereact/radiobutton'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'

import service from '../service'

import './style.scss'
import './stages-control.scss'

import Calendar from '../Calendar'
import Playoff from './Models/Playoff'
import Round from './Models/Round'
import Mixed from './Models/Mixed'
import Custom from './Models/Custom'
import CustomScrollbars from "react-custom-scrollbars-2";

const types = [
    {id: 'round', label: 'Круговой', model: Round},
    {id: 'playoff', label: 'Плейофф', model: Playoff},
    {id: 'mixed', label: 'Группы + плейофф', model: Mixed},
    {id: 'custom', label: 'Сложный (гибкая настройка)', model: Custom}
]
const typeCards = {
    round: () => (
        <div>
            <p>классический турнир по схеме «каждый-с-каждым»</p>
            <ul>
                <li>вы сможете настроить любое количество кругов</li>
            </ul>
        </div>
    ),
    playoff: () => (
        <div>
            <p>«олимпийская система» - матчи навылет без предварительных стадий</p>
            <ul>
                <li>вы сможете создать любое количество «сеток»<br/>и привязать к ним команды</li>
            </ul>
        </div>
    ),
    mixed: () => (
        <div>
            <p>любое количество групповых этапов и переход к матчам навылет</p>
            <ul>
                <li>вы сможете создать несколько стадий турнира</li>
                <li>распределите команды по группам</li>
                <li>настроите количество кругов на групповой стадии</li>
                <li>для стадии плейофф сможете создать любое количество сеток</li>
            </ul>
        </div>
    ),
    custom: () => (
        <div>
            <p>необходим, в случае если не подходят другие типы, например: вы планируете несколько круговых стадий с «наследованием» результатов</p>
            <ul>
                <li>рекомендуем предварительно обратиться в поддержку и обсудить детали =)</li>
            </ul>
        </div>
    )
}

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
            case arr.length === 2 && !!arr.find(s => s.type === 'groups') && !!arr.find(s => s.type === 'playoff'):
                output = 'mixed'
                break
        }
    }
    return output
}

const Structure = ({ subject, toast, updateTournament }) => {
    const [suggested, setSuggested] = useState(null)
    const [processing, setProcessing] = useState(false)
    const configuredType = parseConfiguredType(subject.stages)
    const [createForm, setCreateForm] = useState(null)
    const [activeStage, setActiveStage] = useState(-1)
    const [sharedGrid, setSharedGrid] = useState(null)

    const newStage = {
        title: '',
        type: 'round',
        tournamentId: subject._id,
        leagueId: subject.leagueId,
        roundsQty: 1,
        seasonId: subject.seasonId,
        federationId: subject.federationId
    }

    const createStage = async () => {
        setProcessing(true)
        const data = await service.patchData(null, 'stages', createForm, toast);

        if (data && data._id) {
            setCreateForm(null)
            const saved = {...createForm, ...data}
            updateTournament({stages: subject.stages ? [...subject.stages, saved] : [saved]})
        }
        setProcessing(false)

    }

    const Model = types.find(t => t.id === configuredType).model

    return  <div className='tournament-struct'>
            {createForm ? <Dialog
                visible={createForm}
                className='create-dialog'
                modal
                header={createForm ? createForm.title : ''}
                onHide={() => {
                    if(!processing) {
                        setCreateForm(null)
                    }
                }}
                footer={createForm ? (
                    <div className='create-form_actions'>
                        <Button
                            className='p-button-sm'
                            icon={`pi pi-${processing ? 'spinner pi-spin' : 'check'}`}
                            disabled={processing || !createForm.title}
                            onClick={() => createStage()}
                        >Создать стадию</Button>
                        <Button
                            className='p-button-sm p-button-danger'
                            onClick={() => {
                                setCreateForm(newStage)
                            }}
                            disabled={processing}
                        >Отмена</Button>
                    </div>
                ) : null}
            ><div className='create-dialog_body'>
                        <div className='control'>
                            <InputText disabled={processing} placeholder='Название стадии' value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} />
                        </div>

                        <div className='section'>
                            <div className='field-radiobutton' onClick={() => setCreateForm({...createForm, type: 'round'})}>
                                <RadioButton name='type' inputId='type_round' value='round' checked={createForm.type === 'round'} />
                                <label htmlFor='type_round'>Матчи в круг</label>
                            </div>
                            <div className='field-radiobutton' onClick={() => setCreateForm({...createForm, type: 'groups'})}>
                                <RadioButton name='type' inputId='type_groups' value='groups' checked={createForm.type === 'groups'} />
                                <label htmlFor='type_groups'>Групповой этап</label>
                            </div>
                            <div className='field-radiobutton' onClick={() => setCreateForm({...createForm, type: 'playoff'})}>
                                <RadioButton name='type' inputId='type_playoff' value='playoff' checked={createForm.type === 'playoff'} />
                                <label htmlFor='type_playoff'>Плейофф</label>
                            </div>
                        </div>
                    </div>
            </Dialog> : null}

                {(!subject.stages || !subject.stages.length) && suggested !== 'custom' ? (
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
                ) : [
                    <div className='stages-control' style={{height: `calc(100vh - 120px)`}}>
                        <div className='stages-nav'>
                            <div className='title'>Стадии турнира</div>
                            <CustomScrollbars  autoHide autoHeight autoHeightMin={100} autoHeightMax='calc(100% - 2rem)' hideTracksWhenNotNeeded={true}>
                                <div className='stages-nav_list'>
                                    {subject.stages.map((st, i) => (
                                        <div className={`stages-nav_stage ${activeStage === i ? ' active' : ''}`} key={i} onClick={() => setActiveStage(i)}>
                                            <div className='stage-type-icon'>
                                                <span className={`pi pi-${st.type === 'playoff' ? 'sitemap' : st.type === 'groups' ? 'th-large' : 'bars'}`}></span>
                                            </div>
                                            <div className='info'>
                                                <div className='title'>{st.title}</div>
                                                <Tag severity='info' value={`Команд: ${st.teams.length}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CustomScrollbars>
                            <div className='stages-nav_footer'>
                                <Button
                                    className='p-button-outlined p-button-sm p-button-rounded'
                                    icon='pi pi-plus'
                                    label='Добавить стадию'
                                    onClick={() => setCreateForm(newStage)}
                                />
                            </div>
                        </div>

                        <div className='stage-body'>
                            <div className='model'>
                                <Custom
                                    tournament={subject}
                                    stages={subject.stages}
                                    teams={subject.teams}
                                    toast={toast}
                                    updateTournament={updateTournament}
                                    activeStage={activeStage}
                                    setSharedGrid={setSharedGrid}
                                />

                                <Calendar
                                    subject={subject}
                                    toast={toast}
                                    updateTournament={updateTournament}
                                    activeStage={activeStage}
                                    sharedGrid={sharedGrid}
                                />
                            </div>
                        </div>
                    </div>
                ]}
            </div>
}

export default Structure

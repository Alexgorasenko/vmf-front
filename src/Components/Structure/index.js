import React, { useState, useEffect, useRef } from 'react'

import { useDraggable } from "react-use-draggable-scroll"
import { ProgressSpinner } from 'primereact/progressspinner'
import { OrganizationChart } from 'primereact/organizationchart'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { RadioButton } from 'primereact/radiobutton'
import { Toast } from 'primereact/toast'
import { Messages } from 'primereact/messages'
import { InputSwitch } from 'primereact/inputswitch'

import { mapStructure } from './helper'

import './style.scss'

import { ENDPOINT } from '../../env'
import axios from 'axios'

import moment from 'moment'

const titles = {
    leagues: {title: 'Новая лига', btn: 'лигу'},
    seasons: {title: 'Новый сезон', btn: 'сезон'},
    tournaments: {title: 'Новый турнир', btn: 'турнир'},
    stages: {title: 'Новая стадия', btn: 'стадию'}
}

const indexes = ['leagues', 'seasons', 'tournaments', 'stages']

const cleaned = str => {
    return str.replace('x', '').replace('х', '')
}

const Structure = ({ subject }) => {
    const [rawData, setRawData] = useState(null)
    const [data, setData] = useState(null)
    const [selection, setSelection] = useState({})
    const [createDialog, setCreateDialog] = useState(null)
    const [finishDialog, setFinishDialog] = useState(null)
    const [editDialog, setEditDialog] = useState(null)

    const [createForm, setCreateForm] = useState({})
    const [disciplines, setDisciplines] = useState(null)
    const [progress, setProgress] = useState(false)

    const dsRef = useRef()
    const { events } = useDraggable(dsRef)
    const toastRef = useRef(null)
    const messagesRef = useRef(null)

    useEffect(() => {
        if(!disciplines) {
            axios.get(`${ENDPOINT}v2/list/disciplines`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setDisciplines(resp.data)
            })
        }
    }, [disciplines])

    useEffect(() => {
        if(subject) {
            axios.get(`${ENDPOINT}v2/list/structures`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setRawData(resp.data)
                // messagesRef.current.clear()
                // messagesRef.current.show({severity: 'info', life: 300000, detail: 'Кликните на элемент схемы для просмотра вложенных элементов или действий с ним. Если схема не помещается на экране, вы можете перемещать её мышью'})
            })
        }
    }, [subject])

    useEffect(() => {
        if(rawData) {
            const reMapped = mapStructure(subject, rawData, selection)
            reMapped[0].children.sort((a,b) => {
                return isNaN(+a.label[0]) ? 1 : isNaN(+b.label[0]) ? -1 : a.label < b.label ? 1 : -1
            })
            setData(reMapped)
        }
    }, [rawData, selection])

    useEffect(() => {
        if(createDialog && (createDialog[0] === 'stages')) {
            setCreateForm({...createForm, type: 'round'})
        }
    }, [createDialog])

    const createFlow = () => {
        setProgress(true)

        const [collection, relations] = createDialog
        const ids = Object.entries(relations).filter(e => e[0].includes('Id')).reduce((acc, e) => {
            acc[e[0]] = e[1]
            return acc
        }, {})

        const body = {...ids, ...createForm}
        if(collection === 'stages') {
            body.title = body.name
            delete body.name
        }

        axios.put(`${ENDPOINT}v2/${collection}`, body, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setProgress(false)
            setCreateDialog(null)
            setCreateForm({})
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Элемент добавлен в структуру'})
            axios.get(`${ENDPOINT}v2/list/structures`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setRawData(resp.data)
                const colIdx = indexes.indexOf(collection)
                setSelection(colIdx === 0 ? {'0': resp.data._id} : {...selection, [colIdx.toString()]: resp.data._id})
                if(collection === 'leagues') {
                    setData(null)
                }
            })
        })
    }

    const changeNode = () => {
        setProgress(true)
        const { type, _id: nodeId, label, stageType, disciplineId, finished } = editDialog
        const collection = `${type}s`;
        const body = type === 'stage' ? {title: label, type: stageType} : type === 'league' ? {name: label, disciplineId: disciplineId} : {name: label, finished: finished}

        axios.put(`${ENDPOINT}v2/${collection}/${nodeId}`, body, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setProgress(false)
            setEditDialog(null)
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Элемент обновлен'})
            axios.get(`${ENDPOINT}v2/list/structures`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setRawData(resp.data)
                const colIdx = indexes.indexOf(collection)
                setSelection(colIdx === 0 ? {'0': resp.data._id} : {...selection, [colIdx.toString()]: resp.data._id})
                if(collection === 'leagues') {
                    setData(null)
                }
            })
        }).finally(() => setProgress(false))
    }

    const finishFlow = () => {
        setProgress(true)
        axios.put(`${ENDPOINT}v2/tournaments/${finishDialog[0]}`, {finished: true, addonsAllowed: false}, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setProgress(false)
            setFinishDialog(null)
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Турнир завершён'})
            axios.get(`${ENDPOINT}v2/list/structures`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setRawData(resp.data)
            })
        })
    }

    const removeNode = async () => {
        setProgress(true)
        const { type, _id: nodeId, label } = editDialog
        const collection = `${type}s`;

        axios.delete(`${ENDPOINT}v2/${collection}/${nodeId}`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            setProgress(false)
            setEditDialog(null)
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Данные удалены'})
            axios.get(`${ENDPOINT}v2/list/structures`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                setRawData(resp.data)
            })
        })
    }

    const nodeTemplate = node => {

        switch(node.type) {
            case 'finish_trigger':
                return  <div className='finish-trigger' onClick={() => setFinishDialog([node._id, node.name])}>
                            <i className='pi pi-times-circle'></i>
                            {node.label}
                        </div>
                break
            case 'create_trigger':
                return  <div className='create-trigger' onClick={() => setCreateDialog([node.collection, node.relations])}>
                            <i className='pi pi-plus-circle'></i>
                            {node.label}
                        </div>
                break
            default:
                return  <div
                            className={node._id ? (node.level && selection[node.level.toString()] === node._id) ? 'selected node' : 'node' : ''}
                            onClick={() => !node.locked ? setSelection(node.level === '0' ? {'0': node._id} : {...selection, [node.level]: node._id}) : null}
                        >{node.label}{node._id ? <i className='pi pi-cog editNodeBtn' onClick={(e) => {e.stopPropagation(); setEditDialog(node)}}></i> : null}</div>
        }
    }

    const dialogBody = dialog => {
        const [collection, relations] = dialog

        switch(collection) {
            case 'leagues':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: subject.name, _id: subject._id}]}
                                    value={{label: subject.name, _id: subject._id}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>
                            <div className='control'>
                                <InputText disabled={progress} placeholder='Название лиги' value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
                            </div>

                            <div className='section'>
                                <Dropdown
                                    disabled={progress}
                                    options={disciplines ? disciplines.map(d => ({label: d.format+(cleaned(d.format) === cleaned(d.name) ? '' : ` (${d.name})`), value: d._id})) : []}
                                    placeholder='Выберите дисциплину'
                                    value={createForm.disciplineId}
                                    onChange={e => setCreateForm({...createForm, disciplineId: e.value})}
                                />
                            </div>
                        </div>
                break
            case 'seasons':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: subject.name, _id: subject._id}]}
                                    value={{label: subject.name, _id: subject._id}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.leagueName, _id: relations.leagueId}]}
                                    value={{label: relations.leagueName, _id: relations.leagueId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <InputText disabled={progress} placeholder='Название сезона' value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
                            </div>

                            <div className='section'>
                                <Calendar
                                    placeholder='Дата начала'
                                    dateFormat='dd MM yy'
                                    onChange={e => setCreateForm({...createForm, startDate: moment(e.value).format('YY-MM-DD')})}
                                    value={createForm.startDate ? moment(createForm.startDate, 'YY-MM-DD').toDate() : null}
                                    disabled={progress}
                                />
                            </div>
                        </div>
            case 'tournaments':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: subject.name, _id: subject._id}]}
                                    value={{label: subject.name, _id: subject._id}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.leagueName, _id: relations.leagueId}]}
                                    value={{label: relations.leagueName, _id: relations.leagueId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.seasonName, _id: relations.seasonId}]}
                                    value={{label: relations.seasonName, _id: relations.seasonId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <InputText disabled={progress} placeholder='Название турнира' value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
                            </div>
                        </div>
                break
            case 'stages':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: subject.name, _id: subject._id}]}
                                    value={{label: subject.name, _id: subject._id}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>
                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.leagueName, _id: relations.leagueId}]}
                                    value={{label: relations.leagueName, _id: relations.leagueId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.seasonName, _id: relations.seasonId}]}
                                    value={{label: relations.seasonName, _id: relations.seasonId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <Dropdown
                                    disabled
                                    options={[{label: relations.tournamentName, _id: relations.tournamentId}]}
                                    value={{label: relations.tournamentName, _id: relations.tournamentId}}
                                />
                                <div className='nested-marker'><i className='pi pi-angle-double-down'></i></div>
                            </div>

                            <div className='control'>
                                <InputText disabled={progress} placeholder='Название стадии' value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
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
                break
        }
    }

    return  <div className='structure' ref={dsRef} {...events}>
                <Toast ref={toastRef} position='bottom-right' />

                {!data ? (
                    <div className='spinner'>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                ) : (
                    <div className='structure-body'>
                        {/*<Messages ref={messagesRef} style={{marginBottom: 50, maxWidth: '100%'}} />*/}

                        <OrganizationChart
                            value={data}
                            selectionMode='multiple'
                            nodeTemplate={nodeTemplate}
                        />
                    </div>
                )}

                <Dialog
                    visible={createDialog}
                    className='create-dialog'
                    modal
                    header={createDialog ? titles[createDialog[0]].title : null}
                    onHide={() => {
                        if(!progress) {
                            setCreateDialog(null)
                            setCreateForm({})
                        }
                    }}
                    footer={createDialog ? (
                        <div className='create-form_actions'>
                            <Button
                                className='p-button-sm'
                                icon={`pi pi-${progress ? 'spinner pi-spin' : 'check'}`}
                                disabled={progress || !createForm.name}
                                onClick={() => createFlow()}
                            >Создать {titles[createDialog[0]].btn}</Button>
                            <Button
                                className='p-button-sm p-button-danger'
                                onClick={() => {
                                    setCreateDialog(null)
                                    setCreateForm({})
                                }}
                                disabled={progress}
                            >Отмена</Button>
                        </div>
                    ) : null}
                >{createDialog ? dialogBody(createDialog) : null}</Dialog>

                <Dialog
                    visible={finishDialog}
                    className='create-dialog'
                    modal
                    header={finishDialog ? `Завершить турнир?` : ''}
                    onHide={() => {
                        if(!progress) {
                            setFinishDialog(null)
                        }
                    }}
                    footer={finishDialog ? (
                        <div className='create-form_actions'>
                            <Button
                                className='p-button-sm'
                                icon={`pi pi-${progress ? 'spinner pi-spin' : 'check'}`}
                                disabled={progress}
                                onClick={() => finishFlow()}
                            >Завершить турнир</Button>
                            <Button
                                className='p-button-sm p-button-danger'
                                onClick={() => {
                                    setFinishDialog(null)
                                }}
                                disabled={progress}
                            >Отмена</Button>
                        </div>
                    ) : null}
                >{finishDialog ? (
                    <p className='notice'>Турнир «{finishDialog[1]}» будет помечен как завершённый. Для него будут закрыты разделы «Расписание» и «Дозаявки»</p>
                ) : null}</Dialog>

                <Dialog
                    visible={editDialog}
                    className='create-dialog'
                    modal
                    header={editDialog ? editDialog.type === 'league' ? 'Настройки лиги' : `Выполните действие` : ''}
                    onHide={() => {
                        if(!progress) {
                            setEditDialog(null)
                        }
                    }}
                    footer={editDialog ? (
                        <div className='create-form_actions'>
                            {editDialog.removingEnabled ? <Button
                                className='p-button-sm p-button-danger'
                                icon={`pi pi-${progress ? 'spinner pi-spin' : 'ban'}`}
                                disabled={progress}
                                onClick={() => removeNode()}
                            >Удалить</Button> : null}
                            <Button
                                className='p-button-sm'
                                icon={`pi pi-${progress ? 'spinner pi-spin' : 'check'}`}
                                disabled={progress}
                                onClick={() => changeNode()}
                            >Сохранить</Button>
                            <Button
                                className='p-button-sm p-button-secondary'
                                onClick={() => {
                                    setEditDialog(null)
                                }}
                                disabled={progress}
                            >Отмена</Button>
                        </div>
                    ) : null}
                >{editDialog ? (
                    <div className='control'>
                        <InputText disabled={progress} placeholder='Название' value={editDialog.label} onChange={e => setEditDialog({...editDialog, label: e.target.value})} />
                        { editDialog.type === 'stage' ? <div className='section' style={{marginTop: '10px'}}>
                            <div className='field-radiobutton' style={{marginTop: '10px'}} onClick={() => setEditDialog({...editDialog, stageType: 'round'})}>
                                <RadioButton name='stageType' style={{marginRight: '10px'}} inputId='type_round' value='round' checked={editDialog.stageType === 'round'} />
                                <label htmlFor='type_round'>Матчи в круг</label>
                            </div>
                            <div className='field-radiobutton' style={{marginTop: '10px'}} onClick={() => setEditDialog({...editDialog, stageType: 'groups'})}>
                                <RadioButton name='stageType' style={{marginRight: '10px'}} inputId='type_groups' value='groups' checked={editDialog.stageType === 'groups'} />
                                <label htmlFor='type_groups'>Групповой этап</label>
                            </div>
                            <div className='field-radiobutton' style={{marginTop: '10px'}} onClick={() => setEditDialog({...editDialog, stageType: 'playoff'})}>
                                <RadioButton name='stageType' style={{marginRight: '10px'}} inputId='type_playoff' value='playoff' checked={editDialog.stageType === 'playoff'} />
                                <label htmlFor='type_playoff'>Плейофф</label>
                            </div>
                        </div> : editDialog.type === 'league' ? <div className='control' style={{marginTop: '10px'}}>
                            <Dropdown
                                disabled={progress}
                                options={disciplines ? disciplines.map(d => ({label: d.format+(cleaned(d.format) === cleaned(d.name) ? '' : ` (${d.name})`), value: d._id})) : []}
                                placeholder='Выберите дисциплину'
                                value={editDialog.disciplineId}
                                onChange={e => setEditDialog({...editDialog, disciplineId: e.value})}
                            />
                        </div> : editDialog.type === 'tournament' ? (
                            <div className='switch-obj' style={{marginTop: '1rem'}}>
                                <InputSwitch
                                    onChange={() => setEditDialog({...editDialog, finished: !editDialog.finished})}
                                    checked={editDialog.finished}
                                />
                                <div className='text'>Турнир завершён</div>
                            </div>
                        ) : null}
                    </div>
                    ) : null}</Dialog>
            </div>
}

export default Structure

import {Tag} from "primereact/tag";
import React, {useEffect, useState} from "react";
import ItemSchemaPlayer from "../../../MatchEditModal/ItemSchemaPlayer";
import {Button} from "primereact/button";
import service from "../service";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {schemas} from "../../../../references";
import {Tooltip} from "primereact/tooltip";
import '../../../../buttons.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../../env'

const fillArray = len => {
    const res = [];
    for (let i = 0; i < len; i++) {
        res.push({_id: `plr_${i}`, indx: i})
    }
    return res;
}

const Lineup = ({ lineup, setLineup, arrBasic, setArrBasic, mapperGetActive, mode, setMode, setLineups, update, toast, formationKey }) => {

    const limit = ((lineup.formation.split('-').join('')).split('').reduce((a, b) => a + parseInt(b), 0));
    const arrSchema = lineup.formation.split('-').map(item => +item);

    const lineups = schemas[formationKey].map(s => '1-'+s)

    const [disabledButton, setDisabledButton] = useState(true)
    const [renderingGraphics, setRenderingGraphics] = useState(false)

    useEffect(() => {
        const check = arrBasic.find(item => item.indx)
        if (!lineup.name || check || arrBasic === lineup.players){
            setDisabledButton(true)
        } else setDisabledButton(false)
    }, [arrBasic])

    const createDreamLineup = async () => {
        const newLineup = {...lineup, players: arrBasic, managerDream: lineup.managerDream ? lineup.managerDream : null}
        const resp = await service.createDreamLineup(newLineup, toast.current)
        if (resp){
            update(true)
            setMode('')
        }
    }

    const updateDreamLineup = async () => {
        const updLineup = {...lineup, players: arrBasic, managerDream: lineup.managerDream ? lineup.managerDream : null}
        const resp = await service.updateDreamLineup(updLineup._id, updLineup, toast.current)
        if (resp){
            setMode('')
            setLineups(prevState => {
                prevState.lineups = prevState.lineups.map(el => {if (el._id === updLineup._id) el = updLineup; return el});
                return prevState
            })
        }
    }

    const deleteDreamLineup = async () => {
        const resp = await service.deleteDreamLineup(lineup._id, toast.current)
        if (resp){
            setMode('')
            setLineups(prevState => {
                prevState.lineups = prevState.lineups.filter(el => el._id !== lineup._id);
                return prevState
            })
        }
    }

    const renderLineupGraphics = () => {
        setRenderingGraphics(true)
        const sharableUrl = `${ENDPOINT}render/${lineup.federationId === '624c17e25887f52dbfc6819c' ? 'ole' : 'elegance'}/lineup/${lineup._id}`
        axios.get(`${ENDPOINT}share?url=${encodeURIComponent(sharableUrl)}&asDecoded=true`)
            .then(resp => {
                setRenderingGraphics(false)
                const a = document.createElement("a")
                a.href = "data:image/png;base64," + resp.data
                a.download = `${lineup.name}.png`
                a.click()
            })
    }

    return <div className={'compound__block'} style={{margin: '0'}}>
        <div className='compound__block_basic nobgd'>
            <Tag severity='success' icon="pi pi-star" className='request__title'>
                {
                    (mode === 'update' || mode === 'create') ?
                        <InputText
                            id='name'
                            value={lineup.name}
                            placeholder='Введите название'
                            onChange={(e) => {
                                setLineup({...lineup, name: e.target.value})
                                if(!arrBasic.find(item => item.indx)){
                                    setDisabledButton(false)
                                }
                            }}
                            style={{background: 'none', border: 'none', height: '26px', color: 'white', fontWeight: '600'}}
                        />
                        :
                        <div style={{height: '1.25rem', width: 240, textAlign: 'center', fontSize: '1rem', margin: '0.187rem 0.625rem 0'}}>
                            Сводная сборная турнира
                        </div>
                }
            </Tag>
            <div className="basic__block_arrangement">
                {(mode === 'update' || mode === 'create') ?
                    <div className={`tactic`}>
                        <div className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>Схема:</span>
                            <Dropdown
                                options={lineups.map(l => ({value: l, label: l}))}
                                value={lineup.formation}
                                onChange={e => {
                                    setLineup({...lineup, formation: e.target.value})
                                    if(!arrBasic.find(item => item.indx) && lineup.name){
                                        setDisabledButton(false)
                                    }
                                }}
                            />
                        </div>
                    </div>
                    :
                    <div className={`tactic`}>
                        <div className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>Схема: {lineup.formation}</span>
                        </div>
                    </div>
                }
                <div className={`arrangement__tactic_img team ${arrSchema[3] ? '' : 'nomiddls'}`}>
                    {
                        arrSchema[3] ? <div className={`forws`}>
                            {
                                arrBasic.slice(limit - arrSchema[3], limit).map(item =>
                                    (<ItemSchemaPlayer
                                        key={item._id}
                                        item={item}
                                        active={item.active}
                                    />)
                                )
                            }
                        </div> : null
                    }
                    <div className={`middles`}>
                        {
                            arrBasic.slice(arrSchema[1]+1, arrSchema[3] ? limit - arrSchema[3] : limit).map(item =>
                                (<ItemSchemaPlayer
                                    key={item._id}
                                    item={item}
                                    active={item.active}
                                />)
                            )
                        }
                    </div>
                    <div className={`defs`}>
                        {
                            arrBasic.filter((item, ind) => ind > 0 && ind <= arrSchema[1]).map(item =>
                                (<ItemSchemaPlayer
                                        key={item._id}
                                        item={item}
                                        active={item.active}
                                    />)
                            )
                        }
                    </div>
                    <div className={`keeper`}>
                        {
                            arrBasic.filter((item, ind) => ind === 0).map(item =>
                                (<ItemSchemaPlayer
                                    key={item._id}
                                    item={item}
                                    active={item.active}
                                />)
                            )
                        }
                    </div>
                </div>
                {(arrBasic.filter(a => a.name).length > 0) && (mode === 'update' || mode === 'create') ?
                    <div className={`mvp`}>
                        <div className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>MVP сборной:</span>
                            <Dropdown
                                options={arrBasic.filter(a => a.name).map(l => ({value: l._id, label: l.name + ' ' + l.surname}))}
                                value={lineup.mvpId}
                                onChange={e => {
                                    if (e.target.value){
                                        setLineup({...lineup, mvpId: e.target.value})
                                    } else {
                                        setLineup({...lineup, mvpId: null, mvp: null})
                                    }

                                    if(!arrBasic.find(item => item.indx) && lineup.name){
                                        setDisabledButton(false)
                                    }
                                }}
                                placeholder={'Не выбран'}
                                showClear={true}
                            />
                        </div>
                    </div> : null
                }
                {
                    (mode === 'update' || mode === 'create') ? [
                        <div className={`manager`}>
                            <div className='p-inputgroup'>
                                <span className='p-inputgroup-addon'>Менеджер сборной:</span>
                                <InputText
                                    id='name'
                                    value={lineup.managerDream}
                                    onChange={(e) => {
                                        setLineup({...lineup, managerDream: e.target.value})
                                        if(!arrBasic.find(item => item.indx) && lineup.name){
                                            setDisabledButton(false)
                                        }
                                    }}
                                    style={{background: 'none', height: '30px', fontSize: '0.75rem'}}
                                />
                            </div>
                        </div>,
                        (arrBasic.filter(item => item.name || item.surname).length ?
                            <Button
                                className="asLink"
                                onClick={ () => { setArrBasic(mapperGetActive(fillArray(limit))) }}
                            >
                                Очистить расстановку
                            </Button> : null),
                            <div className={'button-gr'}>
                            <Tooltip/>
                            <Button
                                label={mode === 'update' ? "Обновить сборную" : "Создать сборную"}
                                className={mode === 'update' ? "p-button-sm btn-save" : "p-button-sm btn-create"}
                                style={{width: '100%'}}
                                onClick={() => mode === 'update' ? updateDreamLineup() : createDreamLineup()}
                                disabled={disabledButton}
                                tooltip={mode === 'update' ? "Внесите изменения" : !lineup.name ? "Не заполнено название" : 'Не все игроки добавлены'}
                                tooltipOptions={{ showOnDisabled: true, position: "top", disabled: !disabledButton }}
                            />

                            {mode === 'update' ? (
                                <Button
                                    className='p-button-sm render-btn'
                                    label={renderingGraphics ? 'Рендеринг...' : 'Скачать графику'}
                                    icon='pi pi-image'
                                    onClick={() => renderLineupGraphics()}
                                    loading={renderingGraphics}
                                />
                            ) : null}

                            {mode === 'update' ?
                                <Button
                                    label={"Удалить сборную"}
                                    className="p-button-sm btn-delete"
                                    onClick={() => deleteDreamLineup()}
                                /> : null
                            }
                            <Button
                                label={"Закрыть"}
                                className="p-button-sm btn-default"
                                onClick={() => setMode('')}
                            />
                        </div>
                    ] : null
                }
            </div>
        </div>
    </div>
}

export default Lineup

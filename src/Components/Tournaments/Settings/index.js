import React, {useState, useEffect} from 'react'

import './style.scss'
import {InputSwitch} from "primereact/inputswitch";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag'

import { schemas } from '../../../references'

import service from '../service'
import CustomScrollbars from "react-custom-scrollbars-2";

const StatsInStanding = {
    score: 1,
    shotsOnTarget: 0.5,
    shotsTotal: 0.2,
    passesCompleted: 0.2,
    passesOnOpposerSide: 0.3,
    dribblingCompleted: 0.3,
    catchCompleted: 0.2,
    possessionOnOpposerSide: 0.2
}

const LabelsForStats = {
    score: 'Голы',
    shotsOnTarget: 'Удары в створ ворот',
    shotsTotal: 'Всего ударов',
    passesCompleted: 'Точные передачи',
    passesOnOpposerSide: 'Передачи в атакующей зоне',
    dribblingCompleted: 'Удачный дриблинг в атакующей зоне',
    catchCompleted: 'Удачные отборы',
    possessionOnOpposerSide: 'Владение мячом на половине поля соперника'
}

const Settings = ({ subject, toast, updateTournament }) => {
    const [finished, setFinished] = useState(subject.finished);
    const [addons, setAddons] = useState(subject.addonsAllowed);
    const [squadLimit, setSquadLimit] = useState(subject.config && subject.config.squadLimit ? subject.config.squadLimit : null);
    const [periodDuration, setPeriodDuration] = useState(subject.config && subject.config.periodDuration ? subject.config.periodDuration : 25);
    const [periodCount, setPeriodCount] = useState(subject.config && subject.config.periodCount ? subject.config.periodCount : 2);
    const [shootoutPoints, setShootoutPoints] = useState(subject.config && subject.config.shootoutPoints ? subject.config.shootoutPoints : null);
    const [valkoverScore, setValkoverScore] = useState(subject.config && subject.config.valkoverScore ? subject.config.valkoverScore : 3);
    const [splitStagesStats, setSplitStagesStats] = useState(subject.config && subject.config.splitStagesStats ? subject.config.splitStagesStats : false);

    const [extraSquad, setExtraSquad] = useState(subject.config && subject.config.extraSquad ? subject.config.extraSquad : null);
    const [useStatsInStanding, setUseStatsInStanding] = useState(subject.config && subject.config.useStatsInStanding ? subject.config.useStatsInStanding : null)

    const [showInApp, setShowInApp] = useState(subject.showInApp);
    const [name, setName] = useState(subject.name)
    const [appendMarker, setAppendMarker] = useState(subject.appendMarker || '')

    const [defaultFormation, setDefaultFormation] = useState(null)
    const [formationOptions, setFormationOptions] = useState([])

    const [qtyYellow, setQtyYellow] = useState(subject.config && subject.config.disqual && subject.config.disqual.yellow.qty ? subject.config.disqual.yellow.qty : 4);
    const [countYellow, setCountYellow] = useState(subject.config && subject.config.disqual && subject.config.disqual.yellow.count ? subject.config.disqual.yellow.count : 1);
    const [qtyRed, setQtyRed] = useState(subject.config && subject.config.disqual && subject.config.disqual.red.qty ? subject.config.disqual.red.qty : 1);
    const [countRed, setCountRed] = useState(subject.config && subject.config.disqual && subject.config.disqual.red.count ? subject.config.disqual.red.count : 1);
    const [redAsTwoYellow, setRedAsTwoYellow] = useState(subject.config && subject.config.disqual && subject.config.disqual.redAsTwoYellow ? subject.config.disqual.redAsTwoYellow : false);

    useEffect(() => {
        if (subject) {
            setFinished(subject.finished);
            setAddons(subject.addonsAllowed);
            setSquadLimit(subject.config && subject.config.squadLimit ? subject.config.squadLimit : null);
            setShootoutPoints(subject.config && subject.config.shootoutPoints ? subject.config.shootoutPoints : null);

            setExtraSquad(subject.config && subject.config.extraSquad ? subject.config.extraSquad : null);
            setUseStatsInStanding(subject.config && subject.config.useStatsInStanding ? subject.config.useStatsInStanding : null)

            setPeriodDuration(subject.config && subject.config.periodDuration ? subject.config.periodDuration : 25);
            setPeriodCount(subject.config && subject.config.periodCount ? subject.config.periodCount : 2);
            setValkoverScore(subject.config && subject.config.valkoverScore ? subject.config.valkoverScore : 3);
            setSplitStagesStats(subject.config && subject.config.splitStagesStats ? true : false)

            setShowInApp(subject.showInApp);
            setName(subject.name);
            setAppendMarker(subject.appendMarker || '');

            setQtyYellow(subject.config && subject.config.disqual && subject.config.disqual.yellow.qty ? subject.config.disqual.yellow.qty : 4)
            setCountYellow((subject.config && subject.config.disqual && subject.config.disqual.yellow.count ? subject.config.disqual.yellow.count : 1))
            setQtyRed(subject.config && subject.config.disqual && subject.config.disqual.red.qty ? subject.config.disqual.red.qty : 1)
            setCountRed((subject.config && subject.config.disqual && subject.config.disqual.red.count ? subject.config.disqual.red.count : 1))
            setRedAsTwoYellow(subject.config && subject.config.disqual && subject.config.disqual.redAsTwoYellow ? subject.config.disqual.redAsTwoYellow : false)

            if(subject.league && subject.league.discipline) {
                const formationKey = subject.league.discipline.name.split('x')[0]
                console.log('FK', formationKey)
                const available = schemas[formationKey]
                if(available) {
                    setFormationOptions(available)
                    setDefaultFormation(subject.config && subject.config.schema || available[0])
                }
            }
        }
    },[subject])

    return (
        <div className={'tournament-settings'}>
            <div className='grid p-fluid'>
                <div className='col-md-12'>
                    <div className='p-inputgroup am'>
                        <span className='p-inputgroup-addon'>Отображаемое имя</span>
                        <InputText value={name} onChange={(e) => setName(e.target.value)} onBlur={async e => {
                            const internalName = name+(appendMarker && appendMarker.length ? ' ('+appendMarker+')' : '')
                            await service.renameTournament(subject._id, name.trim(), toast, false, internalName)
                            updateTournament({name: name, internalName: internalName})
                        }}/>
                        <span className='p-inputgroup-addon'>Внутренний маркер</span>
                        <InputText style={{maxWidth: 170}} value={appendMarker} onChange={(e) => setAppendMarker(e.target.value)} onBlur={async e => {
                            const internalName = name+(appendMarker && appendMarker.length ? ' ('+appendMarker+')' : '')
                            await service.renameTournament(subject._id, appendMarker.trim(), toast, true, internalName)
                            updateTournament({appendMarker: appendMarker, internalName: internalName})
                        }}/>
                    </div>
                </div>
            </div>

            <CustomScrollbars autoHide autoHeight autoHeightMin='77vh'>

                <div className='fields-grid triple-row'>

                <div className='card fields-group'>
                    <Tag className='group-title'>Статус</Tag>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {addonsAllowed: !addons}, toast)
                            setAddons(!addons)
                            updateTournament({addonsAllowed: !addons})
                        }}
                    >
                        <InputSwitch checked={addons} />
                        <div className={'text'}>Заявки / дозаявки разрешены</div>
                    </div>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {'config.squadLimit': squadLimit === null ? 23 : null}, toast)
                            setSquadLimit(squadLimit === null ? 23 : null)
                            updateTournament({config: {...subject.config, squadLimit: squadLimit === null ? 23 : null}})
                        }}
                    >
                        <InputSwitch checked={squadLimit !== null} />
                        <div className={'text'} style={{whiteSpace: 'nowrap'}}>
                            Лимит игроков в заявке
                            {squadLimit !== null ? (
                                <InputNumber
                                    onClick={e => e.stopPropagation()}
                                    disabled={!squadLimit}
                                    inputId="integeronly"
                                    value={squadLimit}
                                    onValueChange={async e => {
                                    if(!isNaN(e.value)) {
                                        await service.simpleUpdate(subject._id, {'config.squadLimit': parseInt(e.value)}, toast)
                                        setSquadLimit(parseInt(e.value))
                                        updateTournament({config: {...subject.config, squadLimit: parseInt(e.value)}})
                                    }
                                }} />
                            ) : null}
                        </div>
                    </div>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.updFinishedState(subject._id, !finished, toast)
                            setFinished(!finished)
                            updateTournament({finished: !finished})
                        }}
                    >
                        <InputSwitch checked={finished} />
                        <div className={'text'}>Турнир завершён</div>
                    </div>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {showInApp: !showInApp}, toast)
                            setShowInApp(!showInApp)
                            updateTournament({showInApp: !showInApp})
                        }}
                    >
                        <InputSwitch checked={showInApp} />
                        <div className={'text'}>Показывать на сайте</div>
                    </div>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {'config.splitStagesStats': !splitStagesStats}, toast)
                            setSplitStagesStats(!splitStagesStats)
                            updateTournament({config: {...subject.config, splitStagesStats: !splitStagesStats}})
                        }}
                    >
                        <InputSwitch checked={splitStagesStats} />
                        <div className={'text'}>Сплитованная статистика стадий </div>
                    </div>

                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {'config.extraSquad': extraSquad === null ? {enable: true, canonicalLimit: 2, duplLimit: 4} : null}, toast)
                            setExtraSquad( extraSquad === null ? {enable: true, canonicalLimit: 2, duplLimit: 4} : null)
                            updateTournament({config: {...subject.config, extraSquad: extraSquad === null ? {enable: true, canonicalLimit: 2, duplLimit: 4} : null}})
                        }}
                    >
                        <InputSwitch checked={extraSquad !== null} />
                        <div className={'text'} style={{whiteSpace: 'nowrap'}}>Разрешить сквозные заявки в турнире?</div>
                    </div>

                    {extraSquad ? [
                        <div className={'switch-obj withoutSwitch'}>
                            {/*<div className={'text'}>Очков за победу</div>*/}
                            <label htmlFor="extraSquad" className={'label text nm'}>Из основной команды</label>
                            <InputNumber disabled={!extraSquad} inputId="extraSquad" value={extraSquad.canonicalLimit} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.extraSquad': {...extraSquad, canonicalLimit: parseInt(e.value)}}, toast)
                                    setExtraSquad({...extraSquad, canonicalLimit: parseInt(e.value)})
                                    updateTournament({config: {...subject.config, extraSquad: {...extraSquad, canonicalLimit: parseInt(e.value)}}})
                                }
                            }}/>
                        </div>,
                        <div className={'switch-obj withoutSwitch'} >
                            {/*<div className={'text'}>Очков за поражение</div>*/}
                            <label htmlFor="shootoutPointsLose" className={'label text nm'}>Из дубля</label>
                            <InputNumber disabled={!extraSquad} inputId="shootoutPointsLose" value={extraSquad.duplLimit} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.extraSquad': {...extraSquad, duplLimit: parseInt(e.value)}}, toast)
                                    setExtraSquad({...extraSquad, duplLimit: parseInt(e.value)})
                                    updateTournament({config: {...subject.config, extraSquad: {...extraSquad, duplLimit: parseInt(e.value)}}})
                                }
                            }}/>
                        </div>
                    ] : null}

                    {subject.useStatsInStandingEnable ? (
                        <div
                            className={'switch-obj'}
                            onClick={async () => {
                                await service.simpleUpdate(subject._id, {'config.useStatsInStanding': !useStatsInStanding || !useStatsInStanding.enable ? {enable: true, values: {...StatsInStanding}} : {enable: false, values: {...StatsInStanding}}}, toast)
                                setUseStatsInStanding( !useStatsInStanding || !useStatsInStanding.enable ? {enable: true, values: {...StatsInStanding}} : {enable: false, values: {...StatsInStanding}})
                                updateTournament({config: {...subject.config, useStatsInStanding: !useStatsInStanding || !useStatsInStanding.enable ? {enable: true, values: {...StatsInStanding}} : {enable: false, values: {...StatsInStanding}}}})
                            }}
                        >
                            <InputSwitch checked={useStatsInStanding && useStatsInStanding.enable} />
                            <div className={'text'} style={{whiteSpace: 'nowrap'}}>Учитывать статистические показатели?</div>
                        </div>
                    ) : null}
                </div>

                {useStatsInStanding && useStatsInStanding.enable ? (
                    <div className='card fields-group'>
                        <Tag className='group-title'>Статистические показатели</Tag>
                        {Object.keys(StatsInStanding).map(key => {
                            return <div className={'switch-obj withoutSwitch'}>
                                <label htmlFor={key} className={'label text nm'}>{LabelsForStats[key]}</label>
                                <InputNumber disabled={!useStatsInStanding || !useStatsInStanding.enable} inputId={key} value={useStatsInStanding.values[key]} onValueChange={async e => {
                                    if(!isNaN(e.value)) {
                                        await service.simpleUpdate(subject._id, {'config.useStatsInStanding': {...useStatsInStanding, values: {...useStatsInStanding.values, [key]: parseInt(e.value)}}}, toast)
                                        setUseStatsInStanding({...useStatsInStanding, values: {...useStatsInStanding.values, [key]: parseInt(e.value)}})
                                        updateTournament({config: {...subject.config, useStatsInStanding: {...useStatsInStanding, values: {...useStatsInStanding.values, [key]: parseInt(e.value)}}}})
                                    }
                                }}/>
                            </div>
                        })}
                    </div>
                ) : null}

                <div className='card fields-group'>
                    <Tag className='group-title'>Матчи</Tag>

                    <div className={'switch-obj'}>
                        {/*<div className={'text nm'}>Количество таймов в матче</div>*/}
                        <label htmlFor="periodCount" className={'label text nm'}>Количество таймов в матче</label>
                        <InputNumber inputId="periodCount" value={periodCount} onValueChange={async e => {
                            if(!isNaN(e.value)) {
                                await service.simpleUpdate(subject._id, {'config.periodCount': parseInt(e.value)}, toast)
                                setPeriodCount(parseInt(e.value))
                                updateTournament({config: {...subject.config, periodCount: parseInt(e.value)}})
                            }
                        }}/>
                    </div>

                    <div className={'switch-obj'}>
                        {/*<div className={'text nm'}>Продолжительность тайма</div>*/}
                        <label htmlFor="periodDuration" className={'label text nm'}>Продолжительность тайма</label>
                        <InputNumber inputId="periodDuration" value={periodDuration} onValueChange={async e => {
                            if(!isNaN(e.value)) {
                                await service.simpleUpdate(subject._id, {'config.periodDuration': parseInt(e.value)}, toast)
                                setPeriodDuration(parseInt(e.value))
                                updateTournament({config: {...subject.config, periodDuration: parseInt(e.value)}})
                            }
                        }}/>
                    </div>
                    <div className={'switch-obj'}>
                        <label htmlFor="valkoverScore" className={'label text nm'}>Голов победителю при тех.победе</label>
                        <InputNumber inputId="valkoverScore" value={valkoverScore} onValueChange={async e => {
                            if(!isNaN(e.value)) {
                                await service.simpleUpdate(subject._id, {'config.valkoverScore': parseInt(e.value)}, toast)
                                setValkoverScore(parseInt(e.value))
                                updateTournament({config: {...subject.config, valkoverScore: parseInt(e.value)}})
                            }
                        }}/>
                    </div>
                    <div
                        className={'switch-obj'}
                        onClick={async () => {
                            await service.simpleUpdate(subject._id, {'config.shootoutPoints': shootoutPoints === null ? {win: 2, lose: 1} : null}, toast)
                            setShootoutPoints(shootoutPoints === null ? {win: 2, lose: 1} : null)
                            updateTournament({config: {...subject.config, shootoutPoints: shootoutPoints === null ? {win: 2, lose: 1} : null}})
                        }}
                    >
                        <InputSwitch checked={shootoutPoints !== null} />
                        <div className={'text'} style={{whiteSpace: 'nowrap'}}>Учитывать серию пенальти в матче?</div>
                    </div>

                    {shootoutPoints ? [
                        <div className={'switch-obj withoutSwitch'}>
                            {/*<div className={'text'}>Очков за победу</div>*/}
                            <label htmlFor="shootoutPoints" className={'label text nm'}>Очков за победу</label>
                            <InputNumber disabled={!shootoutPoints} inputId="shootoutPoints" value={shootoutPoints.win} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.shootoutPoints': {...shootoutPoints, win: parseInt(e.value)}}, toast)
                                    setShootoutPoints({...shootoutPoints, win: parseInt(e.value)})
                                    updateTournament({config: {...subject.config, shootoutPoints: {...shootoutPoints, win: parseInt(e.value)}}})
                                }
                            }}/>
                        </div>,
                        <div className={'switch-obj withoutSwitch'} >
                            {/*<div className={'text'}>Очков за поражение</div>*/}
                            <label htmlFor="shootoutPointsLose" className={'label text nm'}>Очков за поражение</label>
                            <InputNumber disabled={!shootoutPoints} inputId="shootoutPointsLose" value={shootoutPoints.lose} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.shootoutPoints': {...shootoutPoints, lose: parseInt(e.value)}}, toast)
                                    setShootoutPoints({...shootoutPoints, lose: parseInt(e.value)})
                                    updateTournament({config: {...subject.config, shootoutPoints: {...shootoutPoints, lose: parseInt(e.value)}}})
                                }
                            }}/>
                        </div>
                    ] : null}
                </div>

                <div className='card fields-group'>
                        <Tag className='group-title'>Дисквалификации</Tag>

                        <div className={'switch-obj'}>
                            {/*<div className={'text nm'}>Количество таймов в матче</div>*/}
                            <label htmlFor="qtyYellow" className={'label text nm'}>Кол-во ЖК для дисквалификации</label>
                            <InputNumber inputId="qtyYellow" value={qtyYellow} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.disqual.yellow.qty': parseInt(e.value)}, toast)
                                    setQtyYellow(parseInt(e.value))
                                    updateTournament({config: {...subject.config, disqual: {...subject.config.disqual, yellow: {...subject.config.disqual.yellow, qty: parseInt(e.value)}}}})
                                }
                            }}/>
                        </div>

                        <div className={'switch-obj'}>
                            {/*<div className={'text nm'}>Продолжительность тайма</div>*/}
                            <label htmlFor="countYellow" className={'label text nm'}>Кол-во пропускаемых матчей за перебор ЖК</label>
                            <InputNumber inputId="countYellow" value={countYellow} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.disqual.yellow.count': parseInt(e.value)}, toast)
                                    setCountYellow(parseInt(e.value))
                                    updateTournament({config: {...subject.config, disqual: {...subject.config.disqual, yellow: {...subject.config.disqual.yellow, count: parseInt(e.value)}}}})
                                }
                            }}/>
                        </div>
                        <div className={'switch-obj'}>
                            <label htmlFor="qtyRed" className={'label text nm'}>Кол-во КК для дисквалификации</label>
                            <InputNumber inputId="qtyRed" value={qtyRed} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.disqual.red.qty': parseInt(e.value)}, toast)
                                    setQtyRed(parseInt(e.value))
                                    updateTournament({config: {...subject.config, disqual: {...subject.config.disqual, red: {...subject.config.disqual.red, qty: parseInt(e.value)}}}})
                                }
                            }}/>
                        </div>
                        <div className={'switch-obj'}>
                            <label htmlFor="countRed" className={'label text nm'}>Кол-во пропускаемых матчей за КК</label>
                            <InputNumber inputId="countRed" value={countRed} onValueChange={async e => {
                                if(!isNaN(e.value)) {
                                    await service.simpleUpdate(subject._id, {'config.disqual.red.count': parseInt(e.value)}, toast)
                                    setCountRed(parseInt(e.value))
                                    updateTournament({config: {...subject.config, disqual: {...subject.config.disqual, red: {...subject.config.disqual.red, count: parseInt(e.value)}}}})
                                }
                            }}/>
                        </div>
                        <div
                            className={'switch-obj'}
                            onClick={async () => {
                                await service.simpleUpdate(subject._id, {'config.disqual.redAsTwoYellow': !redAsTwoYellow}, toast)
                                setRedAsTwoYellow(!redAsTwoYellow)
                                updateTournament({config: {...subject.config, disqual: {...subject.config.disqual, redAsTwoYellow: !redAsTwoYellow}}})
                            }}
                        >
                            <InputSwitch checked={redAsTwoYellow} />
                            <div className={'text'} style={{whiteSpace: 'nowrap'}}>КК за две ЖК в матче?</div>
                        </div>
                    </div>

                {formationOptions && formationOptions.length ? (
                    <div className='card fields-group'>
                        <Tag className='group-title'>Схема сборной тура / турнира</Tag>

                        <div className={'schemaBtns-container'}>
                            <div className={`schemaBtns`}>
                                {formationOptions.map((it,  i)=>(<div key={'schemaBtn_'+i} className="field-radiobutton">
                                    <RadioButton
                                        inputId={it}
                                        name="schemaBtns"
                                        value={it}
                                        onChange={async (e) => {
                                            await service.simpleUpdate(subject._id, {'config.schema': e.value}, toast);
                                            setDefaultFormation(e.value);
                                            updateTournament({config: {...subject.config, schema: e.value}})
                                        }}
                                        checked={defaultFormation === it}
                                    />
                                    <label htmlFor={it}>{it}</label>
                                </div>))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            </CustomScrollbars>
        </div>
    )
}

export default Settings

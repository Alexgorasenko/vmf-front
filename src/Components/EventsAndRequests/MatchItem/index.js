import React, {useEffect, useRef, useState} from 'react'
import './style.scss'
import emblem from "../../Emblem";
import {Tag} from "primereact/tag";
import {Link, useHistory, useLocation} from "react-router-dom";
import moment from 'moment'
import {InputText} from "primereact/inputtext";
import {InputNumber} from 'primereact/inputnumber';
import axios from "axios";
import {ENDPOINT} from "../../../env";
import {Button} from "primereact/button";
import { OverlayPanel } from 'primereact/overlaypanel';
import {Tooltip} from "primereact/tooltip";

const extractEmblem = obj => {
    return obj.emblem || (obj.origin ? obj.origin.emblem ? obj.origin.emblem : obj.origin.source === 'ole' && obj.origin.remoteId ? `https://amateum.fra1.digitaloceanspaces.com/clubs/ole/${obj.origin.remoteId}.png` : require('./pennant.png') : require('./pennant.png'))
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

const StatsInStanding = {
    score: 0,
    shotsOnTarget: 0,
    shotsTotal: 0,
    passesCompleted: 0,
    passesOnOpposerSide: 0,
    dribblingCompleted: 0,
    catchCompleted: 0,
    possessionOnOpposerSide: 0
}

const RefinementsDefault = {
    1: 'pi pi-bolt',
    2: 'pi pi-star',
    3: 'pi pi-users',
    4: 'pi pi-id-card'
}

const TooltipForRefinements = {
    1: 'Не заполнен счет',
    2: 'Не заполнены авторы голов',
    3: 'Не заполнен персонал',
    4: 'Не заполнен состав'
}

const MatchItem = ({ data, showDate, subject, patchScores }) => {
    const { _id, scores, home, away, date, time, stage, employees } = data

    let location = useLocation();

    const referees = employees ? employees.filter(p => p.role === 'referee') : []
    const [visible, setVisible] = useState(false)
    const [stats1, setStats1] = useState(StatsInStanding)
    const [stats2, setStats2] = useState(StatsInStanding)
    const [rapidScore, setRapidScore] = useState({home: 0, away: 0})
    const [rapidProcessing, setRapidProcessing] = useState(false)

    const toastRef = useRef(null)
    const rapidRef = useRef()

    const useRefinements = subject._id === '63720deb3d69d811c73373e5' || subject._id === '63283eba7d3ec0dbcb77bd13'
    const [refinements, setRefinements] = useState([])

    useEffect(() => {
        if (data && data.scores && data.scores.full){
            if (data.scores.stats){
                setStats1({...data.scores.stats.home, score: data.scores.full.home})
                setStats2({...data.scores.stats.away, score: data.scores.full.away})
            } else {
                setStats1({...stats1, score: data.scores.full.home})
                setStats2({...stats2, score: data.scores.full.away})
            }
        }
    },[])

    useEffect(() => {
        if (useRefinements){
            const newRefinements = []
            if (data){
                if (!data.scores){
                    newRefinements.push(1)
                } else {
                    if (!data.isFullGoalEvents){
                        newRefinements.push(2)
                    }
                }
                if (!employees || employees.length === 0){
                    newRefinements.push(3)
                }
                if (!home.roster || !away.roster){
                    newRefinements.push(4)
                }
                setRefinements(newRefinements)
            }
        }

    }, [data])

    const publishMatch = () => {
        setVisible(false)
        axios.post(`${ENDPOINT}v2/applyMatchChanges`, {
            form: {
                awayRoster: data.awayRoster,
                date: date,
                employees: employees,
                homeRoster: data.homeRoster,
                locationId: data.locationId,
                time: time,
                _id: data._id,
                scores: {...scores, stats: {home: stats1, away: stats2}}
            }}, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Матч сохранён!'})
        })
    }

    return [
            visible ? <div className={'modal-stat'} onClick={() => setVisible(false)}>
                <div className={'modal-dialog'} onClick={e => e.stopPropagation()}>
                    <div className={'modal-background'}>
                        <div className='title'>
                            {data.home && <span>{data.home.name} vs {data.away.name}</span>}
                        </div>
                        <div className={'stats'}>
                            <div className={'team-stat'}>{
                                Object.keys(LabelsForStats).map(key => {
                                    return <div className='p-inputgroup am'>
                                        <InputText value={stats1[key]} disabled={key==='score'} onChange={(e) => setStats1({...stats1, [key]: e.target.value === '0' ? e.target.value : e.target.value.replace(/^0+/, '')})} style={{textAlign: 'center'}} keyfilter="num"/>
                                        <span className='p-inputgroup-addon' style={{width: '20vw', textAlign: 'center'}}>{LabelsForStats[key]}</span>
                                        <InputText value={stats2[key]} disabled={key==='score'} onChange={(e) => setStats2({...stats2, [key]: e.target.value === '0' ? e.target.value : e.target.value.replace(/^0+/, '')})} style={{textAlign: 'center'}} keyfilter="num"/>
                                    </div>
                                })
                            }</div>
                        </div>
                        <div className={'btn-group'}>
                            <Button
                                label={"Сохранить"}
                                icon="pi pi-check"
                                className="btn-save"
                                onClick={() => publishMatch()}
                            />
                            <Button
                                label={"Закрыть"}
                                icon="pi pi-check"
                                className="btn-default"
                                onClick={() => setVisible(false)}
                            />
                        </div>
                    </div>
                </div>
            </div> : null,
            <div className={'match-item'}>
                <Link
                    to={{
                        pathname: `/?editmatch=${_id}`,
                        // This is the trick! This link sets
                        // the `background` in location state.
                        state: { background: location }
                    }}
                    style={{
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'row',
                        gridGap: '2.12rem',
                        alignItems: 'center'
                }}
                >
                    <div className={'teams-block'}>
                        <div className={'team'}>
                            {emblem({source: extractEmblem(home.emblem ? home : home.club), backdroped: false, size: 'xs'})}
                            <div className={'name'}>{home.name}</div>
                            <div className={'score'}>{scores && scores.full ? scores.full.home : '-'}</div>
                        </div>
                        <div className={'line'}></div>
                        <div className={'team'}>
                            {emblem({source: extractEmblem(away.emblem ? away : away.club), backdroped: false, size: 'xs'})}
                            <div className={'name'}>{away.name}</div>
                            <div className={'score'}>{scores && scores.full ? scores.full.away : '-'}</div>
                        </div>
                    </div>
                    <div className={'meta-block'}>
                        {showDate ? <div className='match-date'>{moment(date, 'YY-MM-DD').format('D MMMM YYYY')}</div> : null}
                        <div className='info'>{[(time || null), data.location ? data.location.name : 'стадион не указан'].filter(e => e).join(', ')}</div>
                        {stage ? <Tag className="tag" severity="info" value={stage.tournament.name}></Tag> : null}
                    </div>
                    <div className={'status-block'}>
                        <div className={'info'}>арб.: {!referees.length ? 'нет назначений' : referees.map(r => r.name ? r.name.split(' ')[0] : '').join(', ')}</div>
                        {scores && scores.full && typeof(scores.full.home) !== 'undefined' ? (
                            <Tag className="tag" icon="pi pi-check" severity="success" value="размещён в статистике"></Tag>
                        ) : [
                            <Tag
                                className='tag'
                                severity='info'
                                icon='pi pi-bolt'
                                value="быстрый результат"
                                onClick={e => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    rapidRef.current.toggle(e);
                                }}
                            ></Tag>
                        ]}
                    </div>

                </Link>

                <div className='refinements-group'>
                    {refinements ? refinements.map(r => [
                        <Tooltip target={`.tooltip${r}`}/>,
                        <i
                            className={`tooltip${r} ${RefinementsDefault[r]}`}
                            data-pr-tooltip={TooltipForRefinements[r]}
                            data-pr-position='top'
                        />
                    ]) : null}
                    {data.useStatsInStanding && scores ? (
                        <Tag severity='info' value={'статистические показатели'} className='stats'
                             onClick={(e) => {
                                 setVisible(true)
                             }}
                        />
                    ) : null}
                    {data.refinementsQty ? (
                        <Tag severity='danger' value={'возможных корректировок: '+data.refinementsQty} className='refinements' />
                    ) : null}
                </div>
            </div>,
            <OverlayPanel ref={rapidRef} showCloseIcon>
                <div className='rapid-score'>
                    <div className='inputs'>
                        <div>
                            <label htmlFor="homeRapidScore">{home.name}</label>
                            <InputNumber min={0} max={49} inputId="homeRapidScore" value={rapidScore.home} onValueChange={(e) => setRapidScore({...rapidScore, home: e.target.value})} showButtons />
                        </div>
                        <div>
                            <label htmlFor="awayRapidScore">{away.name}</label>
                            <InputNumber min={0} max={49} inputId="awayRapidScore" value={rapidScore.away} onValueChange={(e) => setRapidScore({...rapidScore, away: e.target.value})} showButtons />
                        </div>
                    </div>
                    <Button
                        className='btn-save p-button-sm'
                        icon='pi pi-check'
                        label='Разместить в статистике'
                        disabled={rapidProcessing || isNaN(rapidScore.home) || isNaN(rapidScore.away)}
                        loading={rapidProcessing}
                        onClick={e => {
                            setRapidProcessing(true)
                            axios.put(`${ENDPOINT}v2/matches/${_id}?rapid=true`, {scores: {full: rapidScore}}, {
                                headers: {
                                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                                }
                            }).then(resp => {
                                setRapidProcessing(false)
                                rapidRef.current.hide(e)
                                patchScores(rapidScore)
                            })
                        }}
                    />
                </div>
            </OverlayPanel>
    ];
}

export default MatchItem

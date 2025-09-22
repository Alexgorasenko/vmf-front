import React, {useCallback, useEffect, useRef, useState} from "react";

import Photo from "../../../assets/img/image 19.png";
import PlayerPhoto from "../../../assets/img/soccer-player-1.svg";
import {Tag} from "primereact/tag";
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";

import service from "../service";

import axios from "axios";
import { CancelToken, isCancel } from 'axios';
import { ENDPOINT } from '../../../env'
import moment from 'moment';

const useCancelToken = () => {
    const axiosSource = useRef(null);
    const newCancelToken = useCallback(() => {
        axiosSource.current = CancelToken.source();
        return axiosSource.current.token;
    }, []);

    useEffect(
        () => () => {
            if (axiosSource.current) axiosSource.current.cancel();
        },
        []
    );

    return { newCancelToken, isCancel };
};

const useOnScreen = (ref) => {

    const [isIntersecting, setIntersecting] = useState(false)

    const observer = new IntersectionObserver(
        ([entry]) => setIntersecting(entry.isIntersecting)
    )

    useEffect(() => {
        observer.observe(ref.current)
        // Remove the observer as soon as the component is unmounted
        return () => { observer.disconnect() }
    }, [])

    return isIntersecting
}

const getActiveTeamsWithOutDoubles = (squads) => {
    return squads.reduce((result, item) => {
        return !result.length ?
            [...result, item] :
            result.map(r => {
                return r.teamId === item.teamId
            }) ? result : [...result, item];
    }, [])
}

const PlayerCard = ({ playerData, setSelectedPlayer, selected, setOpenPlrCandidates, clubView, toast, clearGlobal }) => {
    const ref = useRef()
    const isVisible = useOnScreen(ref)
    //const player = props.player
    const [player, setPlayer] = useState(playerData ? {...playerData} : null)
    const [candidates, setDoubles] = useState([])
    const { newCancelToken, isCancel } = useCancelToken();

    const [load, setLoad] = useState(false)

    useEffect(() => {
        setPlayer(playerData ? {...playerData} : null)
    }, [playerData])

    useEffect(() => {
        if ( isVisible && candidates.length===0 && !clubView ) {
            axios.get(`${ENDPOINT}v2/getCandidatesForPlayer/${player._id}?byFederation=true`, {
                cancelToken: newCancelToken(),
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            })
            .then(
                resp => {
                    setDoubles(resp.data && resp.data.candidates ? resp.data.candidates : [])
                    setLoad(true)
                })
            .catch((error) => {
                if (isCancel(error)) return;
            });
        }
    }, [isVisible, newCancelToken, isCancel])

    const getAmountOfDoubles = (value) => {
        let n = value
        n %= 100
        if (n >= 5 && n <= 20) {
            return `показать ${value} профилей`;
        }
        n %= 10;
        if (n === 1) {
            return `показать ${value} профиль`;
        }
        if (n >= 2 && n <= 4) {
            return `показать ${value} профиля`;
        }
        return `показать ${value} профилей`;
    }
    const getDisqualLabel = d => {
        const tl = `${d.tournament ? d.tournament.name : 'не указан'}`;

        return d.count ? d.fictive ? `${tl} - фиктивная` : `${tl} - ${d.missedMatches ? d.missedMatches.length : 0} из ${d.count} матчей` : d.finishDate ? `${tl} до ${moment(d.finishDate, 'YY-MM-DD').format('DD MMM YYYY')}` : d.comment;
    }

    const confirmClearing = (pid, evt) => {
        confirmPopup({
            target: evt.currentTarget,
            message: 'Вы действительно хотите снять глобальную дисквалификацию?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: async () => {
                //console.log('REMOVE', id, 'form', form);
                await clearGlobal(pid)
                //setPlayer({...player, globalDisqTill: null})
                //reload(true)
            }
        });
    }

    return <div className={`content-btn ${load || clubView ? '' : 'notactive'} ${selected ? 'selected' : ''}`} ref={ref} onClick={
        () => {
            if (!selected) {
                setSelectedPlayer({
                _id: player._id,
                avatarUrl: player.avatarUrl,
                birthday: player.birthday,
                surname: player.surname,
                name: player.name,
                middlename: player.middlename,
                globalDisqTill: player.globalDisqTill,
                squads: player.squads,
                disqualifications: player.disqualifications || [],
                candidates: candidates
            })}
        }}
    >

        <div className={'rectangle'}>

            <div className={'photo-rectangle'}>
                <img src={player.avatarUrl || PlayerPhoto} className={'photo'}/>
            </div>
            <div className={'info'}>
                <div className={'name'}>
                    {`${player.surname || ''} ${player.name || ''} ${player.middlename || ''}`}
                </div>
                <div className={'date'}>
                    <Tag className="tag" severity="info" value={player.birthday || 'возраст не указан'}/>
                </div>
            </div>

            <div className={'block'}>
                <div className={'text'}>активные заявки:</div>
                <div className={'teams'}>
                    {getActiveTeamsWithOutDoubles(player.squads.actived).length > 0 ? getActiveTeamsWithOutDoubles(player.squads.actived).map((a, index) => {
                        return index > 2 && index === getActiveTeamsWithOutDoubles(player.squads.actived).length - 1 ?
                            <Tag key={index} className="tag" severity="info"
                                 value={`+ еще ${index - 2}`}/> : index < 3 ?
                                <Tag key={index} className="tag" severity="info" value={a.team.name}/> : null
                    }) : <Tag className="tag-not-found" severity="info" value={'нет'}/>}
                </div>
            </div>

            <div className={'block disqualification'} onClick={(evt) => {
                evt.stopPropagation()
            }}>
                <ConfirmPopup />
                <div className={'text'}>дисквалификации:</div>
                <div className={'teams'}>
                    {player.disqualifications && player.disqualifications.length ? (
                        player.disqualifications.map(d => {
                            const key = d._id;
                            return <Tag key={key} className="tag-disqualification" severity="info" value={getDisqualLabel(d)}/>
                        })
                    ) : <Tag className="tag-not-found" severity="info" value={'нет'}/>}

                    {!clubView && player.globalDisqTill && player.globalDisqTill >= moment().format('YY-MM-DD') ? <Tag
                        className="tag-global"
                        onClick={(evt) => {
                            evt.stopPropagation()
                            //clearGlobal()
                            confirmClearing(player._id, evt)
                        }}
                        severity="success"
                        style={{cursor: 'pointer', zIndex: 2}}
                        value={'Снять глоб.дисквал'}
                    /> : null}
                </div>

            </div>
            {!clubView ?
                <div className={'block candidates'}>
                    <div className={'text'}>возможные дубли:</div>
                    <div className={'teams'}>
                        {(candidates.length > 1) ? <Tag
                            className="tag-doubles"
                            onClick={() => setOpenPlrCandidates({...player, candidates: candidates})}
                            severity="info"
                            style={{cursor: 'pointer'}}
                            value={getAmountOfDoubles(candidates.length - 1)}/> : load ?
                            <Tag className="tag-not-found" severity="info" value={'нет'}/> :
                            <i className="pi pi-spin pi-spinner"/>}
                    </div>
                </div> : null
            }
        </div>
    </div>
}

export default PlayerCard

import {Tag} from "primereact/tag";
import PositionIcon from "../../../assets/img/position-icon.svg";
import {InputText} from "primereact/inputtext";
import PlayerNumberIcon from "../../../assets/img/player-number-icon.svg";
import React, {useRef, useState} from "react";
import {Button} from "primereact/button";
import {OverlayPanel} from "primereact/overlaypanel";
import service from "../service";

import moment from 'moment'

const TeamItem = (props) => {
    const team = props.team
    const selectedPlayer = props.selectedPlayer

    const op = useRef(null);

    const [dis, setDis] = useState({count: 0})

    const sendData = async (count) => {
        const data = {count: count, playerId: selectedPlayer._id, squadId: team.squadId, tournamentId: team.tournament._id}
        const resp = await service.sendDisq({dis: data})

        console.log(resp)
    }

    return <div className={'team-item'} id={team.squadId}>
        <div className={'default-info'}>
            <div className={'team-info'}>
                <div className={'team-name'}>{team.team.name}</div>
                <Tag className="tag-league" severity="info" value={team.tournament.name}/>
            </div>
            <i className="pi pi-chevron-circle-right" onClick={() => props.openTeamCard(team.squadId)}></i>
        </div>
        <div className={'opened-info'}>
            <div className={'linked'}>
                <div className={'tag-group'}>
                    <Tag className="tag-linked" severity="info" value={`Заявлен ${moment(team.linked, 'YY-MM-DD').format('D MMM YYYY')}`}/>
                    {team.unlinked!==null ? <Tag className="tag-unlinked" severity="info" value={`Отзаявлен ${team.unlinked}`}/> : null}
                </div>
                {selectedPlayer.disqualifications.map(d => {
                    if (d.squadId === team.squadId) {
                        return <Tag icon={'pi pi-exclamation-triangle'} className="tag-disqualification" severity="info" value={`Дисквалификация: ${d.missedMatches ? d.missedMatches.length : 0} из ${d.count} матчей`}/>
                    }
                })}
                <div className={'player-info-group'}>
                    <div className={'position'}>
                        <div className={'icon'}>
                            <img src={PositionIcon}/>
                        </div>
                        <InputText value={team.position || ''} style={{border: "none", background: 'none', width: '38px', paddingLeft: '0px'}}/>
                        <i className="pi pi-chevron-circle-down"></i>
                    </div>
                    <div className={'player-number'}>
                        <div className={'icon'}>
                            <img src={PlayerNumberIcon}/>
                        </div>
                        <InputText value={team.number || 'БН'} style={{border: "none", background: 'none', width: '39px', paddingLeft: '0px'}}/>
                    </div>
                </div>
                <div className={'tag-group'}>
                    {selectedPlayer.disqualifications.filter(d => d.squadId === team._id).length === 0 ? <Tag icon={'pi pi-exclamation-triangle'} className="tag-disqualification" severity="info" value={`Дисквалифицировать`} onClick={(e) => op.current.toggle(e)}/> : null}
                    <OverlayPanel ref={op}>
                        Колличество матчей:
                        <InputText value={dis.count} onChange={(e) => setDis({count: e.target.value})} style={{border: "none", background: 'none', width: '39px', paddingLeft: '0px'}}/>
                        <Button icon={'pi pi-save'} label="Сохранить" className="p-button-outlined p-button-success" onClick={() => sendData(dis.count)}/>
                    </OverlayPanel>
                    {team.unlinked===null ? <Tag icon={'pi pi-exclamation-triangle'} className="tag-unlinked" severity="info" value={`Отзаявить`} style={{cursor: 'pointer'}}/> : <Tag icon={'pi pi-sync'} className="tag-return" severity="info" value={`Вернуть в заявку`} style={{cursor: 'pointer'}}/>}
                </div>
            </div>
        </div>
    </div>
}

export default TeamItem

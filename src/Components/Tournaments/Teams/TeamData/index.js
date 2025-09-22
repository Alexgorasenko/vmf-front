import {Sidebar} from "primereact/sidebar";
import Request from "../../../Clubs/Request";
import emblem from "../../../Emblem";
import { PanelWrapper } from '../../../Atoms'
import {Tag} from "primereact/tag";
import React, {useRef, useState} from "react";
import {useHistory} from "react-router-dom";
import qs from "qs";
import axios from "axios";
import {ENDPOINT} from "../../../../env";
import {Toast} from "primereact/toast";
import {Menu} from "primereact/menu";
import {Button} from "primereact/button";
import {RadioButton} from "primereact/radiobutton";

const handleDeleteTeam = (tournamentId, teamId, toastRef, method) => {
    axios.post(`${ENDPOINT}v2/kickTeamFromTournament`,
        {
            "tournamentId": tournamentId,
            "teamId": teamId,
            "method": method
        },
        {
            headers: {
                Authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            toastRef.show({severity: 'success', summary: 'Успешно', detail: 'Команда удалена!'})
    })
}

const formatText = count => {
    if (count > 20) {
        if (count % 10 === 1) {
            return `Заявлен ${count} игрок`
        } else if ([2, 3, 4].includes(count % 10)){
            return `Заявлено ${count} игрока`
        } else {
            return `Заявлено ${count} игроков`
        }

    } else {
        if (count === 1) {
            return `Заявлен ${count} игрок`
        } else if ([2, 3, 4].includes(count)){
            return `Заявлено ${count} игрока`
        } else {
            return `Заявлено ${count} игроков`
        }
    }
}

const TeamData = ({ team, layout, updateTeamsList, toast, setSelectedTeam }) => {
    const history = useHistory()

    const menu = useRef(null);
    const [isVisible, setIsVisible] = useState(false)

    const [optionRequest, setOptionRequest] = useState('')

    const items = team.squad && team.squad.players && team.squad.players.length ? [
        {
            label: 'Исключить из турнира',
            command: () => {
                setIsVisible(true)
            }
        }
    ] : [
        {
            label: 'Клонировать заявку',
            command: () => {
                setSelectedTeam(team)
            }
        },
        {
            label: 'Исключить из турнира',
            command: () => {
                setIsVisible(true)
            }
        }
    ]

    const searchString = qs.parse(window.location.search.replace('?',''))
    const [visibleRight, setVisibleRight] = useState(searchString.tournamentId && searchString.tournamentId.length === 24);
    const [visibleBottom, setVisibleBottom] = useState(false)

    return [
        (isVisible ? <div className={'modal'} onClick={() => setIsVisible(false)}>
            <div className={'modal-dialog'} onClick={e => e.stopPropagation()}>
                <div className={'emblem-wrap'}>
                    {emblem({source: team.club.emblem || (team.club.origin ? team.club.origin.emblem : null) || require('./pennant.png'), backdroped: true, size: 'lg'})}
                </div>
                <div className={'modal-background'}>
                    <div className={'text'}>Исключить команду {team.name}<br/> из турнира:</div>
                    <div className={'actions'}>
                        <div className="action">
                            <RadioButton
                                inputId="removeAllMatches"
                                name="mode"
                                value='removeAllMatches'
                                onChange={(e) => setOptionRequest(e.value)}
                                checked={optionRequest === 'removeAllMatches'}
                            />
                            <label htmlFor="removeAllMatches" className={'label'}>и удалить все матчи</label>
                        </div>
                        <div className="action">
                            <RadioButton
                                inputId="valkoverRestMatches"
                                name="mode"
                                value='valkoverRestMatches'
                                onChange={(e) => setOptionRequest(e.value)}
                                checked={optionRequest === 'valkoverRestMatches'}
                            />
                            <label htmlFor="valkoverRestMatches" className={'label'}>и назначить технические поражения</label>
                        </div>
                    </div>
                    <div className='button-group'>
                        <Button label="Отмена" className="button button-escape" onClick={() => setIsVisible(false)}/>
                        <Button
                            label={"Отзаявить команду"}
                            icon="pi pi-check"
                            className='button button-sub'
                            onClick={async () => {
                                await handleDeleteTeam(team.squad.tournamentId, team._id, toast, optionRequest);
                                updateTeamsList(team._id)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div> : null),
        ((team._id !== undefined || null) && (layout !== 'mobile') && (history.location.search !== undefined || null) ?
        <Sidebar className='request-sidebar' visible={visibleRight} position="right" showCloseIcon={false} onHide={() => {setVisibleRight(false);}} style={{width: '1546px', overflow: 'hidden'}}>
            <Request team={team} setVisibleRight={() => setVisibleRight(false)}/>
        </Sidebar> : null),
        <Toast position='bottom-right' ref={toast} />,
        <div className={'team'} onClick={() => {history.push(`/tournaments/teamsquad/${team._id}?tournamentId=${team.squad.tournamentId}`); setVisibleRight(true); setVisibleBottom(true);}} style={{cursor: 'pointer'}}>
            {emblem({source: team.club.emblem || (team.club.origin ? team.club.origin.emblem : null) || require('./pennant.png'), backdroped: true, size: 'md'})}
            <div className={'text-area'}>
                <div className={'text'}>{team.name}</div>
                {team.squad ? team.squad.players && team.squad.players.length ? (
                    <Tag className="tag" severity="info" value={formatText(team.squad.players.filter(p => !p.unlinked).length)}/>
                ) : (
                    <Tag className="tag-grey" severity="info" value={'Пустая заявка'}/>
                ) : (
                    <Tag severity="warn" value={'Нет заявки'}/>
                )}
            </div>
        </div>,
        <Menu model={items} popup ref={menu} id="popup_menu"/>,
        <Button className={'delete-team'} icon="pi pi-ellipsis-v" onClick={(event) => menu.current.toggle(event)} aria-controls="popup_menu" aria-haspopup />,
        visibleBottom && layout === 'mobile' ? (
        <PanelWrapper resetTrigger={() => setVisibleBottom(false)} layout={layout} area='request'>
            <Request team={team} setVisibleRight={() => setVisibleBottom(false)} />
        </PanelWrapper>
    ) : null]
}

export default TeamData

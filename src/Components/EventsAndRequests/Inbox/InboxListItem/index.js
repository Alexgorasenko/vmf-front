import React, { useState, useEffect } from 'react'
import '../style.scss'
import Emblem from "../../../Emblem";
import {Tag} from "primereact/tag";

const InboxListItem = ({item, getEmblem, onClickItem, isActive}) => {
    const {_id, team, club, user, tournament, league, data, squad, type, players, createdAt, handledAt, handler, archived} = item;

    const appliedLen = ['club','season'].includes(type) ? 0 : type === 'addon' ? data.addon.filter(p => p.applied || (squad && squad.players && squad.players.find(_p => _p._id === p._id))).length : data.filter(p => p.applied).length;
    const len = ['club','season'].includes(type) ? 0 : type === 'addon' ? data.addon.length : data.length;

    const status = !handledAt ? 'awaiting' : archived ? 'rejected' : 'accepted';

    const choiceStatus = () => {
        switch (status) {
            case 'accepted':
                return [
                    <Tag key={'tag'} className="tag-true" icon="pi pi-check" severity="success" value="принята"></Tag>,
                    <div key={'info'} className={'info'}>кем: {handler ? `${handler.name || ''} ${handler.surname || ''}` : 'нет данных'}</div>
                ]
            case 'rejected':
                return [
                    <Tag key={'tag'} className="tag-false" icon="pi pi-times" severity="warning" value="отклонена"></Tag>,
                    <div key={'info'} className={'info'}>кем: {handler ? `${handler.name || ''} ${handler.surname || ''}` : 'нет данных'}</div>
                ]
            case 'awaiting':
                return <Tag key={'tag'} className="tag-awaiting" icon="pi pi-info-circle" severity="info" value="ожидает решения"></Tag>
        }
    }

    return (
        type === 'season' ? null : <div className={`request-item ${isActive ? 'isActive' : ''}`} onClick={() => onClickItem(item)}>
            <div className={'team-block'}>
                <div className={'leader'}>
                    <div className={'name'} style={{color: '#64748B'}}>от: </div>
                    <div className={'name'}>{user ? `${user.name || ''} ${user.surname || ''}` : 'нет данных'}</div>
                </div>
                <div className={'line'}></div>
                <div className={'team'}>
                    {Emblem({source: team && team.emblem ? team.emblem : getEmblem(club), backdroped: false, size: 'xs'})}
                    <div className={'name'}>{team ? team.name : club ? club.name : data ? data.name : ''}</div>
                </div>
            </div>
            {type === 'club' ? (
                <div className={'meta-block'}>
                    <div className={'info'}>регистрация клуба</div>
                    {status === 'rejected' ? (
                        <Tag className="tag" severity="info" value={`${data.declineReason || 'причина отклонения не указана' }`}></Tag>
                    ) : null}
                </div>
            ) : (!handledAt || status === 'rejected') ? (
                <div className={'meta-block'}>
                    <div className={'info'}>{type === 'addon' ? `дозаявка ${len} игрок${pluralForm(len)} в` : (data && data.length) ? `заявка ${data ? data.length : 0} игрок${pluralForm(data ? data.length : 0)} в` : 'заявка в'}</div>
                    {tournament ? (
                        <Tag className="tag" severity="info" value={`${tournament.league ? tournament.league.name : league ? league.name : ''}, ${tournament.name || ''}`}></Tag>
                    ) : league ? (
                        <Tag className="tag" severity="info" value={`${league.name || 'нет названия у лиги'}`}></Tag>
                    ) : <Tag className="tag" severity="info" value={`нет данных`}></Tag>}
                </div>
            ) : (
                <div className={'meta-block'}>
                    <div className={'info'}>{len ? `${checkForm(appliedLen || 0)} ${appliedLen || 0} (из ${len}) игрок${pluralForm(appliedLen || 0)} в` : 'Пустая заявка'}</div>
                    {tournament ? (
                        <Tag className="tag" severity="info" value={`${tournament.league ? tournament.league.name : league ? league.name : ''}, ${tournament.name || ''}`}></Tag>
                    ) : league ? (
                        <Tag className="tag" severity="info" value={`${league.name || 'нет названия у лиги'}`}></Tag>
                    ) : <Tag className="tag" severity="info" value={`нет данных`}></Tag>}
                </div>
            )}
            <div className={'status-block'}>
                {choiceStatus()}
            </div>
        </div>
    )
}

const pluralForm = (n) => {
    let arr = ["а", "ов", "ов"]
    return arr[n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
}
const checkForm = (n) => {
    return n === 1 ? 'Принят' : 'Принято'
}
export default InboxListItem

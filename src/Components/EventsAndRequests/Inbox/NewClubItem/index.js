import React, { useState, useEffect, useRef } from 'react'
import './style.scss'
import {Tag} from "primereact/tag";
import { Toast } from 'primereact/toast'
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";

import CustomScrollbars from 'react-custom-scrollbars-2'
import service from '../service'

const NewClubItem = ({item, getEmblem, patchItem, onArchived, clubManage}) => {
    const {_id, team, club, user, clubId, tournament, league, data, createdAt, handledAt, handler, archived} = item;

    const clubName = club && club.name ? club.name : data && data.name ? data.name : '';

    const [progress, setProgress] = useState(false)

    const [reason, setReason] = useState(club && club.declineReason ? club.declineReason : data && data.declineReason ? data.declineReason : '');

    const [decline, setDecline] = useState(handledAt ? ((club && club.declineReason) || (data && data.declineReason)) ? true : false : false);


    const maintoast = useRef(null)

    const applyClub = async (archived=false) => {
        setProgress(true)
        if (maintoast.current) {
            maintoast.current.show({severity: 'success', summary: 'Обработка', life: 500})
        }
        let patch;
        if (archived) {
            if (reason) {
                patch = await service.applyQuery({
                    queryId: _id,
                    applied: false,
                    declineReason: reason
                });
            }
        } else {
            patch = await service.applyQuery({
                clubId: clubId,
                applied: true,
                queryId: _id,
                tournamentId: data.tournamentId
            }, maintoast.current);
        }

        if (patch) {
            if (club) {
                if (archived) {
                    patch.club = {...club, declineReason: reason}
                    patch.data = {...patch.data, declineReason: reason}
                }
            }

            patchItem({
                ...item,
                ...patch
            })
        }
        setProgress(false)
    }
    return (

        <div className={'control__request'}>
            <Toast ref={maintoast} position='top-right' />
            <img src={`${getEmblem(club)}`} className={'control__request-image'} />
            <div className='control__request_title'>регистрация клуба {clubName}</div>
            {decline ? <div className='club__request_block'>
                <div className='club__request_title'>{handledAt ? 'причина отклонения клуба' : 'Пожалуйста, укажите причину отказа в регистрации (обязательно)'}</div>
                <InputText
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoComplete='off'
                    required
                    style={{width: '100%', marginTop:"20px"}}
                    className={decline && !reason ? "p-invalid block" : 'block'}
                    disabled={handledAt || progress || clubManage}
                /></div> : null}
            {handledAt || clubManage ? null : [
                <Button
                    label={`Принять клуб ${clubName}`}
                    icon="pi pi-check"
                    className='control__request_button'
                    onClick={async () => await applyClub()}
                    disabled={progress}
                />,
                <Button
                    label={`Отклонить заявку`}
                    icon="pi pi-times"
                    className='control__request_button p-button-danger'
                    onClick={async () => {decline ? await applyClub(true) : setDecline(true)}}
                    disabled={progress || (decline && !reason)}
                />]}
        </div>
    )
}

export default NewClubItem

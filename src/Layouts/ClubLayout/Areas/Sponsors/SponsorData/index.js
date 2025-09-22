import React, { useState, useEffect } from "react";
import './style.scss'
import {Button} from "primereact/button";
import {Tag} from "primereact/tag";
import {InputText} from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar'
import {Scrollbars} from 'react-custom-scrollbars-2'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";

import service from '../../../service'
import {Sidebar} from "primereact/sidebar";
import {useHistory} from "react-router-dom";
import qs from "qs";

import moment from 'moment'

const SponsorData = ({ data, club, toast, pushTeam, removeTeam, patchTeam, layout }) => {

    const history = useHistory()
    const [form, setForm] = useState({})
    const [updated, setUpdated] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (data) {
            setForm({...data})
        } else {
            setForm({})
        }
    }, [data])

    const updateTeam = (item, isNewTeam) => {
        const id = isNewTeam ? 'newTeam' : form._id
        setForm({...form, ...item})
        patchTeam(id, item)
    }

    const handleInput = async e => {
        setProcessing(true)
        //toastId.current = toast('Загрузка и обработка...', {autoClose: false})
        //console.log('handleInput', e.target.files);
        const decoded = await service.convertBase64(e.target.files[0])
        // const uploaded = await axios.post(`${ENGINE}common/upload`, {
        //     target: 'clubs',
        //     base64Data: decoded,
        //     asRaw: asRaw
        // })
        //const resp = await service.attachment({decoded: decoded, toast: toast})
        const resp = await service.upload({decoded: decoded, target: 'sponsors', asRow: true, toast: toast})
        if(resp && resp.uploaded) {
            //toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => '⚽️ Обработано', autoClose: 500})
            //setForm({...form, emblem: uploaded.data.uploaded})
            //setEmblem(data.uploaded)
            await service.simpleUpdate(form._id, {logo: resp.uploaded},'sponsors', toast)
            setForm({...form, logo: resp.uploaded})
            //updateClub({emblem: data.uploaded})
            updateTeam({logo: resp.uploaded})
        } else {
            console.log('upload', resp)
            //alert('Ошибка обработки')
        }
        setProcessing(false)

    }

    const confirmRemoving = (id, evt) => {
        confirmPopup({
            target: evt.currentTarget,
            message: 'Вы действительно хотите удалить спонсора?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: () => {
                //console.log('REMOVE', id, 'team', form);
                removeTeam(id);
            }
        });
    };

    return (
            <div className='team-data'>
                <ConfirmPopup />

                <div className='fields-grid double-row np'>
                    <div className='fields-group teamdata'>
                        {form && form._id && form._id !== 'newTeam'? (
                            <Tag
                                className='removingBtn'
                                onClick={(evt) => confirmRemoving(form._id, evt)}
                                icon="pi pi-times"
                                severity="danger"
                                //value="Danger"
                            >Удалить</Tag>
                        ) : null}

                        <div style={{marginBottom: 0}}>
                            <label htmlFor="teamname">Название</label>
                            <InputText
                                id='teamname'
                                value={form.name || ''}
                                onChange={(e) => {
                                    setForm({...form, name: e.target.value})
                                    //updateTeam({name: e.target.value})
                                    setUpdated(true)
                                }}
                                autoFocus
                                autoComplete='off'
                                required
                                className={!form.name ? "p-invalid block" : 'block'}
                                onBlur={async e => {
                                    console.log('blur put', form);

                                    if (form._id && form.name) {
                                        if (form._id === 'newTeam' ) {
                                            const {_id, ...team} = form;
                                            const doc = await service.saveData('sponsors', team, toast);
                                            setUpdated(false)
                                            //console.log('save data', doc);
                                            if (doc && doc._id) {
                                                //setForm({...form, ...doc})
                                                //console.log('doc', doc);
                                                updateTeam(doc, true)
                                            }
                                        } else {
                                            if (updated) {
                                                //console.log('toast', toast);
                                                await service.simpleUpdate(form._id, {name: form.name},'sponsors', toast);
                                                updateTeam({name: form.name})
                                                setUpdated(false)
                                            }
                                        }
                                    }

                                    //updateTeam({name: form.name})
                                }}
                                placeholder='Название'
                            />
                        </div>

                        {form && form._id && form._id !== 'newTeam'? <div className='fields-group teamdata' >
                            <Tag className='group-title'>ЛОГО</Tag>

                            <div className='emb-loader'>
                                <div className='emb-content'>

                                    <div className='emb-current'>
                                        <img className={!form.logo ? 'holder' : ''} src={form.logo || club.logo || require('../../../assets/stickers/trophy.png')} />
                                    </div>
                                    <div className='emb-input'>
                                        <input type='file' onChange={handleInput} />
                                        <Button
                                            label="Выбрать эмблему"
                                            icon="pi pi-file"
                                            className={'button-sub p-button-sm'}
                                            loading={processing}
                                            // onClick={async () => {
                                            //     setLoading(true)
                                            // }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div> : null}
                    </div>

                </div>
            </div>
    );
};

export default SponsorData

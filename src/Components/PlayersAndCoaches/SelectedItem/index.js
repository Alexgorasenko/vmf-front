import React, {useEffect, useRef, useState} from 'react'
import {InputText} from "primereact/inputtext";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import TeamItem from "../TeamItem";
import {FileUpload} from "primereact/fileupload";
import PlayerPhoto from '../../../assets/img/soccer-player-1.svg'
import BdayIcon from "../../../assets/img/bday.svg";
import PositionIcon from "../../../assets/img/position-icon.svg";
import PlayerNumberIcon from "../../../assets/img/player-number-icon.svg";
import Photo from '../../../assets/img/image 19.png'
import CustomScrollbars from "react-custom-scrollbars-2";
import axios from 'axios'
import { ENDPOINT } from '../../../env'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";
import moment from 'moment'

import service from "../service";

//const mask = {key: 'disqual', type: 'mask', mask: '99.99.9999', placeholder: 'дд.мм.гггг'}

const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file)
        fileReader.onload = () => {
            resolve(fileReader.result);
        }
        fileReader.onerror = (error) => {
            reject(error);
        }
    })
}
const initForm = {_id: '', photo: '', avatarUrl: '', birthday: '', surname: '', globalDisqTill: '', name: '', middlename: '', squads: [], disqualifications: [], candidates: []};
const SelectedItem = ({ selected, patchItem, toast, setOpenPlrCandidates, clubView, clearGlobal }) => {

    const [selectedPlayer, setForm] = useState(selected ? {...selected} : initForm)
    const [progress, setProgress] = useState(false)
    const [loadAva, setLoadAva] = useState(false)

    useEffect(() => {
        if (selected) {
            setForm({...selected})
        }
    }, [selected])

    const sendSelectedPlayer = async () => {
        setProgress(true)
        //console.log('toast', toast);
        //if (selectedPlayer.avatarUrl && selectedPlayer.avatarUrl !== selected.avatarUrl) {
        const updResp = {}
        for (let key of ['birthday','middlename','name','surname', 'globalDisqTill']) {
            if (selectedPlayer[key] !== selected[key]) {
                if (key === 'globalDisqTill') {
                    if (selectedPlayer[key]) {
                        updResp[key] = selectedPlayer[key]
                    }
                } else {
                    updResp[key] = selectedPlayer[key]
                }
            }
        }
        if (loadAva) {
            const decoded = await convertBase64(selectedPlayer.avatarUrl)
            //const data = await service.upload({decoded: decoded, target: 'players', trim: true, toast: toast})
            const data = await service.upload({
                target: 'players',
                decoded: decoded,
                asRaw: true,
                trim: false
            })
            // const data = {uploaded: 'https://amateum.fra1.digitaloceanspaces.com/storage/f243fa4e-fea0-4668-bd26-c3244149e42f.png'}
            if (data && data.uploaded) {
                updResp.avatarUrl= data.uploaded;
                // for (let key of ['birthday','middlename','name','surname']) {
                //     if (selectedPlayer[key] !== selected[key]) {
                //         updResp[key] = selectedPlayer[key]
                //     }
                // }
                setForm({...selectedPlayer, ...updResp})
                await service.simpleUpdate(selectedPlayer._id, updResp, toast)
                setProgress(false)
                /*setSearchPlayers(prevState => {prevState.map(p => {
                    if (p._id === selectedPlayer._id) {
                        p.avatarUrl = data.uploaded
                    }
                }); return prevState})*/
                patchItem({...selectedPlayer, ...updResp})
                setLoadAva(false)

                axios.get(`${ENDPOINT}v2/avatarPlrsFix/${selectedPlayer._id}`)
            } else {
                //console.log('upload', data)
                //alert('Ошибка обработки')
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Фото не загружено'})
                }
            }

        } else {
            await service.simpleUpdate(selectedPlayer._id, updResp, toast)
            patchItem({...selectedPlayer})
        }
        setProgress(false)
        //setSelected(false)
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
                // setForm({...selectedPlayer, globalDisqTill: null})
                // patchItem({...selectedPlayer, globalDisqTill: null})
                await clearGlobal(pid)
                //reload(true)
            }
        });
    }

    const customUploader = async (event) => {
        //console.log('event.files[0]', event.files[0]);
        setLoadAva(true)
        setForm({ ...selectedPlayer, avatarUrl: event.files[0]})
    }

    const customUploaderHandler = async (event) => {
        setLoadAva(false)
        setForm({...selectedPlayer, avatarUrl: null})
        event.options.clear()
    }

    const deleteUpload = async (event) => {
        setLoadAva(false)
        setForm({...selectedPlayer, avatarUrl: null})
        patchItem({...selectedPlayer, avatarUrl: null})
        await service.simpleUpdate(selectedPlayer._id, {avatarUrl: null, thhumbnail: null}, toast)
        event.options.clear()
    }
    const openTeamCard = (id) => {
        document.getElementById(id).classList.toggle('opened');
        {selectedPlayer.squads.actived.map(d => {
            if (d.squadId === id) {
                document.getElementById(id).classList.add('disq');
            }
        })}
    }

    const chooseOptions = {label: 'Загрузить фото', icon: 'pi pi-upload'};
    return <div className={'side-notes-player'} style={{marginTop: clubView ? '65px' : '35px'}}>
        <ConfirmPopup />

        <div className={'rectangle-2'}>
            <img src={selectedPlayer.avatarUrl !== null ? selectedPlayer.avatarUrl.objectURL !== null && selectedPlayer.avatarUrl.objectURL !== undefined ? selectedPlayer.avatarUrl.objectURL : selectedPlayer.avatarUrl : PlayerPhoto} className={'photo'}/>
            <div className={'button-group'}>
                {selectedPlayer.candidates && selectedPlayer.candidates.length ? <Tag
                    className="fileupload-cancel"
                    icon={'pi pi-copy'}
                    severity="help"
                    value={'Показать дубли'}
                    onClick={() => setOpenPlrCandidates(selectedPlayer)}
                    style={{whiteSpace: 'nowrap'}}
                /> : null}
                <FileUpload
                    mode='basic'
                    name="demo[]"
                    url="https://primefaces.org/primereact/showcase/upload.php"
                    accept=".jpg,.png"
                    maxFileSize={3e+6}
                    chooseLabel="Загрузить фото"
                    chooseOptions={chooseOptions}
                    customUpload
                    onSelect={customUploader}
                    uploadHandler={customUploaderHandler}
                />
                <Tag
                    className="fileupload-cancel"
                    icon={'pi pi-times-circle'}
                    severity="info"
                    value={'Удалить фото'}
                    onClick={deleteUpload}
                />

                {/*<Button icon={'pi pi-copy'} label="Показать дубли" className="p-button-outlined p-button-info" onClick={() => sendSelectedPlayer()}/>/*}
                {/*<FileUpload ref={fileUploadRef} name="demo[]" url="https://primefaces.org/primereact/showcase/upload.php" accept=".jpg,.png" maxFileSize={3e+6} chooseOptions={chooseOptions} cancelOptions={cancelOptions} headerTemplate={headerTemplate} itemTemplate={null} emptyTemplate={null} customUpload onSelect={customUploader} uploadHandler={customUploaderHandler} onClear={customUploaderHandler}/>*/}
            </div>
            <div className={'fio'}>
                <div className={'icon'}>
                    Ф
                </div>
                <InputText value={selectedPlayer.surname} onChange={(e) => setForm({...selectedPlayer, surname: e.target.value})} style={{border: "none", background: 'none', paddingLeft: '0px'}}/>
            </div>
            <div className={'fio'}>
                <div className={'icon'}>
                    И
                </div>
                <InputText value={selectedPlayer.name} onChange={(e) => setForm({...selectedPlayer, name: e.target.value})} style={{border: "none", background: 'none', paddingLeft: '0px'}}/>
            </div>
            <div className={'fio'}>
                <div className={'icon'}>
                    О
                </div>
                <InputText value={selectedPlayer.middlename} onChange={(e) => setForm({...selectedPlayer, middlename: e.target.value})} style={{border: "none", background: 'none', paddingLeft: '0px'}}/>
            </div>
            <div className={'bday'}>
                <div className={'icon'}>
                    <img src={BdayIcon}/>
                </div>
                <InputText
                    value={selectedPlayer.birthday?selectedPlayer.birthday:''}
                    onChange={(e) => setForm({...selectedPlayer, birthday: e.target.value})}
                    style={{border: "none", background: 'none', paddingLeft: '0px'}}
                />
            </div>

            {clubView ? null : <div className={'fio fio--ban'}>
                <div className={'icon'}>
                    БАН
                </div>
                {/*// <InputText
                //     value={selectedPlayer.globalDisqTill ? selectedPlayer.globalDisqTill : ''}
                //     onChange={(e) => setForm({...selectedPlayer, globalDisqTill: e.target.value})}
                //     style={{border: "none", background: 'none', paddingLeft: '0px'}} moment().format('YYYY-MM-DD')
                // />*/}
                <InputText
                    type='date'
                    value={selectedPlayer.globalDisqTill && selectedPlayer.globalDisqTill >= moment().format('YY-MM-DD') ? moment(selectedPlayer.globalDisqTill, 'YY-MM-DD').format('YYYY-MM-DD') : ''}
                    onChange={e =>  {
                        //console.log(e.target.value, selected.globalDisqTill);
                        setForm({...selectedPlayer, globalDisqTill: e.target.value ? (moment(e.target.value, 'YYYY-MM-DD').format('YY-MM-DD')) : (selected.globalDisqTill || '') })
                    }}
                    placeholder=""
                    style={{border: "none", background: 'none', paddingLeft: '0px'}}
                />
                {selected && selected.globalDisqTill && selected.globalDisqTill >= moment().format('YY-MM-DD') ? <Tag
                    className="tag-global tag-global--selected"
                    severity="success"
                    style={{cursor: 'pointer'}}
                    icon={'pi pi-times-circle'}
                    value={'Снять глоб.дисквал'}
                    onClick={(evt) => {
                        evt.stopPropagation()
                        //clearGlobal()
                        confirmClearing(selectedPlayer._id, evt)
                    }}
                /> : null}
            </div>}

            <Button
                icon={'pi pi-save'}
                disabled={progress}
                label="Сохранить"
                className="p-button-outlined p-button-success"
                onClick={() => sendSelectedPlayer()}
            />


            <div className={'applications'}>
                <div className={'requests'}>
                    <div className={'text-1'}>Активные заявки:</div>
                    {selectedPlayer.squads.actived.length > 0 ? selectedPlayer.squads.actived.map(team => {
                        return <TeamItem key={team.squadId} team={team} selectedPlayer={selectedPlayer}
                                         openTeamCard={openTeamCard}/>
                    }) : <Tag className="tag-not-found" severity="info" value={'нет'}/>}
                </div>
                <div className={'requests'}>
                    <div className={'text-1'}>Архивные заявки:</div>
                    {selectedPlayer.squads.finished.length > 0 ? selectedPlayer.squads.finished.map(team => {
                        return <div key={team.squadId} className={'team-item'}>
                            <div className={'default-info'}>
                                <div className={'team-info'}>
                                    <div className={'team-name'}>{team.team.name}</div>
                                    <Tag className="tag-league" severity="info" value={team.tournament.name}/>
                                </div>
                            </div>
                        </div>
                    }) : <Tag className="tag-not-found" severity="info" value={'нет'}/>}
                </div>
            </div>

        </div>
        {/*<img src={selectedPlayer.photo !== null ? selectedPlayer.photo.objectURL !== null && selectedPlayer.photo.objectURL !== undefined ? selectedPlayer.photo.objectURL : selectedPlayer.photo : PlayerPhoto} className={'photo'}/>
        <FileUpload mode='basic' name="demo[]" url="https://primefaces.org/primereact/showcase/upload.php" accept=".jpg,.png" maxFileSize={3e+6} chooseLabel="Загрузить фото" customUpload onSelect={customUploader} uploadHandler={customUploaderHandler}/>
        <Button className={'button-upload'} label="Загрузить фото" icon='pi pi-plus'/>
        <div className={'rectangle-5'} style={{marginTop: '-268px'}}>
            <div><InputText className={'name-edit'} value={selectedPlayer.name} onChange={(e) => setSelectedPlayer({_id: selectedPlayer._id,photo: selectedPlayer.photo, date: selectedPlayer.date, name: e.target.value})} /></div>
            <div className={'bday'}>
                <div className={'icon'}>
                    <img src={BdayIcon}/>
                </div>
                <InputText value={selectedPlayer.date} onChange={(e) => setSelectedPlayer({_id: selectedPlayer._id, photo: selectedPlayer.photo, date: e.target.value, name: selectedPlayer.name})} style={{border: "none", background: 'none', width: '110px', paddingLeft: '0px'}}/>
            </div>
            <div className={'button-set'}>
                <Button label="Сохранить" className="p-button-outlined p-button-success" onClick={() => sendSelectedPlayer()}/>
                <Button label="Закрыть" className="p-button-outlined p-button-secondary" onClick={() => {setSelected(false)}}/>
            </div>
        </div>*/}
    </div>
}

export default SelectedItem

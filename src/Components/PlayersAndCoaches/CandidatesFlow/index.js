import React, { useState, useEffect, useRef} from 'react'
import {InputText} from "primereact/inputtext";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import { RadioButton } from 'primereact/radiobutton';
import { ConfirmDialog } from 'primereact/confirmdialog'; // To use <ConfirmDialog> tag
import { confirmDialog } from 'primereact/confirmdialog'; // To use confirmDialog method
import { Toast } from 'primereact/toast'
import PlayerPhoto from '../../../assets/img/soccer-player-1.svg'
import BdayIcon from "../../../assets/img/bday.svg";
import PositionIcon from "../../../assets/img/position-icon.svg";
import PlayerNumberIcon from "../../../assets/img/player-number-icon.svg";
import Photo from '../../../assets/img/image 19.png'
import CustomScrollbars from "react-custom-scrollbars-2";
import './style.scss'

import service from "../service";

const Candidat = ({ isTarget, addToDuplicated, addToNotDuplicates, selectedPlayer, isDuplicated, moreOne, addToTarget }) => {
    //console.log('Candidat', selectedPlayer)

    return <div className={`${isDuplicated ? 'player__container isDuplicated' : 'player__container'}`}>
        <div className={'rectangle-2'} onClick={() => addToDuplicated(selectedPlayer)}>
            <img src={selectedPlayer.avatarUrl || PlayerPhoto} className={'photo'} style={{width: '100px', height: '100px'}}/>

            <div className={'playerData fio'}>
                <div className={'icon'}>
                    Ф
                </div>
                <div style={{border: "none", background: 'none', width: '150px', paddingLeft: '5px'}}>{selectedPlayer.surname || ''}</div>
            </div>
            <div className={'playerData'}>
                <div className={'icon'}>
                    И
                </div>
                <div style={{border: "none", background: 'none', width: '150px', paddingLeft: '5px'}}> {selectedPlayer.name || ''}</div>
            </div>
            <div className={'playerData'}>
                <div className={'icon'}>
                    О
                </div>
                <div style={{border: "none", background: 'none', width: '150px', paddingLeft: '5px'}}> {selectedPlayer.middlename || ''}</div>
            </div>
            <div className={'playerData bday'}>
                <div className={'icon'}>
                    <img src={BdayIcon}/>
                </div>
                <div style={{border: "none", background: 'none', width: '110px', paddingLeft: '5px'}}>{selectedPlayer.birthday}</div>
            </div>
        </div>
        {isDuplicated && moreOne ? <div className='field-radiobutton player__checker'>
            <RadioButton
                inline
                name="isTarget"
                checked={isTarget}
                onChange={(e) => addToTarget(selectedPlayer)}
                inputId={selectedPlayer._id}
            />
            <label htmlFor={selectedPlayer._id}>Эталонная запись</label>
        </div> : null }
        <div className='playerTeams'>
            {selectedPlayer.teams && selectedPlayer.teams.length > 0 ? selectedPlayer.teams.map(team => {
                return <Tag key={team._id} className="" severity="info" value={team ? team.name || '' : ''} style={{margin: '5px'}}/>})
            : <Tag className="tag-not-found" severity="info" value={'нет заявок'}/>}
        </div>
    </div>
}

const CandidatesFlow = ({ selectedPlayer, onClose, setReload, filtredSelected, patchItem, toast }) => {

    const [candidates, setCandidates] = useState(selectedPlayer ? [...selectedPlayer.candidates] : [])
    const [duplicates, setDuplicates] = useState([])
    const [target, setTarget] = useState(null);
    const [progress, setProgress] = useState(false);

    useEffect(() => {
        //console.log('flow', selectedPlayer);
        if (selectedPlayer) {
            setCandidates(selectedPlayer.candidates || [])
        } else {
            setCandidates([])
        }
    }, [selectedPlayer])


    const reload = () => {
        setTarget(null);
        setCandidates([]);
        setDuplicates([]);
        onClose();
        setReload();
    }
    //const toast = useRef(null);

    const mergePlayers = async () => {
        setProgress(true)
        const resp = await service.mergePlayers(target, duplicates, toast.current);
        setProgress(false)
        if (resp && resp.success) {

            setTarget(null);
            setCandidates([]);
            setDuplicates([]);
            filtredSelected(duplicates)
            //patchItem({...selectedPlayer, candidates: candidates.filter(cand => cand._id && !duplicates.find(d => d._id && d._id.toString() === cand._id.toString()))})
            onClose()
        } else {

            //console.log('error', resp);
            //if (resp && !resp.success)
            reload();
        }
        return resp
    }

    const reject = () => {
        toast.current.show({ severity: 'warn', summary: 'Rejected', detail: 'Вы отменили действие', life: 3000 });
    }

    const mergingNotDuplicates = async () => {
        if (duplicates.length > 1) {
            let check = true;
            for (let i = 0; i < duplicates.length; i++) {
                const isnot = duplicates[i].isNotDoubleOf;
                const data = duplicates.filter(item => item._id.toString() !== duplicates[i]._id.toString());
                if (isnot && isnot.length) {
                    for (let j=0; j < isnot.length; j++) {
                        const indx = data.findIndex(item => item._id.toString() === isnot[j].toString());
                        if (indx === -1) {
                            data.push({_id: isnot[j]})
                        }
                    }
                }
                const mapd = data.map(item => item._id);
                const resp = await service.simpleUpdate(duplicates[i]._id, {isNotDoubleOf: mapd}, toast.current)
                if (!(resp && (resp._id || resp.success))) {
                    //console.log('mergingNotDuplicates failed', duplicates[i]._id, mapd, resp);
                    check = false;
                }
            }
            if (!check) {
                reload();
            } else {
                setTarget(null);
                setCandidates([]);
                setDuplicates([]);
                filtredSelected(duplicates)
                onClose()
            }
        }
    }

    const closeOpen = () => {
        setTarget(null);
        setCandidates([]);
        setDuplicates([]);
        onClose()
    }

    const addToDuplicated = (pl) => {
        const ind = getIndxObjArr(pl, duplicates);
        if (ind > -1) {
            setDuplicates([...duplicates.filter((item, indx) => indx !== ind)]);
            if (target && pl._id.toString() === target._id.toString()) {
                setTarget(null)
            }
        } else {
            setDuplicates([...duplicates, pl])
        }
    }

    const addToTarget = (pl) => {
        setTarget(pl)
    }

    const getIndxObjArr = (obj, arr) => {
        if (arr.length) {
            const ind = arr.findIndex(item => item._id.toString() === obj._id.toString());
            return ind
        } else {
            return -1
        }
    }

    const confirm = () => {
        confirmDialog({
            message: 'Все игроки кроме эталонного будут удалены без возможности восстановлления',
            header: 'Объединить выбранных игроков?',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => mergePlayers(),
            reject
        });
    }

    const confirm2 = () => {
       confirmDialog({
           message: 'выбранные игроки не будут считаться дублями',
           header: 'Больше не предлагать',
           icon: 'pi pi-info-circle',
           accept: () => mergingNotDuplicates(),
           reject
       });
    };

    /*const clearAll = () => {
        setTarget(null);
        setDuplicates([])
        setIsNotDoubleOf([]);
    }
    const addToNotDuplicates = ( pl ) => {
        const ind = getIndxObjArr(pl, isNotDoubleOf);
        if (ind > -1) {
            setIsNotDoubleOf([...isNotDoubleOf.filter((item, indx) => indx !== ind)]);
        } else {
            setIsNotDoubleOf([...isNotDoubleOf, pl])
        }
    }*/
    return <div className={`candidatesFlow duplicated__container  ${candidates.length > 3 ? 'moreThree' : candidates.length > 2 ? 'moreTwo' : ''}`}>
        {/*<Toast ref={toast} />*/}
        <ConfirmDialog />

        <div className='notice'>
            <p>Выберите карточки игроков для объединения, а также «Эталонную запись», которая останется активна после объединения. В качестве «Эталонной» рекомендуем выбирать карточку, в которой больше данных.</p>
        </div>

        <div className={'duplicated__action'}>
            <Button
                icon={'pi pi-check-circle'}
                label="Объединить игроков"
                className="p-button-outlined p-button-success p-button-sm"
                onClick={confirm}
                disabled={progress || !target || duplicates.length < 2}
            />
            <Button
                icon={'pi pi-clone'}
                label="Это не дубли, больше не предлагать"
                className="p-button-outlined p-button-secondary p-button-sm" onClick={confirm2}
                disabled={progress || duplicates.length < 2}
            />
            <Button
                icon={'pi pi-times-circle'}
                label="Закрыть"
                className="p-button-outlined p-button-danger p-button-sm"
                onClick={closeOpen}
                disabled={progress}
            />
        </div>

        {candidates.length > 0 ? (
            <CustomScrollbars autoHide width={'auto'} autoHeight autoHeightMax='calc(100vh - 316px)' style={{padding: "10px 0 0 0"}}>

                <div className={`duplicated__items`}>
                    {candidates.map(p => (
                        <Candidat
                            key={p._id}
                            isTarget={target && target._id.toString() === p._id.toString()}
                            selectedPlayer={p} addToDuplicated={addToDuplicated}
                            //addToNotDuplicates={addToNotDuplicates}
                            addToTarget={addToTarget}
                            moreOne={duplicates.length > 1}
                            isDuplicated={getIndxObjArr(p, duplicates) > -1}
                        />
                    ))}
                </div>
            </CustomScrollbars>
        ) : null}

    </div>
}

export default CandidatesFlow

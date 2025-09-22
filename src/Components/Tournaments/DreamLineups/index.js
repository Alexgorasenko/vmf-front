import {InputText} from "primereact/inputtext";
import React, {useEffect, useRef, useState} from "react";
import { NonIdealState } from '../../Atoms'
import './style.scss'
import '../../MatchEditModal/components/RosterController/style.scss'
import '../../MatchEditModal/style.scss'
import axios from "axios";
import {ENDPOINT} from "../../../env";
import {Button} from "primereact/button";
import { ProgressSpinner } from 'primereact/progressspinner'
import CustomScrollbars from "react-custom-scrollbars-2";
import {Tag} from "primereact/tag";
import Lineup from "./Lineup";
import ItemPlayer from "../../MatchEditModal/ItemPlayer";
import {Toast} from "primereact/toast";
import {schemas} from "../../../references";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        },
        [value]
    );

    return debouncedValue;
}

const initForm = {
    tournamentId: '',
    federationId: '',
    formation: '',
    name: '',
    players: []
}

const mapperGetActive = arr => {
    let checkFirst = false;
    const res = [];
    for (let item of arr) {
        if (item.surname || item.name|| item.num) {
            res.push(item);
        } else {
            if (!checkFirst) {
                res.push({...item, active: true});
                checkFirst = true
            } else {
                res.push(item);
            }
        }
    }
    return res;
}

const fillArray = len => {
    const res = [];
    for (let i = 0; i < len; i++) {
        if (i !== 0) {res.push({_id: `plr_${i}`, indx: i})}
        else res.push({_id: `plr_${i}`, indx: i, active: true})
    }
    return res;
}


const DreamLineups = ({subject}) => {
    const [searchString, setSearchString] = useState('');
    const [loading, setLoading] = useState(false)
    const [searchPlayers, setSearchPlayers] = useState([])
    const debouncedSearchTerm = useDebounce(searchString, 700);
    const formationKey = subject.league.discipline && subject.league.discipline.format && subject.league.discipline.format.includes('x') ? subject.league.discipline.format.split('x')[0] : 8
    const [currLineUps, setCurrLineups] = useState(null)
    const [selectedLineup, setSelectedLineup] = useState('')
    const [selectedLineupId, setSelectedLineupId] = useState(0)
    const [newLineup, setNewLineup] = useState('')
    const [arrBasic, setArrBasic] = useState([])
    const [mode, setMode] = useState('')
    const [needUpdate, setNeedUpdate] = useState(false)

    const toastRef = useRef()

    const getDreamLineups = () => {
        axios.get(`${ENDPOINT}v2/getTournamentDreamLineups/${subject._id}`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(
            resp => {
                setCurrLineups(resp.data)
            }
        )
    }

    useEffect(() => {
        getDreamLineups()
        setMode('')
    },[subject])

    useEffect(() => {
        if (needUpdate) {
            getDreamLineups()
            setNeedUpdate(false)
        }
    }, [needUpdate])

    useEffect(() => {
        setSearchString('')
        setSearchPlayers([])
        if (mode === 'update' && selectedLineup._id !== selectedLineupId) {
            setArrBasic(selectedLineup.players)
            setSelectedLineupId(selectedLineup._id)
        }
        if (mode === 'create') {
            setArrBasic(fillArray(formationKey))
        }
        if (mode === '') {
            setSelectedLineupId(0)
        }
    }, [mode, selectedLineup])

    const getDataBySearchString = (string) => {
        const regexp = /\D\D+/
        if (string.match(regexp) !== null){
            axios.get(`${ENDPOINT}v2/getTournamentPlayers/${subject._id}?query=${encodeURIComponent(string)}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(
                resp => {
                    setLoading(false)
                    setSearchPlayers(resp.data || [])
                }
            )
        }
    }

    useEffect(() => {
            if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
                setLoading(true)
                getDataBySearchString(debouncedSearchTerm)
            } else {
                setSearchPlayers([]);
            }
        }, [debouncedSearchTerm])

    const addToBasic = (plr, ind) => {
        const plrs = [...arrBasic];
        const checkPlr = plrs.find(item => item._id.toString() === plr._id.toString());
        if (!checkPlr) {
            const mapdPlrs = plrs.map(item => {
                if (item.active) {
                    return {...plr}
                } else {
                    return item
                }
            })
            setArrBasic(mapperGetActive(mapdPlrs))
        }
    }

    return (
        <CustomScrollbars autoHide autoHeight autoHeightMin='81vh'>
            <div className={'dreamLineups fields-grid'}>
            <Toast ref={toastRef} position='top-right' />
            <div className={'fields-group'}>
                <Tag className='group-title'>Созданные сборные:</Tag>
                <CustomScrollbars
                    autoHide
                    autoHeight
                    style={{width: 'calc(100% + 30px)', marginLeft: -15}}
                    autoHeightMax='calc(100vh - 300px)'
                    className='scrollbars'
                >
                    {
                        currLineUps && currLineUps.lineups ? currLineUps.lineups.length > 0 ?
                            currLineUps.lineups.map(lu => {
                                return <div
                                    className='lineupPreview'
                                    onClick={() => {setSelectedLineup(lu); setMode('update')}}
                                    style={{cursor: 'pointer'}}
                                >
                                    <div className={'text'}>{lu.name}</div>
                                    <Tag className="tag tag-formation" severity="info" value={lu.formation}/>
                                    <Tag className="tag" severity="info" value={'автор: '+lu.author.name}/>
                                </div>
                            })
                            :
                            <NonIdealState icon='search' text='ещё нет сборных для этого турнира' />
                            :
                            <div style={{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', height: 200}}>
                                <ProgressSpinner style={{width: 32, height: 32}} />
                            </div>
                    }
                </CustomScrollbars>
                {
                    !(mode === 'create') ?
                        <Button
                            label={"Создать новую сборную"}
                            className="button-sub p-button-outlined p-button-sm p-button-info create-lineup-btn"
                            disabled={!currLineUps}
                            onClick={() => {
                                setNewLineup({
                                    ...initForm,
                                    tournamentId: subject._id,
                                    federationId: subject.federationId,
                                    formation: subject.config.schema ? '1-'+subject.config.schema : '1-'+schemas[formationKey][0]
                                });
                                setMode('create')
                            }}
                        />
                        :
                        null
                }
            </div>
            {
                mode === 'update' || mode === 'create' ? [
                    <div className={'search'}>
                        <div className={'name-input'}>
                            <span className="p-input-icon-right">
                                {loading ? <i className="pi pi-spin pi-spinner" /> : null}
                                <InputText
                                    className={'input'}
                                    value={searchString}
                                    placeholder='Поиск игрока по ФИО'
                                    onChange={(e) => setSearchString(e.target.value)}
                                />
                            </span>
                        </div>
                        <div className='compound__block_match lineups' style={{paddingBottom: 10}}>
                            <CustomScrollbars
                                autoHide
                                autoHeight
                                autoHeightMax='69vh'
                            >
                                <div className='request__player' style={{height:"100%", marginLeft: '20px'}}>
                                    {searchPlayers.length > 0 ? [
                                        <div className='request__notification'>
                                            Кликните по игроку в списке для привязки к выделенной позиции👇
                                        </div>,
                                        searchPlayers.map((item, idx) =>(
                                            <ItemPlayer
                                                mode={'dreamlineups'}
                                                item={item}
                                                activeTab={'arrangement'}
                                                addToBasic={addToBasic}
                                                key={item._id+'_searchPlayers'}
                                                idx={idx}
                                                exists={arrBasic && arrBasic.length && arrBasic.find(plr => plr._id.toString() === item._id.toString())} red={true}
                                            />
                                        ))
                                    ] : null}
                                </div>
                            </CustomScrollbars>
                        </div>
                    </div>,
                    mode === 'update' ?
                        <Lineup
                            lineup={selectedLineup}
                            arrBasic={arrBasic}
                            setArrBasic={setArrBasic}
                            mapperGetActive={mapperGetActive}
                            setLineup={setSelectedLineup}
                            mode={mode}
                            setMode={setMode}
                            setLineups={setCurrLineups}
                            toast={toastRef}
                            formationKey={formationKey}
                        ></Lineup> : null,
                    mode === 'create' ?
                        <Lineup
                            lineup={newLineup}
                            arrBasic={arrBasic}
                            setArrBasic={setArrBasic}
                            mapperGetActive={mapperGetActive}
                            setLineup={setNewLineup}
                            mode={mode}
                            setMode={setMode}
                            setLineups={setCurrLineups}
                            update={setNeedUpdate}
                            toast={toastRef}
                            formationKey={formationKey}
                        ></Lineup> : null
                ] : currLineUps && currLineUps.avgLineUp ?
                    <Lineup
                        lineup={currLineUps.avgLineUp}
                        arrBasic={currLineUps.avgLineUp.players}
                        mode={mode}
                        formationKey={formationKey}
                    ></Lineup>
                    : null
            }
        </div>
        </CustomScrollbars>
    )
}

export default DreamLineups

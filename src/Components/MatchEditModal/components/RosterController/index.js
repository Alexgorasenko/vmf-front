import React, {useState, useEffect, useRef, useContext} from 'react'
import ItemPlayer from '../../ItemPlayer/index'
import ItemSchemaPlayer from '../../ItemSchemaPlayer'

import Hotkeys from 'react-hot-keys';
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Checkbox } from 'primereact/checkbox';
import CustomScrollbars from 'react-custom-scrollbars-2';

import { schemas } from '../../../../references'

import { getBasicAndActiveBtn } from './helpers'

import { showHint, suppressHint } from '../../../../hints'
import {useUnmountEffect} from "primereact/hooks";
import axios from "axios";
import {ENDPOINT} from "../../../../env";
import {Toast} from "primereact/toast";
import {MatchContext} from "../../ctx";

import moment from 'moment'

const fillArray = len => {
    const res = [];
    for (let i = 0; i < len; i++) {
        res.push({_id: `plr_${i}`, indx: i})
    }
    return res;
}

const formatText = count => {
    if (count > 20) {
        if (count % 10 === 1) {
            return `матч`
        } else if ([2, 3, 4].includes(count % 10)){
            return `матча`
        } else {
            return `матчей`
        }

    } else {
        if (count === 1) {
            return `матч`
        } else if ([2, 3, 4].includes(count)){
            return `матча`
        } else {
            return `матчей`
        }
    }
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

const parseDisqualification = (arr, tournamentId, matchDate) => {

    if(!arr || !arr.length || !arr.find(disq => disq.tournamentId === tournamentId)) {
        return null
    } else {
        const disq = arr.find(disq => disq.tournamentId === tournamentId)
        const dd = moment(disq.startDate, 'YY-MM-DD').format('YYYY-MM-DD')
        const ed = disq.finishDate ? moment(disq.finishDate, 'YY-MM-DD').format('YYYY-MM-DD') : null
        const md = moment(disq.startDate, 'YY-MM-DD').format('YYYY-MM-DD')
        const missed = disq.missedMatches ? disq.missedMatches.length : 0;
        if(moment(md).isSameOrAfter(dd, 'day') && !disq.finished) {
            if(disq.count && disq.count > missed) {
                return `дисквал. (${disq.count - missed} ${formatText(disq.count - missed)})`
            } else if(ed && moment(md).isSameOrBefore(ed, 'day')) {
                return `дисквал. (до ${moment(disq.finishDate, 'YY-MM-DD').format('DD.MM.YY')})`
            } else {
                return null
            }
        } else {
            return null
        }
    }
}

const checkExtras = team => {
    if(team) {
        const { extraSquad, extraTeam } = team
        if(extraSquad && extraTeam && extraTeam.tournament && extraSquad.length && extraTeam.tournament.config && extraTeam.tournament.config.extraSquad) {
            return {
                options: [...extraSquad].sort((a, b) => a.surname > b.surname ? 1 : b.surname > a.surname ? -1 : 0),
                limit: extraTeam.tournament.config.extraSquad[extraTeam.canonical ? 'canonicalLimit' : 'duplLimit'],
                label: extraTeam.canonical ? 'Из основы' : 'Из дубля'
            }
        } else {
            return null
        }
    } else {
        return null
    }
}

const checkHeadquarters = team => {
    if(team && team.squad) {
        const { headquarters } = team.squad
        if(headquarters && headquarters.length) {
            return {
                options: headquarters.map(hq => hq.headquarter),
                limit: 4
            }
        } else {
            return null
        }
    } else {
        return null
    }
}

const RosterController = ({ match, team, updForm, setMatch, form }) => {
    const [limit, setLimit] = useState(match.stage && match.stage.league.discipline && match.stage.league.discipline.format ? parseInt(match.stage.league.discipline.format.slice(0,2)) : 8)

        const lineups = schemas[limit].map(s => '1-'+s)

        const dataForm = getBasicAndActiveBtn(form, team, limit, lineups);

        const [arrHome, setArrHome]= useState([])
        const [arrSquad, setArrSquad]= useState([])
        const [arrBasic, setArrBasic] = useState(dataForm.basic)
        const [player, setPlayer] = useState(0)
        const [playerMatch, setPlayerMatch] = useState(0)
        const [playerBasic, setPlayerBasic] = useState(0)
        const [table, setTable]= useState("request")
        const [activeTab, setActiveTab] = useState(dataForm.activeBtn)
        const [tacticPlayer, setTacticPlayer] = useState(false)
        const [exists, setExicts] = useState(false)
        const [arrSchema, setArrSchema] = useState([]);
        const [officials, setOfficials] = useState(form && form[team+'Roster'] ? form[team+'Roster'].headquarters || [] : [])

        const [formation, setFormation] = useState(lineups ? lineups[0] : '')

        const squadHintRef = useRef(null)
        const rosterHintRef = useRef(null)

        const toastRef = useRef(null)
        const extrasRef = useRef()
        const hqRef = useRef()

        const [updateCount, setUpdateCount] = useState(0)

        const updateHeadquarters = upd => {
            axios.put(`${ENDPOINT}v2/rosters/${form[`${team}Roster`]._id}`, {
                headquarters: upd
            }, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                updForm([team+'Roster']+'.headquarters', upd)
                toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Состав обновлен!'})
            })
        }

        useEffect(() => {
            if (!form[`${team}Roster`]) {
                const roster = {
                    matchId: match._id,
                    teamId: match[team]._id,
                    players: [],
                    lineup: ''
                }
                axios.put(`${ENDPOINT}v2/rosters`, roster, {
                    headers: {
                        authorization: localStorage.getItem('_amateum_subject_tkn')
                    }
                }).then(resp => {
                    updForm([team+'Roster'], resp.data)
                    toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Состав обновлен!'})
                })
            }
            const valid = isValid(arrSquad);

            if (updateCount > 1){
                if (valid) {
                    const roster = {
                        matchId: form[`${team}Roster`].matchId,
                        teamId: form[`${team}Roster`].teamId,
                        players: arrSquad,
                        lineup: {formation: formation, players: arrBasic}
                    }

                    axios.put(`${ENDPOINT}v2/rosters/${form[`${team}Roster`]._id}`, roster, {
                        headers: {
                            authorization: localStorage.getItem('_amateum_subject_tkn')
                        }
                    }).then(resp => {
                        toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Состав обновлен!'})
                    })
                }
            } else {
                setUpdateCount(updateCount + 1)
            }
        }, [arrSquad, arrBasic, formation])


        useEffect(()=>{
            if (updateCount !== 0) {
                setUpdateCount(1)
            }
            if (form) {
                let activeBtn = 'one';
                if (form[`${team}Roster`] && form[`${team}Roster`].players) {
                    if (form[`${team}Roster`].lineup && form[`${team}Roster`].lineup.players) {
                        setArrBasic(form[`${team}Roster`].lineup.players.slice(0, limit))
                        activeBtn = 'list'
                        if (form[`${team}Roster`].lineup.formation) {
                            activeBtn = 'arrangement';
                            //при инициализации или смене команды схему нужно актуализировать
                            setFormation(form[`${team}Roster`].lineup.formation)
                        }
                    } else {
                        setArrBasic([])
                        setArrSquad([])
                    }
                    let arr = match[team]?.squad?.players?.filter((item)=>{
                          return  form[`${team}Roster`].players.every(it => it._id.indexOf(item.player._id) !==0 )
                    }).map(item => ({...item, player: {...item.player, num: item.number}}))

                    //сортировка для дфл39 и клфл
                    if(['63283eba7d3ec0dbcb77bd13', '63720deb3d69d811c73373e5'].includes(match?.stage?.league?.federationId)){
                        setArrHome(arr?.filter(item => !item.unlinked)
                            .sort((a, b) =>
                                a.player?.surname > b.player?.surname ? 1 : a.player?.surname === b.player?.surname ? a.player?.name > b.player?.name ? 1 : -1 : -1
                        ) || []);

                        setArrSquad(form[`${team}Roster`].players.sort((a, b) =>
                            a.surname > b.surname ? 1 : a.surname === b.surname ? a.name > b.name ? 1 : -1 : -1
                        ));
                    } else {
                        setArrHome(arr !== [] ? arr.filter(item => !item.unlinked).sort((a, b) =>
                                +a.number?.replace('_', '') && +b.number?.replace('_', '') ? +a.number?.replace('_', '') > +b.number?.replace('_', '') ? 1 : +a.number?.replace('_', '') < +b.number?.replace('_', '') ? -1 : a.player?.surname > b.player?.surname ? 1 : -1 : +a.number?.replace('_', '') ? -1 : +b.number?.replace('_', '') ? 1 : a.player?.surname > b.player?.surname ? -1 : 1
                            )
                            : []);

                        setArrSquad(form[`${team}Roster`].players.sort((a, b) =>
                            +a.num?.replace('_', '') && +b.num?.replace('_', '') ? +a.num?.replace('_', '') > +b.num?.replace('_', '') ? 1 : +a.num?.replace('_', '') < +b.num?.replace('_', '') ? -1 : a.surname > b.surname ? 1 : -1 : +a.num?.replace('_', '') ? -1 : +b.num?.replace('_', '') ? 1 : a.surname > b.surname ? -1 : 1
                        ));
                    }
                    setActiveTab(activeBtn)

                } else if (match[team].squad && match[team].squad.players && match[team].squad.players.length){
                    //сортировка для дфл39 и клфл
                    if(['63283eba7d3ec0dbcb77bd13', '63720deb3d69d811c73373e5'].includes(match?.stage?.league?.federationId)){
                        setArrHome( match[team]?.squad?.players?.filter(item => !item.unlinked)
                            .sort((a, b) =>
                                a.player.surname > b.player.surname ? 1 : a.player.surname === b.player.surname ? a.player.name > b.player.name ? 1 : -1 : -1
                            ) || []);
                    } else {
                        setArrHome( match[team].squad.players.filter(item => !item.unlinked).sort((a, b) => a.player.num && b.player.num ? +a.player.num > +b.player.num ? 1 : -1 : a.player.number && b.player.number ? +a.player.number > +b.player.number ? 1 : -1 : a.player.surname > b.player.surname ? 1 : -1));
                    }
                    setArrBasic([])
                    setArrSquad([])
                    setActiveTab(activeBtn)
                }

                setLimit(match.stage && match.stage.league.discipline && match.stage.league.discipline.format ? parseInt(match.stage.league.discipline.format.slice(0,2)) : 8);
            }
        },[team])

        useEffect(() => {
            setArrSchema(formation.split('-').map(item => +item));
        }, [formation])

        useEffect(() => {
            const valid = isValid(arrSquad);

            if (valid) {
                updForm([team+'Roster']+'.players', arrSquad)
            }
            //setMatch({...match, [team]: {...match[team], roster: {...match[team]['roster'], players: arrSquad}}})
        }, [arrSquad])

        useEffect(() => {
            //console.log('activeTab eff', activeTab);
            switch (activeTab) {
                case 'list':
                    setArrBasic(arrBasic.filter(item => item.name || item.surname))
                    break;
                case 'arrangement':
                    //console.log('activeTab effect', activeTab, arrBasic);
                    arrBasic.length >= limit ? setArrBasic(mapperGetActive(arrBasic.slice(0, limit))) : setArrBasic(mapperGetActive([...arrBasic, ...fillArray(limit - arrBasic.length)]));
                    break;
                default:
                    // setArrBasic([])
                    break
            }
        }, [activeTab])

        useEffect(() => {
            //console.log('arrBasic, arrSchema, activeTab effect', arrBasic, arrSchema, activeTab);
            let lineData = {};
            switch (activeTab) {
                case 'list':
                    lineData.players = arrBasic
                    lineData.formation = null
                    break;
                case 'arrangement':
                    lineData.players = arrBasic
                    lineData.formation = arrSchema.join('-')
                    break;
                default:
                    // lineData.players = []
                    // lineData.schema = null
                    lineData = null;
                    break
            }

            updForm([team+'Roster']+'.lineup', lineData)

            //setMatch({...match, [team]: {...match[team], roster: {...match[team]['roster'], lineup: lineData}}})
        }, [arrBasic, arrSchema, activeTab])

        const isValid = (arr) => {
            //console.log('isValid arrSquad', arr);
            //const nums = [...arrSquad].map( (p, ind) => ({num: p.num, indx: ind}))
            const nums = [...arr].map( (p, ind) => p.num).filter(n => !!n);
            const unics = new Set(nums);
            let valid = unics.size === nums.length;

            //console.log('nums', nums, unics.size, nums.length, valid);
            return valid
        }

        const nums = [...arrSquad].map( (p, ind) => ({num: p.num, indx: ind}))
        //console.log('nums', nums);
        const onKeyDown =(e)=>{
            switch (table){
                case "request":
                    if(e === 'down'){
                        if(player === arrHome.length-1){
                            setPlayer(arrHome.length-1)
                        } else {
                            setPlayer(player+1)
                        }
                    }
                    if(e === 'up'){
                        if(player === 0){
                            setPlayer(0)
                        } else{
                            setPlayer(player-1)
                        }
                    }
                    if(e === 'right'){
                        let arr = arrHome
                        const disqualification = parseDisqualification(arr[player].disqualifications, match.stage.tournamentId, match.date)
                        if(!disqualification) {
                            let newArr = arr.filter((i, idx)=> idx!== player)
                            let restArr = arr.filter((i, idx) => idx===player)
                            setArrHome(newArr)
                            setArrSquad(arrSquad.concat({...restArr[0].player, number: restArr[0].number}))
                            setPlayer(player)
                        }
                    }
                break;

                case "match":
                    if(e==='down'){
                        setExicts(false)
                        if(playerMatch === arrSquad.length-1){
                            setPlayerMatch(arrSquad.length-1)

                        } else {
                            setPlayerMatch(playerMatch+1)
                        }
                    }

                    if(e==='up'){
                        setExicts(false)
                        if(playerMatch === 0){
                            setPlayerMatch(0)

                        } else{
                            setPlayerMatch(playerMatch-1)
                        }

                    }

                    if(e === 'left'){
                        let arr = arrSquad
                        let newArr = arr.filter((i, idx)=> idx !== playerMatch)
                        let restArr = arr.filter((i, idx) => idx === playerMatch)

                        if (restArr.length !== 0){
                            let data = restArr.reduce((p, c ) => { return c }, {})

                            setArrSquad(newArr)
                            setArrHome(arrHome.concat({player: {...data}}))
                            setPlayerMatch(playerMatch)
                            if(playerMatch + 1 === arrSquad.length){
                                setPlayerMatch(playerMatch-1)
                            }
                            if (arrBasic.find(item => item._id === data._id)){
                                setArrBasic(
                                    arrBasic.map((item, index) => {
                                        if (item._id === data._id){
                                            item = {
                                                _id: `plr_${index}`,
                                                indx: index,
                                                active: true
                                            }
                                        } else if (item.active) item.active = false
                                        return item
                                    })
                                )
                            }
                        }

                    }

                    if(e === 'right'){
                        let arr = arrSquad
                        let restArr = arr.filter((i, idx) => idx === playerMatch)
                        let exist = arrBasic.includes(restArr[0])
                        setExicts(exist)
                        setArrBasic(exist ? arrBasic : arrBasic.length <= limit ? arrBasic.concat(restArr) : arrBasic)
                        setPlayerMatch(playerMatch+1)
                    }
                    break;


                case "basic":
                    if(e==='down'){
                        if(playerBasic === arrBasic.length-1){
                            setPlayerBasic(arrBasic.length-1)
                        } else {
                            setPlayerBasic(playerBasic+1)
                        }
                    }
                    if(e==='up'){
                        if(playerBasic === 0){
                            setPlayerBasic(0)
                        } else{
                            setPlayerBasic(playerBasic-1)
                        }
                    }
                    if(e === 'left' && activeTab === 'list'){
                        let arr = arrBasic
                        let newArr = arr.filter((i, idx)=> idx!== playerBasic)
                        setArrBasic(newArr)
                        setPlayerBasic(playerBasic)
                    }

                    break;
        }
    }
    const addToBasic = (plr, ind) => {
        if (activeTab === 'arrangement') {
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
    }

    const onClickMoveEveryone =() =>{
        let arr = arrHome.map(item=> item.player)
        setArrSquad([...arrSquad, ...arr])
        setArrHome([])
    }

        const extras = checkExtras(match[team])
        const headquarters = checkHeadquarters(match[team])

        return [
                <Toast position='top-center' ref={toastRef} />,
                <div className='block-hint'>
                    <span>используйте стрелки «вверх» и ‎«вниз» для переключения игроков, и стрелки «влево» и ‎«вправо» для перемещения игроков между колонками</span>
                </div>,
                <div className='compound__block'>
                    <Hotkeys
                       keyName="up, down, right"
                       onKeyDown={(e) => onKeyDown(e)}
                     >
                        <div className='compound__block_request' id='1' onClick={()=> setTable('request')}>
                            <div className='block-title' style={{opacity: .7}}><span>Заявка команды на сезон</span></div>
                            <CustomScrollbars className='csb'>
                                <div className='request__player' style={{height:" calc(100% - 30px)"}}>
                                    {arrHome !==[] ? arrHome.filter(i => !extras || !extras.options.find(opt => opt._id === i._id)).map((item, idx) => {
                                        const disqualification = parseDisqualification(item.disqualifications, match.stage.tournamentId, match.date)

                                        return  <ItemPlayer
                                                    disqualification={disqualification}
                                                    setNum={num => setArrHome(arrHome.map((i, _idx) => _idx === idx ? ({...i, num: num, number: num}) : i))}
                                                    item={item.number ? {...item.player, num: item.number, number: item.num} : {...item.player}}
                                                    player={table==='request' ? player : ''}
                                                    setPlayer={!disqualification ? setPlayer : null}
                                                    key={item.player._id+'_arrHome'}
                                                    idx={idx}
                                                    matchDate={match.date}
                                                    tournamentId={match.stage.tournamentId}
                                                />
                                    }) : null}
                                </div>
                            </CustomScrollbars>

                            <Button label="Перенести всех" className="p-button-sm p-button-outlined" onClick={()=> onClickMoveEveryone()}/>
                        </div>
                    </Hotkeys >

                    <Hotkeys
                       keyName="up, down, left, right"
                       onKeyDown={ (e) => onKeyDown(e) }
                     >
                        <div className='compound__block_match' onClick={()=> setTable('match')} style={{paddingBottom: 10}}>
                            <div className='block-title' style={{opacity: .85, paddingRight: extras ? 100 : 0}}><span>Состав на матч</span></div>

                            {extras ? (
                                <div className='extras-menu'>
                                    <Menu
                                        ref={extrasRef}
                                        model={extras.options.filter(opt => !arrSquad.find(i => i._id === opt._id)).map(opt => ({
                                            label: `${opt.surname} ${opt.name}`,
                                            command: () => {
                                                setArrSquad([{...opt}].concat(arrSquad))
                                                setPlayerMatch(0)
                                            }
                                        }))}
                                        popup
                                    />
                                    <Button
                                        className='p-button-sm'
                                        label={extras.label}
                                        onClick={e => extrasRef.current.toggle(e)}
                                        iconPos='right'
                                        icon='pi pi-chevron-down'
                                    />
                                </div>
                            ) : null}

                            {headquarters && form[`${team}Roster`] && form[`${team}Roster`]._id ? (
                                <div className='hq-menu'>
                                    <Menu
                                        ref={hqRef}
                                        model={headquarters.options.map(opt => ({
                                            label: `${opt.surname} ${opt.name}`,
                                            icon: <Checkbox checked={typeof(officials.find(o => o._id === opt._id)) !== 'undefined'} style={{marginRight: '.75rem'}} />,
                                            command: () => {
                                                const presented = typeof(officials.find(o => o._id === opt._id)) !== 'undefined'
                                                const updated = presented ? officials.filter(o => o._id !== opt._id) : officials.concat([{...opt}])
                                                setOfficials(updated)
                                                updateHeadquarters(updated)
                                            }
                                        }))}
                                        popup
                                    />
                                    <Button
                                        className='p-button-sm'
                                        label='Официальные лица'
                                        onClick={e => hqRef.current.toggle(e)}
                                        icon='pi pi-plus'
                                    />
                                </div>
                            ) : null}
                            {isValid(arrSquad) ? null : <Tag value="есть дубли" severity={'warning'} className={`duppleNums`} icon="pi pi-eye"/> }
                            <CustomScrollbars className='csb'>
                                <div className='request__player' style={{height:"100%"}}>
                                    {arrSquad !== [] ? arrSquad.map((item, idx) => {
                                        const disqualification = parseDisqualification(item.disqualifications, match.stage.tournamentId, match.date)

                                        return  <ItemPlayer
                                                    item={{...item, fromExtras: extras && extras.options.find(opt => opt._id === item._id)}}
                                                    disqualification={disqualification}
                                                    activeTab={activeTab}
                                                    addToBasic={!disqualification ? addToBasic : null}
                                                    setPlayer={!disqualification ? setPlayerMatch : null}
                                                    player={table === 'match' ? playerMatch : ''}
                                                    key={item._id+'_arrSquad'}
                                                    idx={idx}
                                                    nums={nums}
                                                    exists={arrBasic && arrBasic.length && arrBasic.find(plr => plr._id.toString() === item._id.toString())}
                                                    red={true}
                                                    setNum={num => {
                                                        setArrSquad(arrSquad.map((i, _idx) => _idx === idx ? ({...i, number: num, num: num}) : i).sort((a, b) => a.num && b.num ? +a.num > +b.num ? 1 : -1 : a.number && b.number ? +a.number > +b.number ? 1 : -1 : a.surname > b.surname ? 1 : -1))
                                                        setArrBasic(arrBasic.map(i => i._id === item._id ? ({...i, number: num, num: num}) : i))
                                                    }}
                                                />
                                    }) : null}
                                </div>
                            </CustomScrollbars>
                        </div>
                    </Hotkeys >


                    <Hotkeys
                       keyName="up, down, left, right"
                       onKeyDown={ (e) => onKeyDown(e) }
                     >
                        <div className='compound__block_basic' onClick={()=> setTable('basic')}>
                            <div className='block-title'><span>Основной состав</span></div>
                            <div className='basic__group_btn'>
                                <span className={`one ${activeTab==='one'? 'active' :''}`} onClick={()=> setActiveTab("one")} >Не указан</span>
                                <span className={`players-list ${activeTab==='list'? 'active' :''}`} onClick={()=> setActiveTab("list")}>Списком</span>
                                {lineups ? <span className={`arrangement ${activeTab==='arrangement'? 'active' :''}`} onClick={()=> setActiveTab("arrangement")}>Расстановкой</span> : null}
                            </div>

                            {activeTab==='list' ?
                                <div className='basic__block_compound nested'>
                                    {arrBasic.length>limit ? <div className='basic__notification'>Вы указали больше игроков в основном составе, чем предполагает формат турнира. Удалите {arrBasic.length - limit} игроков</div>: null}
                                    <div className='basic__player'>
                                        {arrBasic!==[] ? arrBasic.filter(item => item.surname || item.name).map((item, idx) =>(
                                            <ItemPlayer
                                                item={item}
                                                setPlayer={setPlayerBasic}
                                                player={table === 'basic' ? playerBasic : ''}
                                                key={item._id+'_arrBasic'}
                                                idx={idx}

                                                matchDate={match.date}
                                                tournamentId={match.stage.tournamentId}
                                            />
                                        )) : null}
                                    </div>
                                </div>
                                :
                                activeTab==='arrangement' ?
                                <div className="basic__block_arrangement">
                                    <div className={`arrangement__tactic`}>
                                        <div className='p-inputgroup'>
                                            <span className='p-inputgroup-addon'>Схема:</span>
                                            <Dropdown
                                                options={lineups.map(l => ({value: l, label: l}))}
                                                value={formation}
                                                onChange={e => setFormation(e.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={`arrangement__tactic_img team ${arrSchema[3] ? '' : 'nomiddls'}`}>

                                        {arrSchema[3] ? <div className={`forws`}>
                                            {arrBasic.slice(limit - arrSchema[3], limit).map(item => (<ItemSchemaPlayer key={item._id} item={item} active={item.active}/>))}
                                        </div> : null}
                                        <div className={`middles`}>
                                            {arrBasic.slice(arrSchema[1]+1, arrSchema[3] ?  limit - arrSchema[3] : limit).map(item =>(<ItemSchemaPlayer key={item._id} item={item} active={item.active}/>))}
                                        </div>
                                        <div className={`defs`}>
                                            {arrBasic.filter((item, ind) => ind > 0 && ind <= arrSchema[1]).map(item=>(<ItemSchemaPlayer key={item._id} item={item} active={item.active}/>
                                            ))}
                                        </div>
                                        <div className={`keeper`}>
                                            {arrBasic.filter((item, ind) => ind === 0).map(item => (<ItemSchemaPlayer key={item._id} item={item} active={item.active}/>))}
                                        </div>
                                    </div>
                                    <div className='request__notification'>Кликните по игроку в списке слева для <br/> привязки к выделенной позиции
                                    </div>

                                    {arrBasic.filter(item => item.name || item.surname).length ? <Button className="asLink" onClick={()=>{setArrBasic(mapperGetActive(fillArray(limit)))}}>Очистить расстановку</Button> : null}
                                    {/*<Button onClick={saveRoster} className={'btn-save'}>Сохранить</Button>*/}
                                </div> : null
                         }
                        </div>
                    </Hotkeys >
                </div>
        ]
    }

    const tactic =[
        {name:'2-3-2', key:'A'},
        {name:'3-2-2', key:'B'},
        {name:'2-4-1', key:'C'},
        {name:'3-3-1', key:'D'},
        {name:'2-2-3', key:'E'},
        {name:'3-1-3', key:'G'},
    ]

    const arr =[
        {id:1, class:'a'},
        {id:2, class:'b'},
        {id:3, class:'c'},
        {id:4, class:'d'},
        {id:5, class:'e'},
        {id:6, class:'f'},
        {id:7, class:'g'},
        {id:8, class:'h'},
    ]


export default RosterController

import React, { useState, useEffect, useContext } from 'react'
import './style.scss'
import {Button} from "primereact/button";
import MatchItem from "../MatchItem";
import Tablo from "../../../assets/img/image 10.svg";
import {Tag} from "primereact/tag";
import { Checkbox } from 'primereact/checkbox';
import service from './service'
import CustomScrollbars from 'react-custom-scrollbars-2'
import { ProgressSpinner } from 'primereact/progressspinner';

import { PanelWrapper } from '../../Atoms'
import InboxListItem from './InboxListItem'
import SquadItem from './SquadItem'
import AddonItem from './AddonItem'
import NewClubItem from './NewClubItem'
import { WorkspaceContext } from '../../../ctx'
import { ToolbarContext } from '../../Toolbar/ctx'

import moment from 'moment'
import {InputText} from "primereact/inputtext";
moment.locale('ru');

const inners = {
    squad: SquadItem,
    addon: AddonItem,
    club: NewClubItem
}

const emb = require('../../../assets/img/pennant.png');

const Item = ({ item, patchItem, onArchived, onClickItem, getEmblem, clubManage,allTournaments }) => {
    const Specified = inners[item.type] || null

    return  Specified ? (
        <Specified
            item={item}
            patchItem={patchItem}
            onArchived={onArchived}
            onClickItem={onClickItem}
            getEmblem={getEmblem}
            clubManage={clubManage}
            allTournaments={allTournaments}
        />) : null
}

const rangeBtns3 = [
    {label: 'Ожидают обработки', name: 'inbox'},
    {label: 'Обработанные', name: 'handled'}
]

const getEmblem = club => {
    if (club) {
        const { emblem, origin } = club;

        const originEmb = emblem || (origin && origin.emblem ? origin.emblem : emb)
        return originEmb
    } else {
        return emb
    }
}

const reducerQueriesByDate = (data, rangeBtn, rangeBtn2) => {
    const filtred = data.reduce((acc, item) => {
        const {handledAt, type, createdAt, archived} = item;
        if (type !== 'season'){
            const date = moment(createdAt).format('DD MMMM YYYY')
            const handled = !!handledAt || !!archived;
            //console.log('type', type,rangeBtn,type === rangeBtn,  date, 'handledAt', !!handledAt);
            if (!type) {
                console.log('item type', item);
            }
            switch (rangeBtn2) {
                case 'inbox':
                    if (!handled && (rangeBtn === 'all' ? !!type : type === rangeBtn)) {
                        if (!acc[date]) {
                            acc[date] = [item]
                        } else {
                            acc[date].push(item)
                        }
                    }
                    break;
                case 'handled':
                    if (handled && (rangeBtn === 'all' ? !!type : type === rangeBtn)) {

                        if (!acc[date]) {
                            acc[date] = [item]
                        } else {
                            acc[date].push(item)
                        }
                    }
                    break;
                default:
                    break
            }
        }
        return acc
    }, {});

    const output = [];

    for (let date in filtred) {
        output.push({
            date: date,
            list: filtred[date]
        })
    }

    return output
}

const Inbox = ({ subject, layout }) => {
    const [value, setValue] = useState('')
    const [controlReq, setControlReq] = useState(null)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([]);
    const [viewData, setViewData] = useState([]);
    const [allTournaments, setTournaments] = useState([])

    const ctx = useContext(WorkspaceContext)
    const tbCtx = useContext(ToolbarContext)
    const { toolbar, setFilter } = tbCtx

    const getData = async () => {

        if(ctx.workspace) {
            if (ctx.workspace.allTournaments) {
                setTournaments(ctx.workspace.allTournaments)
            } else {
                const tourns = await service.getTourns();
                if (tourns) {
                    setTournaments(tourns)
                    ctx.setWorkspace({
                        ...ctx.workspace,
                        allTournaments: tourns
                    })
                }
            }
        }

        const resp = await service.getInbox();
        if (resp) {
            setLoading(false)
            setControlReq(null)
            setData(resp)
        }
    }

    useEffect(() => {
        setLoading(true)
        getData();
    }, [subject])

    useEffect(() => {
        if (data && data.length && subject) {
            const reduced = reducerQueriesByDate(data, subject.type !== 'club' ? toolbar.filters.rangeBtn : 'all', toolbar.filters.rangeBtn2)

            setControlReq(null)
            setViewData(reduced);
        }
    }, [data, toolbar.filters.rangeBtn, toolbar.filters.rangeBtn2])

    const patchItem = (obj) => {
        setData(data.map((item, idx) => item._id.toString() === obj._id.toString() ? {...obj} : {...item}))
    }

    const onClickItem = (item) =>{
        //console.log('onClickItem', item);
        setControlReq(item)
    }

    return [
        <div className={'content-squads'}>
            {loading ? <ProgressSpinner className='loading' animationDuration='1s'/> : (
                <div className={'request-container'}>
                {viewData ? (
                    <CustomScrollbars className='request-bars' autoHeight autoHeightMin='71vh' autoHide>
                        {viewData.map((data, idx) => (
                            data.list && data.list.length ?
                                data.list.filter(m => value ? (
                                    (
                                        (m.club ? m.club.name.toUpperCase().includes(value.toUpperCase()) : false)
                                        ||
                                        (m.tournament ? (
                                            m.tournament.name.toUpperCase().includes(value.toUpperCase())
                                            ||
                                            m.tournament.league.name.toUpperCase().includes(value.toUpperCase())
                                        ) : false)
                                    )
                                ) : m).length > 0 ?
                                    <div className={'team-request-container'} key={data.date}>
                                        <div className={'date'}>{data.date}</div>
                                        {data.list.filter(m => value ? (
                                            (
                                                (m.club ? m.club.name.toUpperCase().includes(value.toUpperCase()) : false)
                                                ||
                                                (m.tournament ? (
                                                    m.tournament.name.toUpperCase().includes(value.toUpperCase())
                                                    ||
                                                    m.tournament.league.name.toUpperCase().includes(value.toUpperCase())
                                                ) : false)
                                            )
                                        ) : m).map((item, idx) => (
                                            <InboxListItem
                                                key={item._id}
                                                item={item}
                                                onClickItem={onClickItem}
                                                getEmblem={getEmblem}
                                                isActive={controlReq ? item._id.toString() === controlReq._id.toString() : false}
                                            />
                                        ))}
                                    </div> : null
                                : null
                        ))}
                        </CustomScrollbars>
                    ) : null}
                    </div>
                )}

        {controlReq ? (
            <PanelWrapper layout={layout} resetTrigger={() => setControlReq(null)}>
                <Item
                    key={controlReq._id}
                    item={controlReq}
                    patchItem={obj => patchItem(obj)}
                    onArchived={() => setData(data.filter(_i => _i._id !== controlReq._id))}
                    getEmblem={getEmblem}
                    clubManage={subject && subject.type === 'club'}
                    allTournaments={allTournaments}
                />
            </PanelWrapper>
        ) : <div className={'side-notes'}>
                <div className={'image'}><img src={Tablo} alt={'image'}/></div>
                <div className={'text-group'}>
                    <ul role="list" className={'text'}>
                        <li>
                            Кликните на карточку запроса, для выбора игроков и действий
                        </li>
                        <li>
                            Если вы заявляете/дозаявляете игроков без запроса представителей команд, воспользуйтесь разделом
                            <a href={'/clubs'}>Клубы и команды</a>
                        </li>
                    </ul>
                </div>
            </div>
        }

        </div>
    ]
}

const pluralForm = (n) => {
    let arr = ["а", "ов", "ов"]
    return arr[n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
}

export default Inbox

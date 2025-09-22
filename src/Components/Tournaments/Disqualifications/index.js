import React, { useState, useRef, useEffect } from 'react'
import service from './service'
import CustomScrollbars from 'react-custom-scrollbars-2'
import DisqualForm from './DisqualForm'
import { ConfirmDialog } from 'primereact/confirmdialog';
import { confirmDialog } from 'primereact/confirmdialog';
import axios from 'axios'

import { ENDPOINT } from '../../../env'

// import {
//     FormInput,
//     Button,
//     FormRadio
// } from '@ui'

import {InputText} from "primereact/inputtext";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import {Toast} from "primereact/toast";
import { ProgressSpinner } from 'primereact/progressspinner'

import './style.scss'
const moment = require('moment')
moment.locale('ru');

const filters = [
    {name: 'active', descr: 'Действующие'},
    {name: 'finished', descr: 'Завершившиеся'}/*,
    {name: 'all', descr: 'Все'}*/
];

const options = {
    headers: {
        authorization: localStorage.getItem('_amateum_subject_tkn'),
        SignedBy: localStorage.getItem('_amateum_tkn')
    }
}

const Disqualifications = ({subject, toast, updateTournament}) => {
    const [data, setData] = useState(null)
    const [curFilter, setCurFilter] = useState('active');
    const [filterText, setCurFilterText] = useState('');
    //const [tourns, setTourns] = useState('');

    const [viewData, setViewData] = useState(null)
    const [activeDisqual, setActiveDisqual] = useState(null);
    //const [fid, setFid] = useState(null);
    const [loading, setLoading] = useState(true)

    const reload = async () => {
        const res = await service.disquals(subject._id)
        if (res) {
            setData(res.disquals)
            //setTourns(res.tourns)
            setLoading(false);
        }
    }
    useEffect(() => {
        if (subject) {
            reload()
        }
    }, [subject])

    useEffect(() => {
        if (data && data.length) {
            let filtData;
            switch (curFilter) {
                case 'active':
                    filtData = data.filter(item => !checkNotActive(item));
                    break;
                case 'finished':
                    filtData = data.filter(item => checkNotActive(item));
                    break;
                case 'all':
                    filtData = [...data];
                    break;
                default:
                    break;
            }
            if (filterText && filterText.length > 1) {
                const filtDataText = filtData.filter(item => (item.club && item.club.name.toLowerCase().includes(filterText.toLowerCase())) || (item.player && `${item.player.name}${item.player.surname}`.toLowerCase().includes(filterText.toLowerCase())) || (item.headquarter && `${item.headquarter.name}${item.headquarter.surname}`.toLowerCase().includes(filterText.toLowerCase())) ||
                    (item.tournament && item.tournament.name.toLowerCase().includes(filterText.toLowerCase()))
                );
                setViewData(filtDataText)
            } else {
                setViewData(filtData)
            }
        }
    }, [data, curFilter, filterText])

    const actWithDisqual = (disqual) => {
        if (disqual) {
            setActiveDisqual(disqual)
        } else {
            const newDisqual = {
                count: 2,
                tournamentId: subject._id,
                squadId: null,
                playerId: null,
                fictive: false,
                stageId: null,
                squad: null,
                player: null,
                missedMatches: [],
                startDate: moment().format('YY-MM-DD'),
                isManual: true,
                comment: null
            }
            //setData(...data, newDisqual);
            setActiveDisqual(newDisqual)
        }
    }

    const confirm = (disq) => {
        confirmDialog({
            message: 'Удалить дисквалификацию?',
            header: '',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteDisqual(disq),
            reject
        });
    }

    const confirm2 = (disq) => {
        confirmDialog({
            message: 'Восстановить дисквалификацию?',
            header: '',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-secondary',
            accept: () => restoreDisqual(disq),
            reject
        });
    }

    const reject = () => {
        if (toast) {
            toast.show({ severity: 'warn', summary: '', detail: 'Вы отменили действие', life: 3000 });
        }
    }

    const restoreDisqual = (disqual) => {
        const {count, createdDate, startDate, finishDate} = disqual
        const body = {
            count: count > 0 ? count : finishDate ? null : 1,
            createdDate,
            startDate,
            finishDate: finishDate && !count ? finishDate <= moment().format('YY-MM-DD') ? moment().add(1,'days').format('YY-MM-DD') : finishDate : null,
            missedMatches: null,
            finished: false
        };
        const ind = data.findIndex(item => item._id.toString() === disqual._id.toString());
        axios.put(`${ENDPOINT}v2/disqualifications/${disqual._id}`, body, options).then(resp => {
            if(resp.data && resp.data.success) {
                if (toast) {
                    setData([...data.slice(0, ind),{...disqual, count: count > 0 ? count : finishDate ? null : 1, finishDate: finishDate && !count ? finishDate <= moment().format('YY-MM-DD') ? moment().add(1,'days').format('YY-MM-DD') : finishDate : null, finished: false},...data.slice(ind+1)]);
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены', life: 1000})
                }
            } else {
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
                }
            }
        })
    }

    const deleteDisqual = (disqual) => {
        axios.delete(`${ENDPOINT}v2/disqualifications/${disqual._id}`, options).then(resp => {
            if(resp.data && resp.data.success) {
                setData(data.filter(d => d._id !== disqual._id))
                if (toast) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены', life: 1000})
                }
            } else {
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
                }
            }
        })
    }
    const cleareGlobal = (disqual) => {

        const ind = data.findIndex(item => item._id.toString() === disqual._id.toString());
        if (data[ind]._id) {
            const body = {cleareGlobal: true};
            /*if (disqual['count'] === null) {
                body.finishDate = moment().format('YY-MM-DD');
            } else {
                body.count = 0;
            }*/

            axios.put(`${ENDPOINT}v2/disqualifications/${disqual._id}`, body, options).then(resp => {
                if(resp.data && resp.data.success) {
                    setData([...data.slice(0, ind),{...disqual,
                        finishDate: moment().format('YY-MM-DD'),
                        count: null,
                        isManual: true,
                        globalDisqTill: false,
                        finished: true},...data.slice(ind+1)]);
                    if (toast) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены', life: 1000})
                    }
                } else {
                    if (toast) {
                        toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
                    }
                }
            })
        } else {
            setData([...data.slice(0, ind),{...disqual, count: 0},...data.slice(ind+1)]);
        }
        setActiveDisqual(null)
    }

    const removeDisqual = (disqual) => {

        const ind = data.findIndex(item => item._id.toString() === disqual._id.toString());
        if (data[ind]._id) {
            const body = {finished: true};
            /*if (disqual['count'] === null) {
                body.finishDate = moment().format('YY-MM-DD');
            } else {
                body.count = 0;
            }*/

            axios.put(`${ENDPOINT}v2/disqualifications/${disqual._id}`, body, options).then(resp => {
                if(resp.data && resp.data.success) {
                    setData([...data.slice(0, ind),{...disqual, finished: true},...data.slice(ind+1)]);
                    if (toast) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены', life: 1000})
                    }
                } else {
                    if (toast) {
                        toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
                    }
                }
            })
        } else {
            setData([...data.slice(0, ind),{...disqual, count: 0},...data.slice(ind+1)]);
        }
        setActiveDisqual(null)
    }

    const patchDisqual = (disqual, notall=true) => {
        //console.log('patchDisqual', disqual, notall);
        if (notall) {
            const ind = data.findIndex(item => disqual._id && item._id.toString() === disqual._id.toString());
            if (ind > -1) {
                setData([...data.slice(0, ind), disqual, ...data.slice(ind+1)]);
            } else {
                setData([...data, disqual]);
            }
            setActiveDisqual(disqual)
        } else {
            const filtredData = data && data.length ? data.filter(item => item._id &&  !disqual.map(dis => dis._id.toString()).includes(item._id.toString())) : []
            setData([...filtredData, ...disqual]);
        }
    }
    const exitDisqual = () => {
        setActiveDisqual(null)
    }
    const checkNotActive = item => {
        if (item.finished) {
            return true
        } else {
            if ( item['count'] !== 'undefined' && item['count'] !== null && !isNaN(+item.count)) {
                if (+item.count === 0) {
                    return true
                } else if (item.missedMatches && (+item.count - item.missedMatches.length === 0)) {
                    return true
                } else {
                    return false
                }
            } else if (item.finishDate && item.finishDate >= moment().format('YY-MM-DD')) {
                return false
            } else {
                return true
            }
        }

    }
    return  <div className='disquals__container'>
                <ConfirmDialog />
                {loading ? <div className='disqual-load'>
                    <ProgressSpinner style={{width: 64, height: 64}} />
                </div> : null }

                {activeDisqual ? (
                    <DisqualForm
                        disqual={activeDisqual}
                        patchDisqual={patchDisqual}
                        removeDisqual={removeDisqual}
                        exitDisqual={exitDisqual}
                        cleareGlobal={cleareGlobal}
                        //tourns={tourns}
                        toast={toast}
                        curTournament={subject}
                        fid={subject.federationId}
                        disqualsData={data}
                        //setModal={setActiveDisqual}
                        isActive={!checkNotActive(activeDisqual)}
                    />
                ) : null}
                {loading ? null : <div className='disquals'>
                    {/*<span className='disquals_label'>Поиск по ФИО или команде</span>*/}
                    <div className='disqual-filters'>
                        {/*filters.map(item => (
                            <FormRadio
                                key={'filters_'+item.name}
                                inline
                                name="filters"
                                checked={curFilter === item.name}
                                onChange={() => setCurFilter(item.name)}
                            >{item.descr}</FormRadio>
                        ))*/}
                        <InputText
                            type='text'
                            className='filter_text'
                            name='filter_text'
                            onChange={e => setCurFilterText(e.target.value)} value={filterText}
                            placeholder='Введите ФИО или команду'
                            autoComplete='off'
                        />
                        <span className='filter_btns'>
                            <span
                            onClick={() => setCurFilter('active')}
                            className={curFilter === 'active' ? 'filter active' : 'filter'}>Действующие</span>

                            <span
                             onClick={() => setCurFilter('finished')}
                             className={curFilter === 'finished' ? 'filter active' : 'filter'}>Завершившиеся</span>
                        </span>

                        <span
                        onClick={() => actWithDisqual()}
                        className='add_btn'
                        >Создать новую</span>
                    </div>

                    <div className='disqual-list'>
                        <CustomScrollbars autoHide autoHeight autoHeightMin='71vh' >
                        {viewData ? viewData.map((item, i) => (
                            <Item
                                data={item}
                                index={i}
                                key={`item_${item.playerId}_${i}`}
                                actWithDisqual={actWithDisqual}
                                isActive={!checkNotActive(item)}
                                confirm={confirm}
                                confirm2={confirm2}
                            />
                        )) : null}
                        </CustomScrollbars>
                    </div>
                    {/*<Button
                        size='sm'
                    isActive    theme='success'
                        onClick={() => actWithDisqual()}
                    ><i className='material-icons'>add_card</i>Создать дисквалификацию</Button>*/}
                </div>}
            </div>
}

const Item = ({ data,index, actWithDisqual, confirm, confirm2, isActive }) => {
    //const active
    //data.comment = 'Аггресивное поведение в адрес арбитра с применением ненормативной лексики'
    let clNames = isActive ? 'disqual__item isActive' : 'disqual__item notActive';
    //data.count +=20;
    if (data.isRedCard) {
        clNames += ' isRedCard'
    }
    const formatter = count => {
        if (count === 1 || (count > 20 && count % 10 === 1)) {
            return 'матч'
        } else if ([2, 3, 4].includes(count) || (count > 20 && [2, 3, 4].includes(count % 10))) {
            return 'матча'
        } else {
            return 'матчей'
        }
    }
    const isHead = !!data.headquarter;

    const memberData = data.player || data.headquarter || null;

    return <div className={clNames}>
                {/*{data.fictive ? <div className='disqual__fictive'>
                    Условная дисквалификация
                </div> : null}*/}
                <div className='disqual__info'>
                    <div className={data.isManual ? 'disqual__card isManual' : 'disqual__card'}>
                        {data.isManual ? null : data.isRedCard ? null : <span className='yellow_count'>x4</span>}
                    </div>
                    {memberData ? <div className='disqual__player'>
                        <div className='disqual__player--name'>
                            {memberData.name || ''} {memberData.surname || memberData.middlename || ''}
                        </div>
                        <div className='disqual__club'>
                            {data.club ? data.club.name : data.team ? data.team.name : 'клуб не найден'} {isHead ? '(штаб)' : ''}
                        </div>
                        <div className='disqual__tournament'>
                            {data.tournament ? data.tournament.name : ''}.{data.stage ? data.stage.name : ''}
                        </div>
                    </div> : <div className='disqual__player'>игрок не выбран</div>}

                    {data.startDate ? <span className='disqual__start'>
                        {moment(data.startDate, 'YY-MM-DD').format('DD MMMM YYYY')}
                    </span> : null }
                    {data.count ? <div className='disqual__count'>
                        <span>{data.count}</span>
                        <span>{formatter(data.count)}</span>
                    </div> : null }
                    {isActive ? <div className='disqual__count disqual__rest'>
                        {data.finishDate ? `до: ${moment(data.finishDate, 'YY-MM-DD').format('DD MMMM YYYY')}` : [<span>{data.missedMatches ? data.count - data.missedMatches.length : data.count}</span>, <span>осталось</span>]}
                    </div> : null }

                </div>
                <div className='disqual__opt'>
                    <div className='disqual__comment'>
                        {data.comment ? [<span>Комментарий:</span>,<span>{data.comment}</span>] : null}
                    </div>
                    <div className='disqual__act' style={{width: isActive ? '22%' : '33%'}}>
                        <Button
                            icon={'pi pi-fw pi-cog'}
                            label=""
                            className="p-button-outlined p-button-success"
                            onClick={() => actWithDisqual(data)}
                            //disabled={isActive}
                        />
                        {isActive ? null : [<Button
                            icon={'pi pi-refresh'}
                            label=""
                            className="p-button-outlined p-button-secondary"
                            onClick={() => confirm2(data)}
                            //disabled={isActive}
                        />
                        ]}
                        <Button
                            icon={'pi pi-trash'}
                            label=""
                            className="p-button-outlined p-button-danger"
                            onClick={() => confirm(data)}
                            //disabled={isActive}
                        />
                    </div>
                </div>
            </div>
}

export default Disqualifications

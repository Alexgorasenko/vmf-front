import React, { useState, useEffect, useRef } from 'react'

import './style.scss'

import Emblem from '../../Emblem'
import { Tag } from "primereact/tag";
import { Menu } from 'primereact/menu'
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown'

import CustomScrollbars from 'react-custom-scrollbars-2'

//import TeamRequestModal from "./TeamRequestModal";
import ItemData from "./ItemData";

import axios from 'axios'
import { ENDPOINT } from '../../../env'

const Representatives = ({ profile, subject, maintoast, updateClub, layout }) => {
    //const [query, setQuery] = useState('');
    const [list, setList] = useState(subject.scopes || [])
    const [selected, setSelected] = useState(null);
    //const [quering, setQuering] = useState(false)

    useEffect(() => {
        if (subject && subject.scopes && subject.scopes.length) {
            setList(subject.scopes)
            setSelected(subject.scopes[0])
        } else {
            setList([])
            setSelected(null)
        }
    }, [subject])

    const addItem = () => {
        const newItem = {
            _id: 'newItem',
            subjectId: subject._id,
            subjectType: 'club',
            scope: 'readWrite',
            userId: 'newItem',
            user: {
                _id: 'newItem',
                name: '',
                phone: ''
            }
        }

        const item = list.find(c => c._id.toString() === newItem._id);
        if (!item) {
            const addedList = list ? [...list, newItem] : [newItem];
            setList(addedList)
        }
        setSelected(newItem)
    }
    const updateItem = updated => {
        setSelected(updated)
    }

    return (
        <div className={'list'}>
            <div className={'list-content'}>
                {list && list.length ? (layout !== 'mobile') ? <CustomScrollbars  autoHide autoHeight autoHeightMin={100} autoHeightMax={500}>
                    <div className={'list-data'}>
                        {list.filter(i => i && i.user).map(item => (
                            <div className='team-btn' key={item._id}>
                                <Button
                                    className={'p-button-sm p-button-info'+(selected && (selected._id !== item._id) ? ' p-button-outlined' : '')}
                                    onClick={() => setSelected(item)}
                                >{item.user.name+' '+(item.user.surname || '')}</Button>

                                {item && item.user && item.user.token ? (
                                    <Tag className="tag" severity="info" value='Активирован'/>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </CustomScrollbars> : (
                    <div className='p-inputgroup'>
                        <Dropdown
                            options={list.map(i => ({...i, name: i.user.name}))}
                            optionLabel='name'
                            value={selected ? {...selected, name: selected.user.name} : null}
                            onChange={e => setSelected(e.target.value)}
                        />
                        <Button
                            icon='pi pi-plus-circle'
                            onClick={() => addItem()}
                        />
                    </div>
                ) : null}

                {layout !== 'mobile' ? (
                    <Button
                        label="Добавить представителя"
                        icon="pi pi-plus"
                        className='addbtn p-button-sm'
                        //loading={loading}
                        onClick={addItem}
                    />
                ) : null}
            </div>

            {selected ? (
                <div className='fields-grid double-row np' style={{marginLeft: 40}}>
                    <div className='fields-group'>
                        <ItemData
                            data={selected}
                            toast={maintoast}
                            subject={subject}
                            profile={profile}
                            updateItem={updateItem}
                            pushItem={newitem => {
                                const ind = list.findIndex(it => it._id.toString() === newitem._id.toString());
                                //console.log('pushItem', newitem, ind, list);

                                if (ind > -1) {
                                    const mapd = list.map(it => it._id.toString() === newitem._id.toString() ? newitem : it);
                                    setList(mapd)
                                    updateClub({scopes: mapd});

                                } else {
                                    const indNewItem = list.findIndex(it => it._id.toString() === 'newItem');

                                    if (indNewItem > -1) {
                                        const mapd = list.map(it => it._id.toString() === 'newItem' ? newitem : it);
                                        setList(mapd)
                                        updateClub({scopes: mapd});
                                    } else {
                                        setList([...list, newitem])
                                        updateClub({scopes: list.concat([newitem])});
                                    }
                                }
                                setSelected(newitem)
                            }}
                            removeItem={id => {
                                const filtred = list.filter(it => it._id.toString() !== id.toString());
                                setList(filtred)
                                updateClub({scopes: filtred});
                                setSelected(filtred[0] || null)
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Representatives

import React, { useState, useEffect, useRef } from 'react';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { RadioButton } from 'primereact/radiobutton'
import { AutoComplete } from 'primereact/autocomplete'
import { Message } from 'primereact/message'
import { Dialog } from 'primereact/dialog'

import helper from './helper';

const types = [
    //{id: 'federation', desc: 'Незавершенные турниры федерации'},
    {id: 'league', desc: 'Все активные турниры лиги'},
    {id: 'tournament', desc: 'Турнир'},
    {id: 'group', desc: 'Группа турниров'},
];

const NodeItem = ({subject, addedType, nodeData, nodekey, changeNodes, closeNode, removeNode, addNode, lostTourns, lostLeagues}) => {
    //console.log('NodeItem', subject, nodeData, nodekey, lostTourns, lostLeagues);
    const [form, setForm] = useState(nodeData.type ? {...nodeData} : nodekey.length ? helper.nodeView({type: 'tournament', name: '', _id: ''}, nodekey || nodeData.key || 0) : helper.nodeView({type: types[0].id, name: subject.name, _id: subject._id}, nodekey || nodeData.key || 0))
    const [type, setType] = useState(nodeData.type ? types.find(t => t.id === nodeData.type) : nodekey.length ? types.find(t => t.id === 'tournament') : types[1])
    const [pull, setPull] = useState(nodeData.children ? [...nodeData.children] : [])
    //const [createDialog, setCreateDialog] = useState(null)
    const [suggest, setSuggest] = useState(null)
    //console.log('NodeItem pull', pull);

    /*useEffect(() => {
        if (nodeData) {
            let f
            let t
            if (nodeData.type) {
                f =  {...nodeData}
                t = types.find(t => t.id === nodeData.type)
            } else {
                f = helper.nodeView({type: types[0].id, name: subject.name, _id: subject._id}, nodekey || nodeData.key || 0);
                if (nodekey) {
                    if (nodekey.length) {
                        t = types.find(t => t.id === 'tournament')
                    } else {
                        t = types[0]
                    }
                }
            }
            setType(t)
            console.log();
            setForm(f)
        }
    }, [nodeData, nodekey])*/

    const checkUnassigned = () => {
        const assigned = pull && pull.length ? pull.map(t => t.nodeId) : []

        return subject.tournaments
                .filter(t => !assigned.includes(t._id))
                .map(t => t.name)
    }

    const searchTourn = (evt) => {
        const checkedTourns = subject.tournaments.filter(t => !pull.map(gt => gt.nodeId).includes(t._id))
        //.log('checkedTourns', checkedTourns);
        const filtered = pull.length >=8 ? [] : checkedTourns
                            .filter(t => evt.query.length ? t.name.toLowerCase().includes(evt.query.toLowerCase()) : t.name)
                            .map((t, i) => helper.nodeView({...t, type: 'tournament'}, t.key || form.key+'-'+i))
                            .map(t => ({...t, name: t.name || t.label}))
        //console.log('searchTourn', filtered);
        setSuggest(filtered)
    }

    const assignTourns = arr => {
        return arr.length ? arr.map((t, i) => {
            const node = subject.tournaments.find(_t => _t._id === t.nodeId);
            return node ? {...node, key: `${form.key}-${i}`} : null
        }).filter(t => !!t) : []
    }
    //console.log('form', form)

    const dialogBody = () => {
        //const [collection, relations] = dialog
        const tournsInfo = nodeData.type ? subject.tournaments : lostTourns;
        const leaguesInfo = nodeData.type ? subject.leagues : lostLeagues;

        const tourns = tournsInfo.map(t => helper.nodeView({...t, type: 'tournament'}, nodeData.key || form.key))
        const leagues = leaguesInfo.map(l => {
            const node = helper.nodeView({...l, type: 'league'}, nodeData.key || form.key);
            const children = l.tournaments ? l.tournaments.map(t => helper.nodeView({...t, type: 'tournament'}, nodeData.key || form.key)) : [];
            return {...node, children: children}
        })
        const fedpull = pull.length ? pull.map(t => t.label) : (subject.tournaments ? subject.tournaments.filter(t => !t.finished).map(t => t.name) : []);

        const unassigned = checkUnassigned()
        //console.log('dialogBody', type, form, 'tourns', tourns, 'unassigned', unassigned, 'suggest', suggest, leagues, 'find', leagues.find(l => l.label === form.label));
        const l = leagues.find(l => l.label === form.label);
        //console.log('dialogBody', type, form, 'find', l)
        switch(type.id) {
            case 'federation':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <InputText placeholder='Название' value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
                            </div>
                            {fedpull.length ? <Message severity="warn" text={`турниры федерации: ${fedpull.join(', ')}`} /> : null}
                        </div>
            case 'league':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    onChange={e => {
                                        //const mapd = e.value.map((t,i) => ({...t, key: `${form.key}-${i}`}));
                                        //console.log('AutoComplete', e.value);
                                        setForm(e.value)
                                        setPull(e.value.children)
                                    }}
                                    options={leagues}
                                    value={l}
                                    optionLabel="label"
                                    placeholder='Выберите лигу'
                                    //optionValue="_id"
                                />
                                {pull && pull.length ? <Message severity="warn" text={`турниры лиги: ${pull.map(t => t.label).join(', ')}`} /> : null}
                            </div>
                        </div>
                break
            case 'tournament':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <Dropdown
                                    options={tourns}
                                    onChange={e => setForm(e.value)}
                                    value={form}
                                    optionLabel="label"
                                    placeholder='Выберите турнир'
                                />
                            </div>
                        </div>
                break
            case 'group':
                return  <div className='create-dialog_body'>
                            <div className='control'>
                                <InputText placeholder='Название группы турниров' value={form.label || ''} onChange={e => setForm({...form, label: e.target.value})} />
                            </div>

                            {unassigned && unassigned.length ? [
                                <div style={{fontSize: '.8rem', marginBottom: '.4rem'}}>возможные турниры:</div>,
                                <Message text={unassigned.join(', ')} />
                            ] : null}

                            <div className="control p-inputgroup">
                                <Button label={'Турниры'} disabled className='group-name' />
                                <AutoComplete
                                    multiple
                                    value={pull}
                                    suggestions={suggest}
                                    completeMethod={searchTourn}
                                    field='label'
                                    onChange={e => {
                                        const mapd = e.value.map((t,i) => ({...t, key: `${form.key}-${i}`}));

                                        //console.log('AutoComplete', e.value, 'mapd', mapd);

                                        setForm({...form, children: mapd})
                                        setPull(mapd)
                                    }}
                                />
                            </div>
                        </div>
                break
        }
    }
    //console.log('editDialog', nodeData, form, type);

    return (
        form ? <div className={'nodeItem'} style={{paddingLeft: '20px'}}>
            <Dialog
                visible={form}
                className='create-dialog'
                modal
                header={'Настройки'}
                onHide={() => closeNode()}
                footer={form ? (
                    <div className='create-form_actions'>
                        <Button
                            className='p-button-sm p-button-danger'
                            icon={`pi pi-ban`}
                            disabled={!nodeData.type}
                            onClick={() => removeNode(form.key)}
                        >Удалить</Button>
                        <Button
                            className='p-button-sm'
                            icon={`pi pi-check`}
                            onClick={() => changeNodes(form.key, nodeData.type ? 'edit' : 'add', form)}
                        >Сохранить</Button>
                        <Button
                            className='p-button-sm p-button-secondary'
                            onClick={() => closeNode()}
                        >Отмена</Button>
                    </div>
                ) : null}
            ><div className='section'>
                <div style={{marginBottom: '1rem'}}>тип пункта меню:</div>
                {nodekey.length ? 'турнир' : types.map(t => (
                    <div key={t.id} className='field-radiobutton' onClick={() => {
                        setForm({...form, type: t.id, icon: helper.icons[t.id]})
                        setType(t)
                    }}>
                        <RadioButton name='type' inputId={t.id} value={t} checked={type.id === t.id} />
                        <label htmlFor={t.id}>{t.desc}</label>
                    </div>
                )) }
                {dialogBody()}
            </div></Dialog>

                {/*<Button
                    className='p-button-sm'
                    icon={`pi pi-${progress ? 'spinner pi-check' : 'check'}`}
                    //disabled={false}
                    onClick={() => saveNav()}
                    label='Сохранить'
                />*/}
        </div> : <div>ожидаем данные</div>
    );
}
export default NodeItem

import React, { useState, useEffect } from "react";
import './style.scss'
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { Scrollbars } from 'react-custom-scrollbars-2'
import Emblem from '../../../Emblem'
import InputMask from 'react-input-mask'

import service from '../../service'

const initForm = {
    _id: 'newItem',
    subjectId: '',
    subjectType: 'club',
    scope: 'readWrite',
    userId: 'newItem',
    user: {
        _id: 'newItem',
        name: '',
        phone: ''
    }
}
const rules = {
    name: /\S{2,}\s\S{2,}/,
    phone: /(\+)\d{11}/,
    simple: /\S{2,}/
}

const phoneFormatter = i => {
    return i ? i.replace(/[\(\)\-\s]/g, '') : ''
}

const ItemData = ({ profile, subject, data, toast, pushItem, removeItem }) => {

    const [form, setForm] = useState(initForm.user)
    const [processing, setProcessing] = useState(false)
    const [hasAccess, setHasAccess] = useState(false);
    const [valid, setValid] = useState(false);

    useEffect(() => {
        let access = false;
        if (data) {
            // const { name, age, canonical, squads, _id } = data;
            // if (name) {
            //     info.name = name
            // }
            // if (age) {
            //     info.age = age
            // }
            // if (squads) {
            //     info.squads = squads
            // }
            // info.canonical = !!canonical
            //console.log(data, data.user);
            if (data.user) {
                setForm({...data.user, name: `${data.user.name || ''} ${data.user.surname || ''}`.trim()})
            }
            if (data._id && data._id !== 'newItem') {
                access = true
            }
        } else {
            setForm(initForm.user)
        }
        setHasAccess(access)
    }, [data])

    useEffect(() => {
        //console.log('form', form);
        if (form) {
            if (validate(form, data)) {
                setValid(true)
            } else {
                setValid(false)
            }
        }
    },[form])

    const updForm = (info) => {
        pushItem({...data, user: {...form, ...info}})
        setForm({...form, ...info});
    }

    const removeAccess = async () => {
        // const resp = await service.removeAccess(data._id)
        // if(resp && resp.success) {
        //     //setForm({...form, scope: null});
        //     removeItem(data._id);
        // }
        const resp = await service.removeData('scopes', data._id)
        if(resp && resp.success) {
            //setForm({...form, scope: null});
            removeItem(data._id);
        }
    }
    const addAccess = async (user) => {
        const scop = {
            scope: 'readWrite',
            subjectType:'club',
            subjectId: subject._id,
            userId: user._id
        };
        const scope = await service.saveData('scopes', scop );
        if (scope && scope._id) {
            const res = {...scop, ...scope, user: {...user} }
            //setForm({...form, scope: {...scop, ...scope }});
            //pushItem(res);
            return res
        }
    }

    const getUser = async (phone, name) => {
        const user = await service.userByPhone(phoneFormatter(phone));
        if (user) {
            return user
        } else {
            const res = await service.saveData({
                name: form.name,
                phone: phoneFormatter(form.phone)
                }, 'users');
            return res
        }
    }

    const validate = (form, data) => {
        if (data._id && data._id !=='newItem' && data.user) {
            const phone = data.phone ? data.phone : (data.user && data.user.phone) ? data.user.phone : '';

            if ( (form.name && data.user.name !== form.name) ||
                (form.phone && /(\+)\d{11}/.test(phoneFormatter(form.phone)) && phoneFormatter(form.phone) !== phoneFormatter(phone))
            ) {
                //console.log('validate true', form, data);
                return true
            } else {
                //console.log('validate false', form, data);
                return false
            }

        } else {
            if (form.name && form.phone && /(\+)\d{11}/.test(phoneFormatter(form.phone))) {
                return true
            } else {
                return false
            }
        }
    }

    const onSave = async () => {
        if (form._id && form.name && form.phone) {
            if (form._id === 'newItem' ) {
                const {_id, ...info} = form;
                const userData = await service.getUser(phoneFormatter(form.phone), form.name, toast)
                //console.log('userData',userData);
                if (userData && userData._id) {
                    setForm({...form, ...userData});
                    const scope = await addAccess(userData)
                    //console.log('save scope', scope);
                    if (scope && scope._id) {
                        //setForm({...form, ...doc})
                        //updForm(doc)
                        pushItem(scope)
                    }
                }
            } else {
                const patch = {}
                if ( form.name && form.name !== data.name) {
                    //console.log('toast', toast);
                    patch.name = form.name
                }
                if ( form.phone && phoneFormatter(form.phone) !== phoneFormatter(data.phone)) {
                    //console.log('toast', toast);
                    patch.phone = phoneFormatter(form.phone)
                }
                if ( patch.phone || patch.name) {
                    //console.log('toast', toast);
                    await service.simpleUpdate(form._id, patch, 'users', toast);
                    updForm(patch)
                }
            }
        }
    }

    const pinReset = async () => {
        setProcessing(true)
        await service.simpleUpdate(form._id, {token: null},'users', toast);
        updForm({token: null})
        setProcessing(false)
    }
    return (
        <div className='item-data'>
            <Tag className='group-title'>Наcтройки представителя</Tag>

            <div className='item-info'>
                <div style={{marginBottom: 12}}>
                    <label>Имя, Фамилия</label>
                    <InputText
                        value={form.name || ''}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        autoFocus
                        autoComplete='off'
                        required
                        className={!form.name ? "p-invalid block" : 'block'}
                        // onBlur={async e => {
                        //     if (form.name !== `${data.name || ''} ${data.surname || ''}`.trim()) {
                        //         await service.simpleUpdate(data._id, {name: form.name},'representatives', toast)
                        //     }
                        //
                        //     updateItem({name: form.name})
                        // }}
                    />
                </div>

                {/*<InputText
                    value={form.phone || ''}
                    onChange={(e) => setForm({...form, name: e.target.value.trim()})}
                    // onBlur={async e => {
                    //     if (form.phone !== `${data.phone || ''} ${data.surname || ''}`.trim()) {
                    //         await service.simpleUpdate(data._id, {name: form.name},'representatives', toast)
                    //     }
                    //
                    //     updateItem({name: form.name})
                    // }}
                />*/}

                <div style={{marginBottom: 12}}>
                    <label>Номер телефона</label>

                    <InputMask
                        autoComplete="off"
                        onChange={e => setForm({...form, phone: e.target.value})}
                        disabled={processing}
                        value={form.phone || ''}
                        mask='+7 (999) 999-99-99'
                    >
                    {(inputProps) => <InputText
                        {...inputProps}
                        disabled={processing}
                        name='phone'
                        autoComplete='off'
                        required
                        className={!rules.phone.test(phoneFormatter(form.phone)) ? "p-invalid block" : 'block'}
                        placeholder='+7 (___) ___-__-__'/>
                    }
                    </InputMask>
                </div>

                <Button
                    label="Сохранить"
                    icon="pi pi-save"
                    className={`button button-save`}
                    loading={processing}
                    disabled={!valid}
                    onClick={onSave}
                />
                {form.token ? <Button
                    label="Сбросить PIN доступа "
                    icon="pi pi-unlock"
                    className={`button button-sub`}
                    loading={processing}
                    onClick={pinReset}
                    disabled={processing}
                /> : null}
                {hasAccess && (!profile || (profile.userId !== data.userId)) ? <Button
                    label={'Отозвать права для клуба'}
                    icon={"pi pi-refresh"}
                    className={`button button-sub p-button-warning`}
                    loading={!hasAccess || processing}
                    style={{marginBottom: 12}}
                    disabled={processing}
                    onClick={removeAccess}
                /> : (!hasAccess && form._id && form._id !== 'newItem' && data && data.userId) ? <Button
                    label={'Предоставить права для клуба'}
                    icon={"pi pi-refresh"}
                    className={`button button-sub`}
                    disabled={!hasAccess ||processing}
                    onClick={addAccess}
                    /> : null}
            </div>
        </div>
    );
};

export default ItemData

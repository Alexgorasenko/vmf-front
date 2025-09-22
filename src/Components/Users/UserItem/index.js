import React, { useState, useEffect, useRef} from 'react'
import { useHistory } from 'react-router-dom'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'

import { FileUpload } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Checkbox } from 'primereact/checkbox'
import InputMask from 'react-input-mask'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";

import SideNotes from '../../SideNotes'

//import PlayerPhoto from "../../../assets/img/soccer-player-1.svg";

import '../style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import service from '../service';
import CustomScrollbars from "react-custom-scrollbars-2";
//import { diff } from 'deep-object-diff'

const chooseOptions = {label: 'Загрузить фото', icon: 'pi pi-upload'};

const phoneFormatter = i => {
    return i ? i.replace(/[\(\)\-\s]/g, '') : ''
}
const rules = {
    name: /\S{2,}\s\S{2,}/,
    phone: /(\+)\d{11}/,
    simple: /\S{2,}/
}

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

const getDiff = (item, form) => {
    const dif = {};
    for (let key in form) {
        if (item[key] !== form[key]) {
            dif[key] = form[key]
        }
    }
    return dif
}

const UserItem = ({ item, patchData, removeUser, addNewStaff, closeItem, feds }) => {
    //console.log('ADMIN', item);
    // const [staff, setStaff] = useState(null)
    // const [role, setRole] = useState(null)
    const [form, setForm] = useState(item ? {...item} : null)
    const [progress, setProgress] = useState(false);
    const [scopes, setScopes] = useState([])
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (item) {
            setForm({...item})
            const superAdmin = item._id ? {
                name: "AMATEUM FLOW",
                scopeId: null,
                type: "superAdmin",
                _id: item._id
            } : null

            const mapd = feds.map(f => ({
                _id: f._id,
                scopeId: null,
                name: f.name,
                type: 'federation',
                tipsFlow: ["structure", "tournaments"]
            }))

            if (superAdmin) {
                mapd.unshift(superAdmin)
            }

            if (item.token || item._id) {
                const query = item.token ? `token=${item.token}` : `uid=${item._id}`
                axios.get(`${ENDPOINT}v2/getScopes?${query}`, {
                    headers: {
                        Authorization: localStorage.getItem('_amateum_subject_tkn')
                    }
                }).then(resp => {
                    const allScopes =resp.data && resp.data.scopes ? [...resp.data.scopes] : [];
                    for (let sc of mapd) {
                        const existed = allScopes.find(s => s._id === sc._id)
                        if (!existed) {
                            allScopes.push(sc)
                        }
                    }
                    if (resp.data && resp.data.code) {
                        setPin(resp.data.code)
                    }
                    setScopes(allScopes)
                })
            } else {
                if (item._id) {
                    setScopes(mapd)
                } else {
                    setScopes([])
                }
            }
        }
    }, [item])
//console.log('scopes', scopes);
    const toast = useRef(null)

    const removeAccess = async (id) => {

        setProgress(true)

        const resp = await service.removeData('scopes', id, toast.current );
        setProgress(false)
        //console.log('resp', resp);
        if (resp && resp.success) {
            const filtred = scopes.filter(s => s._id && s.scopeId !== id)
            setScopes(filtred);
        }

    }

    const confirmRemoving = (pid, evt) => {
        confirmPopup({
            target: evt.currentTarget,
            message: 'Вы действительно хотите удалить пользователя?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: async () => {
                //console.log('REMOVE', id, 'form', form);
                // setForm({...selectedPlayer, globalDisqTill: null})
                // patchItem({...selectedPlayer, globalDisqTill: null})
                setProgress(true)
                await removeUser(pid)
                //reload(true)
            }
        });
    }

    const addAccess = async (scope) => {
        setProgress(true)

        const scop = {
            scope: 'readWrite',
            subjectType: scope.type,
            subjectId: scope._id,
            userId: item._id
        };

        const resp = await service.saveData(scop, 'scopes', toast.current);
        //console.log('scope', resp);
        //setItem({...form, scope: scope});
        setProgress(false)

        if (resp && resp._id) {
            const mapd = scopes.map(s => s._id && s._id === scope._id ? {...s, scopeId: resp._id} : s)
            setScopes(mapd);
        }
    }

    const validate = (form, data) => {
        if (data._id) {
            const phone = data.phone ? data.phone : (data.user && data.user.phone) ? data.user.phone : '';

            if ( (form.name && data.name !== form.name) ||
                (form.phone && /(\+)\d{11}/.test(phoneFormatter(form.phone)) && phoneFormatter(form.phone) !== phoneFormatter(phone)) ||
                (form.avatarUrl && form.avatarUrl !== data.avatarUrl)
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
        setProgress(true)

        const dif = getDiff(item, form)

        if (form._id) {
            dif._id = form._id;
        }

        // if (dif.avatarUrl) {
        //     const decoded = await convertBase64(dif.avatarUrl)
        //
        //     const data = await service.upload({decoded: decoded, target: 'employees', trim: true, toast: toast.current})
        //     // const data = {uploaded: 'https://amateum.fra1.digitaloceanspaces.com/storage/f243fa4e-fea0-4668-bd26-c3244149e42f.png'}
        //     if(data && data.uploaded) {
        //         dif.avatarUrl = data.uploaded
        //         form.avatarUrl = data.uploaded
        //     } else {
        //         //console.log('upload', data)
        //         //alert('Ошибка обработки')
        //         console.log('not uploaded photo dif', dif);
        //         // toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось загрузить фото данные'})
        //         return null
        //     }
        // }

        const res = await service.saveData(dif, 'users', toast.current);
        setProgress(false)

        if (res) {
            /*toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Сотрудник обновлен!', autoClose: 2500})*/
            if (res._id) {
                //setForm({...form, ...res.staff});
                patchData({...form, _id: res._id});
            } else {
                //setForm({...form});
                patchData({...form});
            }
            //setAddAccess(false);
        }

    }

    // const customUploaderHandler = async (event) => {
    //     setForm({...form, avatarUrl: null})
    //     event.options.clear()
    // }

    // const customUploader = (event) => {
    //     //console.log('event.files[0]', event.files[0]);
    //     setForm({ ...form, avatarUrl: event.files[0]})
    // }

    const resetPin = async () => {
        await service.resetPin(item._id, toast.current)
        setPin(null);
        setForm({...form, token: null})
        patchData({...form, token: null});

    }

    return  !form ? (
        <div className='spinner'>
            <ProgressSpinner style={{width: 64, height: 64}} />
        </div>
    ) : (
        <div className='side-notes-user'>
            <Toast ref={toast} position='bottom-right' />
            <ConfirmPopup />
            <div className={'userItem'}>

                {/*<img src={form.avatarUrl ? form.avatarUrl.objectURL ? form.avatarUrl.objectURL : form.avatarUrl : PlayerPhoto} className={'photo'}/>
                <div className={'button-group'}>

                        <FileUpload
                            mode='basic'
                            name="demo[]"
                            url="https://primefaces.org/primereact/showcase/upload.php"
                            accept=".jpg,.png"
                            maxFileSize={3e+6}
                            //chooseLabel="Загрузить фото"
                            chooseOptions={chooseOptions}
                            customUpload
                            onSelect={customUploader}
                            uploadHandler={customUploaderHandler}
                        />
                        {form.avatarUrl ? <Tag
                            className="fileupload-cancel"
                            icon={'pi pi-times-circle'}
                            severity="info"
                            value={'Удалить фото'}
                            //onClick={deleteUpload}
                        /> : null}

                </div>*/}
                <CustomScrollbars autoHeight autoHide autoHeightMin='52vh' autoHeightMax='80vh'>
                    {pin ? <Tag className='userPin' severity='info'>{pin}</Tag> : null}

                    <div className={'fio'}>
                        <div className={'icon'}>
                            ФИО
                        </div>
                        <InputText
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            style={{border: "none", background: 'none', width: '265px', paddingLeft: '0px'}}
                        />
                    </div>

                    <div className={'fio'}>
                        <div className={'icon'}>
                            ТЕЛ
                        </div>

                        <InputMask
                            autoComplete="off"
                            onChange={(e) => setForm({...form, phone: e.target.value})}
                            //disabled={processing}
                            value={form.phone || ''}
                            mask='+7 (999) 999-99-99'
                        >
                            {(inputProps) => <InputText
                                {...inputProps}
                                //disabled={processing}
                                name='phone'
                                autoComplete='off'
                                required
                                className={!rules.phone.test(phoneFormatter(form.phone)) ? "p-invalid block" : 'block'}
                                style={{border: "none", background: 'none', width: '265px', paddingLeft: '0px'}}
                                placeholder='+7 (___) ___-__-__'/>
                            }
                        </InputMask>
                    </div>

                    <div className='item-actions'>
                        <Button
                            icon={'pi pi-save'}
                            label={form._id ? "Обновить" : "Сохранить"}
                            className="p-button-outlined p-button-sm"
                            onClick={onSave}
                            severity="success"
                            disabled={!validate(form, item) || progress}
                        />

                        {/*form.scope ? <Button
                            icon={'pi pi-ban'}
                            label="Отозвать доступ"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={() => removeAccess()}
                            disabled={progress}
                        /> : (!form.scope  && form._id && form.userId) ? <Button
                            icon={'pi pi-bolt'}
                            label="Предоставить доступ"
                            className="p-button-outlined p-button-info p-button-sm"
                            onClick={() => addAccess()}
                            disabled={progress}
                        /> : null*/}

                        {form._id && form.token && pin ? <Button
                            icon={'pi pi-eye-slash'}
                            label="Сбросить пин-код"
                            className="p-button-outlined p-button-sm"
                            severity="info"
                            onClick={resetPin}
                            disabled={progress}
                        /> : null}
                        <Button
                            icon={'pi pi-times'}
                            label="Закрыть"
                            className="p-button-outlined p-button-sm"
                            severity="warning"
                            onClick={closeItem}
                            disabled={progress}
                        />
                        {form._id ? <Button
                            icon={'pi pi-trash'}
                            label="Удалить"
                            className="p-button-outlined p-button-sm"
                            severity="warning"
                            onClick={(evt) => {
                                setProgress(true);
                                confirmRemoving(form._id, evt)
                            }}
                            disabled={progress}
                        /> : null}
                        {form._id ? <Button
                            icon={'pi pi-plus'}
                            label="Добавить нового"
                            className="p-button-outlined p-button-sm"
                            severity="primary"
                            onClick={addNewStaff}
                            disabled={progress}
                        /> : null}
                    </div>

                    <div className='scopesData'>
                        {scopes.map((s, i) => (
                            <div key={s.scopeId || i} className='scope-item card'>
                                {s.scopeId ? (
                                    <Tag className='unauthorized' severity='warning' onClick={() => removeAccess(s.scopeId)}>отозвать</Tag>
                                ) : <Tag className='success' severity='success' onClick={() => addAccess(s)}>предоставить</Tag>}
                                <div>{s.type}: {s.name} </div>
                                {/*<Tag className='unauthorized' severity='warning' onClick={() => removeAccess(s._id)}>отозвать</Tag>*/}
                            </div>
                        ))}
                    </div>
                </CustomScrollbars>
            </div>
        </div>
    )
}

export default UserItem

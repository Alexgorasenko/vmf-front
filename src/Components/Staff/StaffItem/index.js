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

import SideNotes from '../../SideNotes'

import PlayerPhoto from "../../../assets/img/soccer-player-1.svg";

import '../style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../env'
import service from '../service';
import CustomScrollbars from "react-custom-scrollbars-2";
//import { diff } from 'deep-object-diff'

const rules = {
    name: /\S{2,}\s\S{2,}/,
    phone: /(\+)\d{11}/,
    simple: /\S{2,}/
}

const chooseOptions = {label: 'Загрузить фото', icon: 'pi pi-upload'};

const eqvArrs = (arr1, arr2) => {
    if (arr1 && arr2) {
        if (arr1.sort().join('') === arr2.sort().join('')) {
            return true
        } else {
            return false
        }
    } else {
        return true
    }
}

const phoneFormatter = i => {
    return i ? i.replace(/[\(\)\-\s]/g, '') : ''
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
        if (key === 'roles') {
            if (!eqvArrs(item[key], form[key])) {
                dif[key] = [...form[key]]
            }
        } else {
            if (item[key] !== form[key]) {
                dif[key] = form[key]
            }
        }
    }
    return dif
}

const StaffItem = ({ item, roles, patchData, addNewStaff, closeItem }) => {

    // const [staff, setStaff] = useState(null)
    // const [role, setRole] = useState(null)
    const [form, setForm] = useState(item ? {...item} : null)
    const [progress, setProgress] = useState(false);

    useEffect(() => {
        setForm({...item})
    }, [item])

    const toast = useRef(null)

    const archive = async () => {
        const resp = await service.archive(item._id, toast.current)
        if (resp && resp.success) {
            patchData({...item, archived: true});
            closeItem()
        }
    }

    const removeAccess = async () => {

        setProgress(true)

        const resp = await service.removeData('scopes', item.scope._id, toast.current );
        setProgress(false)
console.log('resp', resp);
        if (resp && resp.success) {
            patchData({...item, scope: null});
        }

    }

    const addAccess = async () => {
        setProgress(true)

        const scop = {
            scope: 'readWrite',
            subjectType: 'employee',
            subjectId: item._id,
            userId: item.userId
        };
        const scope = await service.saveData(scop, 'scopes', toast.current);
        console.log('scope', scope);
        //setItem({...form, scope: scope});
        setProgress(false)

        patchData({...item, scope: scope});
    }

    const validate = (form, data) => {
        if (data._id) {
            const phone = data.phone ? data.phone : (data.user && data.user.phone) ? data.user.phone : '';

            if ( (form.name && data.name !== form.name) ||
                (!eqvArrs(form.roles, data.roles)) ||
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

        if (dif.avatarUrl) {
            const decoded = await convertBase64(dif.avatarUrl)

            const data = await service.upload({decoded: decoded, target: 'employees', trim: true, toast: toast.current})
            // const data = {uploaded: 'https://amateum.fra1.digitaloceanspaces.com/storage/f243fa4e-fea0-4668-bd26-c3244149e42f.png'}
            if(data && data.uploaded) {
                dif.avatarUrl = data.uploaded
                form.avatarUrl = data.uploaded
            } else {
                //console.log('upload', data)
                //alert('Ошибка обработки')
                console.log('not uploaded photo dif', dif);
                // toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось загрузить фото данные'})
                return null
            }
        }
        console.log('dif', dif);

        const res = await service.saveData(dif, 'employees', toast.current);
        setProgress(false)

        if (res && res.success) {
            /*toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => ' Сотрудник обновлен!', autoClose: 2500})*/
            if (res.staff) {
                //setForm({...form, ...res.staff});
                patchData({...form,...res.staff});
            } else {
                //setForm({...form});
                patchData({...form});
            }
            //setAddAccess(false);
        }

    }

    const customUploaderHandler = async (event) => {
        setForm({...form, avatarUrl: null})
        event.options.clear()
    }

    const deleteUpload = async (event) => {
        setForm({...form, avatarUrl: null})
        patchData({...form, avatarUrl: null})
        const dif = getDiff(item, form)
        if (form._id) {
            dif._id = form._id;
        }
        dif.avatarUrl = null
        await service.saveData(dif, 'employees', toast.current)
        event.options.clear()
    }

    const customUploader = (event) => {
        //console.log('event.files[0]', event.files[0]);
        setForm({ ...form, avatarUrl: event.files[0]})
    }

    const resetPin = async () => {
        await service.resetPin(item.userId, toast.current)
    }

    return  !form ? (
        <div className='spinner'>
            <ProgressSpinner style={{width: 64, height: 64}} />
        </div>
    ) : (
        <div className='side-notes-player'>
            <Toast ref={toast} position='bottom-right' />
            <div className={'rectangle-2'}>
            <img src={form.avatarUrl ? form.avatarUrl.objectURL ? form.avatarUrl.objectURL : form.avatarUrl : PlayerPhoto} className={'photo'}/>
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
                            onClick={deleteUpload}
                        /> : null}

                    </div>
                <CustomScrollbars autoHeight autoHide autoHeightMin='52vh'>
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

                    <div className='roles'>
                        {roles.filter(r => r.value).map((r, i) => (
                            <div key={i}>
                                <Checkbox
                                    inputId={`role_${r.value}`}
                                    checked={form.roles ? form.roles.includes(r.value) : false}
                                    onChange={() => setForm({
                                        ...form,
                                        roles: form.roles ? form.roles.includes(r.value) ? form.roles.filter(_r => _r !== r.value) : form.roles.concat([r.value]) : [r.value]
                                    })}
                                />
                                <label className='p-checkbox-label' htmlFor={`role_${r.value}`}>{r.label}</label>
                            </div>
                        ))}
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
                            className="p-button-outlined p-button-success p-button-sm"
                            onClick={onSave}
                            disabled={!validate(form, item) || progress}
                        />

                        {form.scope ? <Button
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
                        /> : null}
                        <Button
                            icon={'pi pi-eye-slash'}
                            label="Отправить в архив"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={() => archive()}
                            disabled={progress}
                        />
                        <Button
                            icon={'pi pi-eye-slash'}
                            label="Сбросить пин-код"
                            className="p-button-outlined p-button-secondary p-button-sm"
                            onClick={() => resetPin()}
                            disabled={progress}
                        />
                        <Button
                            icon={'pi pi-times'}
                            label="Закрыть"
                            className="p-button-outlined p-button-warning p-button-sm"
                            onClick={closeItem}
                            disabled={progress}
                        />
                        {form._id ? <Button
                            icon={'pi pi-plus'}
                            label="Добавить нового"
                            className="p-button-outlined p-button-info p-button-sm"
                            onClick={addNewStaff}
                            disabled={progress}
                        /> : null}
                    </div>
                </CustomScrollbars>
            </div>
        </div>
    )
}

export default StaffItem

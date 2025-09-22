import React, {useState, useEffect, useRef} from 'react'

import './style.scss'
//import IconBadge from '../../../assets/img/badge.svg'
import {InputSwitch} from "primereact/inputswitch";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import GeoSelect from "../GeoSelect";
import { ColorPicker } from 'primereact/colorpicker';
import {Button} from "primereact/button";
import { Toast } from 'primereact/toast'
import { Tag } from 'primereact/tag'
import { Calendar } from 'primereact/calendar'
import {ConfirmPopup, confirmPopup} from "primereact/confirmpopup";

import service from '../service'

//const colors = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#272727", "#f9f9f9"]
import moment from 'moment'

const defForm = {
    name: '',
    countryId: null,
    territoryId: null,
    settlementId: null,
    created: '',
    emblem: '',
    colors: null,
    socials: null
}

const Settings = ({ subject, maintoast, updateClub, settlements, reload }) => {
    const settl = subject.settlementId && settlements ? settlements.find(l => l._id.toString() === subject.settlementId.toString()) : null
    const [form, setForm] = useState(defForm);
/*
    const [name, setName] = useState(subject.name)
    const [settlement, setSettlement] = useState(settl);
    const [created, setCreated] = useState(subject.created);
    const [vklink, setVklink] = useState('');

    const [emblem, setEmblem] = useState(subject.emblem);
    const [primaryColor, setPrimaryColor] = useState(subject && subject.colors ? subject.colors.primaryColor : null);
    const [secondaryColor, setSecondaryColor] = useState(subject && subject.colors ? subject.colors.secondaryColor : null);
*/
    const [vklink, setVklink] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        //console.log(subject);
        if (subject) {
            const subjForm = {...subject};
            const { name, emblem, created, socials, origin,countryId, territoryId, colors, settlementId } = subject;

            //setName(name);

            // const set = settlementId && settlements ? settlements.find(l => l._id.toString() === settlementId.toString()) : null
            // setSettlement(set);
            //setCreated(created);
            const originEmb = emblem || (origin && origin.emblem ? origin.emblem : require('../pennant.png'))
            //setEmblem(originEmb);
            subjForm.emblem = originEmb;

            if (socials && socials.length) {
                const vk = socials.find(item => item.social === 'vk');
                setVklink(vk ? vk.link : '')
            } else {
                setVklink('')
            }
            setForm(subjForm)
        } else {
            setForm(defForm)
            setVklink('')
        }
    }, [subject])
    // const saveSettings = async () => {
    //     setLoading(true)
    //     toastId.current = toast('Сохраняю...', {autoClose: false})
    //     const updated = await axios.post(`${ENGINE}store/entity`, {
    //         scopeType: 'clubs',
    //         target: 'self',
    //         scopeId: item._id,
    //         body: {
    //             ...upd,
    //             _id: item._id
    //         }
    //     })
    //     toast.update(toastId.current, {type: toast.TYPE.SUCCESS, render: () => '⚽️ Настройки сохранены!', autoClose: 2500})
    //     if(ctx.updScopeItem) { ctx.updScopeItem(item._id, updated.data) }
    //     setLoading(false)
    // }
    const updForm = (k, v) => {
        //console.log('updForm',k, v);
        //console.log('updForm form',form);
        const updated = typeof(k) === 'string' ? {...form, [k]: v} : {...form, ...k}
        //console.log('updForm updatedform',updated);
        setForm(updated)
        updateClub(typeof(k) === 'string' ? {[k]: v} : k)
    }
    // const maintoastcur = useRef(null)
    // const maintoast = maintoastcur.current;

    const handleInput = async e => {
        setLoading(true)
        const decoded = await service.convertBase64(e.target.files[0])
        const re = new RegExp(/.png$/)
        const asRaw = re.test(e.target.files[0].name)
        const data = await service.upload({decoded: decoded, target: 'clubs', asRaw: asRaw, trim: true, toast: maintoast})
        if(data && data.uploaded) {
            await service.simpleUpdate(subject._id, {emblem: data.uploaded},'clubs', maintoast)
            updForm('emblem', data.uploaded)
        } else {
            console.log('upload', data)
            //alert('Ошибка обработки')
        }
        setLoading(false)

    }

    const confirmRemoving = (id, evt) => {
        confirmPopup({
            target: evt.currentTarget,
            message: 'Вы действительно хотите удалить клуб?',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Да',
            rejectLabel: 'Нет',
            accept: async () => {
                //console.log('REMOVE', id, 'form', form);
                await service.removeData('clubs', id, maintoast)
                reload(true)
            }
        });
    };
    return (
        <div className='settings'>
            {/*<Toast ref={maintoastcur} position='top-right' />*/}
            <ConfirmPopup />

            <div className='fields-grid np'>
                <div className='fields-group'>
                    <Tag className='group-title'>Информация</Tag>
                    {form && form._id && form._id !== 'newClub' && form.isEmpty ? <Tag
                    className='removingBtn'
                    onClick={(evt) => confirmRemoving(form._id, evt)}
                    icon="pi pi-times"
                    severity="danger"
                    //value="Danger"
                    >Удалить клуб</Tag> : null}
                    <div style={{marginBottom: 12}}>
                        <label htmlFor="name">Название</label>
                        <InputText
                            id='name'
                            value={form.name || ''}
                            onChange={(e) => {
                                // updForm('name', e.target.value)
                                setForm({...form, name: e.target.value})
                            }}
                            autoComplete='off'
                            required
                            className={!form.name ? "p-invalid block" : 'block'}
                            onBlur={async e => {
                                if (form._id && form.name) {
                                    setLoading(true)
                                    if (form._id === 'newClub' ) {
                                        const {_id, emblem, ...club} = form;
                                        const doc = await service.saveData('clubs', club, maintoast);

                                        if (doc && doc._id) {
                                            //setForm({...form, ...doc})
                                            updateClub(doc, true)
                                        }
                                    } else {
                                        if (form.name !== subject.name) {
                                            //console.log('toast', maintoast);
                                            await service.simpleUpdate(form._id, {name: form.name},'clubs', maintoast);
                                            updateClub({name: form.name})
                                        }
                                    }
                                    setLoading(false)
                                }
                            }}
                            disabled={loading}
                        />
                    </div>

                    <div style={{marginBottom: 12}}>
                        <label htmlFor="geo">Гео</label>
                        <GeoSelect
                            id='geo'
                            country={form.countryId}
                            region={form.territoryId}
                            city={form.settlementId}
                            patch={async (patch) => {
                                await service.simpleUpdate(subject._id, patch, 'clubs', maintoast)
                                //updForm(patch);
                                updateClub(patch);
                            }}
                        />
                    </div>

                    <div style={{marginBottom: 12}}>
                        <label htmlFor="yearpicker">Год основания</label>
                        <Calendar
                            id="yearpicker"
                            value={moment(form.created, 'YYYY').toDate()}
                            onChange={async (e) => {
                                //setForm({...form, created: moment(e.value).format('YYYY')})
                                if (moment(e.value).format('YYYY') !== subject.created) {
                                    await service.simpleUpdate(subject._id, {created: moment(e.value).format('YYYY')}, 'clubs', maintoast)
                                }

                                updateClub({created: moment(e.value).format('YYYY')})
                            }}
                            view="year"
                            dateFormat="yy"
                            maxDate={moment().toDate()}
                            disabled={loading}
                        />
                    </div>

                    <div style={{marginBottom: 12}}>
                        <label htmlFor="vklink">Сообщество ВКонтакте</label>
                        <InputText
                            id='vklink'
                            value={vklink || ''}
                            inputId="integeronly"
                            onChange={(e) => setVklink(e.target.value)}
                            onBlur={async e => {
                                const { socials } = form;
                                const vk = {
                                    social: 'vk',
                                    link: vklink
                                }
                                if (socials && socials.length) {
                                    const indx = socials.findIndex(it => it.social === 'vk');
                                    if (indx === -1) {
                                        await service.simpleUpdate(subject._id, {socials: [...socials, vk]},'clubs', maintoast)
                                    } else {
                                        if (socials[indx].link !== vklink) {
                                            const mapd = socials.map(it => it.social === 'vk' ? vk : it )
                                            await service.simpleUpdate(subject._id, {socials: mapd},'clubs', maintoast)
                                            //updForm('socials', mapd);
                                            updateClub({socials: mapd});
                                        }
                                    }

                                } else {
                                    await service.simpleUpdate(subject._id, {socials: [vk]},'clubs', maintoast)
                                    updateClub({socials: [vk]})
                                    //updForm('socials', [vk])
                                }
                            }}
                            disabled={loading}
                            placeholder="Сообщество ВКонтакте"
                        />
                    </div>
                </div>

                <div className='fields-group'>
                    <Tag className='group-title'>Эмблема</Tag>

                    <div className='emb-loader'>
                        <div className='emb-content'>

                            <div className='emb-current'>
                                <img className={!form.emblem ? 'holder' : ''} src={form.emblem || require('../pennant.png')} />
                            </div>
                            <div>
                                <div className='emb-input'>
                                    <input type='file' onChange={handleInput} />
                                    <Button
                                        label="Выбрать эмблему"
                                        icon="pi pi-file"
                                        className={'button-sub p-button-sm'}
                                        loading={loading}
                                        // onClick={async () => {
                                        //     setLoading(true)
                                        // }}
                                    />
                                </div>
                                {form.emblem ? (
                                    <div>
                                        <Button
                                            icon='pi pi-times-circle'
                                            className={'button-del p-button-sm'}
                                            label='Очистить эмблему'
                                            onClick={async () => {
                                                setForm({...form, emblem: null})
                                                await service.simpleUpdate(subject._id, {emblem: null},'clubs', maintoast)
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='fields-group'>
                    <Tag className='group-title'>Клубные цвета</Tag>

                    <div className='color-rows'>
                        <div className='color-row'>
                            <div className='color-label' style={{marginBottom: 10}}>Основной цвет</div>
                            <ColorPicker
                                value={form.colors ? form.colors.primary : null}
                                onChange={async (e) => {
                                    //setPrimaryColor(e.value);

                                    updForm('colors', form.colors ? {...form.colors, primary: e.value} : {primary: e.value})
                                }}
                                onHide={async () => {
                                    // await service.simpleUpdate(form._id, {colors: form.colors ? {...form.colors, primary: form.colors.primaryColor} : {primary: form.colors.primaryColor}},'clubs', maintoast);
                                    //console.log('primary', form._id, {colors: form.colors}, 'clubs');

                                    await service.simpleUpdate(form._id, {colors: form.colors}, 'clubs', maintoast);

                                    updateClub({colors: form.colors})
                                    // updateClub({colors: form.colors ? {...form.colors, primary: form.colors.primaryColor} : {primary: form.colors.primaryColor}})
                                }}
                                disabled={loading}
                            />
                        </div>
                        <div className='color-row'>
                            <ColorPicker
                                value={form.colors ? form.colors.secondary : null}
                                onChange={async (e) => {
                                    updForm('colors', form.colors ? {...form.colors, secondary: e.value} : {secondary: e.value})
                                    //setSecondaryColor(e.value);
                                    // await service.simpleUpdate(subject._id, {colors: subject.colors ? {...subject.colors, secondary: e.value} : {secondary: e.value}},'clubs', maintoast)
                                    // updateClub({colors: subject.colors ? {...subject.colors, secondary: e.value} : {secondary: e.value}})
                                    //setForm({...form, colors: form.colors ? {...form.colors, secondary: e.value} : {secondary: e.value}});
                                }}
                                onHide={async () => {
                                    //console.log('secondary',form._id, {colors: form.colors}, 'clubs');

                                    await service.simpleUpdate(form._id, {colors: form.colors}, 'clubs', maintoast);
                                    updateClub({colors: form.colors})
                                    // updateClub({colors: form.colors ? {...form.colors, secondary: form.colors.secondaryColor} : {secondary: form.colors.secondaryColor}})
                                }}
                                disabled={loading}
                            />
                            <div className='color-label'>Второстепенный цвет</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings

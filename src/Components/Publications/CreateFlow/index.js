import React, { useState } from 'react'

import { Button } from 'primereact/button'

import ImportVk from './ImportVk'
import Form from '../Form'

import './style.scss'

const modes = {
    clone: ImportVk,
    custom: Form
}

const CreateForm = ({ profile, onSaved }) => {
    const [mode, setMode] = useState(null)
    const [option, setOption] = useState('clone')

    const Specified = mode ? modes[mode] || null : null

    const initial = mode === 'custom' ? {
        title: '',
        published: true,
        attachments: []
    } : null

    return  <div className='create-flow'>
                {!mode ? (
                    <div className='select-mode'>
                        <div className='title'>Новая публикация</div>
                        <div className='select-mode_options'>
                            <div className={'select-mode_option'+(option === 'custom' ? ' selected' : '')} onClick={() => setOption('custom')}>
                                <span className='pi pi-desktop'></span>
                                <div>создать самостоятельно</div>
                            </div>
                            <div className={'select-mode_option'+(option === 'clone' ? ' selected' : '')} onClick={() => setOption('clone')}>
                                <span className='pi pi-cloud-download'></span>
                                <div>импортировать из ВК</div>
                            </div>
                        </div>

                        <Button label='Далее' onClick={() => setMode(option)} />
                    </div>
                ) : <Specified profile={profile} data={initial} onSaved={onSaved} />}
            </div>
}

export default CreateForm

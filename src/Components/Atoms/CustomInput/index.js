import React from 'react'

import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'

import './style.scss'

const CustomInput = ({ icon, type, value, onChange, options, placeholder, optionLabel }) => {
    let elem
    switch(type) {
        case 'text':
            elem = (
                <InputText
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            )
            break
        case 'dropdown':
            elem = (
                <Dropdown
                    options={options || []}
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.value)}
                    optionLabel={optionLabel}
                />
            )
            break
    }

    return  <div className='custom-input'>
                <div className='icon'>
                    <i className={icon}></i>
                </div>
                {elem}
            </div>
}

export default CustomInput

const models = {
    headquarter: [
        {type: 'addon', icon: 'user'},
        {key: 'surname', type: 'text', placeholder: 'фамилия'},
        {key: 'name', type: 'text', placeholder: 'имя'},
        {key: 'middlename', type: 'text', placeholder: 'отчество'},
        {type: 'addon', icon: 'calendar'},
        {key: 'birthday', type: 'mask', mask: '99.99.9999', placeholder: 'дд.мм.гггг'}
    ]
}

export default models

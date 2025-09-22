const defaults = {
    yc: {player: null, minute: null, number: null},
    rc: {player: null, minute: null, number: null},
    sub: {playerIn: null, playerOut: null, minute: null}
}

const types = [
    {value: 'sub', label: 'Замена', className: 'secondary'},
    {value: 'yc', label: 'Предупреждение', className: 'warning'},
    {value: 'rc', label: 'Удаление', className: 'danger'}
]

const secondary = [
    {path: 'yc', label: 'ЖК', desc: 'Предупреждение', icon: require('./icons/warning.svg').default},
    {path: 'rc', label: 'КК за 2 ЖК', desc: 'Удаление за 2 предупреждения', icon: require('./icons/secondyellow.png')},
    {path: 'rc', label: 'Прямая КК', desc: 'Прямое удаление', attrs: {direct: true}, icon: require('./icons/delete.svg').default},
    {path: 'sub', label: 'Замена', desc: 'Замена', icon: require('./icons/replacenemt.svg').default}
]

const selectorLabels = {
    player: 'игрок',
    headquarter: 'оф.лицо',
    assistant: 'ассистент',
    playerIn: 'вышел',
    playerOut: 'ушёл'
}

export { defaults, types, secondary, selectorLabels }

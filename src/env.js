//export const ENDPOINT = 'https://proxy.amateum.com/'
const points = {
    test: 'https://dev-engine.amateum.com/',
    prod: 'https://engine.amateum.com/'
}

export const ENDPOINT = process.env.NODE_ENV === 'production' ? points[process.env.INSTANCE] : 'http://localhost:3123/';

export const TIP_FLOWS = {
    federation: ['structure'],
    club: []
}

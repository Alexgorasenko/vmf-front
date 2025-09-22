import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { ENDPOINT } from '../../../env'

import { Dropdown } from 'primereact/dropdown';
import './style.scss'

const GeoSelect = ({ country, region, city, patch }) => {
    const [refs, setRefs] = useState({})
    const [defaultCities, setDefaultCities] = useState([])
    // const [curCountry, setCountry] = useState(country || null)
    const [curRegion, setRegion] = useState(region || null)
    const [curCityId, setCityId] = useState(city || null)
    const [curCity, setCurCity] = useState({})

    useEffect(() => {
        getGeoV2(country, region)
    }, [country, region])


    useEffect(() => {
        setCityId(city);
    }, [city])

    useEffect(() => {
        if (refs?.cities){
            setCurCity(refs.cities.find(c => c._id === curCityId))
        }
    }, [curCityId, refs])

    useEffect(() => {
        if(curRegion && curRegion !== region) {
            const reg = refs.regions && refs.regions.length ? refs.regions.find(r => r._id.toString() === curRegion.toString()) : null;
            if (reg && reg.cities) {
                setRefs({...refs, cities: reg.cities})
                if (reg.cities.length === 1) {
                    setCityId(reg.cities[0]._id)
                    patch({territoryId: curRegion, settlementId: reg.cities[0]._id})
                }
            } else {
                axios.get(`${ENDPOINT}v2/geo?regionId=${curRegion || region}`, {
                    headers: {
                        authorization: localStorage.getItem('_amateum_subject_tkn'),
                        SignedBy: localStorage.getItem('_amateum_tkn')
                    }
                }).then(resp => {
                    setRefs({...refs, cities: resp.data[0].cities})
                    setDefaultCities(resp.data[0].cities)
                    /*if (resp.data.length === 0) {
                        setCity(resp.data[0]._id)
                        patch({territoryId: curRegion, settlementId: resp.data[0]._id})
                    }*/
                })
            }

        }
    }, [curRegion])

    const getGeoV2 = async (country, region) => {
        const updRefs = {}
        if(!refs.regions) {
            const res = await axios.get(`${ENDPOINT}v2/geo`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            })
            updRefs.regions = res.data || []
        }

        if (region) {
            setRegion(region)

            if (!refs.cities || curRegion !== region){
                const res = await axios.get(`${ENDPOINT}v2/geo?regionId=${region}`, {
                    headers: {
                        authorization: localStorage.getItem('_amateum_subject_tkn'),
                        SignedBy: localStorage.getItem('_amateum_tkn')
                    }
                })
                updRefs.cities = res.data[0].cities || []
                setDefaultCities(res.data[0].cities)
            }
        }

        setRefs({...refs, ...updRefs})
    }

    /*const getGeo = async (country, region) => {
        const updRefs = {}
        if(!refs.countries) {
            const res = await axios.post(`${ENDPOINT}v1/common/geo`, {})
                // .then(resp => {
                //     console.log('resp count', resp.data);
                //     //setRefs({...refs, countries: resp.data})
                //     updRefs.countries = resp.data
                //     //setCountry(resp.data[0]._id)
                // })
            updRefs.countries = res.data || [];
        }

        if ( ( country || updRefs.countries ) && (!refs.regions || (refs.regions && refs.regions[0] && country && refs.regions[0].countryId.toString() !== country.toString()))) {
            const res = await axios.post(`${ENDPOINT}v1/common/geo`, {
                countryId: country || updRefs.countries[0]._id
            })
            updRefs.regions = res.data || []
        }

        if (region) {
            setRegion(region)

            if ( !refs.cities ||
                (refs.cities && refs.cities[0] &&
                    refs.cities[0].territoryId &&
                    refs.cities[0].territoryId.toString() !== region.toString()
                )
            ) {

                const reg = refs.regions && refs.regions.length ? refs.regions.find(r => r._id.toString() === region.toString()) : null;
                if (reg && reg.cities) {
                    //setRefs({...refs, cities: reg.cities})
                    updRefs.cities= reg.cities
                } else {
                    const res = await axios.post(`${ENDPOINT}v1/common/geo`, {
                        regionId: region
                    })
                    updRefs.cities= res.data || []
                }
            }
        }
        if (city && refs.cities) {
            const c = refs.cities.find(c => c._id.toString() === city);
        }
        setRefs({...refs, ...updRefs})
    }*/

    const getCitiesByFilter = async (value) => {
        let newCities = defaultCities
        if (value.length > 2) {
            const _region = refs.regions.find(r => r._id === curRegion)
            const res = await axios.get(`${ENDPOINT}v2/searchApiData?q=${value}&sample=settlement&regionKladrId=${_region.kladr_id}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    SignedBy: localStorage.getItem('_amateum_tkn')
                }
            })
            const respCities = res.data.map(c => {
                c.name += c.fullName.includes('р-н') ? ', ' + c.fullName.replace(new RegExp(`.*?([а-яА-Я]+ р-н).*`), '$1') : ''
                return c
            })
            newCities = newCities.concat(respCities)
        }
        setRefs({...refs, cities: newCities})
    }

    const updateCities = async (value) => {
        await axios.put(`${ENDPOINT}v2/settlements`, {
            name: value.name,
            territoryId: curRegion,
            kladr_id: value.kladr_id,
            visible: true,
            geo_lat: value.geo_lat,
            geo_lon: value.geo_lon,
            postIndex: ''
        },{
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn'),
                SignedBy: localStorage.getItem('_amateum_tkn')
            }
        }).then(resp => {
            setCityId(resp.data._id)
            setCurCity(resp.data)
            const newCities = defaultCities
            newCities.push(resp.data)
            setRefs({...refs, cities: newCities})
            setDefaultCities(newCities)
            patch({territoryId: curRegion, settlementId: resp.data._id})
        })
    }

    return  <div className='geoSelect'>
                {/*<Dropdown
                    onChange={e => {patch('countryId', e.value)}}
                    value={country}
                    options={refs.countries}
                    placeholder='-- выберите страну'
                    optionLabel="name"
                    optionValue="_id"
                />*/}
                <Dropdown
                    onChange={e => setRegion(e.value)}
                    value={curRegion}
                    options={refs.regions}
                    placeholder='-- выберите регион'
                    optionLabel="name"
                    optionValue="_id"
                />

                <Dropdown
                    //onChange={e => {patch('settlement', e.value)}}
                    onChange={e => {
                        const newCity = refs.cities.find(c => c.kladr_id === e.value)
                        if (newCity._id){
                            setCityId(newCity._id);
                            patch({territoryId: curRegion, settlementId: newCity._id})
                        } else updateCities(newCity)
                    }}
                    onFilter={e => {
                        getCitiesByFilter(e.filter)
                    }}
                    value={curCity?.kladr_id || null}
                    filter
                    filterBy='name'
                    //value={city}
                    options={refs.cities}
                    optionLabel="name"

                    // updForm(k === 'settlement' ? {...form, [k]: v, settlementId: v._id} : {...form, [k]: v});
                    // updateClub(k === 'settlement' ? {[k]: v, settlementId: v._id} : {[k]: v});
                    // await service.simpleUpdate(subject._id, k === 'settlement' ? {settlementId: v._id} : {[k]: v},'clubs', maintoast)
                    optionValue={"kladr_id"}
                />
                {/*<FormSelect style={{marginTop: 8}} onChange={e => patch('territoryId', e.target.value)}>
                    <option value={null}>-- выберите регион</option>
                    {refs.regions ? refs.regions.map(r => (
                        <option selected={r._id === region} value={r._id}>{r.name}</option>
                    )) : null}
                </FormSelect>
                <FormSelect style={{marginTop: 8}} onChange={e => patch('settlementId', e.target.value)}>
                    <option value={null}>-- выберите город</option>
                    {refs.cities ? refs.cities.map(c => (
                        <option selected={c._id === city} value={c._id}>{c.name}</option>
                    )) : null}
                </FormSelect>*/}
            </div>
}

export default GeoSelect

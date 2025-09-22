import {InputText} from "primereact/inputtext";
import CustomScrollbars from "react-custom-scrollbars-2";
import PlayerCard from "../PlayerCard";
import SelectedItem from "../SelectedItem";
import Image1 from "../../../assets/img/image 11.svg";
import {Dialog} from "primereact/dialog";
import CandidatesFlow from "../CandidatesFlow";
import { PanelWrapper } from '../../Atoms'
import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {ENDPOINT} from "../../../env";
import service from "../service";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        },
        [value]
    );

    return debouncedValue;
}

const FederationView = ({ layout, toast }) => {
    //const toast = useRef(null)
    const [searchString, setSearchString] = useState('');

    const [loadCards, setLoadCards] = useState(false)

    const [loading, setLoading] = useState(false)

    //const [selected, setSelected] = useState(false)

    const [selectedPlayer, setSelectedPlayer] = useState(null)

    const [searchPlayers, setSearchPlayers] = useState([])
    const [openPlrCandidates, setOpenPlrCandidates] = useState(null);
    const debouncedSearchTerm = useDebounce(searchString, 700);

    const getDataBySearchString = (string) => {
        const regexp = /\D\D+/
        if (string.match(regexp) !== null){
            axios.get(`${ENDPOINT}v2/suggestPlayer?query=${encodeURIComponent(string)}`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(
                resp => {
                    setLoadCards(true)
                    setLoading(false)
                    setSearchPlayers(resp.data || [])
                }
            )
        }
    }

    useEffect(() => {
        setLoadCards(false)
    }, [searchString])

    useEffect(
        () => {
            if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
                setSelectedPlayer(null)
                setLoading(true)
                getDataBySearchString(debouncedSearchTerm)
            } else {
                setSelectedPlayer(null)
                setSearchPlayers([]);
            }
        },
        [debouncedSearchTerm]
    );
    const setReload = () => {
        setSelectedPlayer(null)
        setLoading(true)
        setSearchPlayers([]);
        getDataBySearchString(searchString)
    }

    const patchItem = (p) => {
        const mapd = searchPlayers.map(pl => pl._id && p._id.toString() === pl._id.toString() ? {...pl, ...p} : pl);
        setSelectedPlayer({...selectedPlayer, ...p})
        //console.log('patchItem', p, mapd);
        setSearchPlayers(mapd)
    }

    const clearGlobal = async (pid) => {
        const data = await service.clearGlobal(pid, toast)
        if (data.success) {
            if (selectedPlayer) {
                setSelectedPlayer({...selectedPlayer, globalDisqTill: null, disqualifications: []})
            }
            const mapd = searchPlayers.map(pl => pl._id && pid.toString() === pl._id.toString() ? {...pl, globalDisqTill: null, disqualifications: []} : pl);
            setSearchPlayers(mapd)
        }
    }


    const filtredSelected = (arr) => {
        setSearchPlayers(searchPlayers.filter(pl => pl._id && !arr.find(p => p._id.toString() === pl._id.toString()) && pl._id.toString() !== selectedPlayer._id.toString()))
        setSelectedPlayer(null)
    }

    return <div>

        <div className={'name-input'}>
            <div className={'text'}>Поиск по фамилии, имени или команде</div>
            <span className="p-input-icon-right">
                {loading ? <i className="pi pi-spin pi-spinner" /> : null}
                <InputText
                    className={'input'}
                    value={searchString}
                    placeholder='Александр Иванов'
                    onChange={(e) => setSearchString(e.target.value)}
                />
            </span>
        </div>
        <div className={'content'}>
              <div className={'search-result'}>
                  {searchPlayers.length > 0 && loadCards ?
                      <div className={'row'}>
                          <div className={'amount-found'}>
                               {formatText(searchPlayers.length)}
                          </div>
                          <CustomScrollbars autoHide width={'auto'} autoHeight autoHeightMin='71vh' className='list-bars' >
                              {searchPlayers.map(player => {
                                  return <PlayerCard
                                  key={player._id}
                                  selected={selectedPlayer && selectedPlayer._id && selectedPlayer._id.toString() === player._id.toString()}
                                  setSelectedPlayer={setSelectedPlayer}
                                  playerData={player}
                                  setOpenPlrCandidates={setOpenPlrCandidates}
                                  toast={toast}
                                  clearGlobal={clearGlobal}
                                  />
                              })}
                          </CustomScrollbars>
                      </div> : null}
              </div>
              {layout !== 'mobile' && searchPlayers.length > 0 && loadCards ? selectedPlayer
                  ?  <CustomScrollbars className='item-bar' autoHide autoHeight autoHeightMin='calc(100vh - 80px)'>
                      <SelectedItem
                          selected={selectedPlayer}
                          patchItem={patchItem}
                          toast={toast}
                           clearGlobal={clearGlobal}
                          setOpenPlrCandidates={setOpenPlrCandidates}
                      />
                  </CustomScrollbars>
                  : <div className={'side-notes'}>
                      <img src={Image1} className={'image1'}/>
                      <div className={'rectangle-4'}>
                          <ul role="list" className={'text'}>
                              <li>
                                  Кликните на карточку игрока для редактирования
                              </li>
                          </ul>
                      </div>
                  </div> : null
              }

              {layout === 'mobile' && selectedPlayer ? (
                  <PanelWrapper resetTrigger={() => setSelectedPlayer(null)} layout={layout} area='player'>
                      <SelectedItem
                          selected={selectedPlayer}
                          patchItem={patchItem}
                          toast={toast}
                          clearGlobal={clearGlobal}
                          setOpenPlrCandidates={setOpenPlrCandidates}
                      />
                  </PanelWrapper>
              ) : null}
          </div>
        {
            openPlrCandidates ? <Dialog visible={openPlrCandidates} header="Возможные «дубли» игрока:" onHide = {() => setOpenPlrCandidates(null)}>
                  <CandidatesFlow
                      selectedPlayer={selectedPlayer}
                      toast={toast}
                      onClose={() => setOpenPlrCandidates(null)}
                      filtredSelected={filtredSelected}
                      setReload={setReload}
                      patchItem={patchItem}
                  />
              </Dialog> : null
        }
    </div>
}
const formatText = count => {
    if (count > 20) {
        if (count % 10 === 1) {
            return `Нашелся ${count} игрок`
        } else if ([2, 3, 4].includes(count % 10)){
            return `Нашли ${count} игрока`
        } else {
            return `Нашли ${count} игроков`
        }

    } else {
        if (count === 1) {
            return `Нашелся ${count} игрок`
        } else if ([2, 3, 4].includes(count)){
            return `Нашли ${count} игрока`
        } else {
            return `Нашли ${count} игроков`
        }
    }
}
export default FederationView

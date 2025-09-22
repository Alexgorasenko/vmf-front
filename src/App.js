import React, { useState, useEffect } from 'react'
import { Desktop, Tablet, Mobile, Auth, Live, ClubLayout } from './Layouts'
import {BrowserRouter as Router, Route, Switch, useLocation} from "react-router-dom";

import { WorkspaceContext } from './ctx'
import { YMInitializer } from 'react-yandex-metrika'

import 'moment/locale/ru'
import PrimeReact from 'primereact/api'

import 'primereact/resources/themes/lara-light-indigo/theme.css'
import "primereact/resources/primereact.min.css"
import 'primeicons/primeicons.css'
import '@splidejs/splide/dist/css/themes/splide-default.min.css'

import './app.scss'

import Sideblock from './Components/Sideblock'
import Topbar from './Components/Topbar'
import MatchModal from './Components/MatchEditModal'
import EventsAndRequests from './Components/EventsAndRequests'
import Tournaments from './Components/Tournaments'
import Clubs from './Components/Clubs'
import Publications from './Components/Publications'
import Staff from './Components/Staff'
import Locations from './Components/Locations'
import Structure from './Components/Structure'
import TipContent from './Components/TipContent'
import TipTrigger from './Components/TipContent/Trigger'
import Appearance from './Components/Appearance'
import Renders from './Components/Renders'
import AppConfig from './Components/AppConfig'
import Federations from './Components/Federations'
import Users from './Components/Users'

import CustomScrollbars from 'react-custom-scrollbars-2'

import qs from 'qs'

import { Dialog } from 'primereact/dialog'

import { initHints } from './hints'
import PlayersAndCoaches from "./Components/PlayersAndCoaches";
import Schedule from "./Components/Schedule";
initHints()

PrimeReact.ripple = true

const App = ({ device }) => {
    return  <Router>
                <ModalSwitch/>
            </Router>
}

const token = localStorage.getItem('_amateum_tkn')

function ModalSwitch() {
    const [subject, setSubject] = useState(null)
    const [profile, setProfile] = useState(null)
    const [title, setTitle] = useState(null)
    const [workspace, setWorkspace] = useState({})

    const patchContext = (key, value) => {
        setWorkspace({...workspace, [key]: value})
    }

    let location = useLocation();
    let background = location.state && location.state.background;

    const [screenWidth, setScreenWidth] = useState(window.innerWidth)

    useEffect(() => {
        const onResize = () => {
            setScreenWidth(window.innerWidth)
        }
        window.addEventListener("resize", onResize)
        return () => {
            window.removeEventListener("resize", onResize)
        }
    }, [])

    useEffect(() => {
        setWorkspace({...workspace, profile: profile})
    }, [profile])

    useEffect(() => {
        if (subject && subject.token && localStorage.getItem('_amateum_subject_tkn') !== subject.token) {
            localStorage.setItem('_amateum_subject_tkn', subject.token)
        }

        setWorkspace({...workspace, subject: subject})
    }, [subject])

    const Layout = screenWidth > 980 ? Desktop : Mobile
    const layoutId = screenWidth > 980 ? 'desktop' : 'mobile'

    const searchString = qs.parse(window.location.search.replace('?',''))
    return (
        token ? <WorkspaceContext.Provider value={{workspace, setWorkspace, patchContext, layoutId, appSubject: subject}}>
                    <Layout
                        onlyLiveMode={subject && subject.onlyLiveMode}
                        sideblock={(
                            <Sideblock
                                theme='indigo'
                                subject={subject}
                                userTkn={token}
                                onSubjectChanged={setSubject}
                                onProfileChanged={setProfile}
                                onTitleChanged={t => setTitle(t)}
                            />
                        )}
                        top={(
                            <Topbar
                                layout={layoutId}
                                title={title}
                                profile={profile}
                                hasBackBtn={subject && subject.type === 'club'}
                            />
                        )}
                        subject={subject}
                        body={subject && subject.type === 'club' ? (
                            <Switch>
                                <Route path='/live/:id?/:eventId?'>
                                    <Live
                                        _subject={subject}
                                    />
                                </Route>
                                <Route path='/:area?/:item?'>
                                    <ClubLayout
                                        subject={subject}
                                    />
                                </Route>
                            </Switch>
                        ) : (
                            <Switch location={background || location}>
                                <Route path='/live/:id?/:eventId?'>
                                    <Live
                                        _subject={subject}
                                    />
                                </Route>
                                <Route exact path="/">
                                    <EventsAndRequests
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/publications/:id?">
                                    <Publications
                                        subject={subject}
                                        profile={profile}
                                    />
                                </Route>
                                <Route exact path="/schedule">
                                    <Schedule
                                        subject={subject}
                                    />
                                </Route>
                                <Route exact path="/tournaments">
                                    <Tournaments
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/appconfig">
                                    <AppConfig
                                        subject={subject}
                                    />
                                </Route>
                                <Route exact path="/tournaments/teamsquad/:teamsquadId">
                                    <Tournaments
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/players-and-coaches">
                                    <PlayersAndCoaches
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/manageclub">
                                    <Clubs
                                        manage={true}
                                        subject={subject}
                                        profile={profile}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/clubs">
                                    <Clubs
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/renders">
                                    <Renders
                                        subject={subject}
                                    />
                                </Route>
                                <Route exact path="/staff">
                                    <Staff
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/locations">
                                    <Locations
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/structure">
                                    <Structure
                                        subject={subject}
                                    />
                                </Route>
                                <Route exact path="/appearance">
                                    <Appearance
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/clubs/teamsquad/:teamsquadId">
                                    <Clubs
                                        subject={subject}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/manageclub/teamsquad/:teamsquadId">
                                    <Clubs
                                        subject={subject}
                                        manage={true}
                                        layout={layoutId}
                                    />
                                </Route>
                                <Route exact path="/federations">
                                    <Federations
                                        subject={subject}
                                    />
                                </Route>
                                <Route exact path="/users">
                                    <Users
                                        subject={subject}
                                    />
                                </Route>
                            </Switch>
                        )}
                    />

                {/* Show the modal when a background page is set */}
                <Dialog className='match-dialog' visible={searchString && searchString.editmatch && searchString.editmatch.length === 24} showHeader={false}>
                    {searchString && searchString.editmatch && searchString.editmatch.length === 24 ? (
                        <MatchModal matchId={searchString.editmatch} />
                    ) : null}
                </Dialog>

                <Dialog
                    className='tip-dialog'
                    visible={workspace.tip}
                    onHide={() => setWorkspace({...workspace, tip: null})}
                >
                    <TipContent tip={workspace.tip} />
                </Dialog>

                <TipTrigger layout={layoutId} />

                <YMInitializer
                    accounts={[92610453]}
                    version='2'
                    options={{
                        clickmap: true,
                        trackLinks: true,
                        accurateTrackBounce: true,
                        webvisor: true,
                        trackHash: true,
                    }}
                />
       </WorkspaceContext.Provider> : <Auth />
    );
}

export default App

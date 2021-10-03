import React from 'react'
import Header from './components/header';
import Navbar from './components/navbar';
import ProjectList from './components/projectlist';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    Link,
    useRouteMatch,
    useParams
} from "react-router-dom";


export default function Canvas(props = {}) {
    return (
        <Router>
            <div>
                <Header></Header>
                <Navbar></Navbar>

                <Switch>
                    <Route path="/projects/project1">
                        <p>Project 1</p> 
                    </Route>

                    <Route path="/projects/project2">
                        <p>Project 2</p> 
                    </Route>

                    <Route path="/projects/project3">
                        <p>Project 3</p> 
                    </Route>

                    <Route path="/projects">
                        <ProjectList></ProjectList>
                    </Route>

                    <Route path="/blog">
                        <p>Blog</p>
                    </Route>

                    <Route path='/resume'>
                        <p>Resume</p>
                    </Route>


                    <Redirect from="/" to="/projects"></Redirect>

                </Switch>
            </div>
        </Router>
    );
}
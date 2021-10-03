import React from 'react';
import lodash from 'lodash';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useRouteMatch,
} from "react-router-dom";

import Header from './components/header';
import Navbar from './components/navbar';

// Project data.
import PROJECTS from './content/projects';
import ProjectList from './components/projectlist'
import ProjectPage from './components/projectpage';

export default function App() {
  return (
    <div>
      <Router>
        <div>
          <Header></Header>
          <Navbar></Navbar>

          <Switch>
            <Route path="/projects/:id" component={function RouterWrapper() {
              const match = useRouteMatch();
              const id = match.params.id;

              const project = lodash.find(PROJECTS, (project) => {
                return project.id === id;
              });

              return <ProjectPage project={project} />
            }} />

            <Route path="/projects" exact component={() => <ProjectList projects={PROJECTS} />} />

            <Route path="/blog">
              <p>Blog</p>
            </Route>

            <Route path='/resume'>
              <p>Resume</p>
            </Route> */

            <Redirect from="/" to="/projects"></Redirect>

          </Switch>
        </div>
      </Router>
    </div>
  );
}

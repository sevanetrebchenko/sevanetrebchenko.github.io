import React from "react";
import lodash from "lodash";
import "./App.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useRouteMatch,
} from "react-router-dom";

import Header from "./components/header";
import Resume from "./components/resume/resume";

// Project data.
import PROJECTS from "./content/projects";
import ProjectPage from "./components/portfolio/project-page";

// Blog data.
import BLOG_POSTS from "./content/blog-posts"
import Blog from "./components/blog/blog"
import BlogPost from "./components/blog/blog-post"

import "./components/page-title.css"

import "./components/global.css"

import ProjectsPage from "./components/projects-page";
import Footer from "./components/footer";

export default class App extends React.Component {
  constructor(props) {


    super(props);

    this.state = {
      limit: 5,
      offset: 0,

      cars: ["Audi", "Alfa Romeo", "BMW", "Citroen", "Dacia", "Ford", "Mercedes", "Peugeot", "Porsche", "VW"]
    }
  }

  render() {
    return (
      <div>
        <Router>
          <div className="global">
            <Header></Header>

            <Switch>
              <Route path="/blog/:url" component={
                function RouterWrapper() {
                  const match = useRouteMatch();
                  const url = match.params.url; // Local URL.
  
                  const post = lodash.find(BLOG_POSTS, (post) => {
                    return post.url === url;
                  });
  
                  return <BlogPost post={post} />
                }
              } />
  
              <Route path="/blog">
                <p className="page-title">Blog</p>
                <Blog posts={BLOG_POSTS} />
              </Route>
  
              <Route path="/projects/:url" component={
                function RouterWrapper() {
                  const match = useRouteMatch();
                  const url = match.params.url; // Local URL.
  
                  const project = lodash.find(PROJECTS, (project) => {
                    return project.url === url;
                  });
  
                  return <ProjectPage project={project} />
                }
              } />

              <Route path="/projects">
                <p className="page-title">Projects</p>
                <ProjectsPage items={PROJECTS} />
              </Route>
    
              <Route path="/resume">
                <Resume />
              </Route>


              <Redirect from="/" to="/projects"></Redirect>

            </Switch>

            <Footer />
          </div>
        </Router>
      </div>
    );
  }
};

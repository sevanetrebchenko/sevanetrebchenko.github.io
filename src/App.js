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
import Navbar from "./components/navbar";

// Project data.
import PROJECTS from "./content/projects";
import ProjectList from "./components/portfolio/project-list";
import ProjectPage from "./components/portfolio/project-page";

// Blog data.
import BLOG_POSTS from "./content/blog-posts"
import Blog from "./components/blog/blog"
import BlogPost from "./components/blog/blog-post"

import "./components/page-title.css"

export default function App() {
  return (
    <div>
      <Router>
        <div>
          <Header></Header>

          <Navbar></Navbar>

          <Switch>

            {/* BLOG. */}
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

            {/* PORTFOLIO. */}
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

            <Route path="/projects" >
              <p className="page-title">Projects</p>
              <ProjectList projects={PROJECTS} />
            </Route>

            <Route path="/resume">
              <p>Resume</p>
            </Route> */

            <Redirect from="/" to="/projects"></Redirect>

          </Switch>
        </div>
      </Router>
    </div>
  );
}

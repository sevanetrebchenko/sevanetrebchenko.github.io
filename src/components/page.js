
import React from 'react';

// Components
import Card from "./card";
import Sidebar from "./sidebar";

// Stylesheets
import "./page.css"

export default function Page() {
    return (
        <div className="page">
            <div className="page-container">
                <Sidebar></Sidebar>
                <div className="content">
                    <div className="content-elements">
                        <Card title={"Card1"} description={"this is the first card"}></Card>
                        <Card></Card>
                        <Card></Card>
                        <Card></Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
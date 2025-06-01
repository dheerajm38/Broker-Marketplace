import React from 'react'
import { useState } from 'react';
import NavigationBar from '../NavigationBar';
import Sidebar from '../Sidebar';
import ContentWrapper from './ContentWrapper';

function LayoutWrapper({component: Component}) {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative">
            <NavigationBar
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <ContentWrapper isSidebarOpen={isSidebarOpen}>
                <Component isSidebarOpen={isSidebarOpen} />
                {/* <OperatorsDashboard isSidebarOpen={isSidebarOpen} /> */}
            </ContentWrapper>
        </div>
    );
  
}

export default LayoutWrapper
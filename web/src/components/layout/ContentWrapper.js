const ContentWrapper = ({ children, isSidebarOpen }) => {
    return (
        <main className={`
            fixed top-16 right-0 bottom-0
            overflow-y-auto
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "left-64" : "left-20"}
            bg-gray-50
        `}>
            <div className="p-6 h-full">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default ContentWrapper;
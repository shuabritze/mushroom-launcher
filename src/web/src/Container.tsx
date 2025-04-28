export const Container = (props: {
    children: React.ReactNode;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    title?: React.ReactNode;
}) => {
    return (
        <div className="h-full w-full p-2">
            <div className="rounded-sm border border-[#D2D2D2] shadow-md/100 ring-2 ring-[#2C262C]">
                <div className="flex h-10 w-full justify-between rounded-t-sm bg-white/50 pt-1.5">
                    <div className="text-outline px-2 text-[1.1rem] font-bold">
                        {props.title}
                    </div>
                    <div className="px-2">
                        {!!props.actions && props.actions}
                    </div>
                </div>
                <div className="rounded-b-sm bg-white/75 p-2">
                    <div className="rounded-sm border-4 border-[#FFFFFF] ring-1 ring-[#797678]">
                        {props.children}
                    </div>
                    <div>{!!props.footer && props.footer}</div>
                </div>
            </div>
        </div>
    );
};

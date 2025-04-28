import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Container } from "./Container";
import { t } from "i18next";

import FRIENDS_ICON from "../assets/friends-icon.png";

function getInviteCodeFromUrl(inviteUrl: string) {
    try {
        const url = new URL(inviteUrl);

        // Check for the discord.gg subdomain
        if (url.hostname === "discord.gg") {
            // The code is the pathname without the leading slash
            return url.pathname.slice(1);
        }

        // Check for the discord.com/invite path
        if (
            url.hostname === "discord.com" &&
            url.pathname.startsWith("/invite/")
        ) {
            // The code is the part after /invite/
            return url.pathname.slice("/invite/".length);
        }

        // If neither format is matched, return null or throw an error
        return null;
    } catch (error) {
        // Handle invalid URL format
        console.error("Invalid URL:", inviteUrl, error);
        return null;
    }
}

export const DiscordWidget = ({ guildId }: { guildId: string }) => {
    const [widgetData, setWidgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWidgetData = async () => {
            try {
                const response = await fetch(
                    `https://discord.com/api/guilds/${guildId}/widget.json`,
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                const inviteCode = getInviteCodeFromUrl(data.instant_invite);

                const memberData = await fetch(
                    `https://discordapp.com/api/v6/invite/${inviteCode}?with_counts=true`,
                );
                if (!memberData.ok) {
                    throw new Error(`HTTP error! status: ${memberData.status}`);
                }

                const memberDataJson = await memberData.json();
                data.presence_count = memberDataJson.approximate_presence_count;
                data.member_count = memberDataJson.approximate_member_count;
                data.icon_url = `https://cdn.discordapp.com/icons/${guildId}/${memberDataJson.guild.icon}.png?size=128`;

                setWidgetData(data);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchWidgetData();
    }, [guildId]); // Refetch if guildId changes

    if (loading) {
        return (
            <div className="text-center text-gray-500">
                Loading Discord widget...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500">
                Error loading Discord data: {error.message}
            </div>
        );
    }

    if (!widgetData) {
        return null; // Or some placeholder
    }

    return (
        <>
            <Container
                title={
                    <div className="relative">
                        <img
                            src={FRIENDS_ICON}
                            className="absolute -top-5 left-0 w-12"
                        />
                        <div className="pl-15">
                            {t("discord.widget.title", "Community Discord")}
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-2 rounded-sm border-2 border-[#594901] bg-gradient-to-t from-[#F2F2F2] via-[#CECECE] to-[#EEEEEE] p-2 text-black text-shadow-sm/100 text-shadow-white">
                    <h2 className="flex items-center gap-2 font-bold">
                        <img
                            className="rounded-sm border border-[#A0A0A0] bg-black/15 p-0.5"
                            height="36"
                            width="36"
                            src={widgetData.icon_url}
                        />
                        {widgetData.name}
                    </h2>
                    <div className="flex gap-2 text-sm">
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-green-300"></div>
                            {widgetData.presence_count.toLocaleString()} Online
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-gray-400">
                                <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                            </div>
                            {widgetData.member_count.toLocaleString()} Members
                        </div>
                    </div>

                    {widgetData.instant_invite && (
                        <div>
                            <Button
                                variant="maplestory_primary"
                                size="maplestory"
                                className="w-full"
                                onClick={() => {
                                    window.open(
                                        widgetData.instant_invite,
                                        "_blank",
                                        "noopener,noreferrer",
                                    );
                                }}
                            >
                                {t("discord.widget.join", "Join Discord")}
                            </Button>
                        </div>
                    )}
                </div>
            </Container>
        </>
    );
};

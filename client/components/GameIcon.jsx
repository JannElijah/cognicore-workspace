import React from 'react';

// Shared line-art SVG icons used in place of emojis in the game screens.
// Sizes with `1em` so the icon scales with the surrounding font size.
const PATHS = {
    check: <><circle cx="12" cy="12" r="10" /><polyline points="8 12.5 11 15.5 16 9" /></>,
    x: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
    puzzle: <path d="M19.4 11H18V8a2 2 0 0 0-2-2h-3V4.6a2.6 2.6 0 0 0-5.2 0V6H5a2 2 0 0 0-2 2v3h1.4a2.6 2.6 0 0 1 0 5.2H3V19a2 2 0 0 0 2 2h3v-1.4a2.6 2.6 0 0 1 5.2 0V21h3a2 2 0 0 0 2-2v-3h1.2a2.6 2.6 0 0 0 0-5z" />,
    hash: <><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>,
    spiral: <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M12 12a3 3 0 0 1 3 3 5 5 0 0 1-5 5 7 7 0 0 1-7-7 9 9 0 0 1 9-9 11 11 0 0 1 11 11" />,
    sprout: <><path d="M7 20h10" /><path d="M12 20v-9" /><path d="M12 11C12 7 9 5 5 5c0 4 2 6 7 6z" /><path d="M12 13c0-3 2-5 6-5 0 3-2 5-6 5z" /></>,
    repeat: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    compass: <><circle cx="12" cy="12" r="10" /><polygon points="16 8 14 14 8 16 10 10 16 8" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></>,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></>,
    scale: <><line x1="12" y1="3" x2="12" y2="21" /><path d="M5 21h14" /><path d="M5 7h14" /><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7z" /><path d="M19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7z" /></>,
    network: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M11 7.3L6 16.7M13 7.3l5 9.4M7.5 19h9" /></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
    run: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    hand: <path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3-2.6L8 15" />,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.7V17c0 1-.8 1.8-1.8 2.4M14 14.7V17c0 1 .8 1.8 1.8 2.4" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></>,
    trend: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    warning: <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    barChart: <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
    brain: <><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v0A2.5 2.5 0 0 0 4.5 7 3 3 0 0 0 3 9.5c0 1 .5 1.9 1.2 2.4A3 3 0 0 0 5 17a3 3 0 0 0 4 2.8 2.5 2.5 0 0 0 3 .2V4.5A2.5 2.5 0 0 0 9.5 2z" /><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5 2.5 2.5 0 0 1 19.5 7 3 3 0 0 1 21 9.5c0 1-.5 1.9-1.2 2.4A3 3 0 0 1 19 17a3 3 0 0 1-4 2.8 2.5 2.5 0 0 1-3 .2" /></>,
    microscope: <><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></>
};

export default function GameIcon({ name, size = '1em', inline = false }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ verticalAlign: '-0.15em', flexShrink: 0, marginRight: inline ? '0.4em' : 0 }}>
            {PATHS[name]}
        </svg>
    );
}

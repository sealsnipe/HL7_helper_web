"use client";

import React from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface NavigationHeaderProps {
    activePage?: 'home' | 'create' | 'serialize' | 'templates';
    onNewMessage?: () => void;
    onLoadExample?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
    activePage = 'home',
    onNewMessage,
    onLoadExample,
}) => {
    const isHome = activePage === 'home';

    // Helper to handle "New Message" click
    // If onHome and callback provided, call it. Else link to home.
    const NewMessageButton = () => {
        if (isHome && onNewMessage) {
            return (
                <button
                    onClick={onNewMessage}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
                >
                    New Message
                </button>
            );
        }
        return (
            <Link
                href="/"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
            >
                New Message
            </Link>
        );
    };

    // Helper to handle "Load Example" click
    const LoadExampleButton = () => {
        if (isHome && onLoadExample) {
            return (
                <button
                    onClick={onLoadExample}
                    className="px-4 py-2 bg-card border border-border rounded-md text-sm font-medium text-card-foreground hover:bg-muted shadow-sm transition-all"
                >
                    Load Example Message
                </button>
            );
        }
        // On other pages, maybe we just link to home or hide it?
        // Plan said: "act as links to the home page"
        return (
            <Link
                href="/"
                className="px-4 py-2 bg-card border border-border rounded-md text-sm font-medium text-card-foreground hover:bg-muted shadow-sm transition-all"
            >
                Load Example Message
            </Link>
        );
    };

    return (
        <header className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">MARIS HL7 Helper</h1>
                        <p className="text-muted-foreground mt-1">Web Edition</p>
                    </div>
                </Link>
                <ThemeSwitcher />
            </div>
            <div className="flex gap-3">
                <Link
                    href="/templates"
                    className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all ${activePage === 'templates'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                >
                    Templates
                </Link>
                <Link
                    href="/templates/use"
                    className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all ${
                        // Original was secondary
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        } ${activePage === 'serialize' ? 'ring-2 ring-offset-2 ring-secondary' : ''}`}
                >
                    Serialize from Template
                </Link>

                <LoadExampleButton />
                <NewMessageButton />
            </div>
        </header>
    );
};

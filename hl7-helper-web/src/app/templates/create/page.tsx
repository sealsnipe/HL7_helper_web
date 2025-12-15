"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@/types/template';
import { NavigationHeader } from '@/components/NavigationHeader';

export default function CreateTemplatePage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [messageType, setMessageType] = useState('ADT-A01');
    const [content, setContent] = useState('');

    const handleSave = () => {
        if (!name || !content) {
            alert("Name and Content are required.");
            return;
        }

        const newTemplate: Template = {
            id: crypto.randomUUID(),
            name,
            description,
            messageType,
            content,
            createdAt: Date.now(),
        };

        try {
            const existing = localStorage.getItem('hl7_templates');
            const templates: Template[] = existing ? JSON.parse(existing) : [];
            templates.push(newTemplate);
            localStorage.setItem('hl7_templates', JSON.stringify(templates));

            router.push('/templates');
        } catch (error) {
            console.error('Failed to parse templates:', error);
            // Ask user for consent before clearing corrupted data
            const shouldClear = confirm(
                'There was an error reading your existing templates. ' +
                'The data may be corrupted.\n\n' +
                'Click OK to clear the corrupted data and save your new template.\n' +
                'Click Cancel to abort and keep the existing data.'
            );

            if (shouldClear) {
                localStorage.removeItem('hl7_templates');
                const templates: Template[] = [newTemplate];
                localStorage.setItem('hl7_templates', JSON.stringify(templates));
                router.push('/templates');
            }
            // If user clicks Cancel, stay on the page without saving
        }
    };

    return (
        <main className="min-h-screen bg-background font-sans transition-colors text-foreground">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <NavigationHeader activePage="create" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                <h2 className="text-2xl font-bold text-foreground">Create New Template</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: HL7 Content */}
                    <div className="space-y-4">
                        <div className="bg-card p-4 rounded-lg shadow border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-card-foreground">HL7 Content</label>
                                <span className="text-xs text-muted-foreground">Use HELPERVARIABLE as placeholder</span>
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-96 p-4 border border-input rounded-md font-mono text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                                placeholder="MSH|^~\&|...|HELPERVARIABLE|..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Template Details */}
                    <div className="space-y-4">
                        <div className="bg-card p-6 rounded-lg shadow border border-border space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                                    placeholder="e.g., My Custom ADT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                                    placeholder="Optional description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">Message Type</label>
                                <select
                                    value={messageType}
                                    onChange={(e) => setMessageType(e.target.value)}
                                    className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                                >
                                    <option value="ADT-A01">ADT-A01</option>
                                    <option value="ORU-R01">ORU-R01</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

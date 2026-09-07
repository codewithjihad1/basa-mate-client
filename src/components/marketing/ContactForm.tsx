'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useState } from 'react';

const SUPPORT_EMAIL = 'support@basamate.app';

/**
 * Composes a mailto link from the form fields and opens the user's mail client.
 * There is no contact submission backend, so mail is the whole pipeline (§24).
 */
export function ContactForm() {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const body = [`From: ${name || 'Not provided'}`, '', message].join('\n');
        const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || 'Support request')}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                    id="contact-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                    id="contact-subject"
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Help with a settlement…"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                    id="contact-message"
                    required
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what's going on, and which basa if it's about an account…"
                    rows={5}
                />
            </div>

            <Button type="submit">
                <Send aria-hidden />
                Send message
            </Button>
        </form>
    );
}

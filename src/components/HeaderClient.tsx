"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { User, Plus, Zap } from "lucide-react";
import Link from "next/link";

interface HeaderClientProps {
    isSignedIn: boolean;
    username?: string | null;
    credits: number;
}

export function HeaderClient({ isSignedIn, username, credits }: HeaderClientProps) {
    return (
        <header className="flex justify-between items-center p-6 absolute top-0 w-full z-10">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
                Promwin
            </Link>

            <div className="flex items-center gap-4">
                {!isSignedIn ? (
                    <>
                        <SignInButton />
                        <SignUpButton />
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4 border-r border-slate-200 pr-4 mr-2">
                            {/* Credits Display */}
                            <Link href="/billing" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                                <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                                <span>{credits.toLocaleString()}</span>
                            </Link>

                            {/* Create Button */}
                            <Link
                                href="/create"
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-black hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                                <Plus size={16} />
                                <span>Create</span>
                            </Link>
                        </div>

                        <UserButton>
                            <UserButton.MenuItems>
                                {username && (
                                    <UserButton.Link
                                        label="Profile"
                                        labelIcon={<User size={16} />}
                                        href={`/${username}`}
                                    />
                                )}
                                <UserButton.Link
                                    label="Billing"
                                    labelIcon={<Zap size={16} />}
                                    href={`/billing`}
                                />
                                <UserButton.Action label="manageAccount" />
                                <UserButton.Action label="signOut" />
                            </UserButton.MenuItems>
                        </UserButton>
                    </>
                )}
            </div>
        </header>
    );
}

"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { User, Plus, Zap, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface HeaderClientProps {
    isSignedIn: boolean;
    username?: string | null;
    credits: number;
}

const NAV_LINKS = [
    { href: "/create", label: "Create", icon: Plus },
    { href: "/billing", label: "Billing", icon: Zap },
];

export function HeaderClient({ isSignedIn, username, credits }: HeaderClientProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <header className="flex justify-between items-center p-6 absolute top-0 w-full z-10">
                <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
                    {pathname === "/pricing" ? "Jobing AI" : "Jobing"}
                </Link>

                <div className="flex items-center gap-4">
                    {!isSignedIn ? (
                        <>
                            <SignInButton />
                            <SignUpButton />
                        </>
                    ) : (
                        <>
                            {/* Desktop Nav */}
                            <div className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-4 mr-2">
                                {/* Credits Display */}
                                <Link href="/billing" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                                    <Zap size={14} className="text-[#8bb800] fill-[#8bb800]" />
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

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

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

            {/* Mobile Menu */}
            {mobileMenuOpen && isSignedIn && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="fixed top-[65px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50">
                        <nav className="flex flex-col p-3 gap-1">
                            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                                const isActive = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                            isActive
                                                ? "bg-[#C1FF00]/20 text-[#1a1a1a]"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}

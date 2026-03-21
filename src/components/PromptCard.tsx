import { MessageSquare, Image as ImageIcon, Video, Lock, Pencil } from "lucide-react";
import Link from "next/link";

export interface PromptData {
    id: string;
    title: string;
    description: string | null;
    output_type: string;
    created_at: string;
}

interface PromptCardProps {
    prompt: PromptData;
    isEditable?: boolean;
}

export function PromptCard({ prompt, isEditable = false }: PromptCardProps) {
    // Helper to get the correct icon and styling based on output type
    const getTypeDetails = (type: string) => {
        switch (type.toLowerCase()) {
            case 'chat':
                return { icon: MessageSquare, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Chat' };
            case 'image':
                return { icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Image' };
            case 'video':
                return { icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Video' };
            default:
                return { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Prompt' };
        }
    };

    const typeDetails = getTypeDetails(prompt.output_type);
    const Icon = typeDetails.icon;

    // Formatting date to be more human readable
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(prompt.created_at));

    return (
        <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-yellow-400 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            {/* Type Badge */}
            <div className="absolute top-5 right-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-500">
                <Icon className={`w-3 h-3 ${typeDetails.color}`} />
                {typeDetails.label}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2 pr-20 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                {prompt.title}
            </h3>
            
            <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">
                {prompt.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
                
                <div className="flex items-center gap-2">
                    {/* Edit Button for owners */}
                    {isEditable && (
                        <Link 
                            href={`/edit/${prompt.id}`}
                            className="flex items-center justify-center p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 transition-colors"
                            title="Edit Prompt"
                        >
                            <Pencil className="w-4 h-4" />
                        </Link>
                    )}

                    {/* Coming Soon Button Placeholder */}
                    <button 
                        disabled
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 text-slate-400 text-xs font-bold rounded-lg border border-slate-200 cursor-not-allowed group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-200 transition-colors"
                    >
                        <Lock className="w-3 h-3" />
                        Buy / Use
                    </button>
                </div>
            </div>
        </div>
    );
}

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { id: resumeId } = await params;

        // 1. Fetch the resume to ensure it belongs to the user and to get the PDF URL
        const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();

        if (fetchError || !resume) {
            return new Response(JSON.stringify({ error: "Resume not found" }), { status: 404 });
        }

        if (resume.clerk_user_id !== user.id) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }

        // 2. Delete the PDF from Supabase Storage (if it exists)
        if (resume.pdf_url) {
            try {
                // Extract filename from the public URL
                // URL format: .../storage/v1/object/public/resumes/resume_XYZ_123.pdf
                const bucketPrefix = '/storage/v1/object/public/resumes/';
                const urlObj = new URL(resume.pdf_url);
                const pathName = urlObj.pathname;
                
                if (pathName.includes(bucketPrefix)) {
                    const fileName = pathName.split(bucketPrefix)[1];
                    if (fileName) {
                        const { error: storageError } = await supabase
                            .storage
                            .from('resumes')
                            .remove([fileName]);
                            
                        if (storageError) {
                            console.error("Failed to delete from storage:", storageError);
                            // We don't fail the whole request just for storage, DB is more important
                        }
                    }
                }
            } catch (err) {
                console.error("Error parsing/deleting PDF URL:", err);
            }
        }

        // 3. Delete the resume record from the database
        const { error: deleteError } = await supabase
            .from('resumes')
            .delete()
            .eq('id', resumeId);

        if (deleteError) {
            console.error("Database deletion error:", deleteError);
            return new Response(JSON.stringify({ error: "Failed to delete record" }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error: any) {
        console.error("Delete resume endpoint error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
    }
}
